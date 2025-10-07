import express from 'express';

const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats
} = require('../controllers/invoiceController');
const { protect } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// All routes require authentication
router.use(protect);

router.get('/', getInvoices);
router.get('/stats/summary', getInvoiceStats);
router.post('/', validate(schemas.invoice), createInvoice);
router.get('/:id', getInvoice);
router.put('/:id', validate(schemas.invoice), updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
