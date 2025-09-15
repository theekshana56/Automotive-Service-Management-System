import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

// Import inventory routes
import inventoryItemsRoutes from './routes/inventory/items.js';
import partsRoutes from './routes/inventory/parts.js';
import suppliersRoutes from './routes/inventory/suppliers.js';
import purchaseOrdersRoutes from './routes/inventory/purchaseOrders.js';
import notificationsRoutes from './routes/inventory/notifications.js';
import auditRoutes from './routes/inventory/audit.js';
import categoriesRoutes from './routes/inventory/categories.js';
import brandsRoutes from './routes/inventory/brands.js';
import vehicleModelsRoutes from './routes/inventory/vehicleModels.js';

// Import services
import { setIo, scanAllPartsForLowStock } from './services/inventory/stockService.js';

// Environment variable validation
const requiredEnvVars = ['MONGO_URI', 'JWT_ACCESS_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing required environment variables:', missingEnvVars.join(', '));
  console.warn('ℹ️ Some features may not work properly');
  
  // Set default JWT secret for development if not provided
  if (!process.env.JWT_ACCESS_SECRET) {
    process.env.JWT_ACCESS_SECRET = 'dev-secret-key-change-in-production';
    console.log('🔑 Using default JWT secret for development');
  }
}

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure helmet with custom CSP and disable restrictive CORP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "http://localhost:5000", "https://via.placeholder.com", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5173"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: false, // Disable restrictive CORP
  crossOriginEmbedderPolicy: false, // Disable restrictive COEP
}));

// Configure CORS to allow cross-origin requests
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Configure static folder for profile images with proper CORS headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    const origin = res.req.headers.origin;
    if (origin && ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:3000'].includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    } else {
      res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    }
    res.set('Access-Control-Allow-Credentials', 'true');
  }
}));

// Configure static folder for assets (logo, etc.) with proper CORS headers
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    const origin = res.req.headers.origin;
    if (origin && ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:3000'].includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    } else {
      res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    }
    res.set('Access-Control-Allow-Credentials', 'true');
  }
}));

// Create HTTP server and Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up Socket.IO for real-time notifications
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Inject Socket.IO instance into stock service
setIo(io);

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);

// inventory routes
app.use('/api/inventory/items', inventoryItemsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/vehicle-models', vehicleModelsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      socketio: 'active',
      inventory: 'enabled'
    }
  });
});

// start
await connectDB(process.env.MONGO_URI);
const port = process.env.PORT || 5000;

// Set up periodic low stock scanning (every 30 minutes)
setInterval(async () => {
  console.log('🔍 Running scheduled low stock scan...');
  try {
    await scanAllPartsForLowStock();
  } catch (error) {
    console.error('❌ Scheduled low stock scan failed:', error);
  }
}, 30 * 60 * 1000); // 30 minutes

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Inventory management system active`);
  console.log(`🔔 Real-time notifications enabled`);
  console.log(`⏰ Low stock scanning every 30 minutes`);
});
