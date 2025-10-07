import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import authRequired from '../middleware/auth.js';
import { allowRoles } from '../middleware/rbac.js';
import { 
  updateProfile, 
  deleteAccount, 
  listUsers, 
  setRole, 
  getAuditLogs, 
  uploadAvatar, 
  getUserStats, 
  requestLoyaltyDiscount, 
  createTestAdvisors,
  getAdvisors,
  createAdvisor,
  updateAdvisor,
  deleteAdvisor,
  updateAdvisorAvailability,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffAvailability,
  getLoyaltyRequests
} from '../controllers/userController.js';

const r = Router();

// Multer local storage (keep simple for uni project)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.mimetype)) return cb(new Error('Only images allowed'));
    cb(null, true);
  }
});

r.put('/me', authRequired, updateProfile);
r.delete('/me', authRequired, deleteAccount);
r.post('/me/avatar', authRequired, upload.single('avatar'), uploadAvatar);
r.post('/loyalty-discount-request', authRequired, requestLoyaltyDiscount);

r.get('/', authRequired, allowRoles('manager','admin','hr_manager'), listUsers);
r.post('/set-role', authRequired, allowRoles('manager','admin'), setRole);
r.get('/audit-logs', authRequired, allowRoles('admin','manager'), getAuditLogs);
r.get('/loyalty-requests', authRequired, allowRoles('finance_manager','admin'), getLoyaltyRequests);
r.get('/:userId/stats', authRequired, allowRoles('manager','admin'), getUserStats);

// Development endpoint (only available in development)
r.post('/create-test-advisors', createTestAdvisors);

// Advisor Management Routes
r.get('/advisors', authRequired, allowRoles('manager','admin','staff_manager','user'), getAdvisors);
r.post('/advisors', authRequired, allowRoles('manager','admin'), createAdvisor);
r.put('/advisors/:id', authRequired, allowRoles('manager','admin'), updateAdvisor);
r.delete('/advisors/:id', authRequired, allowRoles('manager','admin'), deleteAdvisor);

// Staff Management Routes (Admin and Advisor can view, Admin can manage)
r.get('/staff', authRequired, allowRoles('admin', 'advisor', 'hr_manager'), getStaff);
r.post('/staff', authRequired, allowRoles('admin'), createStaff);
r.put('/staff/:id', authRequired, allowRoles('admin'), updateStaff);
r.delete('/staff/:id', authRequired, allowRoles('admin','hr_manager'), deleteStaff);
r.patch('/staff/:id/availability', authRequired, allowRoles('admin'), updateStaffAvailability);

// Advisor availability route (put after staff routes to avoid conflicts)
r.patch('/advisors/:id/availability', authRequired, allowRoles('manager','admin'), updateAdvisorAvailability);

export default r;
