"""
Setup Script for MongoDB Integration and Prophet Forecasting
Automates the setup process for the enhanced ML inventory system
"""

import os
import sys
import subprocess
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_command(command, description):
    """Run a command and handle errors"""
    try:
        logger.info(f"Running: {description}")
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        logger.info(f"Success: {description}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running {description}: {e}")
        logger.error(f"Command output: {e.stdout}")
        logger.error(f"Command error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        logger.error("Python 3.8 or higher is required")
        return False
    
    logger.info(f"Python version: {version.major}.{version.minor}.{version.micro}")
    return True

def install_requirements():
    """Install required packages"""
    requirements_file = "requirements_mongodb.txt"
    
    if not os.path.exists(requirements_file):
        logger.error(f"Requirements file {requirements_file} not found")
        return False
    
    return run_command(
        f"pip install -r {requirements_file}",
        "Installing MongoDB and Prophet requirements"
    )

def setup_directories():
    """Create necessary directories"""
    directories = [
        "models",
        "data",
        "logs",
        "src/__pycache__"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Created directory: {directory}")
    
    return True

def create_env_file():
    """Create environment configuration file"""
    env_content = """# ML Inventory System Environment Configuration

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/automotive_service_management
MONGODB_DATABASE=automotive_service_management

# ML Service Configuration
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=8001
ML_SERVICE_DEBUG=True

# Model Configuration
MODELS_DIR=models
PROPHET_MODELS_ENABLED=True
LINEAR_MODELS_ENABLED=True

# Data Configuration
MIN_TRAINING_DAYS=30
MAX_TRAINING_DAYS=365
UPDATE_INTERVAL_HOURS=1

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/ml_service.log
"""
    
    with open(".env", "w") as f:
        f.write(env_content)
    
    logger.info("Created .env configuration file")
    return True

def test_mongodb_connection():
    """Test MongoDB connection"""
    try:
        from pymongo import MongoClient
        
        # Try to connect to MongoDB
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        client.close()
        
        logger.info("MongoDB connection test successful")
        return True
        
    except Exception as e:
        logger.warning(f"MongoDB connection test failed: {e}")
        logger.warning("Make sure MongoDB is running on localhost:27017")
        return False

def test_prophet_installation():
    """Test Prophet installation"""
    try:
        from prophet import Prophet
        import pandas as pd
        
        # Create a simple test
        df = pd.DataFrame({
            'ds': pd.date_range('2023-01-01', periods=100),
            'y': range(100)
        })
        
        model = Prophet()
        model.fit(df)
        
        logger.info("Prophet installation test successful")
        return True
        
    except Exception as e:
        logger.error(f"Prophet installation test failed: {e}")
        return False

def create_startup_script():
    """Create startup script for the ML service"""
    startup_script = """#!/bin/bash
# ML Inventory Service Startup Script

echo "Starting ML Inventory Service with MongoDB Integration..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements_mongodb.txt

# Start the ML service
echo "Starting ML service on port 8001..."
python api/ml_service_mongodb.py
"""
    
    with open("start_ml_service_mongodb.sh", "w") as f:
        f.write(startup_script)
    
    # Make it executable
    os.chmod("start_ml_service_mongodb.sh", 0o755)
    
    logger.info("Created startup script: start_ml_service_mongodb.sh")
    return True

def create_windows_startup_script():
    """Create Windows startup script"""
    startup_script = """@echo off
REM ML Inventory Service Startup Script for Windows

echo Starting ML Inventory Service with MongoDB Integration...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\\Scripts\\activate.bat

REM Install requirements
pip install -r requirements_mongodb.txt

REM Start the ML service
echo Starting ML service on port 8001...
python api/ml_service_mongodb.py

pause
"""
    
    with open("start_ml_service_mongodb.bat", "w") as f:
        f.write(startup_script)
    
    logger.info("Created Windows startup script: start_ml_service_mongodb.bat")
    return True

def create_training_script():
    """Create script to train models with MongoDB data"""
    training_script = """#!/usr/bin/env python3
'''
Train ML models with MongoDB data
Run this script to train Prophet and Linear Regression models
'''

import sys
import os
sys.path.append('src')

from data_pipeline import MLDataPipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    try:
        # Initialize pipeline
        pipeline = MLDataPipeline()
        
        # Check health
        health = pipeline.get_health_status()
        logger.info(f"Pipeline health: {health}")
        
        # Train models
        logger.info("Training models with MongoDB data...")
        success = pipeline.train_models(use_prophet=True)
        
        if success:
            logger.info("Model training completed successfully!")
            
            # Get statistics
            stats = pipeline.get_model_statistics()
            logger.info(f"Trained {stats['total_models']} models")
            
        else:
            logger.error("Model training failed")
            return 1
        
        return 0
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        return 1
    finally:
        if 'pipeline' in locals():
            pipeline.close()

if __name__ == "__main__":
    exit(main())
"""
    
    with open("train_models_mongodb.py", "w") as f:
        f.write(training_script)
    
    # Make it executable
    os.chmod("train_models_mongodb.py", 0o755)
    
    logger.info("Created training script: train_models_mongodb.py")
    return True

def main():
    """Main setup function"""
    logger.info("Setting up ML Inventory System with MongoDB Integration")
    logger.info("=" * 60)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Setup directories
    if not setup_directories():
        return False
    
    # Create environment file
    if not create_env_file():
        return False
    
    # Install requirements
    if not install_requirements():
        return False
    
    # Test installations
    test_mongodb_connection()
    test_prophet_installation()
    
    # Create startup scripts
    create_startup_script()
    create_windows_startup_script()
    create_training_script()
    
    logger.info("=" * 60)
    logger.info("Setup completed successfully!")
    logger.info("")
    logger.info("Next steps:")
    logger.info("1. Make sure MongoDB is running")
    logger.info("2. Run: python train_models_mongodb.py")
    logger.info("3. Run: python api/ml_service_mongodb.py")
    logger.info("4. Test: curl http://localhost:8001/health")
    logger.info("")
    logger.info("For Windows users:")
    logger.info("Run: start_ml_service_mongodb.bat")
    logger.info("")
    logger.info("For Linux/Mac users:")
    logger.info("Run: ./start_ml_service_mongodb.sh")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
