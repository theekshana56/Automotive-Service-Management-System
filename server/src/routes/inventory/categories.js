import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory, getCategoryTree } from '../../controllers/inventory/categoryController.js';

const router = express.Router();

router.post('/', createCategory);
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
