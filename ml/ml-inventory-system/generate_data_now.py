"""
Simple Data Generator - Guaranteed to Work
This will create the data file in the correct location
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_all_parts_data():
    """Generate realistic usage data for all 45 parts"""
    
    # All 45 parts from your database with realistic characteristics
    parts = [
        # BRAKES CATEGORY (12 parts)
        {"id": "BRK-PAD-CER-F001", "name": "Ceramic Brake Pads - Front", "base_usage": 8, "seasonality": 0.1, "lead_time": 7, "cost": 65.00},
        {"id": "BRK-DSC-ROT-R002", "name": "Brake Disc Rotor - Rear", "base_usage": 3, "seasonality": 0.05, "lead_time": 10, "cost": 120.00},
        {"id": "BRK-FLD-DOT4-003", "name": "Brake Fluid DOT 4", "base_usage": 12, "seasonality": 0.15, "lead_time": 3, "cost": 18.50},
        {"id": "BRK-CAL-FL-004", "name": "Brake Caliper - Front Left", "base_usage": 2, "seasonality": 0.02, "lead_time": 14, "cost": 180.00},
        {"id": "BRK-MST-CYL-005", "name": "Brake Master Cylinder", "base_usage": 1, "seasonality": 0.01, "lead_time": 21, "cost": 250.00},
        {"id": "BRK-SHO-SET-006", "name": "Brake Shoe Set - Rear", "base_usage": 4, "seasonality": 0.08, "lead_time": 7, "cost": 85.00},
        {"id": "BRK-LIN-KIT-007", "name": "Brake Line Kit", "base_usage": 3, "seasonality": 0.05, "lead_time": 5, "cost": 45.00},
        {"id": "BRK-HOS-FLEX-008", "name": "Brake Hose - Flexible", "base_usage": 5, "seasonality": 0.1, "lead_time": 4, "cost": 35.00},
        {"id": "BRK-PED-ASM-009", "name": "Brake Pedal Assembly", "base_usage": 1, "seasonality": 0.01, "lead_time": 14, "cost": 120.00},
        {"id": "BRK-BOO-SEN-010", "name": "Brake Booster Sensor", "base_usage": 2, "seasonality": 0.03, "lead_time": 7, "cost": 85.00},
        {"id": "BRK-ABS-MOD-011", "name": "ABS Module", "base_usage": 1, "seasonality": 0.01, "lead_time": 21, "cost": 450.00},
        {"id": "BRK-WAR-SEN-012", "name": "Brake Warning Sensor", "base_usage": 3, "seasonality": 0.05, "lead_time": 5, "cost": 25.00},
        
        # FILTERS CATEGORY (11 parts)
        {"id": "FLT-OIL-ENG-013", "name": "Engine Oil Filter", "base_usage": 15, "seasonality": 0.2, "lead_time": 3, "cost": 12.50},
        {"id": "FLT-AIR-HF-014", "name": "Air Filter - High Flow", "base_usage": 12, "seasonality": 0.3, "lead_time": 5, "cost": 18.75},
        {"id": "FLT-FUL-INL-015", "name": "Fuel Filter Inline", "base_usage": 8, "seasonality": 0.1, "lead_time": 4, "cost": 22.00},
        {"id": "FLT-CAB-AIR-016", "name": "Cabin Air Filter", "base_usage": 10, "seasonality": 0.25, "lead_time": 3, "cost": 15.50},
        {"id": "FLT-TRN-KIT-017", "name": "Transmission Filter Kit", "base_usage": 4, "seasonality": 0.05, "lead_time": 7, "cost": 35.00},
        {"id": "FLT-PWR-STE-018", "name": "Power Steering Filter", "base_usage": 3, "seasonality": 0.03, "lead_time": 5, "cost": 28.00},
        {"id": "FLT-HYD-OIL-019", "name": "Hydraulic Oil Filter", "base_usage": 2, "seasonality": 0.02, "lead_time": 7, "cost": 45.00},
        {"id": "FLT-AC-EVA-020", "name": "AC Evaporator Filter", "base_usage": 6, "seasonality": 0.4, "lead_time": 4, "cost": 32.00},
        {"id": "FLT-EXH-CAT-021", "name": "Exhaust Catalytic Filter", "base_usage": 1, "seasonality": 0.01, "lead_time": 14, "cost": 280.00},
        {"id": "FLT-DPF-DIE-022", "name": "DPF Diesel Filter", "base_usage": 1, "seasonality": 0.01, "lead_time": 21, "cost": 450.00},
        {"id": "FLT-WAT-RAD-023", "name": "Water Radiator Filter", "base_usage": 5, "seasonality": 0.2, "lead_time": 4, "cost": 25.00},
        
        # ENGINES CATEGORY (11 parts)
        {"id": "ENG-GSK-CMP-024", "name": "Engine Gasket Set Complete", "base_usage": 2, "seasonality": 0.05, "lead_time": 14, "cost": 85.00},
        {"id": "ENG-TMG-BLT-025", "name": "Timing Belt Kit", "base_usage": 1, "seasonality": 0.02, "lead_time": 21, "cost": 120.00},
        {"id": "ENG-OIL-PMP-026", "name": "Engine Oil Pump", "base_usage": 1, "seasonality": 0.01, "lead_time": 14, "cost": 180.00},
        {"id": "ENG-CYL-HD-027", "name": "Cylinder Head Assembly", "base_usage": 1, "seasonality": 0.01, "lead_time": 28, "cost": 450.00},
        {"id": "ENG-PST-RNG-028", "name": "Piston Ring Set", "base_usage": 2, "seasonality": 0.03, "lead_time": 14, "cost": 65.00},
        {"id": "ENG-CAM-SHA-029", "name": "Camshaft Assembly", "base_usage": 1, "seasonality": 0.01, "lead_time": 21, "cost": 280.00},
        {"id": "ENG-CRA-SHA-030", "name": "Crankshaft Assembly", "base_usage": 1, "seasonality": 0.01, "lead_time": 28, "cost": 380.00},
        {"id": "ENG-VAL-SET-031", "name": "Valve Set Complete", "base_usage": 1, "seasonality": 0.02, "lead_time": 14, "cost": 120.00},
        {"id": "ENG-FLY-WHE-032", "name": "Flywheel Assembly", "base_usage": 1, "seasonality": 0.01, "lead_time": 21, "cost": 220.00},
        {"id": "ENG-TUR-CHR-033", "name": "Turbocharger Assembly", "base_usage": 1, "seasonality": 0.01, "lead_time": 28, "cost": 650.00},
        {"id": "ENG-INT-MAN-034", "name": "Intake Manifold", "base_usage": 2, "seasonality": 0.03, "lead_time": 14, "cost": 180.00},
        
        # ELECTRIC CATEGORY (11 parts)
        {"id": "ELC-ALT-ASM-035", "name": "Alternator Assembly", "base_usage": 3, "seasonality": 0.1, "lead_time": 10, "cost": 280.00},
        {"id": "ELC-STR-MTR-036", "name": "Starter Motor", "base_usage": 2, "seasonality": 0.05, "lead_time": 10, "cost": 220.00},
        {"id": "ELC-BAT-AGM-037", "name": "Battery - AGM Deep Cycle", "base_usage": 4, "seasonality": 0.4, "lead_time": 7, "cost": 180.00},
        {"id": "ELC-IGN-COL-038", "name": "Ignition Coil Pack", "base_usage": 6, "seasonality": 0.1, "lead_time": 5, "cost": 85.00},
        {"id": "ELC-SPK-IRD-039", "name": "Spark Plug Set - Iridium", "base_usage": 8, "seasonality": 0.05, "lead_time": 4, "cost": 45.00},
        {"id": "ELC-WIR-HAR-040", "name": "Wiring Harness Main", "base_usage": 1, "seasonality": 0.01, "lead_time": 21, "cost": 350.00},
        {"id": "ELC-FUS-BOX-041", "name": "Fuse Box Assembly", "base_usage": 2, "seasonality": 0.03, "lead_time": 7, "cost": 120.00},
        {"id": "ELC-REL-GEN-042", "name": "Relay - General Purpose", "base_usage": 10, "seasonality": 0.1, "lead_time": 3, "cost": 15.00},
        {"id": "ELC-SEN-O2-043", "name": "O2 Oxygen Sensor", "base_usage": 4, "seasonality": 0.05, "lead_time": 7, "cost": 85.00},
        {"id": "ELC-ECU-ENG-044", "name": "ECU Engine Control Unit", "base_usage": 1, "seasonality": 0.01, "lead_time": 21, "cost": 450.00},
        {"id": "ELC-LED-HED-045", "name": "LED Headlight Assembly", "base_usage": 3, "seasonality": 0.1, "lead_time": 10, "cost": 180.00}
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

def save_data_now():
    """Generate and save data to multiple locations"""
    print("Generating automotive parts data for all 45 parts...")
    df = generate_all_parts_data()
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Save to multiple locations to ensure it's found
    locations = [
        'data/automotive_parts_usage_enhanced.csv',
        'automotive_parts_usage_enhanced.csv',
        'data/automotive_parts_usage.csv',
        'automotive_parts_usage.csv'
    ]
    
    for location in locations:
        try:
            df.to_csv(location, index=False)
            print(f"✅ Saved data to: {location}")
        except Exception as e:
            print(f"❌ Failed to save to {location}: {e}")
    
    print(f"\n📊 Data Summary:")
    print(f"Generated {len(df)} records for {df['part_id'].nunique()} parts")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Total usage: {df['quantity_used'].sum():,} units")
    print(f"Total value: ${(df['quantity_used'] * df['unit_cost']).sum():,.2f}")
    
    # Show sample data
    print(f"\n📋 Sample data:")
    print(df.head(10).to_string())
    
    # Show summary by part
    print(f"\n📈 Usage summary by part:")
    summary = df.groupby(['part_id', 'part_name']).agg({
        'quantity_used': ['sum', 'mean', 'std'],
        'unit_cost': 'first'
    }).round(2)
    print(summary.to_string())
    
    return df

if __name__ == "__main__":
    save_data_now()
