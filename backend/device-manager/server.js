const express = require('express');
const dotenv = require('dotenv');
const deviceRoutes = require('./api/apis');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(express.json());

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',  // Vite dev server
        'http://127.0.0.1:5173',  // Alternative localhost
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'https://mono-repo-fawn.vercel.app',
        'https://server-uteq.nrsoftware.online'
      ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// ===== ADDITIONAL CORS DEBUG MIDDLEWARE =====
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 Device-Manager - Request from origin: ${req.headers.origin || 'No origin'}`);
    console.log(`🔄 Method: ${req.method}`);
    console.log(`📍 Path: ${req.path}`);
  }
  next();
});

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'https://mono-repo-fawn.vercel.app',
        'https://server-uteq.nrsoftware.online'
      ];
  
  console.log(`🔍 Device-Manager OPTIONS request from origin: ${origin}`);
  
  // Allow origin if it's in the allowed list or matches wildcards
  if (allowedOrigins.includes(origin) || 
      (origin && (origin.includes('.vercel.app') || origin.includes('.nrsoftware.online')))) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log(`✅ Origin allowed: ${origin}`);
  } else {
    console.log(`❌ Origin rejected: ${origin}`);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).send();
});

app.use('/api', deviceRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
