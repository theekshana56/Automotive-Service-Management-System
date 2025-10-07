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
import inventoryReportsRoutes from './routes/inventory/reports.js';
import dashboardRoutes from './routes/inventory/dashboard.js';
import advisorOverviewRoutes from './routes/advisor/overview.js';
import advisorHistoryRoutes from './routes/advisor/history.js';
import advisorInspectionRoutes from './routes/advisor/inspections.js';
import advisorJobHistoryRoutes from './routes/advisor/jobHistory.js';
import advisorEstimateRoutes from './routes/advisor/estimate.js';
import advisorPdfRoutes from './routes/advisor/pdfRoutes.js';
import staffAssignmentsRoutes from './routes/staff/assignments.js';
import staffMngRoutes from './routes/staffMng/staffManagement.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import mechanicRoutes from './routes/mechanicRoutes.js';
import serviceRequestRoutes from './routes/serviceRequestRoutes.js';
import partUsageLogRoutes from './routes/inventory/partUsageLog.js';
import hrManagerRoutes from './routes/HRManager/hrManagerRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

// Import ML routes
import mlRoutes from './routes/mlRoutes.js';

// Import finance routes
import financeAuthRoutes from './routes/finance/auth.js';
import salaryRoutes from './routes/finance/salaryRoutes.js';
import inventoryPaymentRoutes from './routes/finance/inventoryPaymentRoutes.js';
import serviceCostRoutes from './routes/finance/serviceCostRoutes.js';
import customerPaymentRoutes from './routes/finance/customerPaymentRoutes.js';
import loyaltyDiscountRoutes from './routes/finance/loyaltyDiscountRoutes.js';
import emailRoutes from './routes/finance/emailRoutes.js';
import capitalRoutes from './routes/finance/capitalRoutes.js';
import pdfRoutes from './routes/finance/pdfRoutes.js';

// Import services
import { setIo, scanAllPartsForLowStock } from './services/inventory/stockService.js';
import { setNotifier } from './services/notificationService.js';

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

  // Set default JWT refresh secret for development if not provided
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'dev-refresh-secret-key-change-in-production';
    console.log('🔄 Using default JWT refresh secret for development');
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
  
  socket.on('auth:user', (email) => {
    if (typeof email === 'string' && email.trim()) {
      socket.join(email.trim().toLowerCase());
    }
  });

  socket.on('auth:role', (role) => {
    if (typeof role === 'string' && role.trim()) {
      socket.join(`role:${role.trim().toLowerCase()}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Inject Socket.IO instance into stock service
setIo(io);
setNotifier(io);

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);

// inventory routes
app.use('/api/inventory/items', inventoryItemsRoutes);
app.use('/api/inventory/dashboard', dashboardRoutes);
app.use('/api/inventory/reports', inventoryReportsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/vehicle-models', vehicleModelsRoutes);
app.use('/api/advisor', advisorOverviewRoutes);
app.use('/api/advisor', advisorHistoryRoutes);
app.use('/api/advisor', advisorInspectionRoutes);
app.use('/api/advisor', advisorJobHistoryRoutes);
app.use('/api/advisor/estimate', advisorEstimateRoutes);
app.use('/api/advisor/pdf', advisorPdfRoutes);
app.use('/api/staff/assignments', staffAssignmentsRoutes);
app.use('/api/staff', staffMngRoutes);

// Additional mounts for client compatibility
app.use('/api/extrawork', (req, res, next) => {
  req.url = `/extrawork${req.url}`;
  return staffMngRoutes(req, res, next);
});

app.use('/api/staff/performance-stats', async (req, res, next) => {
  if (req.method === 'GET') {
    req.url = '/performance-stats';
    return staffMngRoutes(req, res, next);
  }
  next();
});

// Alias for performance-stats without "staff" in path
app.use('/api/staff/performance-stats-alt', async (req, res, next) => {
  if (req.method === 'GET') {
    req.url = '/performance-stats';
    return staffMngRoutes(req, res, next);
  }
  next();
});

app.use('/api/attendance', (req, res, next) => {
  req.url = `/attendance${req.url}`;
  return staffMngRoutes(req, res, next);
});

app.use('/api/staff/staff-jobs', (req, res, next) => {
  req.url = `/staff-jobs${req.url}`;
  return staffMngRoutes(req, res, next);
});

app.use('/api/suggestions', (req, res, next) => {
  req.url = `/suggestions${req.url}`;
  return staffMngRoutes(req, res, next);
});

// Fix for attendance-report endpoint - handle the full path
app.use('/api/staff/attendance-report/:email', async (req, res, next) => {
  if (req.method === 'GET') {
    req.url = `/attendance-report/${req.params.email}`;
    return staffMngRoutes(req, res, next);
  }
  next();
});

// Fix for salary-report endpoint - handle the full path
app.use('/api/staff/salary-report/:email', async (req, res, next) => {
  if (req.method === 'GET') {
    req.url = `/salary-report/${req.params.email}`;
    return staffMngRoutes(req, res, next);
  }
  next();
});
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/inventory/parts-usage-log', partUsageLogRoutes);
app.use('/api/hr', hrManagerRoutes);
app.use('/api/contact', contactRoutes);

// ML routes
app.use('/api/ml', mlRoutes);

// Finance routes
app.use('/api/finance/auth', financeAuthRoutes);
app.use('/api/finance/salaries', salaryRoutes);
app.use('/api/finance/inventory-payments', inventoryPaymentRoutes);
app.use('/api/finance/service-costs', serviceCostRoutes);
app.use('/api/finance/customer-payments', customerPaymentRoutes);
app.use('/api/finance/loyalty-discount-requests', loyaltyDiscountRoutes);
app.use('/api/finance/email', emailRoutes);
app.use('/api/finance/capital', capitalRoutes);
app.use('/api/finance/pdf', pdfRoutes);

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
