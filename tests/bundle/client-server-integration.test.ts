import fs from 'node:fs/promises';
import { AddressInfo } from 'node:net';
import path from 'node:path';
import { ExpressTestServerModule } from '../setup/setup-express.js';

describe('Client-Server Integration Tests using Bundled Code', () => {
  let expressServer: ExpressTestServerModule;
  let clientPkg: typeof import('../../dist/client/client.js');
  let serverPkg: typeof import('../../dist/server/server.js');
  // Integration tests go here
  beforeAll(async () => {
    // Setup code for the tests
    expressServer = await import('../setup/setup-express.js');

    const clientPath = path.resolve('./dist/client/client.js');
    const serverPath = path.resolve('./dist/server/server.js');

    console.log('Client path: ', clientPath);
    console.log('Server path: ', serverPath);

    try {
      await fs.access(clientPath);
      console.log(`✅ Client path exists: ${clientPath}`);
    } catch (error) {
      console.log(`❌ Client path does not exist: ${clientPath}`);
      throw error;
    }

    try {
      await fs.access(serverPath);
      console.log(`✅ Server path exists: ${serverPath}`);
    } catch (error) {
      console.log(`❌ Server path does not exist: ${serverPath}`);
      throw error;
    }

    clientPkg = await import(clientPath);
    serverPkg = await import(serverPath);
  });

  afterAll(async () => {
    const { server } = expressServer;
    server.close();
  });

  it('should start the Express server', async () => {
    const { app, baseUrl, server } = expressServer;
    expect(expressServer).toBeDefined();
    expect(app).toBeDefined();
    expect(baseUrl).toBeDefined();
    expect(server).toBeDefined();

    // Optionally, you can also test if the server is listening on a port
    const address = server.address() as AddressInfo;
    expect(address).toBeDefined();
    expect(address.port).toBeGreaterThan(0);
  });

  it('should perform a correct roundtrip', async () => {
    const testData = { user: 'john', balance: 1000 };

    // Get the public key from server first
    const serverInstance = serverPkg.ServerDecryption.getInstance();
    const publicKeyBase64 = await serverInstance.getPublicKeyBase64();

    const clientInstance = clientPkg.ClientEncryption.getInstance();
    const encrypted = clientInstance.encryptData(testData, publicKeyBase64 as any);
    const encryptedWithRemoteKey = await clientInstance.encryptDataWithRemoteKey(
      testData,
      expressServer.baseUrl + '/api',
    );

    expect(encrypted).toBeDefined();
    expect(encrypted.encryptedContent).toBeDefined();
    expect(encrypted.cipherText).toBeDefined();
    expect(encrypted.nonce).toBeDefined();
    expect(encrypted.preset).toBeDefined();

    // Example: Use server decryption with proper types
    const decrypted = await serverInstance.decryptData(encrypted);
    const decryptedWithRemoteKey = await serverInstance.decryptData(encryptedWithRemoteKey);
    expect(decrypted).toStrictEqual(testData);
    expect(decryptedWithRemoteKey).toStrictEqual(testData);
    expect(decrypted).toStrictEqual(decryptedWithRemoteKey);

    console.log('✅ Roundtrip test completed successfully');
  });
});
