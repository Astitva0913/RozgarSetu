process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaamsetu_test_workflow';
process.env.TEST_PORT = process.env.TEST_PORT || '6014';

import mongoose from 'mongoose';
import crypto from 'crypto';
import assert from 'assert';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Job from '../src/models/Job.js';
import Application from '../src/models/Application.js';
import Payment from '../src/models/Payment.js';
import env from '../src/config/env.js';
import { calculateCommission } from '../src/utils/commission.js';

const TEST_PORT = process.env.TEST_PORT || 6014;
const TEST_DB = 'mongodb://localhost:27017/kaamsetu_test_workflow';
const BASE = `http://localhost:${TEST_PORT}`;

let server;
let cookieJar = [];

const updateCookieJar = (res) => {
  const sc = res.headers.get('set-cookie');
  if (!sc) return;
  cookieJar = cookieJar.concat(sc.split(',').map((s) => s.trim()));
};

const getCookieHeader = () => cookieJar.map((c) => c.split(';')[0]).join('; ');

const request = async (method, path, body = null, extraHeaders = {}) => {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  const cookie = getCookieHeader();
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  updateCookieJar(res);
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { text };
  }
  return { res, data };
};

const cleanDB = async () => {
  await mongoose.connection.db.dropDatabase();
};

const startServer = async () => {
  server = app.listen(TEST_PORT);
  await new Promise((r) => server.once('listening', r));
};

const stopServer = async () => {
  if (server) await new Promise((r) => server.close(r));
};

