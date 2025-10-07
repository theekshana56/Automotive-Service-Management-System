# 🚀 ML Inventory Forecasting System

A complete Machine Learning solution for automotive parts inventory forecasting and optimization, integrated with your MERN stack.

## 📋 Features

- **Predictive Analytics**: Forecast future part demand using Linear Regression
- **JIT Inventory**: Optimize inventory levels to reduce holding costs
- **Dynamic Reorder Points**: Calculate optimal reorder quantities and timing
- **Real-time Dashboard**: React-based dashboard for inventory insights
- **MongoDB Integration**: Ready to connect with your existing database
- **REST API**: FastAPI service for ML predictions

## 🛠️ Tech Stack

### ML/AI
- **Python 3.8+** - Core ML language
- **Pandas** - Data manipulation
- **Scikit-learn** - Linear Regression models
- **Prophet** - Advanced time series forecasting
- **FastAPI** - ML service API
- **Joblib** - Model serialization

### Integration
- **Node.js** - Backend integration
- **React** - Dashboard UI
- **MongoDB** - Database integration
- **Express.js** - API routes

## 🚀 Quick Start

### 1. Setup Python Environment

```bash
# Navigate to ML directory
cd ml/ml-inventory-system

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Generate Sample Data

```bash
# Generate realistic automotive parts data
python src/data_generator.py
```

This creates `data/automotive_parts_usage.csv` with 2 years of realistic usage data.

### 3. Train Models

```bash
# Train Linear Regression models
python src/linear_model.py
```

This trains models for each part and saves them to `models/` directory.

### 4. Start ML Service

```bash
# Start FastAPI service
python api/ml_service.py
```

The service will be available at `http://localhost:8001`

### 5. Test the Service

```bash
# Check health
curl http://localhost:8001/health

# Get predictions
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"part_ids": ["ENG-001"], "days": 30}'

# Get reorder recommendations
curl http://localhost:8001/reorder-recommendations
```

## 🔧 Integration with Your MERN App

### 1. Add ML Routes to Express.js

Add this to your existing `server.js` or `app.js`:

```javascript
const mlRoutes = require('./ml/ml-inventory-system/integration/express_routes');
app.use('/api/ml', mlRoutes);
```

### 2. Install Dependencies

```bash
npm install axios
```

### 3. Add React Dashboard

Copy the React component to your frontend:

```javascript
import InventoryDashboard from './components/InventoryDashboard';

// Add to your routes
<Route path="/inventory-dashboard" component={InventoryDashboard} />
```

### 4. Update Your Navigation

Add a link to the inventory dashboard in your navigation menu.

## 📊 API Endpoints

### ML Service (Port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/predict` | POST | Get usage predictions |
| `/reorder-recommendations` | GET | Get reorder recommendations |
| `/train` | POST | Train models (background) |
| `/model-stats` | GET | Get model statistics |
| `/inventory-optimization` | GET | Get optimization insights |

### Express Integration (Your existing port)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/health` | GET | ML service health |
| `/api/ml/predict` | POST | Get predictions |
| `/api/ml/reorder-recommendations` | GET | Get recommendations |
| `/api/ml/dashboard-data` | GET | Complete dashboard data |

## 📈 Dashboard Features

### 1. Reorder Recommendations
- **Priority Levels**: HIGH, MEDIUM, LOW
- **Current Stock**: Real-time inventory levels
- **Reorder Points**: Calculated safety stock levels
- **Recommended Quantities**: EOQ-based suggestions

### 2. Usage Predictions
- **30-Day Forecasts**: Daily usage predictions
- **Seasonal Patterns**: Account for seasonal variations
- **Lead Time Analysis**: Supplier delivery times

### 3. Inventory Optimization
- **Total Inventory Value**: Current stock value
- **Holding Costs**: Annual storage costs
- **Optimization Insights**: AI-powered recommendations

### 4. Model Statistics
- **Model Performance**: MAE, RMSE metrics
- **Part Analytics**: Usage patterns and costs
- **Training Status**: Model health indicators

## 🔄 MongoDB Integration

### 1. Update Data Generator

Modify `src/data_generator.py` to fetch real data:

```python
from pymongo import MongoClient

def fetch_real_data():
    client = MongoClient('mongodb://localhost:27017')
    db = client.your_database
    collection = db.parts_usage
    
    # Fetch real usage data
    data = list(collection.find())
    return pd.DataFrame(data)
```

### 2. Update Models with Real Data

```python
# In linear_model.py
def retrain_with_real_data():
    df = fetch_real_data()
    forecaster.train_model(df)
    forecaster.save_models()
```

### 3. Schedule Regular Retraining

```python
# Add to your Node.js backend
const cron = require('node-cron');

// Retrain models weekly
cron.schedule('0 0 * * 0', async () => {
    await mlClient.trainModels();
});
```

## 🎯 Advanced Features

### 1. Prophet Integration

For advanced time series forecasting:

```python
from prophet import Prophet

class ProphetForecaster:
    def train_prophet_model(self, df):
        # Prepare data for Prophet
        prophet_df = df[['date', 'quantity_used']].rename(columns={
            'date': 'ds', 'quantity_used': 'y'
        })
        
        # Train Prophet model
        model = Prophet()
        model.fit(prophet_df)
        
        return model
```

### 2. Real-time Predictions

```javascript
// WebSocket integration for real-time updates
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    socket.on('get_predictions', async (partId) => {
        const predictions = await mlClient.getPredictions([partId]);
        socket.emit('predictions_update', predictions);
    });
});
```

### 3. Automated Reordering

```javascript
// Automated reorder system
const checkReorderNeeds = async () => {
    const recommendations = await mlClient.getReorderRecommendations();
    
    for (const rec of recommendations.data.recommendations) {
        if (rec.needs_reorder) {
            // Trigger reorder process
            await createPurchaseOrder(rec);
        }
    }
};
```

## 📝 Configuration

### Environment Variables

Create `.env` file:

```env
# ML Service Configuration
ML_SERVICE_HOST=localhost
ML_SERVICE_PORT=8001

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/automotive_service

# Model Configuration
MODEL_RETRAIN_INTERVAL=7  # days
SERVICE_LEVEL=0.95        # 95% service level
ORDERING_COST=25         # $25 per order
HOLDING_RATE=0.20        # 20% annual holding cost
```

## 🚨 Troubleshooting

### Common Issues

1. **ML Service Not Starting**
   ```bash
   # Check if port 8001 is available
   netstat -an | findstr :8001
   
   # Kill existing process
   taskkill /f /im python.exe
   ```

2. **Models Not Training**
   ```bash
   # Check data file exists
   ls -la data/automotive_parts_usage.csv
   
   # Regenerate data
   python src/data_generator.py
   ```

3. **React Dashboard Not Loading**
   ```bash
   # Check API endpoints
   curl http://localhost:3000/api/ml/health
   
   # Check CORS settings
   ```

### Performance Optimization

1. **Model Caching**: Models are automatically cached after training
2. **Batch Predictions**: Use batch endpoints for multiple parts
3. **Background Training**: Training runs in background to avoid blocking

## 📚 Next Steps

1. **Connect Real Data**: Replace sample data with MongoDB data
2. **Add More Models**: Implement Prophet for advanced forecasting
3. **Real-time Updates**: Add WebSocket support for live updates
4. **Automated Actions**: Implement automated reordering
5. **Advanced Analytics**: Add more sophisticated optimization algorithms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy Forecasting! 🚀📊**
