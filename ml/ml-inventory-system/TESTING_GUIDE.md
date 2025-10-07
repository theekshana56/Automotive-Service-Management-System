# 🧪 **ML Inventory System - Complete Testing Guide**

## 🚀 **Quick Start Testing**

### **1. Start the ML Service**
```bash
# Navigate to ML directory
cd ml/ml-inventory-system

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start the service
python api/ml_service.py
```

The service will start at: **http://localhost:8001**

---

## 📊 **1. Predictive Analytics Testing**

### **📈 30-Day Usage Forecasts**

**Test via Browser:**
```
http://localhost:8001/docs
```

**Test via API:**
```bash
# Get predictions for specific parts
curl -X POST "http://localhost:8001/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "part_ids": ["ENG-001", "BRA-002"],
    "days": 30
  }'
```

**What to Look For:**
- ✅ Daily usage predictions for next 30 days
- ✅ Different patterns for different parts
- ✅ Realistic usage numbers (not negative)

### **🔮 Seasonal Pattern Recognition**

**Test Winter vs Summer Usage:**
```bash
# Check predictions for winter months (Dec-Feb)
curl -X POST "http://localhost:8001/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "part_ids": ["BAT-005"],
    "days": 90
  }'
```

**What to Look For:**
- ✅ Higher battery usage in winter (BAT-005)
- ✅ Higher coolant usage in summer (RAD-009)
- ✅ Consistent patterns year-round for some parts

### **📊 Weekly Patterns (Weekend vs Weekday)**

**Test Weekly Patterns:**
```bash
# Get 14-day predictions to see weekly patterns
curl -X POST "http://localhost:8001/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "part_ids": ["ENG-001"],
    "days": 14
  }'
```

**What to Look For:**
- ✅ Lower usage on weekends (Saturday/Sunday)
- ✅ Higher usage on weekdays (Monday-Friday)
- ✅ Consistent weekly patterns

---

## 📦 **2. JIT Inventory Optimization Testing**

### **📦 Dynamic Reorder Points**

**Test Reorder Recommendations:**
```bash
# Get all reorder recommendations
curl "http://localhost:8001/reorder-recommendations"
```

**What to Look For:**
- ✅ Different reorder points for different parts
- ✅ Safety stock calculations
- ✅ Priority levels (HIGH/MEDIUM/LOW)

### **💰 Economic Order Quantity (EOQ)**

**Test EOQ Calculations:**
```bash
# Get inventory optimization data
curl "http://localhost:8001/inventory-optimization"
```

**What to Look For:**
- ✅ EOQ values for each part
- ✅ Annual ordering costs
- ✅ Annual holding costs
- ✅ Total inventory value

### **🛡️ Safety Stock Optimization**

**Check Safety Stock in Reorder Recommendations:**
```bash
curl "http://localhost:8001/reorder-recommendations" | jq '.recommendations[0]'
```

**What to Look For:**
- ✅ Safety stock > 0 for all parts
- ✅ Higher safety stock for parts with high variability
- ✅ Safety stock considers lead time

### **⏰ Lead Time Considerations**

**Test Lead Time Impact:**
```bash
# Check model statistics to see lead times
curl "http://localhost:8001/model-stats"
```

**What to Look For:**
- ✅ Different lead times for different parts
- ✅ Longer lead times = higher reorder points
- ✅ Lead time affects safety stock calculations

---

## 🚨 **3. Real-time Dashboard Testing**

### **🚨 Priority Alerts (HIGH/MEDIUM/LOW)**

**Test Priority System:**
```bash
curl "http://localhost:8001/reorder-recommendations" | jq '.recommendations[] | {part_id, priority, current_stock, reorder_point}'
```

**What to Look For:**
- ✅ HIGH priority for parts needing immediate reorder
- ✅ MEDIUM priority for parts needing reorder soon
- ✅ LOW priority for parts with sufficient stock

### **📊 Interactive Predictions Viewer**

**Test Predictions API:**
```bash
# Get detailed predictions with reorder info
curl -X POST "http://localhost:8001/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "part_ids": ["ENG-001"],
    "days": 7
  }' | jq '.[0]'
```

**What to Look For:**
- ✅ Daily predictions for next 7 days
- ✅ Reorder point information
- ✅ EOQ recommendations
- ✅ Part name and ID

### **💵 Cost Optimization Insights**

**Test Cost Optimization:**
```bash
curl "http://localhost:8001/inventory-optimization" | jq '.optimization_insights[0]'
```

**What to Look For:**
- ✅ Inventory value for each part
- ✅ Annual holding costs
- ✅ Annual ordering costs
- ✅ Optimization suggestions

### **📈 Model Performance Metrics**

