import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  startWorkHandler,
  finishWorkHandler,
  confirmCompletionHandler,
  getWorkflowStatusHandler,
} from '../controllers/jobWorkflowController.js';

const router = express.Router();

/**
 * Worker routes
 */
router.post('/:jobId/start', authenticate, authorize('worker'), startWorkHandler);
router.post('/:jobId/finish', authenticate, authorize('worker'), finishWorkHandler);

/**
 * Customer routes
 */
router.post('/:jobId/confirm-completion', authenticate, authorize('customer'), confirmCompletionHandler);

/**
 * Shared route (Customer, Worker, Admin)
 */
router.get('/:jobId/workflow', authenticate, getWorkflowStatusHandler);

export default router;
