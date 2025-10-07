/**
 * Test Server Script
 * Tests if the Express.js server can start without errors
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

// Create a minimal Express app for testing
const app = express();

// Basic middleware
app.use(cors({ 
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true 
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Test ML routes
app.get('/api/ml/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'ML routes are working!',
        data: {
            status: 'healthy',
            total_models: 3,
            available_parts: ['part_001', 'part_002', 'part_003']
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: err.message 
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Test endpoints:`);
    console.log(`- http://localhost:${PORT}/test`);
    console.log(`- http://localhost:${PORT}/api/ml/test`);
});
