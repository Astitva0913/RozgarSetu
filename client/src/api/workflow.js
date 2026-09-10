import { request } from './request';

/**
 * Worker starts work on an assigned job.
 * POST /api/v1/jobs/:jobId/start
 */
export const startJobWork = (jobId) =>
  request(`/jobs/${jobId}/start`, {
    method: 'POST',
  });

/**
 * Worker marks work as completed.
 * POST /api/v1/jobs/:jobId/finish
 */
export const finishJobWork = (jobId) =>
  request(`/jobs/${jobId}/finish`, {
    method: 'POST',
  });

/**
 * Customer confirms completion of work.
 * POST /api/v1/jobs/:jobId/confirm-completion
 */
export const confirmJobCompletion = (jobId) =>
  request(`/jobs/${jobId}/confirm-completion`, {
    method: 'POST',
  });

/**
 * Fetch live workflow state and timestamps for a job.
 * GET /api/v1/jobs/:jobId/workflow
 */
export const getJobWorkflow = (jobId) =>
  request(`/jobs/${jobId}/workflow`, {
    method: 'GET',
  });
