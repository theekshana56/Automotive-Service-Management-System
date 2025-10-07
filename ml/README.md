# ML Inventory Forecasting Module

End-to-end guide to integrate a demand forecasting + dynamic reorder suggestion microservice with your existing MERN stack.

## 1. Goals
1. Forecast next period demand per part (start with simple Linear Regression over time).
2. Compute Dynamic Reorder Point (ROP) and Recommended Order Quantity.
3. Provide REST API (FastAPI) for Node.js server to consume.
4. Later upgrade to Prophet for seasonality & holiday effects.
5. Support periodic retraining from MongoDB usage data.

## 2. Data Model (Initial Synthetic CSV)
Expected columns in `ml/data/dataset.csv` (sample / synthetic allowed):

| column | type | description |
|--------|------|-------------|
| date | YYYY-MM-DD | Daily usage date (no gaps ideally) |
| part_id | string/int | Identifier of part |
| quantity_used | int | Units consumed that day |
| stock_on_hand | int | (Optional) Snapshot of stock at end of day |
| lead_time_days | int | Supplier lead time (constant or variable) |
| unit_cost | float | (Optional) Cost per unit |
| supplier_id | string | (Optional) Supplier reference |

Minimum required: date, part_id, quantity_used, lead_time_days.

## 3. Key Inventory Formulas
Let:
- ADU = Average Daily Usage (historical mean)
- σ = Std Dev of Daily Usage
- L = Lead Time (days)
- Z = Service level factor (1.65 ≈ 95%, 2.05 ≈ 98%)

Safety Stock = Z * σ * sqrt(L)

Reorder Point (ROP) = (ADU * L) + Safety Stock

Economic Order Quantity (EOQ) ≈ sqrt((2 * D * K) / H)
- D = Annual demand (sum quantity_used * (365 / number_of_days_observed))
- K = Ordering cost per order (assumed / configurable)
- H = Annual holding cost per unit (unit_cost * holding_rate)

## 4. Architecture Overview
```
MongoDB  --> Node.js (existing) ----> React Dashboard
                 |                         ^
                 v                         |
          FastAPI ML Service <-----> (future) Offline retrain jobs
```

### Components Added
| File | Purpose |
|------|---------|
| `src/data_prep.py` | Load & aggregate raw CSV / Mongo data |
| `src/inventory_calculations.py` | ROP, Safety Stock, EOQ utilities |
| `src/train_baseline.py` | Train & persist linear regression per part |
| `src/service.py` | FastAPI app serving forecasts & reorder suggestions |
| `src/retrain.py` | Script to pull fresh Mongo data & retrain |
| `src/sample_data_generator.py` | Create synthetic dataset if none exists |

## 5. Environment Setup (Windows + VS Code)
From project root:
```powershell
cd ml
python -m venv venv
./venv/Scripts/Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

If execution policy blocks activation:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## 6. Generate Synthetic Data (Optional)
```powershell
python -m src.sample_data_generator --days 180 --parts 12
```

## 7. Train Baseline Model
```powershell
python -m src.train_baseline --data data/dataset.csv
```
Outputs:
```
models/
  model_metadata.json
  linear_part_<ID>.pkl
```

## 8. Run the FastAPI Service
```powershell
uvicorn src.service:app --reload --port 8001
```
Test:
```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

### Forecast Endpoint
`POST /forecast`
Body (optional): `{ "part_ids": ["BRK-001", "FLT-009"] }`
Response: JSON list with demand forecast & reorder suggestions.

### Retrain Endpoint (stubbed for Mongo fetch)
`POST /retrain` – will reload CSV / (future) call Mongo.

## 9. Node.js Integration (Outline)
In your Node server route, call the ML service:
```js
// server/src/services/inventoryForecast.js
import fetch from 'node-fetch';
export async function getForecast(partIds) {
  const res = await fetch('http://localhost:8001/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_ids: partIds })
  });
  if(!res.ok) throw new Error('Forecast service error');
  return res.json();
}
```

Expose via Express route, then React fetches & displays reorder list.

## 10. Upgrading to Prophet Later
1. Uncomment prophet in `requirements.txt` and install: `pip install prophet`.
2. Build a new script `train_prophet.py` modeling each part's daily usage.
3. Add seasonality (weekly, yearly) & holiday calendar if needed.

## 11. Scheduled Retraining
Options:
- Windows Task Scheduler / cron via a small Node script hitting `/retrain`.
- Use `node-cron` in the backend.

## 12. Environment Variables (`ml/.env`)
```
MONGO_URI=mongodb://localhost:27017/autoelite
SERVICE_LEVEL_Z=1.65
ORDERING_COST=25
HOLDING_RATE=0.20
DEFAULT_LEAD_TIME=7
```

## 13. Next Steps Checklist
- [x] Baseline linear models
- [ ] Prophet advanced models
- [ ] Integrate live Mongo usage
- [ ] React dashboard widgets (Top 10 to reorder, Stock risk heatmap)
- [ ] Alerts (email/websocket) when stock < ROP

## 14. Troubleshooting
| Issue | Fix |
|-------|-----|
| scikit-learn build error | Upgrade pip & setuptools: `pip install --upgrade pip setuptools wheel` |
| Prophet install fails | Ensure C++ build tools; use `pip install prophet` after installing build essentials |
| Empty forecast | Not enough historical rows (<3 points) – fallback average used |

---
Happy building! Enhance gradually—ship baseline first, measure impact, then iterate.
