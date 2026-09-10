import { request } from './request';

export const createPaymentOrder = (payload) =>
  request('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyPayment = (payload) =>
  request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getMyPayments = () => request('/payments/my-payments');

export const getJobPayment = (jobId) => request(`/payments/job/${jobId}`);

export const getPaymentDetail = (paymentId) => request(`/payments/${paymentId}`);
