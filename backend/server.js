const express = require('express');
const path = require('path');
const compression = require('compression');

const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allowed origins for development and production
    const allowedOrigins = [
      'https://admin.smartplazabd.com',
      'https://smartplazabd.com',
      'https://www.smartplazabd.com',
      'https://www.admin.smartplazabd.com',
      'http://smartplazabd.com',
      'http://www.smartplazabd.com',
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:8080',
      'http://localhost:5001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5001'
    ];
    
    // Check if origin is allowed (including any localhost ports and vercel deployments)
    if (
      allowedOrigins.indexOf(origin) !== -1 || 
      origin.match(/^http:\/\/localhost:\d+$/) || 
      origin.match(/^http:\/\/127\.0\.0\.1:\d+$/) ||
      origin.endsWith('.vercel.app') ||
      origin.match(/^https:\/\/.*\.vercel\.app$/)
    ) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Access-Control-Request-Method', 'Access-Control-Request-Headers', 'x-shop-id']
};

app.use(cors(corsOptions));

// Enhanced CORS logging for debugging
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Access-Control-Request-Method, Access-Control-Request-Headers, x-shop-id');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


// Serve static files from frontend dist folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests with response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    let category = 'LOW';
    let color = '\x1b[32m'; // Green
    
    if (duration > 1000) {
      category = 'HIGH';
      color = '\x1b[31m'; // Red
    } else if (duration > 300) {
      category = 'MEDIUM';
      color = '\x1b[33m'; // Yellow
    }
    
    const reset = '\x1b[0m';
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${color}[${category}] ${duration}ms${reset}`);
  });
  next();
});

// Database connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ecommerce/auth', require('./routes/ecommerceAuthRoutes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/units', require('./routes/units'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/transfers', require('./routes/transfers'));


app.use('/api/sales-orders', require('./routes/saleOrders'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/orders', require('./routes/orders')); // E-commerce orders
app.use('/api/payments', require('./routes/payments')); // Payment processing
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/income', require('./routes/income'));
app.use('/api/expense', require('./routes/expense'));
app.use('/api/incomeHeads', require('./routes/incomeHead'));
app.use('/api/expenseHeads', require('./routes/expenseHead'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/warranty', require('./routes/warranty'));
app.use('/api/public', require('./routes/public'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/emi', require('./routes/emi'));
app.use('/api/investors', require('./routes/investors'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/stock-in', require('./routes/stockIn'));
app.use('/api/stock-batches', require('./routes/stockBatches'));
app.use('/api/ecommerce-admin', require('./routes/ecommerceAdmin'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/v1/fraud-checker', require('./routes/fraudCheckerRoutes'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/pos-machines', require('./routes/posMachines'));
app.use('/api/mfs-providers', require('./routes/mfsProviders'));

// Serve index.html for any routes that don't match API routes
app.get('/', (req, res) => {
  res.send('backend is running');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Cron Jobs
const startCronJobs = require('./jobs/index');
startCronJobs();

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.clear(); // Clear the terminal logs on restart
    console.log(`\n=======================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
    console.log(`Access server at: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`=======================================\n`);
  });
}

module.exports = app;

