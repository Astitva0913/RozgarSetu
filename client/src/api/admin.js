import { request } from './request';

export const listUsers = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/admin/users${q ? '?' + q : ''}`);
};
export const getUser = (id) => request(`/admin/users/${id}`);

export const listJobs = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/admin/jobs${q ? '?' + q : ''}`);
};
export const getJob = (id) => request(`/admin/jobs/${id}`);

export const listApplications = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/admin/applications${q ? '?' + q : ''}`);
};

export const listPayments = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/admin/payments${q ? '?' + q : ''}`);
};

export const getStats = () => request('/admin/stats');

