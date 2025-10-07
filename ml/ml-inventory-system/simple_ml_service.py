"""
Simplified ML Service for Inventory Forecasting
Working version without complex dependencies
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import json
import os
from datetime import datetime, timedelta
import sys

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

try:
    from linear_model import InventoryForecaster
    from data_generator import generate_sample_data
except ImportError as e:
    print(f"Import error: {e}")
    print("Please ensure all dependencies are installed")

app = FastAPI(
    title="Automotive Parts Inventory ML Service",
    description="ML-powered inventory forecasting and optimization",
    version="1.0.0"
)

# Global forecaster instance
forecaster = InventoryForecaster()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Automotive Parts Inventory ML Service",
        "status": "running",
        "models_loaded": len(forecaster.models) if hasattr(forecaster, 'models') else 0,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": len(forecaster.models) if hasattr(forecaster, 'models') else 0,
        "is_trained": forecaster.is_trained if hasattr(forecaster, 'is_trained') else False,
        "available_parts": list(forecaster.models.keys()) if hasattr(forecaster, 'models') else [],
        "timestamp": datetime.now().isoformat()
    }

class PredictionRequest(BaseModel):
    part_ids: Optional[List[str]] = None
    days: int = 30

@app.post("/predict")
async def predict_usage(request: PredictionRequest):
    """Predict future usage for specified parts"""
    if not forecaster.is_trained:
        # Try to load models
        try:
            forecaster.load_models()
        except:
            raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")
    
    if not forecaster.is_trained:
        raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")
    
    # Get parts to predict (all if none specified)
    parts_to_predict = request.part_ids if request.part_ids else list(forecaster.models.keys())
    
    results = []
    
    for part_id in parts_to_predict:
        if part_id not in forecaster.models:
            continue
        
        try:
            # Get predictions
            predictions = forecaster.predict_next_days(part_id, request.days)
            
            # Get reorder information
            reorder_info = forecaster.calculate_reorder_point(part_id)
            eoq_info = forecaster.calculate_eoq(part_id)
            
            # Get part name
            part_name = forecaster.part_stats[part_id].get('part_name', part_id)
            
            results.append({
                "part_id": part_id,
                "part_name": part_name,
                "predictions": predictions,
                "reorder_info": reorder_info,
                "eoq_info": eoq_info
            })
            
        except Exception as e:
            print(f"Error predicting for {part_id}: {str(e)}")
            continue
    
    return results

@app.get("/reorder-recommendations")
async def get_reorder_recommendations():
    """Get reorder recommendations for all parts"""
    if not forecaster.is_trained:
        try:
            forecaster.load_models()
        except:
            raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")
    
    if not forecaster.is_trained:
        raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")
    
    recommendations = []
    
    for part_id in forecaster.models.keys():
        try:
            # Get current stock (simulated - in real app, get from database)
            current_stock = 100  # This would come from your MongoDB
            
            # Get reorder info
            reorder_info = forecaster.calculate_reorder_point(part_id)
            eoq_info = forecaster.calculate_eoq(part_id)
            
            # Determine if reorder is needed
            needs_reorder = current_stock <= reorder_info['reorder_point']
            
            # Calculate days until reorder
            avg_daily_usage = reorder_info['avg_daily_usage']
            days_until_reorder = (current_stock - reorder_info['reorder_point']) / avg_daily_usage if avg_daily_usage > 0 else 0
            
            recommendations.append({
                "part_id": part_id,
                "part_name": forecaster.part_stats[part_id].get('part_name', part_id),
                "current_stock": current_stock,
                "reorder_point": reorder_info['reorder_point'],
                "safety_stock": reorder_info['safety_stock'],
                "recommended_order_quantity": eoq_info['eoq'],
                "needs_reorder": needs_reorder,
                "days_until_reorder": round(days_until_reorder, 1),
                "unit_cost": forecaster.part_stats[part_id]['unit_cost'],
                "lead_time_days": reorder_info['lead_time_days'],
                "priority": "HIGH" if needs_reorder else "MEDIUM" if days_until_reorder < 7 else "LOW"
            })
            
        except Exception as e:
            print(f"Error getting recommendation for {part_id}: {str(e)}")
            continue
    
    # Sort by priority
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    recommendations.sort(key=lambda x: priority_order[x["priority"]])
    
    return {
        "recommendations": recommendations,
        "total_parts": len(recommendations),
        "high_priority": len([r for r in recommendations if r["priority"] == "HIGH"]),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model-stats")
async def get_model_stats():
    """Get statistics about trained models"""
    if not forecaster.is_trained:
        try:
            forecaster.load_models()
        except:
            raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")
    
    if not forecaster.is_trained:
        raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")
    
    stats = []
    for part_id, part_stats in forecaster.part_stats.items():
        stats.append({
            "part_id": part_id,
            "part_name": part_stats.get('part_name', part_id),
            "mae": part_stats['mae'],
            "rmse": part_stats['rmse'],
            "avg_usage": part_stats['avg_usage'],
            "std_usage": part_stats['std_usage'],
            "lead_time_days": part_stats['lead_time'],
            "unit_cost": part_stats['unit_cost']
        })
    
    return {
        "models": stats,
        "total_models": len(stats),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/inventory-optimization")
async def get_inventory_optimization():
    """Get inventory optimization insights"""
    if not forecaster.is_trained:
        try:
            forecaster.load_models()
        except:
            raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")
    
    if not forecaster.is_trained:
        raise HTTPException(status_code=400, detail="Models not trained. Please train models first.")
    
    total_value = 0
    total_holding_cost = 0
    optimization_insights = []
    
    for part_id in forecaster.models.keys():
        try:
            eoq_info = forecaster.calculate_eoq(part_id)
            reorder_info = forecaster.calculate_reorder_point(part_id)
            
            # Calculate inventory value
            inventory_value = eoq_info['eoq'] * forecaster.part_stats[part_id]['unit_cost']
            total_value += inventory_value
            
            # Calculate holding costs
            total_holding_cost += eoq_info['total_holding_cost']
            
            # Optimization insights
            avg_usage = reorder_info['avg_daily_usage']
            lead_time = reorder_info['lead_time_days']
            
            # Suggest optimizations
            insights = []
            if lead_time > 14:
                insights.append("Consider finding faster suppliers")
            if avg_usage < 1:
                insights.append("Low usage - consider bulk ordering")
            if eoq_info['eoq'] > 100:
                insights.append("High EOQ - consider storage capacity")
            
            optimization_insights.append({
                "part_id": part_id,
                "part_name": forecaster.part_stats[part_id].get('part_name', part_id),
                "inventory_value": round(inventory_value, 2),
                "holding_cost_annual": round(eoq_info['total_holding_cost'], 2),
                "ordering_cost_annual": round(eoq_info['total_ordering_cost'], 2),
                "insights": insights
            })
            
        except Exception as e:
            print(f"Error optimizing {part_id}: {str(e)}")
            continue
    
    return {
        "total_inventory_value": round(total_value, 2),
        "total_holding_cost_annual": round(total_holding_cost, 2),
        "optimization_insights": optimization_insights,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/train")
async def train_models():
    """Train models with sample data"""
    try:
        # Generate sample data
        print("Generating sample data...")
        df = generate_sample_data()
        
        # Train models
        print("Training models...")
        forecaster.train_model(df)
        
        # Save models
        print("Saving models...")
        forecaster.save_models()
        
        return {
            "message": "Training completed successfully",
            "status": "completed",
            "models_trained": len(forecaster.models),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting ML Inventory Service...")
    print("Available at: http://localhost:8001")
    print("API docs at: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
