"""
MongoDB Connector for ML Inventory System
Connects to your existing MongoDB database to fetch real inventory data
"""

import os
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDBConnector:
    """Connects to MongoDB and fetches real inventory data for ML training"""
    
    def __init__(self, connection_string: str = None):
        """
        Initialize MongoDB connection
        
        Args:
            connection_string: MongoDB connection string
                              Default: Uses environment variable MONGODB_URI or localhost
        """
        self.connection_string = connection_string or os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(self.connection_string, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.admin.command('ping')
            
            # Extract database name from connection string or use default
            if 'automotive' in self.connection_string.lower():
                db_name = 'automotive'
            else:
                db_name = 'automotive_service_management'
            
            self.db = self.client[db_name]
            logger.info(f"Connected to MongoDB database: {db_name}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def get_parts_usage_data(self, days_back: int = 365) -> pd.DataFrame:
        """
        Fetch parts usage data from MongoDB
        
        Args:
            days_back: Number of days to look back for data
            
        Returns:
            DataFrame with parts usage data
        """
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Fetch from parts usage logs collection
            usage_logs = self.db.partusagelogs.find({
                'usedAt': {
                    '$gte': start_date,
                    '$lte': end_date
                }
            }).sort('usedAt', 1)
            
            # Convert to DataFrame
            data = []
            for log in usage_logs:
                data.append({
                    'date': log['usedAt'],
                    'part_id': log.get('partId', {}).get('_id', 'unknown'),
                    'part_name': log.get('partId', {}).get('name', 'Unknown Part'),
                    'part_code': log.get('partId', {}).get('partCode', ''),
                    'quantity_used': log.get('quantityUsed', 0),
                    'unit_cost': log.get('partId', {}).get('unitCost', 0),
                    'used_by': log.get('usedBy', {}).get('name', 'Unknown'),
                    'note': log.get('note', '')
                })
            
            if not data:
                logger.warning("No usage data found in MongoDB")
                return pd.DataFrame()
            
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            
            logger.info(f"Fetched {len(df)} usage records from MongoDB")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching usage data: {e}")
            return pd.DataFrame()
    
    def get_parts_inventory_data(self) -> pd.DataFrame:
        """
        Fetch current parts inventory data from MongoDB
        
        Returns:
            DataFrame with current inventory data
        """
        try:
            # Fetch from parts collection
            parts = self.db.parts.find({})
            
            data = []
            for part in parts:
                data.append({
                    'part_id': str(part['_id']),
                    'part_name': part.get('name', 'Unknown'),
                    'part_code': part.get('partCode', ''),
                    'current_stock': part.get('currentStock', 0),
                    'min_stock': part.get('minStock', 0),
                    'max_stock': part.get('maxStock', 0),
                    'unit_cost': part.get('unitCost', 0),
                    'supplier': part.get('supplier', {}).get('name', 'Unknown'),
                    'category': part.get('category', 'Unknown'),
                    'lead_time_days': part.get('leadTimeDays', 7),
                    'is_active': part.get('isActive', True)
                })
            
            if not data:
                logger.warning("No parts data found in MongoDB")
                return pd.DataFrame()
            
            df = pd.DataFrame(data)
            logger.info(f"Fetched {len(df)} parts from MongoDB")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching parts data: {e}")
            return pd.DataFrame()
    
    def get_purchase_orders_data(self, days_back: int = 365) -> pd.DataFrame:
        """
        Fetch purchase orders data from MongoDB
        
        Args:
            days_back: Number of days to look back for data
            
        Returns:
            DataFrame with purchase orders data
        """
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Fetch from purchase orders collection
            pos = self.db.purchaseorders.find({
                'createdAt': {
                    '$gte': start_date,
                    '$lte': end_date
                }
            }).sort('createdAt', 1)
            
            data = []
            for po in pos:
                # Get items from the purchase order
                for item in po.get('items', []):
                    data.append({
                        'date': po['createdAt'],
                        'po_id': str(po['_id']),
                        'part_id': str(item.get('part', {}).get('_id', '')),
                        'part_name': item.get('part', {}).get('name', 'Unknown'),
                        'quantity_ordered': item.get('quantity', 0),
                        'unit_cost': item.get('unitCost', 0),
                        'total_cost': item.get('totalCost', 0),
                        'supplier': po.get('supplier', {}).get('name', 'Unknown'),
                        'status': po.get('status', 'Unknown')
                    })
            
            if not data:
                logger.warning("No purchase orders data found in MongoDB")
                return pd.DataFrame()
            
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            
            logger.info(f"Fetched {len(df)} purchase order items from MongoDB")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching purchase orders data: {e}")
            return pd.DataFrame()
    
    def get_suppliers_data(self) -> pd.DataFrame:
        """
        Fetch suppliers data from MongoDB
        
        Returns:
            DataFrame with suppliers data
        """
        try:
            suppliers = self.db.suppliers.find({})
            
            data = []
            for supplier in suppliers:
                data.append({
                    'supplier_id': str(supplier['_id']),
                    'name': supplier.get('name', 'Unknown'),
                    'contact_person': supplier.get('contactPerson', ''),
                    'email': supplier.get('email', ''),
                    'phone': supplier.get('phone', ''),
                    'address': supplier.get('address', ''),
                    'lead_time_days': supplier.get('leadTimeDays', 7),
                    'is_active': supplier.get('isActive', True)
                })
            
            if not data:
                logger.warning("No suppliers data found in MongoDB")
                return pd.DataFrame()
            
            df = pd.DataFrame(data)
            logger.info(f"Fetched {len(df)} suppliers from MongoDB")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching suppliers data: {e}")
            return pd.DataFrame()
    
    def create_ml_training_dataset(self, days_back: int = 365) -> pd.DataFrame:
        """
        Create comprehensive dataset for ML training from MongoDB data
        
        Args:
            days_back: Number of days to look back for data
            
        Returns:
            DataFrame ready for ML training
        """
        try:
            # Get all data
            usage_df = self.get_parts_usage_data(days_back)
            inventory_df = self.get_parts_inventory_data()
            po_df = self.get_purchase_orders_data(days_back)
            
            if usage_df.empty:
                logger.warning("No usage data available for ML training")
                return pd.DataFrame()
            
            # Create daily usage dataset
            daily_usage = usage_df.groupby(['date', 'part_id', 'part_name']).agg({
                'quantity_used': 'sum',
                'unit_cost': 'first'
            }).reset_index()
            
            # Add inventory information
            inventory_lookup = inventory_df.set_index('part_id')[['current_stock', 'min_stock', 'lead_time_days']].to_dict('index')
            
            # Add inventory data to usage data
            for idx, row in daily_usage.iterrows():
                part_id = row['part_id']
                if part_id in inventory_lookup:
                    daily_usage.loc[idx, 'current_stock'] = inventory_lookup[part_id]['current_stock']
                    daily_usage.loc[idx, 'min_stock'] = inventory_lookup[part_id]['min_stock']
                    daily_usage.loc[idx, 'lead_time_days'] = inventory_lookup[part_id]['lead_time_days']
                else:
                    daily_usage.loc[idx, 'current_stock'] = 0
                    daily_usage.loc[idx, 'min_stock'] = 0
                    daily_usage.loc[idx, 'lead_time_days'] = 7
            
            # Add date features
            daily_usage['day_of_week'] = daily_usage['date'].dt.dayofweek
            daily_usage['day_of_month'] = daily_usage['date'].dt.day
            daily_usage['month'] = daily_usage['date'].dt.month
            daily_usage['year'] = daily_usage['date'].dt.year
            daily_usage['day_of_year'] = daily_usage['date'].dt.dayofyear
            daily_usage['week_of_year'] = daily_usage['date'].dt.isocalendar().week
            daily_usage['quarter'] = daily_usage['date'].dt.quarter
            
            # Add seasonal features
            daily_usage['is_month_start'] = daily_usage['date'].dt.is_month_start.astype(int)
            daily_usage['is_month_end'] = daily_usage['date'].dt.is_month_end.astype(int)
            daily_usage['is_quarter_start'] = daily_usage['date'].dt.is_quarter_start.astype(int)
            daily_usage['is_quarter_end'] = daily_usage['date'].dt.is_quarter_end.astype(int)
            daily_usage['is_year_start'] = daily_usage['date'].dt.is_year_start.astype(int)
            daily_usage['is_year_end'] = daily_usage['date'].dt.is_year_end.astype(int)
            daily_usage['is_weekend'] = (daily_usage['day_of_week'] >= 5).astype(int)
            
            # Add seasonal factors
            daily_usage['seasonal_factor'] = np.sin(2 * np.pi * daily_usage['day_of_year'] / 365)
            daily_usage['weekly_factor'] = np.sin(2 * np.pi * daily_usage['day_of_week'] / 7)
            
            logger.info(f"Created ML training dataset with {len(daily_usage)} records")
            return daily_usage
            
        except Exception as e:
            logger.error(f"Error creating ML training dataset: {e}")
            return pd.DataFrame()
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

# Example usage
if __name__ == "__main__":
    # Initialize connector
    connector = MongoDBConnector()
    
    # Test connection and fetch data
    try:
        # Get usage data
        usage_data = connector.get_parts_usage_data(30)  # Last 30 days
        print(f"Usage data shape: {usage_data.shape}")
        
        # Get inventory data
        inventory_data = connector.get_parts_inventory_data()
        print(f"Inventory data shape: {inventory_data.shape}")
        
        # Create ML training dataset
        ml_dataset = connector.create_ml_training_dataset(90)  # Last 90 days
        print(f"ML dataset shape: {ml_dataset.shape}")
        
        if not ml_dataset.empty:
            print("\nSample ML dataset:")
            print(ml_dataset.head())
            print(f"\nColumns: {ml_dataset.columns.tolist()}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        connector.close()
