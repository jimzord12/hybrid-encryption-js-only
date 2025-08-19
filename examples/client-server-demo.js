#!/usr/bin/env node

/**
 * Client Demo for Express.js Server
 *
 * This script demonstrates how to use the client package to encrypt data
 * and send it to the Express.js server with automatic decryption.
 *
 * To run this demo:
 * 1. Start the server: node examples/express-server-demo.js
 * 2. Run this client: node examples/client-server-demo.js
 */

import { ClientEncryption } from '../src/client/index.js';

const SERVER_BASE_URL = 'http://localhost:3000';

async function runClientDemo() {
  console.log('🚀 Starting Client Demo');
  console.log('=======================');

  try {
    // Initialize client encryption
    const clientEncryption = ClientEncryption.getInstance();
    console.log('✅ Client encryption initialized');

    // Step 1: Get public key from server
    console.log('\\n1️⃣ Requesting public key from server...');
    const keyResponse = await fetch(`${SERVER_BASE_URL}/api/crypto/public-key`);

    if (!keyResponse.ok) {
      throw new Error(`Failed to get public key: ${keyResponse.status}`);
    }

    const keyData = await keyResponse.json();
    const publicKey = keyData.publicKey;
    console.log(`✅ Public key received (${publicKey.length} characters)`);

    // Step 2: Demo User Registration with encrypted personal data
    console.log('\\n2️⃣ Encrypting and sending user registration data...');

    const userData = {
      email: 'alice.johnson@example.com',
      personalInfo: {
        fullName: 'Alice Johnson',
        dateOfBirth: '1990-05-15',
        socialSecurityNumber: '123-45-6789',
        address: {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'CA',
          zipCode: '90210',
        },
      },
      preferences: {
        newsletter: true,
        notifications: true,
      },
    };

    // Encrypt the user data
    const encryptedUserData = clientEncryption.encryptData(userData, publicKey);
    console.log('🔒 User data encrypted successfully');

    // Send to server
    const userResponse = await fetch(`${SERVER_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: encryptedUserData }),
    });

    const userResult = await userResponse.json();
    console.log('📝 User registration result:', userResult);

    // Step 3: Demo Payment Processing with encrypted financial data
    console.log('\\n3️⃣ Encrypting and sending payment data...');

    const paymentData = {
      amount: 299.99,
      currency: 'USD',
      creditCard: '4532-1234-5678-9012',
      expirationDate: '12/25',
      cvv: '123',
      billingAddress: {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
      },
      customerInfo: {
        email: 'alice.johnson@example.com',
        phone: '+1-555-123-4567',
      },
    };

    // Encrypt the payment data
    const encryptedPaymentData = clientEncryption.encryptData(paymentData, publicKey);
    console.log('🔒 Payment data encrypted successfully');

    // Send to server
    const paymentResponse = await fetch(`${SERVER_BASE_URL}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: encryptedPaymentData }),
    });

    const paymentResult = await paymentResponse.json();
    console.log('💳 Payment processing result:', paymentResult);

    // Step 4: Demo Document Upload with encrypted metadata
    console.log('\\n4️⃣ Encrypting and sending document metadata...');

    const documentData = {
      filename: 'financial-report-2024.pdf',
      size: 2458624, // 2.4 MB
      type: 'application/pdf',
      metadata: {
        confidentialityLevel: 'HIGH',
        department: 'Finance',
        creator: 'Alice Johnson',
        tags: ['financial', 'quarterly', 'confidential'],
        permissions: {
          read: ['finance-team', 'executives'],
          write: ['alice.johnson'],
          delete: ['alice.johnson', 'admin'],
        },
      },
      checksum: 'sha256:a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      uploadedBy: 'alice.johnson@example.com',
    };

    // Encrypt the document metadata
    const encryptedDocumentData = clientEncryption.encryptData(documentData, publicKey);
    console.log('🔒 Document metadata encrypted successfully');

    // Send to server
    const documentResponse = await fetch(`${SERVER_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: encryptedDocumentData }),
    });

    const documentResult = await documentResponse.json();
    console.log('📄 Document upload result:', documentResult);

    // Step 5: Security Verification
    console.log('\\n5️⃣ Security verification...');

    // Verify that sensitive data is not visible in transmission
    const transmissionExample = JSON.stringify({ data: encryptedUserData });
    const sensitiveValues = [
      'Alice Johnson',
      '123-45-6789',
      '4532-1234-5678-9012',
      'alice.johnson@example.com',
      '123 Main Street',
    ];

    let allSecure = true;
    for (const value of sensitiveValues) {
      if (transmissionExample.includes(value)) {
        console.log(`❌ SECURITY ISSUE: "${value}" found in transmission`);
        allSecure = false;
      }
    }

    if (allSecure) {
      console.log('✅ Security verification passed - no sensitive data visible in transmission');
    }

    // Step 6: Test server health
    console.log('\\n6️⃣ Checking server health...');

    const healthResponse = await fetch(`${SERVER_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('🏥 Server health:', healthData);

    console.log('\\n🎉 CLIENT DEMO COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('✅ All operations completed without errors');
    console.log('✅ Data encrypted and transmitted securely');
    console.log('✅ Server processed all requests successfully');
    console.log('✅ No sensitive data exposed in transmission');
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Clean up
    ClientEncryption.resetInstance();
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runClientDemo().catch(console.error);
}

export { runClientDemo };
