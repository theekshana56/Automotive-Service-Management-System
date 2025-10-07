"""
Linear Regression Model for Inventory Forecasting
Simple but effective approach for quick results
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
import os
from datetime import datetime, timedelta

class InventoryForecaster:
    def __init__(self):
        self.models = {}
        self.part_stats = {}
        self.is_trained = False
    
    def prepare_data(self, df):
        """Prepare data for training"""
        # Convert date to datetime
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Create time-based features
        df['day_of_year'] = df['date'].dt.dayofyear
        df['month'] = df['date'].dt.month
        df['day_of_week'] = df['date'].dt.dayofweek
        df['is_weekend'] = (df['date'].dt.dayofweek >= 5).astype(int)
        
        # Create lag features (previous day usage)
        df['usage_lag_1'] = df.groupby('part_id')['quantity_used'].shift(1)
        df['usage_lag_7'] = df.groupby('part_id')['quantity_used'].shift(7)
        
        # Rolling averages
        df['usage_ma_7'] = df.groupby('part_id')['quantity_used'].rolling(7).mean().reset_index(0, drop=True)
        df['usage_ma_30'] = df.groupby('part_id')['quantity_used'].rolling(30).mean().reset_index(0, drop=True)
        
        return df
    
    def train_model(self, df):
        """Train linear regression models for each part"""
        print("Training Linear Regression models...")
        
        # Prepare data
        df_processed = self.prepare_data(df)
        
        # Remove rows with NaN values (from lag features)
        df_processed = df_processed.dropna()
        
        # Feature columns for training
        feature_cols = [
            'day_of_year', 'month', 'day_of_week', 'is_weekend',
            'usage_lag_1', 'usage_lag_7', 'usage_ma_7', 'usage_ma_30',
            'seasonal_factor', 'weekly_factor'
        ]
        
        # Train model for each part
        for part_id in df_processed['part_id'].unique():
            part_data = df_processed[df_processed['part_id'] == part_id].copy()
            
            if len(part_data) < 30:  # Need minimum data points
                print(f"Skipping {part_id}: insufficient data ({len(part_data)} points)")
                continue
            
            # Prepare features and target
            X = part_data[feature_cols]
            y = part_data['quantity_used']
            
            # Train model
            model = LinearRegression()
            model.fit(X, y)
            
            # Make predictions for evaluation
            y_pred = model.predict(X)
            
            # Calculate metrics
            mae = mean_absolute_error(y, y_pred)
            rmse = np.sqrt(mean_squared_error(y, y_pred))
            
            # Store model and stats
            self.models[part_id] = model
            self.part_stats[part_id] = {
                'mae': mae,
                'rmse': rmse,
                'avg_usage': y.mean(),
                'std_usage': y.std(),
                'lead_time': part_data['lead_time_days'].iloc[0],
                'unit_cost': part_data['unit_cost'].iloc[0],
                'part_name': part_data['part_name'].iloc[0]
            }
            
            print(f"{part_id}: MAE={mae:.2f}, RMSE={rmse:.2f}, Avg Usage={y.mean():.1f}")
        
        self.is_trained = True
        print(f"Trained {len(self.models)} models successfully!")
    
    def predict_next_days(self, part_id, days=30):
        """Predict usage for next N days"""
        if not self.is_trained or part_id not in self.models:
            raise ValueError(f"Model not trained for part {part_id}")
        
        model = self.models[part_id]
        stats = self.part_stats[part_id]
        
        # Generate future dates
        last_date = datetime.now()
        future_dates = [last_date + timedelta(days=i) for i in range(1, days + 1)]
        
        predictions = []
        
        for i, date in enumerate(future_dates):
            # Create features for prediction
            features = {
                'day_of_year': date.timetuple().tm_yday,
                'month': date.month,
                'day_of_week': date.weekday(),
                'is_weekend': 1 if date.weekday() >= 5 else 0,
                'usage_lag_1': stats['avg_usage'],  # Use average as proxy
                'usage_lag_7': stats['avg_usage'],
                'usage_ma_7': stats['avg_usage'],
                'usage_ma_30': stats['avg_usage'],
                'seasonal_factor': 1 + 0.3 * np.sin(2 * np.pi * date.timetuple().tm_yday / 365),
                'weekly_factor': 0.7 if date.weekday() >= 5 else 1.0
            }
            
            # Make prediction
            X_pred = pd.DataFrame([features])
            pred = model.predict(X_pred)[0]
            pred = max(0, pred)  # Ensure non-negative
            
            predictions.append({
                'date': date.strftime('%Y-%m-%d'),
                'predicted_usage': round(pred, 2),
                'part_id': part_id
            })
        
        return predictions
    
    def calculate_reorder_point(self, part_id, service_level=0.95):
        """Calculate optimal reorder point using safety stock formula"""
        if part_id not in self.part_stats:
            raise ValueError(f"No stats available for part {part_id}")
        
        stats = self.part_stats[part_id]
        
        # Safety stock calculation
        # SS = Z * σ * √(Lead Time)
        # Where Z is service level factor (1.65 for 95%)
        z_score = 1.65 if service_level == 0.95 else 1.28  # 90% service level
        
        safety_stock = z_score * stats['std_usage'] * np.sqrt(stats['lead_time'])
        
        # Reorder point = (Average daily usage × Lead time) + Safety stock
        reorder_point = (stats['avg_usage'] * stats['lead_time']) + safety_stock
        
        return {
            'reorder_point': round(reorder_point, 2),
            'safety_stock': round(safety_stock, 2),
            'avg_daily_usage': round(stats['avg_usage'], 2),
            'lead_time_days': stats['lead_time'],
            'service_level': service_level
        }
    
    def calculate_eoq(self, part_id, ordering_cost=25, holding_rate=0.2):
        """Calculate Economic Order Quantity"""
        if part_id not in self.part_stats:
            raise ValueError(f"No stats available for part {part_id}")
        
        stats = self.part_stats[part_id]
        
        # Annual demand
        annual_demand = stats['avg_usage'] * 365
        
        # Holding cost per unit per year
        holding_cost = stats['unit_cost'] * holding_rate
        
        # EOQ formula: √(2 * D * S / H)
        # D = Annual demand, S = Ordering cost, H = Holding cost
        eoq = np.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
        
        return {
            'eoq': round(eoq, 2),
            'annual_demand': round(annual_demand, 2),
            'ordering_cost': ordering_cost,
            'holding_cost_per_unit': round(holding_cost, 2),
            'total_ordering_cost': round((annual_demand / eoq) * ordering_cost, 2),
            'total_holding_cost': round((eoq / 2) * holding_cost, 2)
        }
    
    def save_models(self, models_dir='../models'):
        """Save trained models to disk"""
        os.makedirs(models_dir, exist_ok=True)
        
        # Save each model
        for part_id, model in self.models.items():
            model_path = os.path.join(models_dir, f'linear_model_{part_id}.pkl')
            joblib.dump(model, model_path)
        
        # Save stats
        stats_path = os.path.join(models_dir, 'part_stats.json')
        import json
        with open(stats_path, 'w') as f:
            json.dump(self.part_stats, f, indent=2, default=str)
        
        print(f"Saved {len(self.models)} models to {models_dir}")
    
    def load_models(self, models_dir='../models'):
        """Load trained models from disk"""
        import json
        
        # Load stats
        stats_path = os.path.join(models_dir, 'part_stats.json')
        if os.path.exists(stats_path):
            with open(stats_path, 'r') as f:
                self.part_stats = json.load(f)
        
        # Load models
        for part_id in self.part_stats.keys():
            model_path = os.path.join(models_dir, f'linear_model_{part_id}.pkl')
            if os.path.exists(model_path):
                self.models[part_id] = joblib.load(model_path)
        
        self.is_trained = len(self.models) > 0
        print(f"Loaded {len(self.models)} models from {models_dir}")

def main():
    """Example usage"""
    # This will be called after we generate sample data
    print("Linear Regression Inventory Forecaster")
    print("=" * 50)
    
    # Initialize forecaster
    forecaster = InventoryForecaster()
    
    # Load sample data (we'll create this next)
    try:
        df = pd.read_csv('../data/automotive_parts_usage.csv')
        print(f"Loaded {len(df)} records")
        
        # Train models
        forecaster.train_model(df)
        
        # Save models
        forecaster.save_models()
        
        # Example predictions
        print("\nSample Predictions:")
        for part_id in list(forecaster.models.keys())[:3]:
            predictions = forecaster.predict_next_days(part_id, days=7)
            print(f"\n{part_id} - Next 7 days:")
            for pred in predictions[:3]:
                print(f"  {pred['date']}: {pred['predicted_usage']} units")
        
        # Example reorder calculations
        print("\nReorder Point Calculations:")
        for part_id in list(forecaster.models.keys())[:3]:
            reorder_info = forecaster.calculate_reorder_point(part_id)
            eoq_info = forecaster.calculate_eoq(part_id)
            print(f"\n{part_id}:")
            print(f"  Reorder Point: {reorder_info['reorder_point']} units")
            print(f"  Safety Stock: {reorder_info['safety_stock']} units")
            print(f"  EOQ: {eoq_info['eoq']} units")
    
    except FileNotFoundError:
        print("Sample data not found. Please run data_generator.py first.")

if __name__ == "__main__":
    main()
