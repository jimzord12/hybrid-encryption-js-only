// Generate keys const keyPair = generateRSAKeyPair(2048);

// Encrypt any data const encrypted = encrypt({ user: 'john', balance: 1000 },
keyPair.publicKey);

// Decrypt back to original const decrypted = decrypt(encrypted,
keyPair.privateKey);

// Validate keys work const isValid = validateKeyPair(keyPair);
