"""
Simple ML Service Starter
Provides basic ML functionality without requiring MongoDB or Prophet
Use this when the full MongoDB integration isn't ready yet
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global data store
ml_data = {
    'models_trained': False,
    'last_update': None,
    'available_parts': ['part_001', 'part_002', 'part_003', 'part_004', 'part_005']
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    logger.info("Starting Simple ML Service...")
    ml_data['last_update'] = datetime.now()
    ml_data['models_trained'] = True
    logger.info("Simple ML service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Simple ML service stopped")

# Create FastAPI app
app = FastAPI(
    title="Simple ML Inventory Service",
    description="Basic ML inventory forecasting service with fallback data",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PredictionRequest(BaseModel):
    partIds: List[str]
    days: int = 30

class ReorderRequest(BaseModel):
    currentStock: Dict[str, int]

# Helper functions
def generate_sample_predictions(part_ids: List[str], days: int) -> List[Dict]:
    """Generate sample predictions"""
    predictions = []
    
    for part_id in part_ids:
        # Generate realistic usage patterns
        base_usage = 5 + hash(part_id) % 10  # Consistent base usage per part
        seasonal_factor = 1 + 0.3 * (hash(part_id) % 3 - 1)  # Seasonal variation
        
        part_predictions = []
        for i in range(days):
            date = (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
            # Add some randomness but keep it realistic
            usage = max(0, base_usage + (hash(f"{part_id}{date}") % 5 - 2))
            usage = usage * seasonal_factor
            
            part_predictions.append({
                'date': date,
                'predicted_usage': round(usage, 1),
                'lower_bound': round(max(0, usage - 2), 1),
                'upper_bound': round(usage + 3, 1),
                'confidence': round(usage * 0.2, 1)
            })
        
        predictions.append({
            'part_id': part_id,
            'part_name': f'Part {part_id.split("_")[1]}',
            'predictions': part_predictions,
            'reorder_info': {
                'reorder_point': 15 + hash(part_id) % 20,
                'safety_stock': 5 + hash(part_id) % 10,
                'lead_time_days': 7 + hash(part_id) % 7
            },
            'eoq_info': {
                'eoq': 50 + hash(part_id) % 100,
                'annual_usage': 200 + hash(part_id) % 500,
                'ordering_cost': 50,
                'holding_cost_rate': 0.2
            },
            'model_performance': {
                'mae': 1.0 + (hash(part_id) % 10) / 10,
                'rmse': 1.5 + (hash(part_id) % 15) / 10,
                'avg_usage': base_usage
            }
        })
    
    return predictions

def generate_sample_recommendations() -> List[Dict]:
    """Generate sample reorder recommendations"""
    recommendations = []
    
    sample_parts = [
        {'id': 'part_001', 'name': 'Oil Filter', 'cost': 12.50, 'priority': 'HIGH'},
        {'id': 'part_002', 'name': 'Brake Pads', 'cost': 45.00, 'priority': 'MEDIUM'},
        {'id': 'part_003', 'name': 'Air Filter', 'cost': 8.75, 'priority': 'LOW'},
        {'id': 'part_004', 'name': 'Spark Plugs', 'cost': 6.25, 'priority': 'MEDIUM'},
        {'id': 'part_005', 'name': 'Battery', 'cost': 120.00, 'priority': 'LOW'}
    ]
    
    for part in sample_parts:
        recommendations.append({
            'part_id': part['id'],
            'part_name': part['name'],
            'current_stock': 5 + hash(part['id']) % 25,
            'reorder_point': 10 + hash(part['id']) % 20,
            'safety_stock': 3 + hash(part['id']) % 8,
            'recommended_order_quantity': 30 + hash(part['id']) % 50,
            'days_until_reorder': hash(part['id']) % 30,
            'lead_time_days': 5 + hash(part['id']) % 10,
            'unit_cost': part['cost'],
            'priority': part['priority']
        })
    
    return recommendations

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Simple ML Inventory Service",
        "version": "1.0.0",
        "status": "running",
        "features": [
            "Basic Predictions",
            "Reorder Recommendations",
            "Model Statistics",
            "Fallback Data"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "mongodb_status": "not_connected",
        "total_models": len(ml_data['available_parts']),
        "prophet_models": 0,
        "linear_models": len(ml_data['available_parts']),
        "last_update": ml_data['last_update'].isoformat() if ml_data['last_update'] else None,
        "available_parts": ml_data['available_parts']
    }

@app.post("/predict")
async def predict_usage(request: PredictionRequest):
    """Get usage predictions for specific parts"""
    try:
        predictions = generate_sample_predictions(request.partIds, request.days)
        return predictions
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reorder-recommendations")
async def get_reorder_recommendations(request: ReorderRequest):
    """Get reorder recommendations for all parts"""
    try:
        recommendations = generate_sample_recommendations()
        return recommendations
    except Exception as e:
        logger.error(f"Reorder recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-stats")
async def get_model_statistics():
    """Get model statistics"""
    try:
        models = []
        for part_id in ml_data['available_parts']:
            models.append({
                'part_id': part_id,
                'part_name': f'Part {part_id.split("_")[1]}',
                'mae': 1.0 + (hash(part_id) % 10) / 10,
                'rmse': 1.5 + (hash(part_id) % 15) / 10,
                'avg_usage': 5 + hash(part_id) % 10,
                'lead_time_days': 7 + hash(part_id) % 7,
                'unit_cost': 10 + hash(part_id) % 50
            })
        
        return {
            'total_models': len(models),
            'models': models
        }
    except Exception as e:
        logger.error(f"Model stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard-data")
async def get_dashboard_data():
    """Get comprehensive dashboard data"""
    try:
        recommendations = generate_sample_recommendations()
        
        # Calculate summary statistics
        total_parts = len(ml_data['available_parts'])
        high_priority = len([r for r in recommendations if r['priority'] == 'HIGH'])
        medium_priority = len([r for r in recommendations if r['priority'] == 'MEDIUM'])
        low_priority = len([r for r in recommendations if r['priority'] == 'LOW'])
        
        # Calculate inventory value
        total_inventory_value = sum(r['current_stock'] * r['unit_cost'] for r in recommendations)
        total_holding_cost = total_inventory_value * 0.2  # 20% holding cost
        
        # Create optimization insights
        optimization_insights = []
        for rec in recommendations[:3]:  # Top 3 recommendations
            optimization_insights.append({
                'part_id': rec['part_id'],
                'part_name': rec['part_name'],
                'inventory_value': rec['current_stock'] * rec['unit_cost'],
                'holding_cost_annual': rec['current_stock'] * rec['unit_cost'] * 0.2,
                'ordering_cost_annual': 50,
                'insights': [
                    f"Reorder {rec['recommended_order_quantity']} units when stock reaches {rec['reorder_point']}",
                    f"Lead time: {rec['lead_time_days']} days",
                    f"Priority: {rec['priority']}"
                ]
            })
        
        return {
            'health': {
                'status': 'healthy',
                'mongodb_status': 'not_connected',
                'total_models': total_parts,
                'prophet_models': 0,
                'linear_models': total_parts,
                'last_update': ml_data['last_update'].isoformat() if ml_data['last_update'] else None,
                'available_parts': ml_data['available_parts']
            },
            'recommendations': {
                'total_parts': total_parts,
                'high_priority': high_priority,
                'medium_priority': medium_priority,
                'low_priority': low_priority,
                'recommendations': recommendations
            },
            'modelStats': {
                'total_models': total_parts,
                'models': [
                    {
                        'part_id': part_id,
                        'part_name': f'Part {part_id.split("_")[1]}',
                        'mae': 1.0 + (hash(part_id) % 10) / 10,
                        'rmse': 1.5 + (hash(part_id) % 15) / 10,
                        'avg_usage': 5 + hash(part_id) % 10,
                        'lead_time_days': 7 + hash(part_id) % 7,
                        'unit_cost': 10 + hash(part_id) % 50
                    }
                    for part_id in ml_data['available_parts']
                ]
            },
            'optimization': {
                'total_inventory_value': total_inventory_value,
                'total_holding_cost_annual': total_holding_cost,
                'optimization_insights': optimization_insights
            }
        }
    except Exception as e:
        logger.error(f"Dashboard data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
async def retrain_models():
    """Trigger model retraining"""
    try:
        ml_data['last_update'] = datetime.now()
        ml_data['models_trained'] = True
        return {"message": "Model retraining completed (simulated)"}
    except Exception as e:
        logger.error(f"Retrain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test")
async def test_endpoint():
    """Test endpoint for basic functionality"""
    return {
        "status": "success",
        "message": "Simple ML service is running",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    # Run the service
    uvicorn.run(
        "simple_ml_service_starter:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
