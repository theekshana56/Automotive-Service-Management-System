"""
Prophet-based Advanced Forecasting for Inventory Management
Uses Facebook Prophet for time series forecasting with seasonality
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
import joblib
import os
from prophet import Prophet
from prophet.plot import plot_plotly, plot_components_plotly
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProphetInventoryForecaster:
    """
    Advanced inventory forecasting using Facebook Prophet
    Handles seasonality, trends, and holidays for better predictions
    """
    
    def __init__(self, models_dir: str = "models"):
        """
        Initialize Prophet forecaster
        
        Args:
            models_dir: Directory to save/load Prophet models
        """
        self.models_dir = models_dir
        self.models = {}  # Store trained Prophet models
        self.part_stats = {}  # Store part statistics
        self.is_trained = False
        
        # Create models directory if it doesn't exist
        os.makedirs(models_dir, exist_ok=True)
        
        # Prophet model parameters
        self.prophet_params = {
            'yearly_seasonality': True,
            'weekly_seasonality': True,
            'daily_seasonality': False,
            'seasonality_mode': 'multiplicative',
            'changepoint_prior_scale': 0.05,
            'seasonality_prior_scale': 10.0,
            'holidays_prior_scale': 10.0,
            'interval_width': 0.95
        }
    
    def prepare_data_for_prophet(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare data for Prophet forecasting
        
        Args:
            df: DataFrame with usage data
            
        Returns:
            DataFrame formatted for Prophet
        """
        try:
            # Prophet expects 'ds' (datestamp) and 'y' (value) columns
            prophet_data = df.copy()
            prophet_data = prophet_data.rename(columns={'date': 'ds', 'quantity_used': 'y'})
            
            # Ensure data is sorted by date
            prophet_data = prophet_data.sort_values('ds')
            
            # Remove any rows with missing values
            prophet_data = prophet_data.dropna(subset=['ds', 'y'])
            
            # Ensure y values are positive (Prophet requirement)
            prophet_data = prophet_data[prophet_data['y'] >= 0]
            
            logger.info(f"Prepared {len(prophet_data)} records for Prophet")
            return prophet_data
            
        except Exception as e:
            logger.error(f"Error preparing data for Prophet: {e}")
            return pd.DataFrame()
    
    def add_custom_seasonalities(self, model: Prophet, df: pd.DataFrame) -> Prophet:
        """
        Add custom seasonalities based on business patterns
        
        Args:
            model: Prophet model instance
            df: Training data
            
        Returns:
            Enhanced Prophet model
        """
        try:
            # Add monthly seasonality if we have enough data
            if len(df) > 60:  # At least 2 months of data
                model.add_seasonality(
                    name='monthly',
                    period=30.5,
                    fourier_order=5
                )
            
            # Add quarterly seasonality if we have enough data
            if len(df) > 90:  # At least 3 months of data
                model.add_seasonality(
                    name='quarterly',
                    period=91.25,
                    fourier_order=4
                )
            
            # Add business day seasonality
            model.add_seasonality(
                name='business_day',
                period=7,
                fourier_order=3,
                condition_name='is_business_day'
            )
            
            return model
            
        except Exception as e:
            logger.error(f"Error adding custom seasonalities: {e}")
            return model
    
    def create_holidays_dataframe(self, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Create holidays dataframe for Prophet
        
        Args:
            start_date: Start date for holidays
            end_date: End date for holidays
            
        Returns:
            DataFrame with holidays information
        """
        holidays = []
        
        # Add common holidays that might affect inventory
        current_year = start_date.year
        end_year = end_date.year
        
        for year in range(current_year, end_year + 1):
            # New Year
            holidays.append({'holiday': 'new_year', 'ds': f'{year}-01-01'})
            
            # Christmas
            holidays.append({'holiday': 'christmas', 'ds': f'{year}-12-25'})
            
            # Black Friday (4th Thursday of November)
            thanksgiving = datetime(year, 11, 1)
            while thanksgiving.weekday() != 3:  # Thursday
                thanksgiving += timedelta(days=1)
            thanksgiving += timedelta(weeks=3)
            black_friday = thanksgiving + timedelta(days=1)
            holidays.append({'holiday': 'black_friday', 'ds': black_friday.strftime('%Y-%m-%d')})
            
            # End of month (common for business cycles)
            for month in range(1, 13):
                last_day = datetime(year, month, 1) + timedelta(days=32)
                last_day = last_day.replace(day=1) - timedelta(days=1)
                holidays.append({'holiday': 'month_end', 'ds': last_day.strftime('%Y-%m-%d')})
        
        return pd.DataFrame(holidays)
    
    def train_model(self, df: pd.DataFrame) -> bool:
        """
        Train Prophet models for each part
        
        Args:
            df: DataFrame with usage data
            
        Returns:
            True if training successful, False otherwise
        """
        try:
            logger.info("Training Prophet models...")
            
            # Prepare data
            df_processed = self.prepare_data_for_prophet(df)
            
            if df_processed.empty:
                logger.error("No data available for training")
                return False
            
            # Train model for each part
            for part_id in df_processed['part_id'].unique():
                part_data = df_processed[df_processed['part_id'] == part_id].copy()
                
                if len(part_data) < 30:  # Need minimum data points
                    logger.warning(f"Skipping {part_id}: insufficient data ({len(part_data)} points)")
                    continue
                
                # Create Prophet model
                model = Prophet(**self.prophet_params)
                
                # Add custom seasonalities
                model = self.add_custom_seasonalities(model, part_data)
                
                # Add holidays
                if len(part_data) > 0:
                    start_date = part_data['ds'].min()
                    end_date = part_data['ds'].max() + timedelta(days=365)  # Include future dates
                    holidays_df = self.create_holidays_dataframe(start_date, end_date)
                    model.add_country_holidays(country_name='US')
                
                # Add business day indicator
                part_data['is_business_day'] = (part_data['ds'].dt.weekday < 5).astype(int)
                
                # Fit the model
                try:
                    model.fit(part_data)
                    self.models[part_id] = model
                    
                    # Calculate model performance
                    future = model.make_future_dataframe(periods=0)
                    forecast = model.predict(future)
                    
                    # Calculate metrics
                    actual = part_data['y'].values
                    predicted = forecast['yhat'].values[:len(actual)]
                    
                    mae = np.mean(np.abs(actual - predicted))
                    rmse = np.sqrt(np.mean((actual - predicted) ** 2))
                    
                    self.part_stats[part_id] = {
                        'mae': mae,
                        'rmse': rmse,
                        'avg_usage': actual.mean(),
                        'std_usage': actual.std(),
                        'lead_time': part_data['lead_time_days'].iloc[0] if 'lead_time_days' in part_data.columns else 7,
                        'unit_cost': part_data['unit_cost'].iloc[0] if 'unit_cost' in part_data.columns else 0,
                        'part_name': part_data['part_name'].iloc[0] if 'part_name' in part_data.columns else 'Unknown'
                    }
                    
                    logger.info(f"{part_id}: MAE={mae:.2f}, RMSE={rmse:.2f}, Avg Usage={actual.mean():.1f}")
                    
                except Exception as e:
                    logger.error(f"Error training model for {part_id}: {e}")
                    continue
            
            self.is_trained = True
            logger.info(f"Trained {len(self.models)} Prophet models successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Error training Prophet models: {e}")
            return False
    
    def predict(self, part_id: str, days: int = 30) -> Dict:
        """
        Make predictions for a specific part
        
        Args:
            part_id: Part ID to predict
            days: Number of days to predict ahead
            
        Returns:
            Dictionary with predictions and confidence intervals
        """
        try:
            if part_id not in self.models:
                raise ValueError(f"No model found for part {part_id}")
            
            model = self.models[part_id]
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=days)
            
            # Add business day indicator for future dates
            future['is_business_day'] = (future['ds'].dt.weekday < 5).astype(int)
            
            # Make predictions
            forecast = model.predict(future)
            
            # Get only future predictions
            future_forecast = forecast.tail(days)
            
            # Calculate reorder point and safety stock
            recent_usage = future_forecast['yhat'].mean()
            usage_std = future_forecast['yhat'].std()
            lead_time = self.part_stats[part_id]['lead_time_days']
            
            # Safety stock calculation (using service level of 95%)
            safety_stock = 1.96 * usage_std * np.sqrt(lead_time)
            reorder_point = recent_usage * lead_time + safety_stock
            
            # EOQ calculation (simplified)
            annual_usage = recent_usage * 365
            unit_cost = self.part_stats[part_id]['unit_cost']
            ordering_cost = 50  # Assume $50 ordering cost
            holding_cost_rate = 0.2  # 20% annual holding cost
            eoq = np.sqrt(2 * annual_usage * ordering_cost / (unit_cost * holding_cost_rate))
            
            return {
                'part_id': part_id,
                'part_name': self.part_stats[part_id]['part_name'],
                'predictions': [
                    {
                        'date': row['ds'].strftime('%Y-%m-%d'),
                        'predicted_usage': max(0, row['yhat']),
                        'lower_bound': max(0, row['yhat_lower']),
                        'upper_bound': max(0, row['yhat_upper']),
                        'confidence': row['yhat_upper'] - row['yhat_lower']
                    }
                    for _, row in future_forecast.iterrows()
                ],
                'reorder_info': {
                    'reorder_point': max(0, int(reorder_point)),
                    'safety_stock': max(0, int(safety_stock)),
                    'lead_time_days': lead_time
                },
                'eoq_info': {
                    'eoq': max(0, int(eoq)),
                    'annual_usage': max(0, int(annual_usage)),
                    'ordering_cost': ordering_cost,
                    'holding_cost_rate': holding_cost_rate
                },
                'model_performance': {
                    'mae': self.part_stats[part_id]['mae'],
                    'rmse': self.part_stats[part_id]['rmse'],
                    'avg_usage': self.part_stats[part_id]['avg_usage']
                }
            }
            
        except Exception as e:
            logger.error(f"Error making predictions for {part_id}: {e}")
            return {}
    
    def get_reorder_recommendations(self, current_stock: Dict[str, int]) -> List[Dict]:
        """
        Get reorder recommendations for all parts
        
        Args:
            current_stock: Dictionary with part_id -> current_stock mapping
            
        Returns:
            List of reorder recommendations
        """
        try:
            recommendations = []
            
            for part_id in self.models.keys():
                if part_id not in current_stock:
                    continue
                
                # Get predictions
                prediction = self.predict(part_id, 30)
                if not prediction:
                    continue
                
                current = current_stock[part_id]
                reorder_point = prediction['reorder_info']['reorder_point']
                safety_stock = prediction['reorder_info']['safety_stock']
                lead_time = prediction['reorder_info']['lead_time_days']
                eoq = prediction['eoq_info']['eoq']
                
                # Calculate days until reorder
                daily_usage = prediction['model_performance']['avg_usage']
                days_until_reorder = max(0, (current - reorder_point) / daily_usage) if daily_usage > 0 else 999
                
                # Determine priority
                if current <= safety_stock:
                    priority = 'HIGH'
                elif current <= reorder_point:
                    priority = 'MEDIUM'
                elif days_until_reorder <= lead_time:
                    priority = 'LOW'
                else:
                    continue  # No reorder needed
                
                recommendations.append({
                    'part_id': part_id,
                    'part_name': prediction['part_name'],
                    'current_stock': current,
                    'reorder_point': reorder_point,
                    'safety_stock': safety_stock,
                    'recommended_order_quantity': eoq,
                    'days_until_reorder': int(days_until_reorder),
                    'lead_time_days': lead_time,
                    'unit_cost': self.part_stats[part_id]['unit_cost'],
                    'priority': priority
                })
            
            # Sort by priority
            priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
            recommendations.sort(key=lambda x: priority_order.get(x['priority'], 3))
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting reorder recommendations: {e}")
            return []
    
    def save_models(self) -> bool:
        """
        Save trained models to disk
        
        Returns:
            True if successful, False otherwise
        """
        try:
            for part_id, model in self.models.items():
                model_path = os.path.join(self.models_dir, f'prophet_part_{part_id}.pkl')
                joblib.dump(model, model_path)
            
            # Save part statistics
            stats_path = os.path.join(self.models_dir, 'prophet_part_stats.json')
            import json
            with open(stats_path, 'w') as f:
                json.dump(self.part_stats, f, indent=2)
            
            logger.info(f"Saved {len(self.models)} Prophet models to {self.models_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
            return False
    
    def load_models(self) -> bool:
        """
        Load trained models from disk
        
        Returns:
            True if successful, False otherwise
        """
        try:
            import json
            
            # Load part statistics
            stats_path = os.path.join(self.models_dir, 'prophet_part_stats.json')
            if os.path.exists(stats_path):
                with open(stats_path, 'r') as f:
                    self.part_stats = json.load(f)
            
            # Load models
            model_files = [f for f in os.listdir(self.models_dir) if f.startswith('prophet_part_') and f.endswith('.pkl')]
            
            for model_file in model_files:
                part_id = model_file.replace('prophet_part_', '').replace('.pkl', '')
                model_path = os.path.join(self.models_dir, model_file)
                
                try:
                    model = joblib.load(model_path)
                    self.models[part_id] = model
                except Exception as e:
                    logger.warning(f"Could not load model for {part_id}: {e}")
                    continue
            
            self.is_trained = len(self.models) > 0
            logger.info(f"Loaded {len(self.models)} Prophet models from {self.models_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            return False
    
    def get_model_statistics(self) -> Dict:
        """
        Get statistics about trained models
        
        Returns:
            Dictionary with model statistics
        """
        try:
            if not self.is_trained:
                return {'total_models': 0, 'models': []}
            
            models_info = []
            for part_id, stats in self.part_stats.items():
                models_info.append({
                    'part_id': part_id,
                    'part_name': stats['part_name'],
                    'mae': stats['mae'],
                    'rmse': stats['rmse'],
                    'avg_usage': stats['avg_usage'],
                    'lead_time_days': stats['lead_time_days'],
                    'unit_cost': stats['unit_cost']
                })
            
            return {
                'total_models': len(self.models),
                'models': models_info
            }
            
        except Exception as e:
            logger.error(f"Error getting model statistics: {e}")
            return {'total_models': 0, 'models': []}

# Example usage
if __name__ == "__main__":
    # Initialize forecaster
    forecaster = ProphetInventoryForecaster()
    
    # Example: Load and train with sample data
    # This would typically be called from the main ML service
    print("Prophet Inventory Forecaster initialized")
    print("Use this class in your ML service for advanced forecasting")
