"""
Sample Data Generator for Automotive Parts Inventory
Creates realistic usage patterns for training ML models
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_sample_data():
    """Generate realistic automotive parts usage data"""
    
    # Define automotive parts with realistic characteristics
    parts = [
        {"id": "ENG-001", "name": "Engine Oil Filter", "base_usage": 15, "seasonality": 0.2, "lead_time": 3, "cost": 12.50},
        {"id": "BRA-002", "name": "Brake Pads", "base_usage": 8, "seasonality": 0.1, "lead_time": 7, "cost": 45.00},
        {"id": "AIR-003", "name": "Air Filter", "base_usage": 12, "seasonality": 0.3, "lead_time": 5, "cost": 18.75},
        {"id": "SPA-004", "name": "Spark Plugs", "base_usage": 6, "seasonality": 0.05, "lead_time": 4, "cost": 8.50},
        {"id": "BAT-005", "name": "Car Battery", "base_usage": 3, "seasonality": 0.4, "lead_time": 10, "cost": 120.00},
        {"id": "TIR-006", "name": "Tire Set", "base_usage": 2, "seasonality": 0.15, "lead_time": 14, "cost": 350.00},
        {"id": "BEL-007", "name": "Timing Belt", "base_usage": 1, "seasonality": 0.02, "lead_time": 21, "cost": 85.00},
        {"id": "FLU-008", "name": "Transmission Fluid", "base_usage": 4, "seasonality": 0.1, "lead_time": 6, "cost": 15.25},
        {"id": "RAD-009", "name": "Radiator Coolant", "base_usage": 10, "seasonality": 0.25, "lead_time": 4, "cost": 22.00},
        {"id": "WIN-010", "name": "Windshield Wipers", "base_usage": 5, "seasonality": 0.35, "lead_time": 3, "cost": 28.50}
    ]
    
    # Generate 2 years of daily data
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2024, 12, 31)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    data = []
    
    for date in date_range:
        # Add seasonal patterns (higher usage in winter for some parts)
        day_of_year = date.timetuple().tm_yday
        seasonal_factor = 1 + 0.3 * np.sin(2 * np.pi * day_of_year / 365)
        
        # Add weekly patterns (lower usage on weekends)
        day_of_week = date.weekday()
        weekly_factor = 0.7 if day_of_week >= 5 else 1.0
        
        for part in parts:
            # Base usage with randomness
            base_usage = part["base_usage"]
            
            # Apply seasonal and weekly factors
            seasonal_effect = part["seasonality"] * seasonal_factor
            usage = base_usage * (1 + seasonal_effect) * weekly_factor
            
            # Add random noise
            usage += np.random.normal(0, usage * 0.2)
            usage = max(0, int(usage))  # Ensure non-negative integers
            
            # Calculate stock on hand (simplified)
            initial_stock = 500
            stock_on_hand = max(0, initial_stock - np.random.randint(0, 50))
            
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'part_id': part["id"],
                'part_name': part["name"],
                'quantity_used': usage,
                'stock_on_hand': stock_on_hand,
                'lead_time_days': part["lead_time"],
                'unit_cost': part["cost"],
                'seasonal_factor': seasonal_factor,
                'weekly_factor': weekly_factor
            })
    
    return pd.DataFrame(data)

def save_sample_data():
    """Generate and save sample data to CSV"""
    print("Generating sample automotive parts data...")
    df = generate_sample_data()
    
    # Save to CSV
    df.to_csv('../data/automotive_parts_usage.csv', index=False)
    
    print(f"Generated {len(df)} records for {df['part_id'].nunique()} parts")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Total usage: {df['quantity_used'].sum():,} units")
    print(f"Total value: ${(df['quantity_used'] * df['unit_cost']).sum():,.2f}")
    
    # Show sample data
    print("\nSample data:")
    print(df.head(10).to_string())
    
    # Show summary by part
    print("\nUsage summary by part:")
    summary = df.groupby(['part_id', 'part_name']).agg({
        'quantity_used': ['sum', 'mean', 'std'],
        'unit_cost': 'first'
    }).round(2)
    print(summary.to_string())
    
    return df

if __name__ == "__main__":
    save_sample_data()
