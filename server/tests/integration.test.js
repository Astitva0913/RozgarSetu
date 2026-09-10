// Ensure test DB and port are set before importing app (env is read on import in some modules)
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaamsetu_test_integration';
process.env.TEST_PORT = process.env.TEST_PORT || '6010';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Job from '../src/models/Job.js';
import Application from '../src/models/Application.js';
import assert from 'assert';

// Test configuration
const TEST_PORT = process.env.TEST_PORT || 6010;
const TEST_DB = 'mongodb://localhost:27017/kaamsetu_test_integration';
const BASE = `http://localhost:${TEST_PORT}`;

let server;
let cookieJar = [];

const updateCookieJar = (res) => {
  const sc = res.headers.get('set-cookie');
  if (!sc) return;
  cookieJar = cookieJar.concat(sc.split(',').map(s => s.trim()));
};

const getCookieHeader = () => cookieJar.map(c => c.split(';')[0]).join('; ');

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
  try { data = JSON.parse(text); } catch (e) { data = { text }; }
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

// Run tests sequentially
try {
  console.log('Connecting to test DB:', TEST_DB);
  await mongoose.connect(TEST_DB);
  await cleanDB();
  await startServer();
  console.log('Server started for integration tests on', BASE);

  // 1. Authentication: New Worker via Mock OTP (123456)
  const workerPhone = '9123456789';
  let otpRes = await request('POST', '/api/v1/auth/send-otp', { phone: workerPhone, role: 'worker' });
  assert(otpRes.res.status === 200, `send-otp failed: ${JSON.stringify(otpRes.data)}`);

  let res = await request('POST', '/api/v1/auth/verify-otp', {
    phone: workerPhone,
    otp: '123456',
    name: 'Worker One',
    role: 'worker',
  });
  assert(res.res.status === 200, `Mock OTP auth failed for worker: ${JSON.stringify(res.data)}`);
  assert(res.data.user.role === 'worker', 'User role mismatch for worker');
  assert(res.data.user.name === 'Worker One', 'User name mismatch');
  const workerUser = res.data.user;

  // GET /me should work with HTTP-only cookie
  let me = await request('GET', '/api/v1/auth/me');
  assert(me.res.status === 200 && me.data.user.id, 'GET /me failed after worker login');

  // Protected endpoint rejects unauthenticated request
  const savedCookieJar = cookieJar.slice();
  cookieJar = []; // clear
  const { res: pRes } = await request('GET', '/api/v1/worker/profile');
  assert(pRes.status === 401, 'Protected endpoint did not reject unauthenticated request');
  cookieJar = savedCookieJar; // restore

  // 2. Authentication: New Customer via Mock OTP (123456)
  const customerPhone = '9876543210';
  otpRes = await request('POST', '/api/v1/auth/send-otp', { phone: customerPhone, role: 'customer' });
  assert(otpRes.res.status === 200, 'send-otp failed for customer');

  cookieJar = []; // clear cookie jar to simulate new client
  res = await request('POST', '/api/v1/auth/verify-otp', {
    phone: customerPhone,
    otp: '123456',
    name: 'Customer One',
    role: 'customer',
  });
  assert(res.res.status === 200 && res.data.user.role === 'customer', 'Customer mock OTP auth failed');
  const customerUser = res.data.user;

  // Save customer cookie separately
  const customerCookies = cookieJar.slice();

  // Restore worker cookie for next steps
  cookieJar = savedCookieJar;

  // Worker can access own profile
  let workerProfile = await request('GET', '/api/v1/worker/profile');
  assert(workerProfile.res.status === 200 && workerProfile.data.user.role === 'worker', 'Worker profile access failed');

  // Worker update profile
  res = await request('PUT', '/api/v1/worker/profile', { location: 'City A', skills: ['plumbing'], experience: 2 });
  assert(res.res.status === 200 && res.data.user.location === 'City A', 'Worker update profile failed');

  // Customer creates a job
  // Switch to customer cookies
  cookieJar = customerCookies.slice();
  res = await request('POST', '/api/v1/customer/jobs', {
    title: 'Fix sink',
    description: 'Fix kitchen sink',
    requiredSkills: ['plumbing'],
    location: 'City A',
    salary: 500,
    workType: 'part-time',
  });
  assert(res.res.status === 201 && res.data.job, 'Customer create job failed');
  const job = res.data.job;

  // Restore worker cookie
  cookieJar = savedCookieJar.slice();

  // Worker: get job detail (valid)
  res = await request('GET', `/api/v1/worker/jobs/${job._id}`);
  assert(res.res.status === 200 && res.data.job, 'Worker job detail failed');
  const jobDetail = res.data.job;
  assert(jobDetail.title === job.title, 'Job detail title mismatch');
  assert(!('customer' in jobDetail), 'Job detail should not expose customer info');

  // Invalid ObjectId for job detail
  cookieJar = savedCookieJar.slice();
  const invalidJobId = 'not-a-valid-id';
  let bad = await request('GET', `/api/v1/worker/jobs/${invalidJobId}`);
  assert(bad.res.status >= 400 && bad.res.status < 500, 'Invalid jobId did not return 4xx for job detail');

  // Non-existent but well-formed ObjectId
  const { default: mongooseModule } = await import('mongoose');
  const nonExistentId = new mongooseModule.Types.ObjectId().toString();
  bad = await request('GET', `/api/v1/worker/jobs/${nonExistentId}`);
  assert(bad.res.status === 404, 'Non-existent job did not return 404 for job detail');

  // Unauthorized access: customer should be forbidden from worker job detail
  cookieJar = customerCookies.slice();
  bad = await request('GET', `/api/v1/worker/jobs/${job._id}`);
  assert(bad.res.status === 403, 'Customer should not access worker job detail');

  // Unauthenticated access should be rejected
  cookieJar = [];
  bad = await request('GET', `/api/v1/worker/jobs/${job._id}`);
  assert(bad.res.status === 401, 'Unauthenticated request to worker job detail should be rejected');

  // Restore worker cookie
  cookieJar = savedCookieJar.slice();

  // Worker applies to job
  res = await request('POST', `/api/v1/worker/jobs/${job._id}/apply`);
  assert(res.res.status === 201 && res.data.application, 'Worker apply failed');
  const application1 = res.data.application;

  // Worker tries to apply twice
  res = await request('POST', `/api/v1/worker/jobs/${job._id}/apply`);
  assert(res.res.status === 400, 'Duplicate application was not rejected');

  // Worker fetches job detail after applying: hasApplied true and status present
  res = await request('GET', `/api/v1/worker/jobs/${job._id}`);
  assert(res.res.status === 200 && res.data.job, 'Worker job detail after apply failed');
  assert(res.data.job.hasApplied === true, 'hasApplied should be true after applying');
  assert(typeof res.data.job.myApplicationStatus === 'string', 'myApplicationStatus should be present after applying');

  // Another worker tries to apply: create second worker via mock OTP
  cookieJar = []; // new client
  res = await request('POST', '/api/v1/auth/verify-otp', {
    phone: '9812345670',
    otp: '123456',
    name: 'Worker Two',
    role: 'worker',
  });
  assert(res.res.status === 200 && res.data.user.role === 'worker', 'Second worker creation failed');
  const worker2Cookies = cookieJar.slice();

  // Second worker applies
  cookieJar = worker2Cookies.slice();
  res = await request('POST', `/api/v1/worker/jobs/${job._id}/apply`);
  assert(res.res.status === 201, 'Second worker apply failed');
  const application2 = res.data.application;

  // Another worker (worker2) fetches job detail: hasApplied true for worker2
  res = await request('GET', `/api/v1/worker/jobs/${job._id}`);
  assert(res.res.status === 200 && res.data.job, 'Worker2 job detail fetch failed');
  assert(res.data.job.hasApplied === true, 'Worker2 should see hasApplied true after applying');

  // Customer accepts one application (use customer cookie)
  cookieJar = customerCookies.slice();
  res = await request('PATCH', `/api/v1/customer/jobs/${job._id}/applications/${application1._id}/accept`);
  assert(res.res.status === 200, 'Customer accept application failed');
  assert(res.data.application.status === 'accepted', 'Accepted application status not updated');

  // Verify job closed
  res = await request('GET', `/api/v1/customer/jobs/${job._id}`);
  assert(res.res.status === 200 && res.data.job.status === 'closed', 'Job not closed after accept');

  // Verify other application rejected
  cookieJar = customerCookies.slice();
  res = await request('GET', `/api/v1/customer/jobs/${job._id}/applications`);
  assert(res.res.status === 200 && res.data.applications, 'List applications failed after accept');
  const apps = res.data.applications;
  const other = apps.find(a => a.id === application2._id || a.id === application2._id);
  assert(other && other.status === 'rejected', 'Other application not rejected after accept');

  // Accepted worker connection endpoint works (use worker1 cookie)
  cookieJar = savedCookieJar.slice();
  res = await request('GET', `/api/v1/worker/applications/${application1._id}/connection`);
  assert(res.res.status === 200 && res.data.connection && res.data.connection.customer, 'Worker connection endpoint failed');

  // Customer accepted-worker endpoint works
  cookieJar = customerCookies.slice();
  res = await request('GET', `/api/v1/customer/jobs/${job._id}/accepted-worker`);
  assert(res.res.status === 200 && res.data.acceptedWorker && res.data.acceptedWorker.worker, 'Customer accepted-worker endpoint failed');

  // Now ensure another worker cannot apply to closed job
  cookieJar = worker2Cookies.slice();
  res = await request('POST', `/api/v1/worker/jobs/${job._id}/apply`);
  assert(res.res.status === 400, 'Applying to closed job was not rejected');

  // Admin: create admin user directly in DB
  const adminUser = await User.create({
    name: 'Adm',
    email: 'admin@test.local',
    password: await bcrypt.hash('adminpass', 10),
    role: 'admin',
    isVerified: true,
  });

  // Admin login via admin route
  cookieJar = [];
  res = await request('POST', '/api/v1/auth/admin/login', { email: 'admin@test.local', password: 'adminpass' });
  assert(res.res.status === 200 && res.data.user.role === 'admin', 'Admin login failed');

  // Admin endpoints
  res = await request('GET', '/api/v1/admin/users');
  assert(res.res.status === 200 && Array.isArray(res.data.users), 'Admin users list failed');
  res = await request('GET', '/api/v1/admin/jobs');
  assert(res.res.status === 200 && Array.isArray(res.data.jobs), 'Admin jobs list failed');
  res = await request('GET', '/api/v1/admin/applications');
  assert(res.res.status === 200 && Array.isArray(res.data.applications), 'Admin applications list failed');
  res = await request('GET', '/api/v1/admin/stats');
  assert(res.res.status === 200 && res.data.stats, 'Admin stats failed');

  // Security / ownership checks
  // Customer A cannot modify customer B's job
  cookieJar = [];
  res = await request('POST', '/api/v1/auth/verify-otp', { phone: '9999888777', otp: '123456', name: 'Customer B', role: 'customer' });
  const customerBCookie = cookieJar.slice();

  // Customer B attempts to update job created by customer A
  cookieJar = customerBCookie.slice();
  res = await request('PUT', `/api/v1/customer/jobs/${job._id}`, { title: 'Hacked title' });
  assert(res.res.status === 404 || res.res.status === 403, 'Customer B improperly modified Customer A job');

  // Worker A cannot access Worker B's application connection
  cookieJar = worker2Cookies.slice();
  res = await request('GET', `/api/v1/worker/applications/${application1._id}/connection`);
  assert(res.res.status === 404 || res.res.status === 403, 'Worker B accessed Worker A connection');

  // === Additional security & edge-case integration tests ===
  const assertErrorFormat = (obj) => {
    if (obj && typeof obj === 'object') {
      if ('success' in obj) {
        assert(obj.success === false, 'Error response success flag should be false');
      }
      assert('message' in obj, 'Error response should include message');
    }
  };

  // 1. INVALID OTP
  cookieJar = [];
  let errRes = await request('POST', '/api/v1/auth/verify-otp', { phone: '9555666777', otp: '111111', role: 'worker' });
  assert(errRes.res.status === 400, 'Invalid OTP was not rejected with 400');
  assertErrorFormat(errRes.data);

  // 2. ROLE CONFLICT: Worker attempting customer login with existing worker phone
  errRes = await request('POST', '/api/v1/auth/verify-otp', { phone: workerPhone, otp: '123456', role: 'customer' });
  assert(errRes.res.status === 400, 'Role conflict was not rejected with 400');
  assertErrorFormat(errRes.data);

  // Also verify send-otp rejects role conflict for existing account
  errRes = await request('POST', '/api/v1/auth/send-otp', { phone: workerPhone, role: 'customer' });
  assert(errRes.res.status === 400, 'send-otp role conflict was not rejected with 400');
  assertErrorFormat(errRes.data);

  // 3. ROLE ESCALATION: admin role registration via OTP rejected
  errRes = await request('POST', '/api/v1/auth/verify-otp', { phone: '9111222333', otp: '123456', name: 'Hacker', role: 'admin' });
  assert(errRes.res.status === 400, 'Attempting to register as admin via phone auth was not rejected');
  assertErrorFormat(errRes.data);

  // 4. INVALID JWT
  cookieJar = ['token=malformed.token.value'];
  errRes = await request('GET', '/api/v1/worker/profile');
  assert(errRes.res.status === 401, 'Malformed JWT did not return 401');
  assertErrorFormat(errRes.data);

  // Expired JWT
  const jwtModule = await import('jsonwebtoken');
  const jwt = jwtModule.default || jwtModule;
  const env = (await import('../src/config/env.js')).default;
  const token = jwt.sign({ userId: workerUser.id, role: 'worker' }, env.jwtSecret, { expiresIn: '1s' });
  cookieJar = [`token=${token}`];
  await new Promise(r => setTimeout(r, 1200));
  errRes = await request('GET', '/api/v1/worker/profile');
  assert(errRes.res.status === 401, 'Expired JWT did not return 401');
  assertErrorFormat(errRes.data);

  // 5. ROLE ACCESS CONTROL
  // worker -> admin endpoint
  cookieJar = savedCookieJar.slice();
  errRes = await request('GET', '/api/v1/admin/users');
  assert(errRes.res.status === 403, 'Worker was able to access admin endpoint');
  assertErrorFormat(errRes.data);

  // customer -> admin endpoint
  cookieJar = customerCookies.slice();
  errRes = await request('GET', '/api/v1/admin/users');
  assert(errRes.res.status === 403, 'Customer was able to access admin endpoint');
  assertErrorFormat(errRes.data);

  // 6. LOGOUT CLEARS AUTH
  cookieJar = savedCookieJar.slice();
  res = await request('POST', '/api/v1/auth/logout');
  assert(res.res.status === 200, 'Logout failed');
  cookieJar = [];
  const afterLogout = await request('GET', '/api/v1/auth/me');
  assert(afterLogout.res.status === 401, 'Auth me after logout should be unauthorized');

  console.log('\nAll integration tests passed successfully!');

  // Cleanup and exit
  await cleanDB();
  await stopServer();
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('Integration tests failed:', err);
  try { await stopServer(); } catch (e) {}
  try { await mongoose.disconnect(); } catch (e) {}
  process.exit(1);
}
