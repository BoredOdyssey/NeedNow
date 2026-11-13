// server/db.js - Zero-Dependency Persistent Database for NeedNow Marketplace
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const servicePhotos = {
  repair: "https://images.unsplash.com/photo-1597497522150-2f50bffea452?auto=format&fit=crop&w=900&q=82",
  tutor: "https://images.unsplash.com/photo-1566827886072-417be1953f36?auto=format&fit=crop&w=900&q=82",
  photography: "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=900&q=82",
  moving: "https://images.unsplash.com/photo-1596199736721-16d3677365a4?auto=format&fit=crop&w=900&q=82",
  cleaning: "https://images.unsplash.com/photo-1793016049699-2c071f7867db?auto=format&fit=crop&w=900&q=82",
  provider: "https://images.unsplash.com/photo-1682662046457-74fd5b199b92?auto=format&fit=crop&w=1200&q=85",
  delivery: "https://images.unsplash.com/photo-1614018453562-77f6180ce036?auto=format&fit=crop&w=900&q=82",
  authRepair: "https://images.unsplash.com/photo-1713192704825-74a0017f585d?auto=format&fit=crop&w=900&q=85",
  authMoving: "https://images.unsplash.com/photo-1672559987333-976876fa8a12?auto=format&fit=crop&w=700&q=85",
  authCamera: "https://images.unsplash.com/photo-1596629917694-39954024f734?auto=format&fit=crop&w=700&q=85",
};

