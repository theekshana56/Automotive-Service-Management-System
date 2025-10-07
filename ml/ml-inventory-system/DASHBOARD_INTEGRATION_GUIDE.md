# 🔧 **Dashboard Integration Fix - Complete Guide**

## 🚨 **Problem: Dashboard Not Showing ML Model Details**

Your inventory dashboard isn't showing ML model details because:
1. ML service isn't running properly
2. Integration between React and ML service is missing
3. API endpoints aren't connected

## 🛠️ **Step-by-Step Fix**

### **Step 1: Start ML Service Properly**

```bash
# Navigate to ML directory
cd ml/ml-inventory-system

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start the service (use this command)
python simple_ml_service.py
```

**Expected Output:**
```
Starting ML Inventory Service...
Available at: http://localhost:8001
API docs at: http://localhost:8001/docs
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

### **Step 2: Test ML Service**

Open your browser and go to:
- **Health Check**: http://localhost:8001/health
- **API Docs**: http://localhost:8001/docs

You should see:
```json
{
  "status": "healthy",
  "models_loaded": 10,
  "is_trained": true,
  "available_parts": ["ENG-001", "BRA-002", "AIR-003", ...]
}
```

### **Step 3: Add ML Routes to Your Express.js Backend**

**Add this to your `server.js` or `app.js`:**

```javascript
// Add ML routes
const mlRoutes = require('./ml/ml-inventory-system/integration/express_routes');
app.use('/api/ml', mlRoutes);

// Add CORS for ML service
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8001'],
  credentials: true
}));
```

### **Step 4: Install Required Dependencies**

```bash
# In your main project directory
npm install axios cors
```

### **Step 5: Add ML Dashboard Component to React**

**Create `src/components/MLInventoryDashboard.jsx`:**

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MLInventoryDashboard = () => {
  const [mlData, setMlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMLData();
  }, []);

  const fetchMLData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ml/dashboard-data');
      setMlData(response.data.data);
    } catch (err) {
      setError('Failed to fetch ML data');
      console.error('ML Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading ML data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!mlData) return <div>No ML data available</div>;

  return (
    <div className="ml-dashboard">
      <h2>ML Inventory Forecasting Dashboard</h2>
      
      {/* Health Status */}
      <div className="health-status">
        <h3>ML Service Status</h3>
        <p>Status: {mlData.health?.status || 'Unknown'}</p>
        <p>Models Loaded: {mlData.health?.models_loaded || 0}</p>
        <p>Available Parts: {mlData.health?.available_parts?.length || 0}</p>
      </div>

      {/* Reorder Recommendations */}
      <div className="reorder-recommendations">
        <h3>Reorder Recommendations</h3>
        <p>Total Parts: {mlData.recommendations?.total_parts || 0}</p>
        <p>High Priority: {mlData.recommendations?.high_priority || 0}</p>
        
        {mlData.recommendations?.recommendations?.map((rec, index) => (
          <div key={index} className="recommendation-item">
            <h4>{rec.part_name} ({rec.part_id})</h4>
            <p>Priority: {rec.priority}</p>
            <p>Current Stock: {rec.current_stock}</p>
            <p>Reorder Point: {rec.reorder_point}</p>
            <p>Recommended Qty: {Math.round(rec.recommended_order_quantity)}</p>
            <p>Days until reorder: {rec.days_until_reorder}</p>
          </div>
        ))}
      </div>

      {/* Model Statistics */}
      <div className="model-stats">
        <h3>Model Performance</h3>
        <p>Total Models: {mlData.modelStats?.total_models || 0}</p>
        
        {mlData.modelStats?.models?.map((model, index) => (
          <div key={index} className="model-item">
            <h4>{model.part_name} ({model.part_id})</h4>
            <p>MAE: {model.mae.toFixed(2)}</p>
            <p>RMSE: {model.rmse.toFixed(2)}</p>
            <p>Avg Usage: {model.avg_usage.toFixed(1)}</p>
            <p>Lead Time: {model.lead_time_days} days</p>
          </div>
        ))}
      </div>

      {/* Inventory Optimization */}
      <div className="inventory-optimization">
        <h3>Inventory Optimization</h3>
        <p>Total Inventory Value: ${mlData.optimization?.total_inventory_value?.toLocaleString() || 0}</p>
        <p>Annual Holding Cost: ${mlData.optimization?.total_holding_cost_annual?.toLocaleString() || 0}</p>
        
        {mlData.optimization?.optimization_insights?.map((insight, index) => (
          <div key={index} className="optimization-item">
            <h4>{insight.part_name}</h4>
            <p>Inventory Value: ${insight.inventory_value.toLocaleString()}</p>
            <p>Holding Cost: ${insight.holding_cost_annual.toLocaleString()}</p>
            {insight.insights.length > 0 && (
              <div>
                <strong>Insights:</strong>
                <ul>
                  {insight.insights.map((tip, tipIndex) => (
                    <li key={tipIndex}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={fetchMLData} className="refresh-btn">
        Refresh Data
      </button>
    </div>
  );
};

export default MLInventoryDashboard;
```