**Test Model Statistics:**
```bash
curl "http://localhost:8001/model-stats" | jq '.models[0]'
```

**What to Look For:**
- ✅ MAE (Mean Absolute Error) - lower is better
- ✅ RMSE (Root Mean Square Error) - lower is better
- ✅ Average usage per part
- ✅ Standard deviation of usage

---

## 🌐 **4. Web Interface Testing**

### **FastAPI Documentation**
Visit: **http://localhost:8001/docs**

**What to Test:**
1. ✅ Click on each endpoint
2. ✅ Try the "Try it out" feature
3. ✅ Test different parameters
4. ✅ View response examples

### **Alternative Documentation**
Visit: **http://localhost:8001/redoc**

---

## 🔧 **5. Integration Testing**

### **Test with Your MERN App**

**Add to your Express.js app:**
```javascript
// In your server.js or app.js
const mlRoutes = require('./ml/ml-inventory-system/integration/express_routes');
app.use('/api/ml', mlRoutes);
```

**Test Integration Endpoints:**
```bash
# Health check through your app
curl "http://localhost:3000/api/ml/health"

# Get dashboard data
curl "http://localhost:3000/api/ml/dashboard-data"

# Get reorder recommendations
curl "http://localhost:3000/api/ml/reorder-recommendations"
```

---

## 📱 **6. React Dashboard Testing**

### **Add Dashboard Component**
```javascript
// In your React app
import InventoryDashboard from './components/InventoryDashboard';

// Add route
<Route path="/inventory-dashboard" component={InventoryDashboard} />
```

### **Test Dashboard Features**
1. ✅ **Summary Cards**: Total parts, high priority items, inventory value
2. ✅ **Reorder Recommendations**: Priority-based list
3. ✅ **Inventory Optimization**: Cost insights and suggestions
4. ✅ **Usage Predictions**: Interactive predictions viewer
5. ✅ **Model Statistics**: Performance metrics

---

## 🎯 **7. Expected Results**

### **Sample Data Parts:**
- **ENG-001**: Engine Oil Filter (high usage, frequent reorders)
- **BRA-002**: Brake Pads (medium usage, seasonal)
- **AIR-003**: Air Filter (high usage, seasonal)
- **SPA-004**: Spark Plugs (low usage, infrequent)
- **BAT-005**: Car Battery (low usage, highly seasonal)
- **TIR-006**: Tire Set (very low usage, expensive)
- **BEL-007**: Timing Belt (very low usage, long lead time)
- **FLU-008**: Transmission Fluid (medium usage)
- **RAD-009**: Radiator Coolant (high usage, seasonal)
- **WIN-010**: Windshield Wipers (medium usage, seasonal)

### **Expected Patterns:**
- ✅ **Seasonal**: Higher battery usage in winter, higher coolant in summer
- ✅ **Weekly**: Lower usage on weekends
- ✅ **Cost-based**: Expensive parts have higher EOQ, longer lead times
- ✅ **Usage-based**: High usage parts need frequent reorders

---

## 🚨 **8. Troubleshooting**

### **Common Issues:**

**Service won't start:**
```bash
# Check if port 8001 is free
netstat -an | findstr :8001

# Kill existing process
taskkill /f /im python.exe
```

**No data/models:**
```bash
# Generate sample data
python src/data_generator.py

# Train models
python src/linear_model.py
```

**API returns errors:**
```bash
# Check service health
curl http://localhost:8001/health

# Check if models are trained
curl http://localhost:8001/model-stats
```

---

## 🎉 **Success Criteria**

You'll know the system is working when you see:

1. ✅ **Predictive Analytics**: Realistic daily usage predictions
2. ✅ **Seasonal Patterns**: Different usage in different seasons
3. ✅ **Weekly Patterns**: Lower weekend usage
4. ✅ **Reorder Points**: Calculated based on usage and lead time
5. ✅ **EOQ Values**: Optimal order quantities
6. ✅ **Safety Stock**: Prevents stockouts
7. ✅ **Priority Alerts**: HIGH/MEDIUM/LOW based on stock levels
8. ✅ **Cost Optimization**: Inventory value and holding costs
9. ✅ **Model Performance**: MAE and RMSE metrics
10. ✅ **Dashboard Integration**: Working React components

---

## 🚀 **Next Steps**

Once testing is complete:

1. **Connect Real Data**: Replace sample data with MongoDB data
2. **Schedule Retraining**: Set up automatic model retraining
3. **Add Notifications**: Email/SMS alerts for high priority items
4. **Advanced Analytics**: Implement Prophet for better forecasting
5. **Automated Actions**: Auto-create purchase orders

**Happy Testing! 🧪✨**
