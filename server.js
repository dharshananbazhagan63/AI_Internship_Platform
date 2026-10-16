const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const initializeDatabase = require('./database/initDb');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'AI Internship Aggregator and Recommendation Platform',
    timestamp: new Date().toISOString()
  });
});

// Friendly 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Fallback to index.html for root or unknown pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[-] Handled server error:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// Process safety crash guards to prevent accidental downtime
process.on('uncaughtException', (err) => {
  console.error('[!] Uncaught Exception captured safely (server kept running):', err.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[!] Unhandled Promise Rejection captured safely (server kept running):', reason);
});

// Initialize database and start HTTP server
async function startServer() {
  try {
    console.log('[*] Initializing SQLite database...');
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log('================================================================');
      console.log('  AI Internship Aggregator and Recommendation Platform');
      console.log('  Running WITHOUT XAMPP, Apache, MySQL, or PHP!');
      console.log(`  Local URL: http://localhost:${PORT}`);
      console.log('================================================================');
    });
  } catch (error) {
    console.error('[-] Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();
