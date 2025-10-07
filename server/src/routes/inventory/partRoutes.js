import express from 'express';

const router = express.Router();
const { 
  createPart, 
  listParts, 
  searchParts, 
  reservePart 
} = require('../../controllers/inventory/partController');
const { auth } = require('../../middleware/auth');

// Search parts
router.get('/search', auth, searchParts);

// Reserve part quantity
router.put('/:id/reserve', auth, reservePart);

// Existing routes
router.post('/', auth, createPart);
router.get('/', auth, listParts);

export default router;