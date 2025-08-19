#!/usr/bin/env node

/**
 * Real Express.js v5 Server Demo
 *
 * This script demonstrates how to set up a production-ready Express.js server
 * using the hybrid encryption library with automatic decryption middleware.
 *
 * To run this demo:
 * 1. npm install
 * 2. npm run build
 * 3. node examples/express-server-demo.js
 */

import express from 'express';
import {
  DecryptionError,
  ServerDecryption,
  decryptMiddleware,
  decryptionRouter,
} from '../src/server/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS for client applications
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Mount the built-in encryption routes
// These provide: /public-key, /rotate-keys, /round-trip
app.use('/api/crypto', decryptionRouter);

// Demo: User Registration (with encrypted personal data)
app.post('/api/users/register', decryptMiddleware, async (req, res) => {
  try {
    console.log('🔐 Processing encrypted user registration...');

    const userData = req.body.data; // Automatically decrypted by middleware

    // Validate required fields
    if (!userData.email || !userData.personalInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required user data',
      });
    }

    console.log(`✅ User registration for: ${userData.email}`);

    // In a real app, save to database here
    // const user = await User.create(userData);

    res.json({
      success: true,
      message: 'User registered successfully',
      userId: `user_${Date.now()}`,
      email: userData.email,
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

// Demo: Payment Processing (with encrypted financial data)
app.post('/api/payments/process', decryptMiddleware, async (req, res) => {
  try {
    console.log('💳 Processing encrypted payment...');

    const paymentData = req.body.data; // Automatically decrypted

    // Validate payment data
    if (!paymentData.amount || !paymentData.creditCard) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment data',
      });
    }

    console.log(`💰 Processing payment: $${paymentData.amount}`);

    // Simulate payment processing
    const transactionId = `txn_${Math.random().toString(36).substr(2, 9)}`;

    // In a real app, integrate with payment processor here
    // const result = await PaymentProcessor.charge(paymentData);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      transactionId,
      amount: paymentData.amount,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
    });
  }
});

// Demo: Secure Document Upload (with encrypted metadata)
app.post('/api/documents/upload', decryptMiddleware, async (req, res) => {
  try {
    console.log('📄 Processing encrypted document metadata...');

    const docData = req.body.data;

    if (!docData.filename || !docData.metadata) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document data',
      });
    }

    console.log(`📁 Document upload: ${docData.filename}`);

    // In a real app, handle file upload and save metadata
    const documentId = `doc_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      documentId,
      filename: docData.filename,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Document upload failed',
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const serverDecryption = ServerDecryption.getInstance();
    const health = await serverDecryption.healthCheck();

    res.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      encryption: {
        available: health.healthy,
        issues: health.issues,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Health check failed',
    });
  }
});

// Status endpoint for monitoring
app.get('/api/status', async (req, res) => {
  try {
    const serverDecryption = ServerDecryption.getInstance();
    const status = await serverDecryption.getStatus();

    res.json({
      server: 'running',
      timestamp: new Date().toISOString(),
      encryption: status,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Status check failed',
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err.message);

  if (err instanceof DecryptionError) {
    return res.status(400).json({
      success: false,
      error: 'Decryption failed',
      message: 'Unable to decrypt the provided data',
    });
  }

  // Log the full error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Start the server
async function startServer() {
  try {
    console.log('🚀 Starting Express.js v5 Hybrid Encryption Server...');

    // Initialize the server decryption system
    const serverDecryption = ServerDecryption.getInstance();
    await serverDecryption.getStatus(); // This triggers initialization

    console.log('🔐 Encryption system initialized successfully');

    app.listen(PORT, () => {
      console.log('🌐 Server running on:', `http://localhost:${PORT}`);
      console.log('📋 Available endpoints:');
      console.log('   GET  /api/health              - Health check');
      console.log('   GET  /api/status              - Server status');
      console.log('   GET  /api/crypto/public-key   - Get public key');
      console.log('   POST /api/crypto/rotate-keys  - Rotate encryption keys');
      console.log('   POST /api/crypto/round-trip   - Test encryption');
      console.log('   POST /api/users/register      - User registration (encrypted)');
      console.log('   POST /api/payments/process    - Payment processing (encrypted)');
      console.log('   POST /api/documents/upload    - Document upload (encrypted)');
      console.log('');
      console.log('🔒 All POST endpoints automatically decrypt incoming data');
      console.log('📖 See README.md for client integration examples');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down server gracefully...');

  // Clean up resources
  ServerDecryption.resetInstance();

  console.log('✅ Server shutdown complete');
  process.exit(0);
});

// Start the server
startServer().catch(console.error);

export default app;
