"""FastAPI microservice exposing forecast & reorder point calculations."""
from __future__ import annotations
import json
import os
from pathlib import Path
from typing import List, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from .data_prep import load_dataset, aggregate_daily_to_monthly, prepare_model_frame, compute_daily_stats, get_lead_time_map
from .inventory_calculations import safety_stock, reorder_point, eoq, next_reorder_date_projection

# Load environment variables if .env file exists
try:
    load_dotenv()
except Exception as e:
    print(f"[ML-SERVICE][WARN] Could not load .env file: {e}")
    print("[ML-SERVICE][INFO] Using default environment variables")

DATA_PATH = os.environ.get('DATA_PATH', 'data/dataset.csv')
MODELS_DIR = Path(__file__).resolve().parent.parent / 'models'

SERVICE_LEVEL_Z = float(os.environ.get('SERVICE_LEVEL_Z', 1.65))
ORDERING_COST = float(os.environ.get('ORDERING_COST', 25))
HOLDING_RATE = float(os.environ.get('HOLDING_RATE', 0.20))  # % of unit cost / year
DEFAULT_LEAD_TIME = int(os.environ.get('DEFAULT_LEAD_TIME', 7))

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print('[ML-SERVICE] FastAPI startup event fired.')
    # Lightweight check only; no heavy model loading here
    # This helps confirm app reached startup phase.
    yield
    # Shutdown
    print('[ML-SERVICE] Shutdown event fired.')

app = FastAPI(title="Inventory Forecast Service", version="0.1.0", lifespan=lifespan)

print("[ML-SERVICE] Starting Inventory Forecast Service...")
print(f"[ML-SERVICE] DATA_PATH={DATA_PATH}")
print(f"[ML-SERVICE] MODELS_DIR={MODELS_DIR}")
print(f"[ML-SERVICE] SERVICE_LEVEL_Z={SERVICE_LEVEL_Z} ORDERING_COST={ORDERING_COST} HOLDING_RATE={HOLDING_RATE} DEFAULT_LEAD_TIME={DEFAULT_LEAD_TIME}")
if not Path(DATA_PATH).exists():
    print(f"[ML-SERVICE][WARN] Dataset path '{DATA_PATH}' does not exist yet. /forecast will fail until data + training done.")
if not (MODELS_DIR / 'model_metadata.json').exists():
    print("[ML-SERVICE][INFO] model_metadata.json not found. Run training or POST /retrain.")


class ForecastRequest(BaseModel):
    part_ids: Optional[List[str]] = None


def _load_models_metadata():
    md_path = MODELS_DIR / 'model_metadata.json'
    if not md_path.exists():
        raise FileNotFoundError("Model metadata not found. Train models first.")
    with open(md_path) as f:
        return json.load(f)


def _load_models(metadata):
    models = {}
    for m in metadata['models']:
        part_id = m['part_id']
        if m['method'] == 'linear':
            models[part_id] = joblib.load(MODELS_DIR / f"linear_part_{part_id}.pkl")
        else:
            with open(MODELS_DIR / f"fallback_part_{part_id}.json") as f:
                models[part_id] = json.load(f)  # dict
    return models


@app.get('/health')
def health():
    return {"status": "ok"}


@app.get('/test')
def test():
    """Simple test endpoint to verify basic functionality."""
    try:
        return {"message": "Test endpoint working", "data_path": DATA_PATH}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test error: {str(e)}")


@app.post('/forecast')
def forecast(req: ForecastRequest):
    try:
        # Load data & models
        metadata = _load_models_metadata()
        model_map = _load_models(metadata)
        raw = load_dataset(DATA_PATH)
        monthly = aggregate_daily_to_monthly(raw)
        monthly = prepare_model_frame(monthly)
        part_stats = compute_daily_stats(raw)
        lead_time_map = get_lead_time_map(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading data/models: {str(e)}")

    try:
        results = []
        for m in metadata['models']:
            part_id = m['part_id']
            if req.part_ids and part_id not in req.part_ids:
                continue
            grp = monthly[monthly.part_id == part_id]
            if grp.empty:
                continue
            t_next = grp['t'].max() + 1
            model_obj = model_map[part_id]
            if m['method'] == 'linear':
                pred = float(model_obj.predict([[t_next]])[0])
            else:
                pred = float(model_obj['avg_usage'])  # monthly average fallback

            # Convert monthly prediction to daily average assumption (30 days approx)
            avg_daily_forecast = pred / 30.0
            stats_row = part_stats[part_stats.part_id == part_id].iloc[0].to_dict()
            avg_daily_usage_hist = stats_row['avg_daily_usage']
            std_daily_usage = stats_row['std_daily_usage']
            lead_time = lead_time_map.get(part_id, DEFAULT_LEAD_TIME)
            unit_cost = None
            if 'unit_cost' in raw.columns:
                # Take latest
                unit_cost = raw[raw.part_id == part_id].sort_values('date')['unit_cost'].ffill().iloc[-1]
            holding_cost_unit = (unit_cost * HOLDING_RATE) if unit_cost else 1 * HOLDING_RATE

            ss = safety_stock(std_daily_usage, lead_time, SERVICE_LEVEL_Z)
            rop = reorder_point(avg_daily_usage_hist, lead_time, ss)

            # Annual demand approximation
            D = avg_daily_usage_hist * 365
            eoq_val = eoq(D, ORDERING_COST, holding_cost_unit) or pred

            # Current stock snapshot (latest row if available)
            if 'stock_on_hand' in raw.columns:
                latest_stock = raw[raw.part_id == part_id].sort_values('date')['stock_on_hand'].iloc[-1]
            else:
                latest_stock = None

            days_until_reorder = None
            if latest_stock is not None:
                days_until_reorder = next_reorder_date_projection(latest_stock, avg_daily_usage_hist, rop)

            results.append({
                'part_id': part_id,
                'method': m['method'],
                'predicted_monthly_usage': round(pred, 2),
                'avg_daily_forecast': round(avg_daily_forecast, 3),
                'historical_avg_daily_usage': round(avg_daily_usage_hist, 3),
                'std_daily_usage': round(std_daily_usage, 3),
                'lead_time_days': lead_time,
                'safety_stock': round(ss, 2),
                'reorder_point': round(rop, 2),
                'recommended_order_qty': round(eoq_val, 2),
                'latest_stock_on_hand': latest_stock,
                'days_until_reorder_threshold': None if days_until_reorder is None else round(days_until_reorder, 1)
            })

        return {"count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing forecast: {str(e)}")


@app.post('/retrain')
def retrain():
    # Simple retrain by calling training script logic inline (avoids spawning process)
    try:
        from .train_baseline import train_models
        md = train_models(DATA_PATH)
        return {"status": "retrained", "models": len(md['models'])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Allow running via: python -m src.service
if __name__ == '__main__':
    try:
        import uvicorn
    except ImportError:
        print('[ML-SERVICE][ERROR] uvicorn not installed in this environment. Install requirements first.')
        raise SystemExit(1)

    host = os.environ.get('ML_SERVICE_HOST', '127.0.0.1')
    port = int(os.environ.get('ML_SERVICE_PORT', '8001'))
    reload_flag = os.environ.get('ML_SERVICE_RELOAD', '0') in ('1', 'true', 'True')

    print(f"[ML-SERVICE] Launching via __main__ host={host} port={port} reload={reload_flag}")
    # Using app directly avoids module path ambiguity when run from wrong working dir.
    uvicorn.run(app, host=host, port=port, reload=reload_flag, log_level='info')