try {
  console.log('Connecting to workflow test DB:', TEST_DB);
  await mongoose.connect(TEST_DB);
  await cleanDB();
  await startServer();
  console.log(`Server started for workflow tests on ${BASE}`);

  // 1. Create Users: Customer A, Customer B, Worker A, Worker B
  const customerA = await User.create({
    name: 'Customer Alice',
    phone: '9876543210',
    role: 'customer',
    isProfileComplete: true,
  });

  const customerB = await User.create({
    name: 'Customer Bob',
    phone: '9876543211',
    role: 'customer',
    isProfileComplete: true,
  });

  const workerA = await User.create({
    name: 'Worker Alex',
    phone: '9123456780',
    role: 'worker',
    isProfileComplete: true,
    skills: ['Plumbing', 'Carpentry'],
    workType: 'full-time',
    location: 'Mumbai',
  });

  const workerB = await User.create({
    name: 'Worker Ben',
    phone: '9123456781',
    role: 'worker',
    isProfileComplete: true,
    skills: ['Electrician'],
    workType: 'part-time',
    location: 'Pune',
  });

  // Helper login
  const loginUser = async (phone, role) => {
    cookieJar = [];
    await request('POST', '/api/v1/auth/mock-otp-request', { phone, role });
    await request('POST', '/api/v1/auth/verify-otp', { phone, otp: '123456', role });
    return cookieJar.slice();
  };

  const customerACookies = await loginUser('9876543210', 'customer');
  const customerBCookies = await loginUser('9876543211', 'customer');
  const workerACookies = await loginUser('9123456780', 'worker');
  const workerBCookies = await loginUser('9123456781', 'worker');

  // 2. Customer A posts a job
  cookieJar = customerACookies.slice();
  let res = await request('POST', '/api/v1/customer/jobs', {
    title: 'Fix Kitchen Plumbing',
    description: 'Fix the leaky sink and kitchen drain',
    requiredSkills: ['Plumbing'],
    location: 'Mumbai',
    salary: 2000,
    workType: 'one-time',
  });
  assert(res.res.status === 201, 'Customer should successfully create job');
  const jobId = res.data.job._id;
  assert(res.data.job.workflowStatus === 'open', 'Job initial workflowStatus must be open');

  // 3. Worker A applies to the job
  cookieJar = workerACookies.slice();
  res = await request('POST', `/api/v1/worker/jobs/${jobId}/apply`);
  assert(res.res.status === 201, 'Worker A should apply to job');
  const applicationId = res.data.application._id;

  // 4. Customer A accepts Worker A
  cookieJar = customerACookies.slice();
  res = await request('PATCH', `/api/v1/customer/jobs/${jobId}/applications/${applicationId}/accept`);
  assert(res.res.status === 200, 'Customer A should accept application');

  const jobAfterAccept = await Job.findById(jobId);
  assert(jobAfterAccept.status === 'closed', 'Job status must be closed');
  assert(jobAfterAccept.workflowStatus === 'worker_accepted', 'Job workflowStatus must be worker_accepted');

  // 5. Customer attempts to create payment before work is completed & confirmed -> must be blocked
  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', { jobId });
  assert(res.res.status === 400, 'Payment should be blocked before work is completed and confirmed');
  assert(res.data.message.includes('Payment is only available after work is completed and confirmed'), 'Error message mismatch');

  // 6. Worker B (unauthorized) attempts to start work -> must be rejected 403
  cookieJar = workerBCookies.slice();
  res = await request('POST', `/api/v1/jobs/${jobId}/start`);
  assert(res.res.status === 403, 'Unauthorized worker must be rejected 403 from starting work');

  // 7. Customer attempts to confirm completion before worker has started -> must be rejected 400
  cookieJar = customerACookies.slice();
  res = await request('POST', `/api/v1/jobs/${jobId}/confirm-completion`);
  assert(res.res.status === 400, 'Customer cannot confirm completion before work is done');

  // 8. Worker A starts work
  cookieJar = workerACookies.slice();
  res = await request('POST', `/api/v1/jobs/${jobId}/start`);
  assert(res.res.status === 200, 'Worker A should successfully start work');
  assert(res.data.job.workflowStatus === 'in_progress', 'Job workflowStatus must be in_progress');
  assert(res.data.job.workStartedAt, 'workStartedAt must be set');

  // 9. Worker A cannot start work again (duplicate start)
  res = await request('POST', `/api/v1/jobs/${jobId}/start`);
  assert(res.res.status === 400, 'Duplicate start request must be rejected');

  // 10. Worker B attempts to finish work -> must be rejected 403
  cookieJar = workerBCookies.slice();
  res = await request('POST', `/api/v1/jobs/${jobId}/finish`);
  assert(res.res.status === 403, 'Unauthorized worker must be rejected from finishing work');

  // 11. Customer attempts payment while in progress -> must be rejected 400
  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', { jobId });
  assert(res.res.status === 400, 'Payment must be blocked while work is in progress');

  // 12. Customer attempts to confirm completion while in progress -> must be rejected 400
  res = await request('POST', `/api/v1/jobs/${jobId}/confirm-completion`);
  assert(res.res.status === 400, 'Customer cannot confirm completion while work is in progress');

  // 13. Worker A finishes work
  cookieJar = workerACookies.slice();
  res = await request('POST', `/api/v1/jobs/${jobId}/finish`);
  assert(res.res.status === 200, 'Worker A should finish work');
  assert(res.data.job.workflowStatus === 'completed', 'Job workflowStatus must be completed');
  assert(res.data.job.workCompletedAt, 'workCompletedAt must be set');

  // 14. Worker A cannot finish work again (duplicate finish)
  res = await request('POST', `/api/v1/jobs/${jobId}/finish`);
  assert(res.res.status === 400, 'Duplicate finish request must be rejected');

  // 15. Customer attempts payment before confirming completion -> must still be blocked 400
  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', { jobId });
  assert(res.res.status === 400, 'Payment must be blocked before customer confirms completion');

  // 16. Customer B (not owner) attempts to confirm completion -> must be rejected 403
  cookieJar = customerBCookies.slice();
  res = await request('POST', `/api/v1/jobs/${jobId}/confirm-completion`);
  assert(res.res.status === 403, 'Unauthorized customer must be rejected 403');

  // 17. Customer A confirms completion
  cookieJar = customerACookies.slice();
  res = await request('POST', `/api/v1/jobs/${jobId}/confirm-completion`);
  assert(res.res.status === 200, 'Customer A should confirm completion');
  assert(res.data.job.workflowStatus === 'customer_confirmed', 'Job workflowStatus must be customer_confirmed');
  assert(res.data.job.customerConfirmedAt, 'customerConfirmedAt must be set');

  // 18. Customer A cannot confirm completion again (duplicate confirm)
  res = await request('POST', `/api/v1/jobs/${jobId}/confirm-completion`);
  assert(res.res.status === 400, 'Duplicate confirmation must be rejected');

  // 19. GET /api/v1/jobs/:jobId/workflow status check
  res = await request('GET', `/api/v1/jobs/${jobId}/workflow`);
  assert(res.res.status === 200, 'Customer should get workflow status');
  assert(res.data.workflow.workflowStatus === 'customer_confirmed', 'Workflow status check mismatch');
  assert(res.data.workflow.workStartedAt, 'Workflow workStartedAt mismatch');
  assert(res.data.workflow.workCompletedAt, 'Workflow workCompletedAt mismatch');
  assert(res.data.workflow.customerConfirmedAt, 'Workflow customerConfirmedAt mismatch');

  // Worker A can also view workflow
  cookieJar = workerACookies.slice();
  res = await request('GET', `/api/v1/jobs/${jobId}/workflow`);
  assert(res.res.status === 200, 'Worker A should get workflow status');

  // Worker B (unauthorized) cannot view workflow
  cookieJar = workerBCookies.slice();
  res = await request('GET', `/api/v1/jobs/${jobId}/workflow`);
  assert(res.res.status === 403, 'Unauthorized user should get 403 for workflow');

  // 20. Payment Flow: Customer A creates order & verifies
  cookieJar = customerACookies.slice();

  // Test with mock payment signature
  const testKeySecret = 'testWorkflowSecret1234567890';
  const savedKeySecret = env.razorpayKeySecret;
  env.razorpayKeySecret = testKeySecret;

  const mockOrderId = 'order_wf_test_987654';
  const commission = calculateCommission(2000, env.commissionRate);

  const pendingPayment = await Payment.create({
    customer: customerA._id,
    worker: workerA._id,
    job: jobId,
    application: applicationId,
    amount: 2000,
    commissionRate: env.commissionRate,
    platformCommission: commission.platformCommission,
    workerAmount: commission.workerAmount,
    currency: 'INR',
    razorpayOrderId: mockOrderId,
    status: 'pending',
  });

  const mockPaymentId = 'pay_wf_test_123456';
  const validSignature = crypto
    .createHmac('sha256', testKeySecret)
    .update(`${mockOrderId}|${mockPaymentId}`)
    .digest('hex');

  res = await request('POST', '/api/v1/payments/verify', {
    razorpayOrderId: mockOrderId,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: validSignature,
  });

  assert(res.res.status === 200, 'Payment verification should succeed');
  assert(res.data.payment.status === 'paid', 'Payment status must be paid');

  const finalJob = await Job.findById(jobId);
  assert(finalJob.workflowStatus === 'paid', 'Job workflowStatus must be paid after verification');
  assert(finalJob.paidAt, 'Job paidAt must be set after verification');

  // Restore env secret
  env.razorpayKeySecret = savedKeySecret;

  console.log('\nAll workflow & payment release tests passed successfully!');

  await cleanDB();
  await stopServer();
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('Workflow tests failed:', err);
  if (server) await stopServer();
  await mongoose.disconnect();
  process.exit(1);
}
