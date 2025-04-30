import express from 'express';

const router = express.Router();

// Import ingredient route modules
import analyzeRoutes from './analyze/analyzeRoutes';
import extractRoutes from './extract/extractRoutes';

// Set up the routes
router.use('/analyze', analyzeRoutes);
router.use('/extract', extractRoutes);

export default router;
