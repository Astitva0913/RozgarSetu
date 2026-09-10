process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaamsetu_test_payments';
process.env.TEST_PORT = process.env.TEST_PORT || '6012';

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

const TEST_PORT = process.env.TEST_PORT || 6012;
const TEST_DB = 'mongodb://localhost:27017/kaamsetu_test_payments';
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
  } catch (e) {
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
  console.log('Connecting to payments test DB:', TEST_DB);
  await mongoose.connect(TEST_DB);
  await cleanDB();
  await startServer();
  console.log('Server started for payment tests on', BASE);

  // 1. Commission Calculation Unit Tests
  const c1 = calculateCommission(1000, 0.10);
  assert(c1.platformCommission === 100, `Platform commission mismatch: expected 100, got ${c1.platformCommission}`);
  assert(c1.workerAmount === 900, `Worker amount mismatch: expected 900, got ${c1.workerAmount}`);
  assert(c1.rate === 0.10, 'Rate mismatch');

  const c2 = calculateCommission(750, 0.10);
  assert(c2.platformCommission === 75, `Expected 75, got ${c2.platformCommission}`);
  assert(c2.workerAmount === 675, `Expected 675, got ${c2.workerAmount}`);

  // 2. Setup Users: Customer A, Worker A, Customer B, Admin
  // Customer A
  cookieJar = [];
  let res = await request('POST', '/api/v1/auth/verify-otp', {
    phone: '9876500001',
    otp: '123456',
    name: 'Customer Alice',
    role: 'customer',
  });
  assert(res.res.status === 200, 'Customer Alice creation failed');
  const customerAUser = res.data.user;
  const customerACookies = cookieJar.slice();

  // Worker A
  cookieJar = [];
  res = await request('POST', '/api/v1/auth/verify-otp', {
    phone: '9123400002',
    otp: '123456',
    name: 'Worker Bob',
    role: 'worker',
  });
  assert(res.res.status === 200, 'Worker Bob creation failed');
  const workerAUser = res.data.user;
  const workerACookies = cookieJar.slice();

  // Customer B
  cookieJar = [];
  res = await request('POST', '/api/v1/auth/verify-otp', {
    phone: '9876500003',
    otp: '123456',
    name: 'Customer Charlie',
    role: 'customer',
  });
  assert(res.res.status === 200, 'Customer Charlie creation failed');
  const customerBCookies = cookieJar.slice();

  // Admin
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin_payment@test.local',
    password: 'hashedpassword',
    role: 'admin',
    isVerified: true,
  });
  // Generate admin token
  const jwtModule = await import('jsonwebtoken');
  const jwt = jwtModule.default || jwtModule;
  const adminToken = jwt.sign({ userId: adminUser._id, role: 'admin' }, env.jwtSecret, { expiresIn: '7d' });
  const adminCookies = [`token=${adminToken}`];

  // 3. Customer A posts a job
  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/customer/jobs', {
    title: 'Paint House Walls',
    description: 'Paint living room walls with primer and paint',
    requiredSkills: ['painting'],
    location: 'North Block',
    salary: 2000,
    workType: 'contract',
  });
  assert(res.res.status === 201 && res.data.job, 'Job creation failed');
  const jobA = res.data.job;

  // 4. Test eligibility checks before accepted worker:
  // Cannot create payment when job has no accepted worker
  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', {
    jobId: jobA._id,
  });
  assert(res.res.status === 400, 'Payment order creation without accepted worker should fail with 400');
  assert(res.data.success === false, 'Error response success should be false');

  // 5. Worker applies to job
  cookieJar = workerACookies.slice();
  res = await request('POST', `/api/v1/worker/jobs/${jobA._id}/apply`);
  assert(res.res.status === 201, 'Worker apply failed');
  const applicationA = res.data.application;

  // Still cannot create payment while application is pending
  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', {
    jobId: jobA._id,
    applicationId: applicationA._id,
  });
  assert(res.res.status === 400, 'Payment before acceptance should fail');

  // 6. Customer accepts application
  cookieJar = customerACookies.slice();
  res = await request('PATCH', `/api/v1/customer/jobs/${jobA._id}/applications/${applicationA._id}/accept`);
  assert(res.res.status === 200, 'Accept application failed');

  // Advance workflow to customer_confirmed so payment tests can test create-order
  await Job.findByIdAndUpdate(jobA._id, { workflowStatus: 'customer_confirmed' });

  // 7. Security: Worker cannot create payment order
  cookieJar = workerACookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', {
    jobId: jobA._id,
  });
  assert(res.res.status === 403, 'Worker must not be allowed to create payment order (403)');

  // 8. Security: Customer B cannot create payment for Customer A's job
  cookieJar = customerBCookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', {
    jobId: jobA._id,
  });
  assert(res.res.status === 404, 'Customer B paying for Customer A job should return 404');

  // 9. When Razorpay keys are not configured, create-order returns clean 503
  const savedKeyId = env.razorpayKeyId;
  const savedKeySecret = env.razorpayKeySecret;
  env.razorpayKeyId = '';
  env.razorpayKeySecret = '';

  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', {
    jobId: jobA._id,
  });
  assert(res.res.status === 503, `Expected 503 when keys are unconfigured, got ${res.res.status}`);
  assert(res.data.message.includes('Razorpay credentials are not configured'), 'Error message should explain missing keys');

  // 10. Test with test keys configured
  env.razorpayKeyId = savedKeyId || 'rzp_test_mockKeyId12345';
  env.razorpayKeySecret = savedKeySecret || 'mockSecretKeySecret1234567890';

  // Mock the Razorpay order creation for offline integration testing
  const { default: razorpayServiceModule } = await import('../src/services/razorpayService.js');
  // Create a pending Payment record directly to test backend verification, commission math, and access controls
  const commission = calculateCommission(jobA.salary, env.commissionRate);
  const mockOrderId = 'order_mock_test_123456';

  const testPayment = await Payment.create({
    customer: customerAUser.id,
    worker: workerAUser.id,
    job: jobA._id,
    application: applicationA._id,
    amount: jobA.salary,
    commissionRate: env.commissionRate,
    platformCommission: commission.platformCommission,
    workerAmount: commission.workerAmount,
    currency: 'INR',
    razorpayOrderId: mockOrderId,
    status: 'pending',
  });

  assert(testPayment.platformCommission === 200, `Platform commission should be 200, got ${testPayment.platformCommission}`);
  assert(testPayment.workerAmount === 1800, `Worker amount should be 1800, got ${testPayment.workerAmount}`);

  // 11. Test Signature Verification with forged signature (should fail)
  cookieJar = customerACookies.slice();
  const mockPaymentId = 'pay_mock_test_789012';
  res = await request('POST', '/api/v1/payments/verify', {
    razorpayOrderId: mockOrderId,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: 'forged_invalid_signature_hash',
  });
  assert(res.res.status === 400, 'Forged signature should return 400');
  const failedPayment = await Payment.findById(testPayment._id);
  assert(failedPayment.status === 'failed', 'Payment status should be failed after bad signature');

  // 12. Test Signature Verification with authentic HMAC SHA256 signature
  // Reset status to pending
  testPayment.status = 'pending';
  await testPayment.save();

  const authenticSignature = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${mockOrderId}|${mockPaymentId}`)
    .digest('hex');

  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/payments/verify', {
    razorpayOrderId: mockOrderId,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: authenticSignature,
  });
  assert(res.res.status === 200, `Authentic signature verification failed: ${JSON.stringify(res.data)}`);
  assert(res.data.success === true, 'Verification response success should be true');
  assert(res.data.payment.status === 'paid', 'Verified payment status should be paid');
  assert(res.data.payment.paidAt, 'paidAt timestamp should be set');
  assert(res.data.payment.paymentMethod === 'upi', 'Default payment method should be upi');

  // 12b. Verify that the application was automatically deleted after completion of work and payment
  const remainingJobApps = await Application.find({ job: jobA._id });
  assert(remainingJobApps.length === 0, 'Application should be automatically deleted after completion of work and payment');

  // Verify that the job status is updated to closed and paid
  const updatedJobA = await Job.findById(jobA._id);
  assert(updatedJobA.workflowStatus === 'paid', 'Job workflowStatus should be paid');
  assert(updatedJobA.status === 'closed', 'Job status should be closed');

  // 12c. Verify that customer can still retrieve accepted worker details via fallback
  cookieJar = customerACookies.slice();
  const workerInfoRes = await request('GET', `/api/v1/customer/jobs/${jobA._id}/accepted-worker`);
  assert(workerInfoRes.res.status === 200, 'Customer should retrieve worker info via fallback after app deletion');
  assert(workerInfoRes.data.acceptedWorker.worker.name === 'Worker Bob', 'Worker name should match');

  // 13. Idempotency test: duplicate verification should succeed without creating duplicates
  res = await request('POST', '/api/v1/payments/verify', {
    razorpayOrderId: mockOrderId,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: authenticSignature,
    paymentMethod: 'fake_method', // Frontend attempting to send arbitrary method
  });
  assert(res.res.status === 200, 'Idempotent re-verification should return 200');
  assert(res.data.message.includes('already verified'), 'Should indicate already verified');
  assert(res.data.payment.paymentMethod !== 'fake_method', 'paymentMethod must not be blindly trusted from frontend');
  const count = await Payment.countDocuments({ razorpayOrderId: mockOrderId });
  assert(count === 1, 'Duplicate payment records must not be created');

  // 14. Duplicate payment prevention for already-paid job
  cookieJar = customerACookies.slice();
  res = await request('POST', '/api/v1/payments/create-order', {
    jobId: jobA._id,
  });
  assert(res.res.status === 400, 'Paying for already paid job should return 400');
  assert(res.data.message.includes('already been paid for'), 'Should say job has already been paid for');

  // 15. Customer views my-payments
  cookieJar = customerACookies.slice();
  res = await request('GET', '/api/v1/payments/my-payments');
  assert(res.res.status === 200, 'Customer get my-payments failed');
  assert(res.data.payments.length === 1, 'Customer should have 1 payment');
  assert(res.data.summary.totalPaid === 2000, `totalPaid should be 2000, got ${res.data.summary.totalPaid}`);

  // 16. Worker views my-payments (earnings)
  cookieJar = workerACookies.slice();
  res = await request('GET', '/api/v1/payments/my-payments');
  assert(res.res.status === 200, 'Worker get my-payments failed');
  assert(res.data.payments.length === 1, 'Worker should have 1 payment record');
  assert(res.data.summary.totalEarnings === 1800, `Worker earnings should be 1800, got ${res.data.summary.totalEarnings}`);
  assert(res.data.summary.completedPayments === 1800, 'Worker completed payments should be 1800');

  // 17. GET /api/v1/payments/job/:jobId
  // Customer can view
  cookieJar = customerACookies.slice();
  res = await request('GET', `/api/v1/payments/job/${jobA._id}`);
  assert(res.res.status === 200 && res.data.payment.amount === 2000, 'Customer view job payment failed');

  // Worker can view
  cookieJar = workerACookies.slice();
  res = await request('GET', `/api/v1/payments/job/${jobA._id}`);
  assert(res.res.status === 200 && res.data.payment.workerAmount === 1800, 'Worker view job payment failed');

  // Unauthorized Customer B cannot view
  cookieJar = customerBCookies.slice();
  res = await request('GET', `/api/v1/payments/job/${jobA._id}`);
  assert(res.res.status === 403, 'Customer B should be forbidden from viewing Customer A job payment');

  // 18. Admin payment listing and stats
  cookieJar = adminCookies.slice();
  res = await request('GET', '/api/v1/admin/payments');
  assert(res.res.status === 200, 'Admin payments list failed');
  assert(res.data.payments.length === 1, 'Admin should see 1 payment');
  assert(res.data.payments[0].amount === 2000, 'Payment amount mismatch in admin list');

  res = await request('GET', '/api/v1/admin/stats');
  assert(res.res.status === 200, 'Admin stats failed');
  assert(res.data.stats.totalPayments === 1, 'Stats totalPayments mismatch');
  assert(res.data.stats.totalTransactionValue === 2000, 'Stats totalTransactionValue mismatch');
  assert(res.data.stats.totalPlatformCommission === 200, 'Stats totalPlatformCommission mismatch');
  assert(res.data.stats.totalWorkerEarnings === 1800, 'Stats totalWorkerEarnings mismatch');

  // 19. Payment limit validation tests (10,000 rupees limit)
  cookieJar = customerACookies.slice();

  // 19a. Customer cannot post job with salary exceeding 10,000 limit
  let limitRes = await request('POST', '/api/v1/customer/jobs', {
    title: 'Executive Villa Renovation',
    description: 'Full house luxury makeover',
    requiredSkills: ['interior'],
    location: 'South City',
    salary: 15000,
    workType: 'contract',
  });
  assert(limitRes.res.status === 400, 'Posting job with salary > 10000 should fail with 400');
  assert(limitRes.data.message.includes('10,000'), 'Error message should mention 10,000 limit');

  // 19b. Customer cannot update job salary exceeding 10,000 limit
  limitRes = await request('PUT', `/api/v1/customer/jobs/${jobA._id}`, {
    salary: 25000,
  });
  assert(limitRes.res.status === 400, 'Updating job with salary > 10000 should fail with 400');

  // 19c. Payment creation rejects jobs exceeding limit
  const customerADoc = await User.findOne({ phone: '9876500001' });
  const workerADoc = await User.findOne({ phone: '9123400002' });
  const expensiveJob = await Job.collection.insertOne({
    title: 'Over Limit Job',
    description: 'Description',
    requiredSkills: ['masonry'],
    location: 'East Wing',
    salary: 12000,
    workType: 'contract',
    status: 'open',
    workflowStatus: 'customer_confirmed',
    customer: customerADoc._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const expensiveApp = await Application.create({
    job: expensiveJob.insertedId,
    worker: workerADoc._id,
    status: 'accepted',
  });

  limitRes = await request('POST', '/api/v1/payments/create-order', {
    jobId: expensiveJob.insertedId.toString(),
    applicationId: expensiveApp._id.toString(),
  });
  assert(limitRes.res.status === 400, 'Payment order for salary > 10000 should fail with 400');
  assert(limitRes.data.message.includes('10,000'), 'Error message should mention 10,000 limit');

  // Restore original env keys
  env.razorpayKeyId = savedKeyId;
  env.razorpayKeySecret = savedKeySecret;

  console.log('\nAll payment tests passed successfully!');

  await cleanDB();
  await stopServer();
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('Payment tests failed:', err);
  try {
    await stopServer();
  } catch (e) {}
  try {
    await mongoose.disconnect();
  } catch (e) {}
  process.exit(1);
}
