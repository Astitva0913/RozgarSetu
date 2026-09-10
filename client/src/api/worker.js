import { request } from './request';

export const getProfile = () => request('/worker/profile');
export const updateProfile = (payload) => request('/worker/profile', { method: 'PUT', body: JSON.stringify(payload) });
export const listOpenJobs = (page = 1, limit = 10) => request(`/worker/jobs?page=${page}&limit=${limit}`);
export const getJobDetail = (jobId) => request(`/worker/jobs/${jobId}`);
export const applyToJob = (jobId) => request(`/worker/jobs/${jobId}/apply`, { method: 'POST' });
export const listMyApplications = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/worker/applications${q ? '?' + q : ''}`);
};
export const withdrawApplication = (applicationId) => request(`/worker/applications/${applicationId}`, { method: 'DELETE' });
export const getConnection = (applicationId) => request(`/worker/applications/${applicationId}/connection`);