### **Step 6: Add Route to Your React App**

**In your `App.js` or routing file:**

```javascript
import MLInventoryDashboard from './components/MLInventoryDashboard';

// Add this route
<Route path="/ml-inventory-dashboard" component={MLInventoryDashboard} />
```

### **Step 7: Add Navigation Link**

**In your navigation component:**

```javascript
<Link to="/ml-inventory-dashboard">ML Inventory Dashboard</Link>
```

### **Step 8: Test the Integration**

1. **Start your Node.js backend:**
   ```bash
   npm start
   ```

2. **Start your React frontend:**
   ```bash
   npm start
   ```

3. **Navigate to:** http://localhost:3000/ml-inventory-dashboard

## 🎯 **Expected Results**

You should now see:

### **ML Service Status**
- ✅ Status: healthy
- ✅ Models Loaded: 10
- ✅ Available Parts: 10

### **Reorder Recommendations**
- ✅ Total Parts: 10
- ✅ High Priority: X items
- ✅ Detailed recommendations for each part

### **Model Performance**
- ✅ Total Models: 10
- ✅ MAE and RMSE for each model
- ✅ Average usage and lead times

### **Inventory Optimization**
- ✅ Total inventory value
- ✅ Annual holding costs
- ✅ Optimization insights

## 🔧 **Troubleshooting**

### **If ML Service Won't Start:**
```bash
# Check if port 8001 is free
netstat -an | findstr :8001

# Kill existing processes
taskkill /f /im python.exe

# Start service again
python simple_ml_service.py
```

### **If Dashboard Shows "No ML data available":**
1. Check if ML service is running: http://localhost:8001/health
2. Check browser console for errors
3. Verify API routes are added to Express.js
4. Check CORS settings

### **If Models Show as "Not Trained":**
```bash
# Retrain models
curl -X POST http://localhost:8001/train
```

## 🚀 **Advanced Features**

### **Real-time Updates**
```javascript
// Add to your React component
useEffect(() => {
  const interval = setInterval(fetchMLData, 30000); // Update every 30 seconds
  return () => clearInterval(interval);
}, []);
```

### **Error Handling**
```javascript
const [connectionStatus, setConnectionStatus] = useState('checking');

const checkMLService = async () => {
  try {
    await axios.get('/api/ml/health');
    setConnectionStatus('connected');
  } catch (err) {
    setConnectionStatus('disconnected');
  }
};
```

### **Loading States**
```javascript
const [loadingStates, setLoadingStates] = useState({
  recommendations: false,
  predictions: false,
  optimization: false
});
```

## 🎉 **Success Criteria**

Your dashboard integration is working when you see:

1. ✅ **ML Service Status**: Shows healthy with 10 models loaded
2. ✅ **Reorder Recommendations**: Shows priority-based recommendations
3. ✅ **Model Performance**: Shows MAE, RMSE, and usage statistics
4. ✅ **Inventory Optimization**: Shows cost insights and recommendations
5. ✅ **Real-time Data**: Updates when you click refresh
6. ✅ **No Console Errors**: Clean browser console

## 📞 **Need Help?**

If you're still having issues:

1. **Check the browser console** for JavaScript errors
2. **Check the Node.js console** for API errors
3. **Verify ML service** is running at http://localhost:8001
4. **Test API endpoints** directly in browser

Your ML inventory dashboard should now be fully functional! 🚀📊
