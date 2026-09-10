import { Router } from 'express';
import { searchWorkersHandler } from '../controllers/customerController.js';
import {
  createJobHandler,
  getMyJobsHandler,
  getMyJobHandler,
  updateMyJobHandler,
  deleteMyJobHandler,
} from '../controllers/customerJobController.js';
import {
  listApplicationsForJobHandler,
  getApplicationForJobHandler,
  acceptApplicationHandler,
  rejectApplicationHandler,
  getAcceptedWorkerForJobHandler,
} from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/workers', authenticate, authorize('customer'), searchWorkersHandler);

// Jobs
router
  .route('/jobs')
  .post(authenticate, authorize('customer'), createJobHandler)
  .get(authenticate, authorize('customer'), getMyJobsHandler);

router
  .route('/jobs/:id')
  .get(authenticate, authorize('customer'), getMyJobHandler)
  .put(authenticate, authorize('customer'), updateMyJobHandler)
  .delete(authenticate, authorize('customer'), deleteMyJobHandler);

// Applications for a customer's job
router.get('/jobs/:jobId/applications', authenticate, authorize('customer'), listApplicationsForJobHandler);
router.get('/jobs/:jobId/applications/:applicationId', authenticate, authorize('customer'), getApplicationForJobHandler);

// Accept / reject application
router.patch('/jobs/:jobId/applications/:applicationId/accept', authenticate, authorize('customer'), acceptApplicationHandler);
router.patch('/jobs/:jobId/applications/:applicationId/reject', authenticate, authorize('customer'), rejectApplicationHandler);

// Get accepted worker for a job
router.get('/jobs/:jobId/accepted-worker', authenticate, authorize('customer'), getAcceptedWorkerForJobHandler);

export default router;
