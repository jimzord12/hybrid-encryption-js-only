import express, { NextFunction, Request, Response } from 'express';
import { AddressInfo } from 'node:net';
import { decryptionRouter, decryptMiddleware } from '../../src';
import { DecryptionError } from '../../src/server';

export interface APIError {
  success: boolean;
  error: string;
  message: string;
  name: string;
}

// Initialize Express app with v5 features
export const app = express();

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount the server routes FIRST
app.use('/api', decryptionRouter);

// Custom route that uses decryption middleware
app.post('/api/secure-data', decryptMiddleware, (req, res) => {
  console.log('📥 Received decrypted data:', req.body.data);

  // Verify the data was decrypted properly
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({
      success: false,
      error: 'No decrypted data received',
    });
  }

  return res.json({
    success: true,
    message: 'Data processed successfully',
    dataReceived: true,
    dataType: typeof data,
    hasUserInfo: Object.getOwnPropertyNames(data).includes('user'),
    timestamp: new Date().toISOString(),
  });
});

// Another custom route for testing complex objects
app.post('/api/process-transaction', decryptMiddleware, (req, res) => {
  const { data: aaa } = req.body;

  const data = aaa as any;

  // Validate transaction data structure
  if (!data.transaction || !data.user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid transaction data structure',
    });
  }

  // Process the transaction (simulation)
  const processedTransaction = {
    ...data.transaction,
    processedAt: new Date().toISOString(),
    status: 'processed',
    confirmationId: `conf_${Math.random().toString(36).substring(2, 9)}`,
  };

  return res.json({
    success: true,
    message: 'Transaction processed successfully',
    transaction: processedTransaction,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response<APIError>, _next: NextFunction) => {
  console.log('🚨 Server error:', err);

  if (err instanceof DecryptionError) {
    return res.status(400).json({
      success: false,
      error: 'Decryption failed',
      message: err.message,
      name: err.name,
    } as APIError);
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    name: err.name,
  } as APIError);
});

// Start the server
export const server = app.listen(0); // Use 0 for random available port
const address = server.address() as AddressInfo;
export const baseUrl = `http://localhost:${address.port}`;

console.log(`🚀 Test server started on ${baseUrl}`);

export type ExpressTestServerModule = {
  app: typeof app;
  server: typeof server;
  baseUrl: typeof baseUrl;
};
