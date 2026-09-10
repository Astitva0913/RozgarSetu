import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listUsersHandler,
  getUserHandler,
  listJobsHandler,
  getJobHandler,
  listApplicationsHandler,
  getStatsHandler,
  listPaymentsHandler,
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/users', listUsersHandler);
router.get('/users/:userId', getUserHandler);

router.get('/jobs', listJobsHandler);
router.get('/jobs/:jobId', getJobHandler);

router.get('/applications', listApplicationsHandler);

router.get('/payments', listPaymentsHandler);

router.get('/stats', getStatsHandler);

export default router;
