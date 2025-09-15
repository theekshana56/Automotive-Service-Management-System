import { Router } from 'express';
import authRequired from '../middleware/auth.js';
import { allowRoles } from '../middleware/rbac.js';
import { 
  createBooking, 
  myBookings, 
  updateBooking, 
  cancelBooking, 
  assignAdvisor, 
  bookedSlots, 
  getAvailableSlots,
  completeService,
  freeSlot,
  getQueueInfo,
  processQueueManually,
  debugSlotInfo,
  generateBookingReport,
  generatePDFReport,
  getAllBookings
} from '../controllers/bookingController.js';

const r = Router();

// Static routes first (no parameters)
r.post('/', authRequired, createBooking);
r.get('/mine', authRequired, myBookings);
r.get('/all', authRequired, getAllBookings);
r.get('/booked-slots', bookedSlots);
r.get('/available-slots', getAvailableSlots);
r.get('/queue-info', getQueueInfo);
r.get('/debug-slot', authRequired, allowRoles('manager','admin'), debugSlotInfo);
r.get('/debug-slot-open', debugSlotInfo);
r.get('/test-report', (req, res) => {
  res.json({ message: 'Test report route working!' });
});

// Simple test route without authentication
r.get('/ping', (req, res) => {
  res.json({ 
    message: 'Booking routes are working!', 
    timestamp: new Date().toISOString(),
    routes: ['/ping', '/test-report', '/report/:id', '/:id/report', '/:id/test']
  });
});

// Test route without authentication to verify basic functionality
r.get('/test-no-auth/:id', (req, res) => {
  console.log('🔍 Test route without auth hit:', req.params.id);
  res.json({ 
    message: 'Test route without auth working!', 
    bookingId: req.params.id,
    timestamp: new Date().toISOString(),
    params: req.params,
    query: req.query
  });
});

// Simple report test without authentication
r.get('/report-test-no-auth/:id', (req, res) => {
  console.log('🔍 Report test without auth hit:', req.params.id);
  res.json({ 
    message: 'Report test without auth working!', 
    bookingId: req.params.id,
    timestamp: new Date().toISOString(),
    note: 'This route works without authentication - the issue is likely in auth or validation'
  });
});

// Report routes - specific patterns to avoid conflicts
r.get('/report/:id', authRequired, (req, res, next) => {
  console.log('🔍 Alternative report route hit:', req.params.id);
  next();
}, generateBookingReport);

// PDF Report routes - specific patterns to avoid conflicts
r.get('/report/:id/pdf', authRequired, (req, res, next) => {
  console.log('🔍 Alternative PDF report route hit:', req.params.id);
  next();
}, generatePDFReport);

// Parameterized routes last (to avoid conflicts)
r.get('/:id/report', authRequired, (req, res, next) => {
  console.log('🔍 Main report route hit:', req.params.id);
  next();
}, generateBookingReport);

// PDF Report route
r.get('/:id/report/pdf', authRequired, (req, res, next) => {
  console.log('🔍 Main PDF report route hit:', req.params.id);
  next();
}, generatePDFReport);

r.get('/:id/test', authRequired, (req, res) => {
  console.log('🔍 Test route hit:', req.params.id);
  res.json({ 
    message: 'Test route working!', 
    bookingId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

r.get('/:id/report-test', authRequired, async (req, res) => {
  console.log('🔍 Report test route hit:', req.params.id);
  try {
    await generateBookingReport(req, res);
  } catch (error) {
    console.error('❌ Error in generateBookingReport:', error);
    res.status(500).json({ 
      message: 'Error testing generateBookingReport function',
      error: error.message 
    });
  }
});

r.put('/:id', authRequired, updateBooking);
r.delete('/:id', authRequired, cancelBooking);

// Manager/Advisor routes
r.post('/:id/assign', authRequired, allowRoles('manager','admin'), assignAdvisor);
r.post('/:id/complete', authRequired, allowRoles('advisor','manager','admin'), completeService);
r.post('/:id/free-slot', authRequired, allowRoles('advisor','manager','admin'), freeSlot);
r.post('/process-queue', authRequired, allowRoles('manager','admin'), processQueueManually);

export default r;
