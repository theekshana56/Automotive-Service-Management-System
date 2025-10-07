"""
Data Pipeline for ML Inventory System
Connects MongoDB data to ML models with real-time updates
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
import os
import json
from mongodb_connector import MongoDBConnector
from prophet_forecaster import ProphetInventoryForecaster
from linear_model import InventoryForecaster

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLDataPipeline:
    """
    Complete data pipeline from MongoDB to ML predictions
    Handles data fetching, preprocessing, model training, and predictions
    """
    
    def __init__(self, mongodb_uri: str = None, models_dir: str = "models"):
        """
        Initialize ML data pipeline
        
        Args:
            mongodb_uri: MongoDB connection string
            models_dir: Directory for ML models
        """
        self.mongodb_uri = mongodb_uri
        self.models_dir = models_dir
        self.mongodb_connector = None
        self.prophet_forecaster = None
        self.linear_forecaster = None
        self.last_update = None
        
        # Initialize components
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize all pipeline components"""
        try:
            # Initialize MongoDB connector
            self.mongodb_connector = MongoDBConnector(self.mongodb_uri)
            logger.info("MongoDB connector initialized")
            
            # Initialize Prophet forecaster
            self.prophet_forecaster = ProphetInventoryForecaster(self.models_dir)
            logger.info("Prophet forecaster initialized")
            
            # Initialize Linear forecaster (fallback)
            self.linear_forecaster = InventoryForecaster()
            logger.info("Linear forecaster initialized")
            
        except Exception as e:
            logger.error(f"Error initializing pipeline components: {e}")
            raise
    
    def fetch_and_prepare_data(self, days_back: int = 365) -> pd.DataFrame:
        """
        Fetch data from MongoDB and prepare for ML training
        
        Args:
            days_back: Number of days to look back for data
            
        Returns:
            Prepared DataFrame for ML training
        """
        try:
            logger.info(f"Fetching data from MongoDB for last {days_back} days")
            
            # Get comprehensive dataset from MongoDB
            ml_dataset = self.mongodb_connector.create_ml_training_dataset(days_back)
            
            if ml_dataset.empty:
                logger.warning("No data available from MongoDB")
                return pd.DataFrame()
            
            # Data preprocessing
            ml_dataset = self._preprocess_data(ml_dataset)
            
            logger.info(f"Prepared dataset with {len(ml_dataset)} records")
            return ml_dataset
            
        except Exception as e:
            logger.error(f"Error fetching and preparing data: {e}")
            return pd.DataFrame()
    
    def _preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess data for ML training
        
        Args:
            df: Raw data from MongoDB
            
        Returns:
            Preprocessed DataFrame
        """
        try:
            # Remove duplicates
            df = df.drop_duplicates(subset=['date', 'part_id'])
            
            # Handle missing values
            df['quantity_used'] = df['quantity_used'].fillna(0)
            df['unit_cost'] = df['unit_cost'].fillna(0)
            df['lead_time_days'] = df['lead_time_days'].fillna(7)
            
            # Ensure positive values
            df['quantity_used'] = df['quantity_used'].clip(lower=0)
            df['unit_cost'] = df['unit_cost'].clip(lower=0)
            
            # Add derived features
            df['usage_value'] = df['quantity_used'] * df['unit_cost']
            
            # Add trend features
            df = self._add_trend_features(df)
            
            # Add seasonal features
            df = self._add_seasonal_features(df)
            
            logger.info("Data preprocessing completed")
            return df
            
        except Exception as e:
            logger.error(f"Error preprocessing data: {e}")
            return df
    
    def _add_trend_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add trend-based features"""
        try:
            # Calculate rolling averages
            for window in [7, 14, 30]:
                df[f'usage_ma_{window}'] = df.groupby('part_id')['quantity_used'].transform(
                    lambda x: x.rolling(window=window, min_periods=1).mean()
                )
            
            # Calculate usage trends
            df['usage_trend_7d'] = df.groupby('part_id')['quantity_used'].transform(
                lambda x: x.rolling(window=7, min_periods=1).apply(
                    lambda y: np.polyfit(range(len(y)), y, 1)[0] if len(y) > 1 else 0
                )
            )
            
            # Calculate volatility
            df['usage_volatility'] = df.groupby('part_id')['quantity_used'].transform(
                lambda x: x.rolling(window=14, min_periods=1).std()
            )
            
            return df
            
        except Exception as e:
            logger.error(f"Error adding trend features: {e}")
            return df
    
    def _add_seasonal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add seasonal features"""
        try:
            # Day of week patterns
            df['is_monday'] = (df['day_of_week'] == 0).astype(int)
            df['is_friday'] = (df['day_of_week'] == 4).astype(int)
            df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
            
            # Month patterns
            df['is_january'] = (df['month'] == 1).astype(int)
            df['is_december'] = (df['month'] == 12).astype(int)
            df['is_quarter_end'] = df['month'].isin([3, 6, 9, 12]).astype(int)
            
            # Business cycle features
            df['is_month_start'] = (df['day_of_month'] <= 5).astype(int)
            df['is_month_end'] = (df['day_of_month'] >= 25).astype(int)
            
            return df
            
        except Exception as e:
            logger.error(f"Error adding seasonal features: {e}")
            return df
    
    def train_models(self, use_prophet: bool = True) -> bool:
        """
        Train ML models with current data
        
        Args:
            use_prophet: Whether to use Prophet (True) or Linear Regression (False)
            
        Returns:
            True if training successful, False otherwise
        """
        try:
            logger.info("Starting model training...")
            
            # Fetch and prepare data
            training_data = self.fetch_and_prepare_data()
            
            if training_data.empty:
                logger.error("No training data available")
                return False
            
            # Train models
            if use_prophet:
                success = self.prophet_forecaster.train_model(training_data)
                if success:
                    self.prophet_forecaster.save_models()
                    logger.info("Prophet models trained and saved successfully")
                else:
                    logger.warning("Prophet training failed, falling back to Linear Regression")
                    use_prophet = False
            
            if not use_prophet:
                success = self.linear_forecaster.train_model(training_data)
                if success:
                    self.linear_forecaster.save_models()
                    logger.info("Linear Regression models trained and saved successfully")
                else:
                    logger.error("Both Prophet and Linear Regression training failed")
                    return False
            
            self.last_update = datetime.now()
            logger.info("Model training completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
            return False
    
    def load_models(self) -> bool:
        """
        Load pre-trained models
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Try to load Prophet models first
            prophet_loaded = self.prophet_forecaster.load_models()
            
            if prophet_loaded:
                logger.info("Prophet models loaded successfully")
                return True
            
            # Fallback to Linear Regression
            linear_loaded = self.linear_forecaster.load_models()
            
            if linear_loaded:
                logger.info("Linear Regression models loaded successfully")
                return True
            
            logger.warning("No models could be loaded")
            return False
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            return False
    
    def get_predictions(self, part_ids: List[str], days: int = 30) -> List[Dict]:
        """
        Get predictions for specific parts
        
        Args:
            part_ids: List of part IDs to predict
            days: Number of days to predict ahead
            
        Returns:
            List of prediction dictionaries
        """
        try:
            predictions = []
            
            for part_id in part_ids:
                try:
                    # Try Prophet first
                    if self.prophet_forecaster.is_trained:
                        prediction = self.prophet_forecaster.predict(part_id, days)
                        if prediction:
                            predictions.append(prediction)
                            continue
                    
                    # Fallback to Linear Regression
                    if self.linear_forecaster.is_trained:
                        prediction = self.linear_forecaster.predict(part_id, days)
                        if prediction:
                            predictions.append(prediction)
                            continue
                    
                    logger.warning(f"No prediction available for part {part_id}")
                    
                except Exception as e:
                    logger.error(f"Error predicting for part {part_id}: {e}")
                    continue
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error getting predictions: {e}")
            return []
    
    def get_reorder_recommendations(self, current_stock: Dict[str, int]) -> List[Dict]:
        """
        Get reorder recommendations for all parts
        
        Args:
            current_stock: Dictionary with part_id -> current_stock mapping
            
        Returns:
            List of reorder recommendations
        """
        try:
            # Try Prophet first
            if self.prophet_forecaster.is_trained:
                recommendations = self.prophet_forecaster.get_reorder_recommendations(current_stock)
                if recommendations:
                    return recommendations
            
            # Fallback to Linear Regression
            if self.linear_forecaster.is_trained:
                recommendations = self.linear_forecaster.get_reorder_recommendations(current_stock)
                if recommendations:
                    return recommendations
            
            logger.warning("No reorder recommendations available")
            return []
            
        except Exception as e:
            logger.error(f"Error getting reorder recommendations: {e}")
            return []
    
    def get_model_statistics(self) -> Dict:
        """
        Get statistics about trained models
        
        Returns:
            Dictionary with model statistics
        """
        try:
            # Try Prophet first
            if self.prophet_forecaster.is_trained:
                return self.prophet_forecaster.get_model_statistics()
            
            # Fallback to Linear Regression
            if self.linear_forecaster.is_trained:
                return self.linear_forecaster.get_model_statistics()
            
            return {'total_models': 0, 'models': []}
            
        except Exception as e:
            logger.error(f"Error getting model statistics: {e}")
            return {'total_models': 0, 'models': []}
    
    def get_health_status(self) -> Dict:
        """
        Get health status of the ML pipeline
        
        Returns:
            Dictionary with health information
        """
        try:
            # Check MongoDB connection
            mongodb_status = "connected"
            try:
                self.mongodb_connector.client.admin.command('ping')
            except:
                mongodb_status = "disconnected"
            
            # Check model status
            prophet_models = len(self.prophet_forecaster.models) if self.prophet_forecaster.is_trained else 0
            linear_models = len(self.linear_forecaster.models) if self.linear_forecaster.is_trained else 0
            
            return {
                'status': 'healthy' if (prophet_models > 0 or linear_models > 0) and mongodb_status == 'connected' else 'unhealthy',
                'mongodb_status': mongodb_status,
                'prophet_models': prophet_models,
                'linear_models': linear_models,
                'total_models': prophet_models + linear_models,
                'last_update': self.last_update.isoformat() if self.last_update else None,
                'available_parts': list(self.prophet_forecaster.models.keys()) if self.prophet_forecaster.is_trained else list(self.linear_forecaster.models.keys()) if self.linear_forecaster.is_trained else []
            }
            
        except Exception as e:
            logger.error(f"Error getting health status: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    def update_models(self, force_retrain: bool = False) -> bool:
        """
        Update models with latest data
        
        Args:
            force_retrain: Force retraining even if models are recent
            
        Returns:
            True if update successful, False otherwise
        """
        try:
            # Check if update is needed
            if not force_retrain and self.last_update:
                time_since_update = datetime.now() - self.last_update
                if time_since_update < timedelta(hours=1):  # Update at most once per hour
                    logger.info("Models are recent, skipping update")
                    return True
            
            logger.info("Updating models with latest data...")
            
            # Retrain models
            success = self.train_models(use_prophet=True)
            
            if success:
                logger.info("Models updated successfully")
                return True
            else:
                logger.error("Model update failed")
                return False
                
        except Exception as e:
            logger.error(f"Error updating models: {e}")
            return False
    
    def close(self):
        """Close all connections"""
        try:
            if self.mongodb_connector:
                self.mongodb_connector.close()
            logger.info("ML data pipeline closed")
        except Exception as e:
            logger.error(f"Error closing pipeline: {e}")

# Example usage
if __name__ == "__main__":
    # Initialize pipeline
    pipeline = MLDataPipeline()
    
    try:
        # Test connection and data fetching
        health = pipeline.get_health_status()
        print(f"Pipeline health: {health}")
        
        # Train models
        success = pipeline.train_models()
        print(f"Training success: {success}")
        
        # Get model statistics
        stats = pipeline.get_model_statistics()
        print(f"Model statistics: {stats}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        pipeline.close()
