"""
Enhanced ML Service with MongoDB Integration and Prophet Forecasting
FastAPI service that connects to MongoDB and provides advanced ML predictions
"""

import os
import sys
import logging
from datetime import datetime
from typing import List, Dict, Optional
from contextlib import asynccontextmanager

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import our ML components
from data_pipeline import MLDataPipeline
from mongodb_connector import MongoDBConnector
from prophet_forecaster import ProphetInventoryForecaster

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global ML pipeline
ml_pipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    global ml_pipeline
    
    # Startup
    logger.info("Starting ML service with MongoDB integration...")
    
    try:
        # Initialize ML pipeline
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        ml_pipeline = MLDataPipeline(mongodb_uri=mongodb_uri)
        
        # Try to load existing models
        if not ml_pipeline.load_models():
            logger.info("No existing models found, will train on first request")
        
        logger.info("ML service started successfully")
        
    except Exception as e:
        logger.error(f"Error starting ML service: {e}")
        ml_pipeline = None
    
    yield
    
    # Shutdown
    if ml_pipeline:
        ml_pipeline.close()
    logger.info("ML service stopped")

# Create FastAPI app
app = FastAPI(
    title="ML Inventory Service with MongoDB",
    description="Advanced inventory forecasting with Prophet and MongoDB integration",
    version="2.0.0",
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

class HealthResponse(BaseModel):
    status: str
    mongodb_status: str
    total_models: int
    prophet_models: int
    linear_models: int
    last_update: Optional[str]
    available_parts: List[str]

class PredictionResponse(BaseModel):
    part_id: str
    part_name: str
    predictions: List[Dict]
    reorder_info: Dict
    eoq_info: Dict
    model_performance: Dict

class ReorderRecommendation(BaseModel):
    part_id: str
    part_name: str
    current_stock: int
    reorder_point: int
    safety_stock: int
    recommended_order_quantity: int
    days_until_reorder: int
    lead_time_days: int
    unit_cost: float
    priority: str

class DashboardData(BaseModel):
    health: Dict
    recommendations: Dict
    modelStats: Dict
    optimization: Dict

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ML Inventory Service with MongoDB",
        "version": "2.0.0",
        "features": [
            "MongoDB Integration",
            "Prophet Forecasting",
            "Linear Regression Fallback",
            "Real-time Predictions",
            "Reorder Recommendations"
        ]
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML pipeline not initialized")
        
        health_data = ml_pipeline.get_health_status()
        return HealthResponse(**health_data)
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict", response_model=List[PredictionResponse])
async def predict_usage(request: PredictionRequest):
    """Get usage predictions for specific parts"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML pipeline not initialized")
        
        predictions = ml_pipeline.get_predictions(request.partIds, request.days)
        
        if not predictions:
            raise HTTPException(status_code=404, detail="No predictions available")
        
        return [PredictionResponse(**pred) for pred in predictions]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reorder-recommendations", response_model=List[ReorderRecommendation])
async def get_reorder_recommendations(request: ReorderRequest):
    """Get reorder recommendations for all parts"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML pipeline not initialized")
        
        recommendations = ml_pipeline.get_reorder_recommendations(request.currentStock)
        
        return [ReorderRecommendation(**rec) for rec in recommendations]
        
    except Exception as e:
        logger.error(f"Reorder recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-stats")
async def get_model_statistics():
    """Get model statistics"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML pipeline not initialized")
        
        stats = ml_pipeline.get_model_statistics()
        return stats
        
    except Exception as e:
        logger.error(f"Model stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
async def retrain_models(background_tasks: BackgroundTasks):
    """Retrain models with latest data"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML pipeline not initialized")
        
        # Run training in background
        background_tasks.add_task(ml_pipeline.update_models, force_retrain=True)
        
        return {"message": "Model retraining started in background"}
        
    except Exception as e:
        logger.error(f"Retrain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard-data", response_model=DashboardData)
async def get_dashboard_data():
    """Get comprehensive dashboard data"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML pipeline not initialized")
        
        # Get health status
        health = ml_pipeline.get_health_status()
        
        # Get model statistics
        model_stats = ml_pipeline.get_model_statistics()
        
        # Get reorder recommendations (with dummy current stock)
        current_stock = {part_id: 10 for part_id in health.get('available_parts', [])}
        recommendations = ml_pipeline.get_reorder_recommendations(current_stock)
        
        # Calculate summary statistics
        total_parts = len(health.get('available_parts', []))
        high_priority = len([r for r in recommendations if r.get('priority') == 'HIGH'])
        
        # Create optimization insights
        optimization_insights = []
        for rec in recommendations[:5]:  # Top 5 recommendations
            optimization_insights.append({
                'part_id': rec['part_id'],
                'part_name': rec['part_name'],
                'inventory_value': rec['current_stock'] * rec['unit_cost'],
                'holding_cost_annual': rec['current_stock'] * rec['unit_cost'] * 0.2,  # 20% holding cost
                'ordering_cost_annual': 50,  # Assume $50 ordering cost
                'insights': [
                    f"Reorder {rec['recommended_order_quantity']} units when stock reaches {rec['reorder_point']}",
                    f"Lead time: {rec['lead_time_days']} days",
                    f"Priority: {rec['priority']}"
                ]
            })
        
        dashboard_data = {
            'health': health,
            'recommendations': {
                'total_parts': total_parts,
                'high_priority': high_priority,
                'medium_priority': len([r for r in recommendations if r.get('priority') == 'MEDIUM']),
                'low_priority': len([r for r in recommendations if r.get('priority') == 'LOW']),
                'recommendations': recommendations
            },
            'modelStats': model_stats,
            'optimization': {
                'total_inventory_value': sum(rec['current_stock'] * rec['unit_cost'] for rec in recommendations),
                'total_holding_cost_annual': sum(rec['current_stock'] * rec['unit_cost'] * 0.2 for rec in recommendations),
                'optimization_insights': optimization_insights
            }
        }
        
        return DashboardData(**dashboard_data)
        
    except Exception as e:
        logger.error(f"Dashboard data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test")
async def test_endpoint():
    """Test endpoint for basic functionality"""
    try:
        if not ml_pipeline:
            return {"status": "error", "message": "ML pipeline not initialized"}
        
        health = ml_pipeline.get_health_status()
        return {
            "status": "success",
            "message": "ML service is running",
            "health": health
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    # Run the service
    uvicorn.run(
        "ml_service_mongodb:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