// Seed initial data
function getDefaultData() {
  return {
    users: [
      {
        id: 1,
        email: "ananya@example.com",
        name: "Ananya Sharma",
        phone: "+91 98765 43210",
        role: "requester",
        salt: "seed-salt-1",
        // Password123
        passwordHash: "3bb1dcfbbf00389c7fb1e4f8653293b7c3fce700f8ec1e732c71a7d786533639f28b8a696079beb56c76b7db81f5aaa1107b76a20cba38bd9e48f82662029a2b",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        email: "ravi@example.com",
        name: "Ravi Kumar",
        phone: "+91 98765 11223",
        role: "provider",
        initials: "RK",
        tone: "mint",
        rating: 4.8,
        reviews: 91,
        distance: 0.8,
        hours: 1,
        price: 450,
        jobsCompleted: 38,
        bio: "Local technician with six years of experience in everyday home repairs. Clear about pricing, brings the right tools and confirms timing before each visit.",
        services: ["Home repairs", "Furniture assembly", "Minor electrical work", "Installations"],
        portfolio: [servicePhotos.authRepair, servicePhotos.moving, servicePhotos.provider],
        salt: "seed-salt-2",
        passwordHash: "a8dac80d8b79779752200a0e89d46501755bd3bd4d3164790e8b3f5066456cd1a7c88aa2f980690d1e7996cf3647f9af6e54c98667ddec4dc2c0e76bfe729f04",
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        email: "meera@example.com",
        name: "Meera Plumbing Works",
        phone: "+91 98765 44556",
        role: "provider",
        initials: "MP",
        tone: "yellow",
        rating: 4.9,
        reviews: 128,
        distance: 1.2,
        hours: 2,
        price: 380,
        jobsCompleted: 52,
        bio: "Master plumbing and water system repairs with full warranty on leak fixes and fittings.",
        services: ["Home repairs", "Plumbing", "Sanitary fittings", "Drainage"],
        portfolio: [servicePhotos.repair, servicePhotos.authRepair, servicePhotos.cleaning],
        salt: "seed-salt-3",
        passwordHash: "9b4224b55f6029955c6fa0317f8ffae0d9888c1be58f4ef89cc502783076397915c59bb08a6ae79932179b029aa0ecc47568a33c75ece549ae54628c153f1ebd",
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        email: "sanjay@example.com",
        name: "Sanjay Verma",
        phone: "+91 98765 77889",
        role: "provider",
        initials: "SV",
        tone: "blue",
        rating: 4.7,
        reviews: 63,
        distance: 2.1,
        hours: 3,
        price: 500,
        jobsCompleted: 29,
        bio: "Experienced handyman specializing in electrical, camera mounting, and carpentry.",
        services: ["Home repairs", "Electrical", "Carpentry", "Appliance setup"],
        portfolio: [servicePhotos.repair, servicePhotos.authMoving, servicePhotos.authCamera],
        salt: "seed-salt-4",
        passwordHash: "c06636ed209afb5ebcc48e2e77eb8dfafe3b6f0ae25a51ecbc11a7ba05bc714063787b6f47a86f92ca5635de17a762d8fdbd1a5b8121874fda721f66f055cdf2",
        createdAt: new Date().toISOString()
      }
    ],
    tasks: [
      {
        id: 1,
        title: "Fix a leaking kitchen tap",
        category: "Home repairs",
        customCategory: "",
        location: "Indiranagar",
        budget: "₹ 500",
        neededBy: "Tomorrow, 6 pm",
        details: "Single lever sink faucet has a steady drip under the cabinet.",
        imageUrl: servicePhotos.repair,
        requesterId: 1,
        requesterName: "Ananya Sharma",
        status: "open",
        acceptedBidId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Mount a 43-inch TV",
        category: "Home repairs",
        customCategory: "",
        location: "Domlur",
        distance: "0.8 km",
        budget: "₹ 700",
        neededBy: "Today, 7 pm",
        details: "Bracket is already purchased, need drilling on solid brick wall.",
        imageUrl: servicePhotos.repair,
        requesterId: 99,
        requesterName: "Priya S.",
        status: "open",
        acceptedBidId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: "Deliver flowers across town",
        category: "Deliveries",
        customCategory: "",
        location: "Ulsoor",
        distance: "1.4 km",
        budget: "₹ 350",
        neededBy: "Tomorrow, 11 am",
        details: "Fragile flower basket delivery to an anniversary party.",
        imageUrl: servicePhotos.delivery,
        requesterId: 98,
        requesterName: "Arjun M.",
        status: "open",
        acceptedBidId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        title: "Move a study table upstairs",
        category: "Moving",
        customCategory: "",
        location: "Indiranagar",
        distance: "2.2 km",
        budget: "₹ 600",
        neededBy: "Sat, 10 am",
        details: "Solid teak study desk needs moving up two flights of stairs.",
        imageUrl: servicePhotos.moving,
        requesterId: 97,
        requesterName: "Neha R.",
        status: "open",
        acceptedBidId: null,
        createdAt: new Date().toISOString()
      }
    ],
    bids: [
      {
        id: 1,
        taskId: 1,
        providerId: 3,
        name: "Meera Plumbing Works",
        initials: "MP",
        tone: "yellow",
        rating: 4.9,
        reviews: 128,
        distance: 1.2,
        hours: 2,
        price: 380,
        status: "pending",
        portfolio: [servicePhotos.repair, servicePhotos.authRepair, servicePhotos.cleaning],
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        taskId: 1,
        providerId: 2,
        name: "Ravi Kumar",
        initials: "RK",
        tone: "mint",
        rating: 4.8,
        reviews: 91,
        distance: 0.8,
        hours: 1,
        price: 450,
        status: "pending",
        portfolio: [servicePhotos.authRepair, servicePhotos.moving, servicePhotos.provider],
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        taskId: 1,
        providerId: 4,
        name: "Sanjay Verma",
        initials: "SV",
        tone: "blue",
        rating: 4.7,
        reviews: 63,
        distance: 2.1,
        hours: 3,
        price: 500,
        status: "pending",
        portfolio: [servicePhotos.repair, servicePhotos.authMoving, servicePhotos.authCamera],
        createdAt: new Date().toISOString()
      }
    ],
    messages: [
      {
        id: 1,
        taskId: 1,
        senderId: 2,
        senderName: "Ravi Kumar",
        senderRole: "provider",
        recipientId: 1,
        text: "Hi! I can come by tomorrow afternoon. I’ve handled this repair many times.",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        taskId: 1,
        senderId: 1,
        senderName: "Ananya Sharma",
        senderRole: "requester",
        recipientId: 2,
        text: "Great. Does your bid include any replacement parts?",
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ],
    reviews: [],
    helplineTickets: []
  };
}

class Database {
  constructor() {
    this.ensureDir();
    this.load();
  }

  ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  load() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = getDefaultData();
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed reading database file, initializing default:', err);
        this.data = getDefaultData();
        this.save();
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed writing database file:', err);
    }
  }

  // Generic helpers
  find(collection, predicate) {
    return (this.data[collection] || []).filter(predicate);
  }

  findOne(collection, predicate) {
    return (this.data[collection] || []).find(predicate);
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const maxId = this.data[collection].reduce((max, obj) => Math.max(max, obj.id || 0), 0);
    const newItem = { id: maxId + 1, createdAt: new Date().toISOString(), ...item };
    this.data[collection].push(newItem);
    this.save();
    return newItem;
  }

  update(collection, id, updates) {
    const list = this.data[collection] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    this.save();
    return list[index];
  }

  remove(collection, id) {
    const list = this.data[collection] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.save();
    return true;
  }
}

const db = new Database();
// Ensure each user has a 'roles' array for multi‑role support
if (Array.isArray(db.data?.users)) {
  db.data.users.forEach(user => {
    if (!Array.isArray(user.roles)) {
      user.roles = [user.role];
    }
  });
}

module.exports = { db, servicePhotos };
