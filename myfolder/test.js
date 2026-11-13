// server/test.js - Zero-Dependency Automated Test Suite for NeedNow Backend API
const { handleRequest } = require('./server');
const { EventEmitter } = require('events');

class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.headers = {};
    this.statusCode = 200;
    this.body = '';
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    Object.assign(this.headers, headers);
  }

  end(data) {
    if (data) this.body += data;
    this.emit('finish');
  }

  get json() {
    try {
      return JSON.parse(this.body);
    } catch (e) {
      return null;
    }
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = path;
    req.headers = { ...headers };
    if (body) {
      req.body = body;
    }

    const res = new MockResponse();
    res.on('finish', () => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        body: res.body,
        json: res.json
      });
    });

    handleRequest(req, res);
  });
}

async function runTests() {
  console.log('🧪 Starting NeedNow Backend API Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName, extraInfo = '') {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${extraInfo}`);
    }
  }

  // 1. Health Check
  const healthRes = await request('GET', '/api/health');
  assert(healthRes.status === 200 && healthRes.json?.status === 'ok', 'GET /api/health returns ok status');

  // 2. Categories
  const catRes = await request('GET', '/api/categories');
  assert(catRes.status === 200 && Array.isArray(catRes.json) && catRes.json.length >= 7, 'GET /api/categories returns category list');

  // 3. Stats
  const statsRes = await request('GET', '/api/stats');
  assert(statsRes.status === 200 && typeof statsRes.json?.openRequests === 'number', 'GET /api/stats returns marketplace metrics');

  // 4. Register new user
  const uniqueEmail = `test_${Date.now()}@example.com`;
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Pooja Hegde',
    email: uniqueEmail,
    password: 'Password123',
    phone: '+91 99887 76655',
    role: 'requester'
  });
  assert(regRes.status === 201 && regRes.json?.token && regRes.json?.user?.email === uniqueEmail, 'POST /api/auth/register creates user and JWT');
  const token = regRes.json?.token;

  // 5. Login
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'ananya@example.com',
    password: 'Password123'
  });
  assert(loginRes.status === 200 && loginRes.json?.token && loginRes.json?.user?.name === 'Ananya Sharma', 'POST /api/auth/login authenticates user');

  // 6. Get Current User (/api/auth/me)
  const meRes = await request('GET', '/api/auth/me', null, { authorization: `Bearer ${token}` });
  assert(meRes.status === 200 && meRes.json?.user?.name === 'Pooja Hegde', 'GET /api/auth/me validates Bearer token');

  // 7. Get Tasks
  const tasksRes = await request('GET', '/api/tasks');
  assert(tasksRes.status === 200 && Array.isArray(tasksRes.json) && tasksRes.json.length > 0, 'GET /api/tasks lists tasks');

  // 8. Create Task
  const newTaskRes = await request('POST', '/api/tasks', {
    title: 'Install RO water purifier',
    category: 'Home repairs',
    location: 'Koramangala',
    budget: '₹ 600',
    neededBy: 'Tomorrow'
  }, { authorization: `Bearer ${token}` });
  assert(newTaskRes.status === 201 && newTaskRes.json?.id && newTaskRes.json?.title === 'Install RO water purifier', 'POST /api/tasks creates task');
  const createdTaskId = newTaskRes.json?.id;

  // 9. Place Bid on created task
  const bidRes = await request('POST', `/api/tasks/${createdTaskId}/bids`, {
    price: 550,
    hours: 2
  });
  assert(bidRes.status === 201 && bidRes.json?.id && bidRes.json?.price === 550, 'POST /api/tasks/:id/bids places a bid');
  const createdBidId = bidRes.json?.id;

  // 10. Accept Bid
  const acceptRes = await request('POST', `/api/bids/${createdBidId}/accept`);
  assert(acceptRes.status === 200 && acceptRes.json?.bid?.status === 'accepted' && acceptRes.json?.task?.status === 'booked', 'POST /api/bids/:id/accept updates bid & task status');

  // 11. Complete Task & Submit Review
  const reviewRes = await request('POST', `/api/tasks/${createdTaskId}/complete`, {
    rating: 5,
    comment: 'Punctual, thorough, and clean installation!',
    imageUrl: 'data:image/png;base64,sample'
  }, { authorization: `Bearer ${token}` });
  assert(reviewRes.status === 200 && reviewRes.json?.review?.rating === 5 && reviewRes.json?.task?.status === 'completed', 'POST /api/tasks/:id/complete marks task done and stores review');

  // 12. Send Chat Message
  const sendMsgRes = await request('POST', `/api/tasks/${createdTaskId}/messages`, {
    text: 'Hello, when can you arrive?',
    senderRole: 'requester'
  });
  assert(sendMsgRes.status === 201 && sendMsgRes.json?.text === 'Hello, when can you arrive?', 'POST /api/tasks/:id/messages sends chat message');

  // 13. Get Chat Messages
  const getMsgsRes = await request('GET', `/api/tasks/${createdTaskId}/messages`);
  assert(getMsgsRes.status === 200 && Array.isArray(getMsgsRes.json) && getMsgsRes.json.length >= 1, 'GET /api/tasks/:id/messages returns chat history');

  // 14. Provider Profile
  const provRes = await request('GET', '/api/providers/2');
  assert(provRes.status === 200 && provRes.json?.name === 'Ravi Kumar' && Array.isArray(provRes.json?.customerReviews), 'GET /api/providers/:id returns profile and reviews');

  // 15. Helpline Support Ticket
  const helpRes = await request('POST', '/api/helpline', {
    topic: 'Booking issue in Indiranagar'
  });
  assert(helpRes.status === 201 && helpRes.json?.success === true, 'POST /api/helpline creates support ticket');

  console.log(`\n🎉 Test Results: ${passed}/${total} passed.`);
  if (passed === total) {
    console.log('🌟 ALL BACKEND API TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests();
