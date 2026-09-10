import { request } from './request';

export const searchWorkers = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/customer/workers${q ? '?' + q : ''}`);
};

export const createJob = (payload) => request('/customer/jobs', { method: 'POST', body: JSON.stringify(payload) });
export const listMyJobs = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/customer/jobs${q ? '?' + q : ''}`);
};
export const getMyJob = (id) => request(`/customer/jobs/${id}`);
export const updateMyJob = (id, payload) => request(`/customer/jobs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteMyJob = (id) => request(`/customer/jobs/${id}`, { method: 'DELETE' });
export const listApplicationsForJob = (jobId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/customer/jobs/${jobId}/applications${q ? '?' + q : ''}`);
};
export const getApplicationForJob = (jobId, applicationId) => request(`/customer/jobs/${jobId}/applications/${applicationId}`);
export const acceptApplication = (jobId, applicationId) => request(`/customer/jobs/${jobId}/applications/${applicationId}/accept`, { method: 'PATCH' });
export const rejectApplication = (jobId, applicationId) => request(`/customer/jobs/${jobId}/applications/${applicationId}/reject`, { method: 'PATCH' });
export const getAcceptedWorker = (jobId) => request(`/customer/jobs/${jobId}/accepted-worker`);
