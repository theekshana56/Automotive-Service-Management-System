import { Router } from 'express';
import { getOverview } from '../../controllers/advisor/overviewController.js';
import auth from '../../middleware/auth.js';

const router = Router();

router.get('/overview', auth, getOverview);

export default router;


