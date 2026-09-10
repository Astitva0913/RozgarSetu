import { Router } from 'express';
import {
  getWorkerProfileHandler,
  updateWorkerProfileHandler,
} from '../controllers/workerController.js';
import {
  listOpenJobsHandler,
  getJobDetailForWorkerHandler,
  applyToJobHandler,
  listMyApplicationsHandler,
  withdrawApplicationHandler,
  getConnectionForWorkerHandler,
} from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/profile', authenticate, authorize('worker'), getWorkerProfileHandler);
router.put('/profile', authenticate, authorize('worker'), updateWorkerProfileHandler);

// Worker job/application endpoints
router.get('/jobs', authenticate, authorize('worker'), listOpenJobsHandler);
router.get('/jobs/:jobId', authenticate, authorize('worker'), getJobDetailForWorkerHandler);
router.post('/jobs/:jobId/apply', authenticate, authorize('worker'), applyToJobHandler);

router.get('/applications', authenticate, authorize('worker'), listMyApplicationsHandler);
router.delete('/applications/:applicationId', authenticate, authorize('worker'), withdrawApplicationHandler);

// Connection info for accepted application (worker only)
router.get('/applications/:applicationId/connection', authenticate, authorize('worker'), getConnectionForWorkerHandler);

export default router;
