#!/bin/bash
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
