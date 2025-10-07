/**
 * Node.js Client for ML Inventory Service
 * Integrates with your existing MERN backend
 */

const axios = require('axios');

class MLInventoryClient {
    constructor(baseURL = 'http://localhost:8001') {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL: baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Check if ML service is healthy
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get predictions for specific parts
     */
    async getPredictions(partIds = null, days = 30) {
        try {
            const response = await this.client.post('/predict', {
                part_ids: partIds,
                days: days
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get reorder recommendations
     */
    async getReorderRecommendations() {
        try {
            const response = await this.client.get('/reorder-recommendations');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Train models (triggers background training)
     */
    async trainModels() {
        try {
            const response = await this.client.post('/train');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get model statistics
     */
    async getModelStats() {
        try {
            const response = await this.client.get('/model-stats');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get inventory optimization insights
     */
    async getInventoryOptimization() {
        try {
            const response = await this.client.get('/inventory-optimization');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = MLInventoryClient;
