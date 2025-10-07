/**
 * Express.js Routes for ML Inventory Integration
 * Add these routes to your existing Express.js backend
 */

const express = require('express');
const MLInventoryClient = require('./nodejs_client');
const router = express.Router();

// Initialize ML client
const mlClient = new MLInventoryClient();

/**
 * GET /api/ml/health
 * Check ML service health
 */
router.get('/health', async (req, res) => {
    try {
        const result = await mlClient.healthCheck();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'ML service is healthy',
                data: result.data
            });
        } else {
            res.status(503).json({
                success: false,
                message: 'ML service is unavailable',
                error: result.error
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
        
        const result = await mlClient.getPredictions(partIds, days);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Predictions retrieved successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get predictions',
                error: result.error
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
        const result = await mlClient.getReorderRecommendations();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Reorder recommendations retrieved successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get reorder recommendations',
                error: result.error
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
 * POST /api/ml/train
 * Trigger model training
 */
router.post('/train', async (req, res) => {
    try {
        const result = await mlClient.trainModels();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Model training started',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to start training',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error starting training',
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
        const result = await mlClient.getModelStats();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Model statistics retrieved successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get model statistics',
                error: result.error
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
        const result = await mlClient.getInventoryOptimization();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Inventory optimization insights retrieved successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get optimization insights',
                error: result.error
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
        // Get all data in parallel
        const [
            healthResult,
            recommendationsResult,
            optimizationResult,
            statsResult
        ] = await Promise.all([
            mlClient.healthCheck(),
            mlClient.getReorderRecommendations(),
            mlClient.getInventoryOptimization(),
            mlClient.getModelStats()
        ]);

        // Combine results
        const dashboardData = {
            health: healthResult.success ? healthResult.data : null,
            recommendations: recommendationsResult.success ? recommendationsResult.data : null,
            optimization: optimizationResult.success ? optimizationResult.data : null,
            modelStats: statsResult.success ? statsResult.data : null,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Dashboard data retrieved successfully',
            data: dashboardData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting dashboard data',
            error: error.message
        });
    }
});

module.exports = router;
