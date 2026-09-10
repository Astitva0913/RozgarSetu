import { Router } from 'express';
import {
  createOrderHandler,
  verifyPaymentHandler,
  getMyPaymentsHandler,
  getJobPaymentHandler,
  getPaymentDetailHandler,
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Customer only: create order and verify payment
router.post('/create-order', authenticate, authorize('customer'), createOrderHandler);
router.post('/verify', authenticate, authorize('customer'), verifyPaymentHandler);

// Customer or worker: fetch own payments/earnings
router.get('/my-payments', authenticate, authorize('customer', 'worker'), getMyPaymentsHandler);

// Authorized party (customer, worker, admin): view payment for job or specific payment ID
router.get('/job/:jobId', authenticate, getJobPaymentHandler);
router.get('/:paymentId', authenticate, getPaymentDetailHandler);

export default router;
