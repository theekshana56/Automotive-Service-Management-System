/**
 * Fixed Express.js Routes for ML Inventory Integration
 * Updated to work with MongoDB-integrated ML service
 */

const express = require('express');
const router = express.Router();

// ML Service Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

/**
 * Helper function to make requests to ML service
 */
async function makeMLRequest(endpoint, method = 'GET', body = null) {
    try {
        const url = `${ML_SERVICE_URL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`ML service error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error(`ML service request failed for ${endpoint}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * GET /api/ml/health
 * Check ML service health
 */
router.get('/health', async (req, res) => {
    try {
        const result = await makeMLRequest('/health');
        
        if (result.success) {
            res.json({
                success: true,
                message: 'ML service is healthy',
                data: result.data
            });
        } else {
            // Return fallback health data
            res.json({
                success: true,
                message: 'ML service unavailable, using fallback data',
                data: {
                    status: 'unhealthy',
                    mongodb_status: 'unknown',
                    total_models: 0,
                    prophet_models: 0,
                    linear_models: 0,
                    last_update: null,
                    available_parts: []
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking ML service health',
            error: error.message
        });
    }
});

/**
 * POST /api/ml/predict
 * Get usage predictions for parts
 */
router.post('/predict', async (req, res) => {
    try {
        const { partIds, days = 30 } = req.body;
        
        const result = await makeMLRequest('/predict', 'POST', { partIds, days });
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Predictions retrieved successfully',
                data: result.data
            });
        } else {
            // Return fallback predictions
            const fallbackPredictions = partIds.map(partId => ({
                part_id: partId,
                part_name: `Part ${partId}`,
                predictions: Array.from({ length: days }, (_, i) => ({
                    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    predicted_usage: Math.random() * 10 + 1,
                    lower_bound: Math.random() * 5,
                    upper_bound: Math.random() * 15 + 5,
                    confidence: Math.random() * 10 + 5
                })),
                reorder_info: {
                    reorder_point: Math.floor(Math.random() * 20 + 10),
                    safety_stock: Math.floor(Math.random() * 10 + 5),
                    lead_time_days: Math.floor(Math.random() * 14 + 7)
                },
                eoq_info: {
                    eoq: Math.floor(Math.random() * 100 + 50),
                    annual_usage: Math.floor(Math.random() * 1000 + 500),
                    ordering_cost: 50,
                    holding_cost_rate: 0.2
                },
                model_performance: {
                    mae: Math.random() * 2 + 0.5,
                    rmse: Math.random() * 3 + 1,
                    avg_usage: Math.random() * 10 + 5
                }
            }));
            
            res.json({
                success: true,
                message: 'Using fallback predictions (ML service unavailable)',
                data: fallbackPredictions
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting predictions',
            error: error.message
        });
    }
});

/**
 * GET /api/ml/reorder-recommendations
 * Get reorder recommendations
 */
router.get('/reorder-recommendations', async (req, res) => {
    try {
        const result = await makeMLRequest('/reorder-recommendations', 'POST', { currentStock: {} });
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Reorder recommendations retrieved successfully',
                data: result.data
            });
        } else {
            // Return fallback recommendations
            const fallbackRecommendations = [
                {
                    part_id: 'part_001',
                    part_name: 'Oil Filter',
                    current_stock: 15,
                    reorder_point: 20,
                    safety_stock: 10,
                    recommended_order_quantity: 50,
                    days_until_reorder: 5,
                    lead_time_days: 7,
                    unit_cost: 12.50,
                    priority: 'HIGH'
                },
                {
                    part_id: 'part_002',
                    part_name: 'Brake Pads',
                    current_stock: 8,
                    reorder_point: 15,
                    safety_stock: 8,
                    recommended_order_quantity: 30,
                    days_until_reorder: 12,
                    lead_time_days: 10,
                    unit_cost: 45.00,
                    priority: 'MEDIUM'
                },
                {
                    part_id: 'part_003',
                    part_name: 'Air Filter',
                    current_stock: 25,
                    reorder_point: 30,
                    safety_stock: 15,
                    recommended_order_quantity: 40,
                    days_until_reorder: 20,
                    lead_time_days: 5,
                    unit_cost: 8.75,
                    priority: 'LOW'
                }
            ];
            
            res.json({
                success: true,
                message: 'Using fallback recommendations (ML service unavailable)',
                data: fallbackRecommendations
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting reorder recommendations',
            error: error.message
        });
    }
});

/**
 * GET /api/ml/model-stats
 * Get model statistics
 */
router.get('/model-stats', async (req, res) => {
    try {
        const result = await makeMLRequest('/model-stats');
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Model statistics retrieved successfully',
                data: result.data
            });
        } else {
            // Return fallback model stats
            res.json({
                success: true,
                message: 'Using fallback model statistics (ML service unavailable)',
                data: {
                    total_models: 3,
                    models: [
                        {
                            part_id: 'part_001',
                            part_name: 'Oil Filter',
                            mae: 1.2,
                            rmse: 1.8,
                            avg_usage: 5.5,
                            lead_time_days: 7,
                            unit_cost: 12.50
                        },
                        {
                            part_id: 'part_002',
                            part_name: 'Brake Pads',
                            mae: 0.8,
                            rmse: 1.2,
                            avg_usage: 3.2,
                            lead_time_days: 10,
                            unit_cost: 45.00
                        },
                        {
                            part_id: 'part_003',
                            part_name: 'Air Filter',
                            mae: 1.5,
                            rmse: 2.1,
                            avg_usage: 7.8,
                            lead_time_days: 5,
                            unit_cost: 8.75
                        }
                    ]
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting model statistics',
            error: error.message
        });
    }
});

/**
 * GET /api/ml/inventory-optimization
 * Get inventory optimization insights
 */
router.get('/inventory-optimization', async (req, res) => {
    try {
        const result = await makeMLRequest('/inventory-optimization');
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Inventory optimization insights retrieved successfully',
                data: result.data
            });
        } else {
            // Return fallback optimization data
            res.json({
                success: true,
                message: 'Using fallback optimization data (ML service unavailable)',
                data: {
                    total_inventory_value: 125000,
                    total_holding_cost_annual: 25000,
                    optimization_insights: [
                        {
                            part_id: 'part_001',
                            part_name: 'Oil Filter',
                            inventory_value: 187.50,
                            holding_cost_annual: 37.50,
                            ordering_cost_annual: 50,
                            insights: [
                                'Consider reducing safety stock by 20%',
                                'Reorder point can be optimized to 18 units',
                                'Lead time reduction could save $5/month'
                            ]
                        },
                        {
                            part_id: 'part_002',
                            part_name: 'Brake Pads',
                            inventory_value: 360.00,
                            holding_cost_annual: 72.00,
                            ordering_cost_annual: 50,
                            insights: [
                                'High-value item - consider JIT ordering',
                                'Current stock level is optimal',
                                'Supplier reliability is good'
                            ]
                        }
                    ]
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting optimization insights',
            error: error.message
        });
    }
});

/**
 * GET /api/ml/dashboard-data
 * Get comprehensive dashboard data
 */
router.get('/dashboard-data', async (req, res) => {
    try {
        // Try to get data from ML service
        const mlResult = await makeMLRequest('/dashboard-data');
        
        if (mlResult.success) {
            res.json({
                success: true,
                message: 'Dashboard data retrieved from ML service',
                data: mlResult.data
            });
        } else {
            // Return comprehensive fallback data
            const fallbackData = {
                health: {
                    status: 'unhealthy',
                    mongodb_status: 'unknown',
                    total_models: 3,
                    prophet_models: 0,
                    linear_models: 3,
                    last_update: new Date().toISOString(),
                    available_parts: ['part_001', 'part_002', 'part_003']
                },
                recommendations: {
                    total_parts: 3,
                    high_priority: 1,
                    medium_priority: 1,
                    low_priority: 1,
                    recommendations: [
                        {
                            part_id: 'part_001',
                            part_name: 'Oil Filter',
                            current_stock: 15,
                            reorder_point: 20,
                            safety_stock: 10,
                            recommended_order_quantity: 50,
                            days_until_reorder: 5,
                            lead_time_days: 7,
                            unit_cost: 12.50,
                            priority: 'HIGH'
                        },
                        {
                            part_id: 'part_002',
                            part_name: 'Brake Pads',
                            current_stock: 8,
                            reorder_point: 15,
                            safety_stock: 8,
                            recommended_order_quantity: 30,
                            days_until_reorder: 12,
                            lead_time_days: 10,
                            unit_cost: 45.00,
                            priority: 'MEDIUM'
                        },
                        {
                            part_id: 'part_003',
                            part_name: 'Air Filter',
                            current_stock: 25,
                            reorder_point: 30,
                            safety_stock: 15,
                            recommended_order_quantity: 40,
                            days_until_reorder: 20,
                            lead_time_days: 5,
                            unit_cost: 8.75,
                            priority: 'LOW'
                        }
                    ]
                },
                modelStats: {
                    total_models: 3,
                    models: [
                        {
                            part_id: 'part_001',
                            part_name: 'Oil Filter',
                            mae: 1.2,
                            rmse: 1.8,
                            avg_usage: 5.5,
                            lead_time_days: 7,
                            unit_cost: 12.50
                        },
                        {
                            part_id: 'part_002',
                            part_name: 'Brake Pads',
                            mae: 0.8,
                            rmse: 1.2,
                            avg_usage: 3.2,
                            lead_time_days: 10,
                            unit_cost: 45.00
                        },
                        {
                            part_id: 'part_003',
                            part_name: 'Air Filter',
                            mae: 1.5,
                            rmse: 2.1,
                            avg_usage: 7.8,
                            lead_time_days: 5,
                            unit_cost: 8.75
                        }
                    ]
                },
                optimization: {
                    total_inventory_value: 125000,
                    total_holding_cost_annual: 25000,
                    optimization_insights: [
                        {
                            part_id: 'part_001',
                            part_name: 'Oil Filter',
                            inventory_value: 187.50,
                            holding_cost_annual: 37.50,
                            ordering_cost_annual: 50,
                            insights: [
                                'Consider reducing safety stock by 20%',
                                'Reorder point can be optimized to 18 units',
                                'Lead time reduction could save $5/month'
                            ]
                        },
                        {
                            part_id: 'part_002',
                            part_name: 'Brake Pads',
                            inventory_value: 360.00,
                            holding_cost_annual: 72.00,
                            ordering_cost_annual: 50,
                            insights: [
                                'High-value item - consider JIT ordering',
                                'Current stock level is optimal',
                                'Supplier reliability is good'
                            ]
                        }
                    ]
                }
            };
            
            res.json({
                success: true,
                message: 'Using fallback dashboard data (ML service unavailable)',
                data: fallbackData
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting dashboard data',
            error: error.message
        });
    }
});

/**
 * POST /api/ml/retrain
 * Trigger model retraining
 */
router.post('/retrain', async (req, res) => {
    try {
        const result = await makeMLRequest('/retrain', 'POST');
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Model retraining started',
                data: result.data
            });
        } else {
            res.status(503).json({
                success: false,
                message: 'ML service unavailable for retraining',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error starting retraining',
            error: error.message
        });
    }
});

module.exports = router;
