import mongoose from 'mongoose';
import { signToken } from './src/services/jwtService.js';

const MONGO_URI = 'mongodb://localhost:27017/kaamsetu';
const BASE_URL = 'http://localhost:5000/api/v1';

async function testWorkerSearch() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.\n');

  try {
    const db = mongoose.connection.db;

    // Clean up test users
    await db.collection('users').deleteMany({ phone: { $in: ['8888888888', '7777777777', '6666666666', '9999999999'] } });
    console.log('Cleaned up previous test users.');

    // 1. GET /customer/workers without auth -> Expect 401
    console.log('\nTest 1: GET /customer/workers unauthorized');
    const getUnauthRes = await fetch(`${BASE_URL}/customer/workers`);
    const getUnauthData = await getUnauthRes.json();
    console.log('Status:', getUnauthRes.status);
    console.log('Response:', JSON.stringify(getUnauthData));
    if (getUnauthRes.status !== 401) throw new Error('Unauthenticated request did not return 401');

    // Create 2 test workers and 1 customer
    console.log('\nSeeding test database with workers and customer...');
    
    const worker1 = await db.collection('users').insertOne({
      name: 'Mumbai Plumber',
      phone: '7777777777',
      role: 'worker',
      isVerified: true,
      skills: ['Plumbing'],
      location: 'Mumbai, India',
      experience: 5,
      workType: 'Full-time',
      availability: 'Weekdays',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const worker2 = await db.collection('users').insertOne({
      name: 'Delhi Electrician',
      phone: '6666666666',
      role: 'worker',
      isVerified: true,
      skills: ['Electrical'],
      location: 'Delhi, India',
      experience: 2,
      workType: 'Part-time',
      availability: 'Weekends',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const customer = await db.collection('users').insertOne({
      name: 'John Customer',
      phone: '8888888888',
      role: 'customer',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const customerToken = signToken({ _id: customer.insertedId, role: 'customer' });
    const customerCookie = `token=${customerToken}`;

    const worker1Token = signToken({ _id: worker1.insertedId, role: 'worker' });
    const workerCookie = `token=${worker1Token}`;

    // 2. GET /customer/workers as Worker -> Expect 403
    console.log('\nTest 2: GET /customer/workers as worker (forbidden)');
    const getWorkerRes = await fetch(`${BASE_URL}/customer/workers`, {
      headers: { Cookie: workerCookie },
    });
    const getWorkerData = await getWorkerRes.json();
    console.log('Status:', getWorkerRes.status);
    console.log('Response:', JSON.stringify(getWorkerData));
    if (getWorkerRes.status !== 403) throw new Error('Worker user accessing customer route did not return 403');

    // 3. GET /customer/workers as Customer (No Filters) -> Expect 200, returns all workers
    console.log('\nTest 3: GET /customer/workers as customer (no filters)');
    const getCustomerRes = await fetch(`${BASE_URL}/customer/workers`, {
      headers: { Cookie: customerCookie },
    });
    const getCustomerData = await getCustomerRes.json();
    console.log('Status:', getCustomerRes.status);
    console.log('Response Count:', getCustomerData.workers.length);
    console.log('Response Pagination:', JSON.stringify(getCustomerData.pagination));
    if (getCustomerRes.status !== 200 || getCustomerData.workers.length < 2) throw new Error('Search failed to return all workers');

    // 4. GET with skills filter -> Expect Mumbai Plumber
    console.log('\nTest 4: Search by skills=Plumbing');
    const skillRes = await fetch(`${BASE_URL}/customer/workers?skills=Plumbing`, {
      headers: { Cookie: customerCookie },
    });
    const skillData = await skillRes.json();
    console.log('Status:', skillRes.status);
    console.log('Found Workers:', skillData.workers.map(w => w.name));
    if (skillData.workers.length !== 1 || skillData.workers[0].name !== 'Mumbai Plumber') throw new Error('Skills search failed');

    // 5. GET with location filter (case-insensitive) -> Expect Delhi Electrician
    console.log('\nTest 5: Search by location=delhi');
    const locRes = await fetch(`${BASE_URL}/customer/workers?location=delhi`, {
      headers: { Cookie: customerCookie },
    });
    const locData = await locRes.json();
    console.log('Status:', locRes.status);
    console.log('Found Workers:', locData.workers.map(w => w.name));
    if (locData.workers.length !== 1 || locData.workers[0].name !== 'Delhi Electrician') throw new Error('Location search failed');

    // 6. GET with minExperience and maxExperience filter
    console.log('\nTest 6: Search by experience filter (minExperience=3&maxExperience=6)');
    const expRes = await fetch(`${BASE_URL}/customer/workers?minExperience=3&maxExperience=6`, {
      headers: { Cookie: customerCookie },
    });
    const expData = await expRes.json();
    console.log('Status:', expRes.status);
    console.log('Found Workers:', expData.workers.map(w => w.name));
    if (expData.workers.length !== 1 || expData.workers[0].name !== 'Mumbai Plumber') throw new Error('Experience search failed');

    // 7. GET with invalid experience filter -> Expect 400
    console.log('\nTest 7: Search by invalid experience filter (minExperience=-1)');
    const expInvalidRes = await fetch(`${BASE_URL}/customer/workers?minExperience=-1`, {
      headers: { Cookie: customerCookie },
    });
    const expInvalidData = await expInvalidRes.json();
    console.log('Status:', expInvalidRes.status);
    console.log('Response:', JSON.stringify(expInvalidData));
    if (expInvalidRes.status !== 400) throw new Error('Invalid experience search did not return 400');

    console.log('\nALL SEARCH TESTS PASSED SUCCESSFULLY.');
  } catch (err) {
    console.error('\nVerification failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

testWorkerSearch();
