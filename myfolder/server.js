// server/server.js - Zero-Dependency REST API & Real-Time SSE Server for NeedNow Marketplace
const http = require('http');
const url = require('url');
const { db, servicePhotos } = require('./db');
const { hashPassword, verifyPassword, createToken, verifyToken, extractUser } = require('./auth');

const PORT = parseInt(process.env.PORT || '5000', 10);

// SSE clients for real-time live events (new bids, bookings, chat messages)
let sseClients = [];

function broadcast(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    // If body is already parsed (e.g. in test runner or mock)
    if (req.body !== undefined) {
      return resolve(req.body);
    }
    let body = '';
    // Allow up to 15MB for base64 task photos and finished-work review photos
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large (max 15MB)'));
      }
    });
    req.on('end', () => {
      if (!body) {
        return resolve({});
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', err => reject(err));
  });
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // Real-time Server-Sent Events (SSE) Stream
  if (pathname === '/api/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(':\n\n'); // SSE comment to keep connection alive
    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c.id !== clientId);
    });
    return;
  }

  try {
    // Health Check
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'ok',
        marketplace: 'NeedNow',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    }

    // ----------------------------------------------------
    // AUTHENTICATION
    // ----------------------------------------------------
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password, name, phone, role } = body;

      if (!email || !password || !name) {
        return sendError(res, 400, 'Name, email, and password are required.');
      }

      const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return sendError(res, 400, 'An account with this email already exists.');
      }

      const { salt, hash } = hashPassword(password);
      const userRole = role === 'provider' ? 'provider' : 'requester';

      // Initials for avatar
      const nameParts = name.trim().split(/\s+/);
      const initials = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();

      const tones = ['mint', 'yellow', 'blue', 'peach', 'lavender'];
      const tone = tones[Math.floor(Math.random() * tones.length)];

      const newUser = db.insert('users', {
        email: email.toLowerCase(),
        name: name.trim(),
        phone: phone || '',
        role: userRole,
        initials,
        tone,
        rating: 5.0,
        reviews: 0,
        distance: 1.0,
        hours: 2,
        price: 400,
        jobsCompleted: 0,
        bio: userRole === 'provider' ? 'Dedicated local service provider ready for new tasks.' : '',
        services: userRole === 'provider' ? ['Home repairs'] : [],
        portfolio: [servicePhotos.repair],
        salt,
        passwordHash: hash
      });

      const { passwordHash: _, salt: __, ...safeUser } = newUser;
      const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role });

      return sendJson(res, 201, { user: safeUser, token });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendError(res, 400, 'Email and password are required.');
      }

      const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return sendError(res, 401, 'Invalid email or password.');
      }

      const valid = verifyPassword(password, user.salt, user.passwordHash);
      if (!valid) {
        return sendError(res, 401, 'Invalid email or password.');
      }

      const { passwordHash: _, salt: __, ...safeUser } = user;
      const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role });

      return sendJson(res, 200, { user: safeUser, token });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = extractUser(req);
      if (!user) {
        return sendError(res, 401, 'Not authenticated.');
      }
      return sendJson(res, 200, { user });
    }

    // ----------------------------------------------------
    // CATEGORIES
    // ----------------------------------------------------
    if (pathname === '/api/categories' && method === 'GET') {
      const categories = [
        { name: "Home repairs", icon: "wrench", tone: "mint" },
        { name: "Tutoring", icon: "book", tone: "yellow" },
        { name: "Photography", icon: "camera", tone: "pink" },
        { name: "Moving", icon: "truck", tone: "lavender" },
        { name: "Deliveries", icon: "bike", tone: "blue" },
        { name: "Event support", icon: "event", tone: "peach" },
        { name: "Something else", icon: "search", tone: "cream" }
      ];
      return sendJson(res, 200, categories);
    }

    // ----------------------------------------------------
    // STATS
    // ----------------------------------------------------
    if (pathname === '/api/stats' && method === 'GET') {
      const allTasks = db.data.tasks || [];
      const allBids = db.data.bids || [];
      const openRequests = allTasks.filter(t => t.status === 'open').length;
      const bookedCount = allTasks.filter(t => t.status === 'booked' || t.status === 'completed').length;
      const bidsReceived = allBids.length;
      const nearbyRequests = allTasks.length;

      return sendJson(res, 200, {
        openRequests,
        bidsReceived,
        bookedCount,
        nearbyRequests
      });
    }

    // ----------------------------------------------------
    // TASKS
    // ----------------------------------------------------
    if (pathname === '/api/tasks' && method === 'GET') {
      const { category, status, search, requesterId, maxDistance } = parsedUrl.query;
      let tasks = db.data.tasks || [];

      if (category && category !== 'All jobs') {
        tasks = tasks.filter(t => t.category.toLowerCase() === category.toLowerCase() || t.customCategory?.toLowerCase() === category.toLowerCase());
      }
      if (status) {
        tasks = tasks.filter(t => t.status === status);
      }
      if (requesterId) {
        tasks = tasks.filter(t => String(t.requesterId) === String(requesterId));
      }
      if (search) {
        const q = search.toLowerCase();
        tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.details?.toLowerCase().includes(q) || t.location?.toLowerCase().includes(q));
      }
      if (maxDistance) {
        const maxDist = parseFloat(maxDistance);
        tasks = tasks.filter(t => {
          const dist = parseFloat(t.distance || '1.0');
          return dist <= maxDist;
        });
      }

      // Attach bids info to each task
      const enriched = tasks.map(t => {
        const bids = db.find('bids', b => b.taskId === t.id);
        const acceptedBid = bids.find(b => b.status === 'accepted') || null;
        return {
          ...t,
          bidsCount: bids.length,
          bids,
          acceptedBid
        };
      });

      return sendJson(res, 200, enriched);
    }

    if (pathname === '/api/tasks' && method === 'POST') {
      const body = await parseBody(req);
      const user = extractUser(req);

      const { title, category, customCategory, location, budget, neededBy, details, imageUrl } = body;
      if (!title) {
        return sendError(res, 400, 'Task title is required.');
      }

      const newTask = db.insert('tasks', {
        title,
        category: category || 'Home repairs',
        customCategory: customCategory || '',
        location: location || 'Indiranagar',
        distance: '0.9 km',
        budget: budget || '₹ 500',
        neededBy: neededBy || 'As soon as possible',
        details: details || '',
        imageUrl: imageUrl || servicePhotos.repair,
        requesterId: user ? user.id : 1,
        requesterName: user ? user.name : 'Ananya Sharma',
        status: 'open',
        acceptedBidId: null
      });

      broadcast('NEW_TASK', newTask);
      return sendJson(res, 201, newTask);
    }

    // Specific task routes
    const taskMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
    if (taskMatch && method === 'GET') {
      const taskId = parseInt(taskMatch[1], 10);
      const task = db.findOne('tasks', t => t.id === taskId);
      if (!task) {
        return sendError(res, 404, 'Task not found.');
      }
      const bids = db.find('bids', b => b.taskId === taskId);
      const messages = db.find('messages', m => m.taskId === taskId);
      return sendJson(res, 200, { ...task, bids, messages });
    }

    // Mark task completed & submit review
    const completeMatch = pathname.match(/^\/api\/tasks\/(\d+)\/complete$/);
    if (completeMatch && method === 'POST') {
      const taskId = parseInt(completeMatch[1], 10);
      const body = await parseBody(req);
      const user = extractUser(req);
      const { rating, comment, imageUrl } = body;

      const task = db.findOne('tasks', t => t.id === taskId);
      if (!task) {
        return sendError(res, 404, 'Task not found.');
      }

      const bids = db.find('bids', b => b.taskId === taskId);
      const acceptedBid = bids.find(b => b.status === 'accepted');
      if (!acceptedBid) {
        return sendError(res, 400, 'Cannot complete a task without an accepted bid.');
      }

      // Update task status
      db.update('tasks', taskId, { status: 'completed' });

      // Save review
      const review = db.insert('reviews', {
        taskId,
        providerId: acceptedBid.providerId,
        providerName: acceptedBid.name,
        requesterId: user ? user.id : task.requesterId,
        requesterName: user ? user.name : task.requesterName,
        rating: Number(rating) || 5,
        comment: comment || 'Work completed and confirmed.',
        imageUrl: imageUrl || ''
      });

      // Update provider metrics
      const provider = db.findOne('users', u => u.id === acceptedBid.providerId);
      let updatedProvider = null;
      if (provider) {
        const curRating = provider.rating || 5.0;
        const curReviews = provider.reviews || 0;
        const newRating = Number(((curRating * curReviews + Number(rating)) / (curReviews + 1)).toFixed(1));
        const newReviews = curReviews + 1;
        const newJobs = (provider.jobsCompleted || 0) + 1;

        updatedProvider = db.update('users', provider.id, {
          rating: newRating,
          reviews: newReviews,
          jobsCompleted: newJobs,
          reviewImage: imageUrl || provider.reviewImage,
          reviewComment: comment || provider.reviewComment
        });
      }

      // Also update bid records with new rating
      db.update('bids', acceptedBid.id, {
        reviewImage: imageUrl,
        reviewComment: comment,
        rating: updatedProvider ? updatedProvider.rating : acceptedBid.rating,
        reviews: updatedProvider ? updatedProvider.reviews : acceptedBid.reviews + 1
      });

      broadcast('TASK_COMPLETED', { taskId, review, provider: updatedProvider });
      return sendJson(res, 200, { success: true, task: db.findOne('tasks', t => t.id === taskId), review, provider: updatedProvider });
    }

    // ----------------------------------------------------
    // BIDS
    // ----------------------------------------------------
    const taskBidsMatch = pathname.match(/^\/api\/tasks\/(\d+)\/bids$/);
    if (taskBidsMatch && method === 'GET') {
      const taskId = parseInt(taskBidsMatch[1], 10);
      const bids = db.find('bids', b => b.taskId === taskId);
      return sendJson(res, 200, bids);
    }

    if (taskBidsMatch && method === 'POST') {
      const taskId = parseInt(taskBidsMatch[1], 10);
      const body = await parseBody(req);
      const user = extractUser(req);

      const task = db.findOne('tasks', t => t.id === taskId);
      if (!task) {
        return sendError(res, 404, 'Task not found.');
      }

      const { price, hours } = body;
      const providerId = user ? user.id : 2;
      const provider = db.findOne('users', u => u.id === providerId) || {
        name: "Ravi Kumar",
        initials: "RK",
        tone: "mint",
        rating: 4.8,
        reviews: 91,
        distance: 0.8
      };

      const newBid = db.insert('bids', {
        taskId,
        providerId,
        name: provider.name,
        initials: provider.initials || "RK",
        tone: provider.tone || "mint",
        rating: provider.rating || 4.8,
        reviews: provider.reviews || 91,
        distance: provider.distance || 0.8,
        hours: Number(hours) || 2,
        price: Number(price) || 500,
        status: "pending",
        portfolio: provider.portfolio || [servicePhotos.repair]
      });

      broadcast('NEW_BID', { taskId, bid: newBid });
      return sendJson(res, 201, newBid);
    }

    // Accept bid
    const acceptBidMatch = pathname.match(/^\/api\/bids\/(\d+)\/accept$/);
    if (acceptBidMatch && method === 'POST') {
      const bidId = parseInt(acceptBidMatch[1], 10);
      const targetBid = db.findOne('bids', b => b.id === bidId);
      if (!targetBid) {
        return sendError(res, 404, 'Bid not found.');
      }

      // Update bids for this task: accepted vs not-selected
      const allTaskBids = db.find('bids', b => b.taskId === targetBid.taskId);
      allTaskBids.forEach(b => {
        const newStatus = b.id === bidId ? 'accepted' : 'not-selected';
        db.update('bids', b.id, { status: newStatus });
      });

      // Update task status
      db.update('tasks', targetBid.taskId, {
        status: 'booked',
        acceptedBidId: bidId
      });

      const updatedBid = db.findOne('bids', b => b.id === bidId);
      const updatedTask = db.findOne('tasks', t => t.id === targetBid.taskId);

      broadcast('BID_ACCEPTED', { taskId: targetBid.taskId, bidId, bid: updatedBid });
      return sendJson(res, 200, { success: true, bid: updatedBid, task: updatedTask });
    }

    // Provider's own placed bids
    if (pathname === '/api/provider/bids' && method === 'GET') {
      const user = extractUser(req);
      const providerId = user ? user.id : 2; // Default to Ravi Kumar in demo
      const providerBids = db.find('bids', b => b.providerId === providerId);

      // Enrich with task details
      const enriched = providerBids.map(b => {
        const task = db.findOne('tasks', t => t.id === b.taskId);
        return {
          ...b,
          taskTitle: task ? task.title : 'Task',
          taskLocation: task ? task.location : 'Indiranagar',
          taskBudget: task ? task.budget : '₹500'
        };
      });

      return sendJson(res, 200, enriched);
    }

    // ----------------------------------------------------
    // PROVIDER PROFILE
    // ----------------------------------------------------
    const providerMatch = pathname.match(/^\/api\/providers\/(\d+)$/);
    if (providerMatch && method === 'GET') {
      const providerId = parseInt(providerMatch[1], 10);
      const provider = db.findOne('users', u => u.id === providerId);
      if (!provider) {
        return sendError(res, 404, 'Provider not found.');
      }
      const reviews = db.find('reviews', r => r.providerId === providerId);
      const { passwordHash: _, salt: __, ...safeProvider } = provider;
      return sendJson(res, 200, { ...safeProvider, customerReviews: reviews });
    }

    // ----------------------------------------------------
    // MESSAGING / LIVE CHAT
    // ----------------------------------------------------
    const chatMatch = pathname.match(/^\/api\/tasks\/(\d+)\/messages$/);
    if (chatMatch && method === 'GET') {
      const taskId = parseInt(chatMatch[1], 10);
      const messages = db.find('messages', m => m.taskId === taskId);
      return sendJson(res, 200, messages);
    }

    if (chatMatch && method === 'POST') {
      const taskId = parseInt(chatMatch[1], 10);
      const body = await parseBody(req);
      const user = extractUser(req);
      const { text, recipientId, senderName, senderRole } = body;

      if (!text || !text.trim()) {
        return sendError(res, 400, 'Message text is required.');
      }

      const sId = user ? user.id : (senderRole === 'provider' ? 2 : 1);
      const sName = user ? user.name : (senderName || (senderRole === 'provider' ? 'Ravi Kumar' : 'Ananya Sharma'));
      const sRole = user ? user.role : (senderRole || 'requester');

      const newMessage = db.insert('messages', {
        taskId,
        senderId: sId,
        senderName: sName,
        senderRole: sRole,
        recipientId: recipientId || null,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      broadcast('NEW_MESSAGE', { taskId, message: newMessage });
      return sendJson(res, 201, newMessage);
    }

    // ----------------------------------------------------
    // HELPLINE
    // ----------------------------------------------------
    if (pathname === '/api/helpline' && method === 'POST') {
      const body = await parseBody(req);
      const user = extractUser(req);
      const ticket = db.insert('helplineTickets', {
        userId: user ? user.id : null,
        name: body.name || (user ? user.name : 'Anonymous User'),
        phone: body.phone || '1800 000 3636',
        topic: body.topic || 'General Support Inquiry',
        status: 'pending'
      });
      return sendJson(res, 201, {
        success: true,
        message: 'Support request recorded. Our Bengaluru helpline team will reach out shortly.',
        ticket
      });
    }

    // Route not found
    return sendError(res, 404, `Not found: ${method} ${pathname}`);
  } catch (err) {
    console.error('Server error:', err);
    return sendError(res, 500, err.message || 'Internal server error');
  }
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`🚀 NeedNow Backend running at http://localhost:${PORT}`);
    console.log(`📡 Real-time SSE stream at http://localhost:${PORT}/api/events`);
    console.log(`💾 Local Database: zero-cost, persistent, zero-install`);
    console.log(`=================================================`);
  });
}

module.exports = { server, handleRequest, broadcast, parseBody };
