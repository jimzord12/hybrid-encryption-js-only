#!/bin/bash

# Build script for creating distributable npm packages
set -e

echo "🏗️  Building hybrid encryption packages..."

# Read version from root package.json
ROOT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Using version: $ROOT_VERSION from root package.json"

# Clean and build
npm run clean
npm run bundle

# Recreate package.json files after build
echo "📝 Creating package.json files..."

# Client package.json
cat > dist/client/package.json << EOF
{
  "name": "@hybrid-encryption/client",
  "version": "$ROOT_VERSION",
  "description": "Client-side hybrid encryption library using ML-KEM + AES-GCM",
  "type": "module",
  "main": "./client.js",
  "types": "./client.d.ts",
  "exports": {
    ".": {
      "import": "./client.js",
      "types": "./client.d.ts"
    },
    "./package.json": "./package.json"
  },
  "keywords": [
    "encryption",
    "ml-kem",
    "aes-gcm",
    "client",
    "browser",
    "hybrid-encryption"
  ],
  "author": "Your Name",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jimzord12/hybrid-encryption-js-only.git"
  },
  "dependencies": {
    "@noble/ciphers": "^1.3.0",
    "@noble/hashes": "^1.8.0",
    "@noble/post-quantum": "^0.4.1",
    "buffer": "^6.0.3"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "client.js",
    "client.d.ts",
    "client.js.map",
    "client.d.ts.map"
  ]
}
EOF

# Server package.json
cat > dist/server/package.json << EOF
{
  "name": "@hybrid-encryption/server",
  "version": "$ROOT_VERSION",
  "description": "Server-side hybrid decryption library with Express.js integration",
  "type": "module",
  "main": "./server.cjs",
  "module": "./server.js",
  "types": "./server.d.ts",
  "exports": {
    ".": {
      "import": "./server.js",
      "require": "./server.cjs",
      "types": "./server.d.ts"
    },
    "./package.json": "./package.json"
  },
  "keywords": [
    "encryption",
    "decryption",
    "ml-kem",
    "aes-gcm",
    "server",
    "nodejs",
    "express",
    "middleware"
  ],
  "author": "Your Name",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jimzord12/hybrid-encryption-js-only.git"
  },
  "dependencies": {
    "@noble/ciphers": "^1.3.0",
    "@noble/hashes": "^1.8.0",
    "@noble/post-quantum": "^0.4.1",
    "buffer": "^6.0.3",
    "node-cron": "^4.2.1"
  },
  "peerDependencies": {
    "express": "^4.0.0 || ^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "server.js",
    "server.cjs",
    "server.d.ts",
    "server.d.cts",
    "server.js.map",
    "server.cjs.map",
    "server.d.ts.map",
    "server.d.cts.map"
  ]
}
EOF

# Core package.json
cat > dist/core/package.json << EOF
{
  "name": "@hybrid-encryption/core",
  "version": "$ROOT_VERSION",
  "description": "Core hybrid encryption engine with ML-KEM + AES-GCM and key management",
  "type": "module",
  "main": "./core.cjs",
  "module": "./core.js",
  "types": "./core.d.ts",
  "exports": {
    ".": {
      "import": "./core.js",
      "require": "./core.cjs",
      "types": "./core.d.ts"
    },
    "./package.json": "./package.json"
  },
  "keywords": [
    "encryption",
    "ml-kem",
    "aes-gcm",
    "core",
    "key-management",
    "post-quantum",
    "cryptography"
  ],
  "author": "Your Name",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jimzord12/hybrid-encryption-js-only.git"
  },
  "dependencies": {
    "@noble/ciphers": "^1.3.0",
    "@noble/hashes": "^1.8.0",
    "@noble/post-quantum": "^0.4.1",
    "buffer": "^6.0.3",
    "node-cron": "^4.2.1"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "core.js",
    "core.cjs",
    "core.d.ts",
    "core.d.cts",
    "core.js.map",
    "core.cjs.map",
    "core.d.ts.map",
    "core.d.cts.map"
  ]
}
EOF

# Utils package.json
cat > dist/utils/package.json << EOF
{
  "name": "@hybrid-encryption/utils",
  "version": "$ROOT_VERSION",
  "description": "Utility functions for hybrid encryption operations",
  "type": "module",
  "main": "./utils.cjs",
  "module": "./utils.js",
  "types": "./utils.d.ts",
  "exports": {
    ".": {
      "import": "./utils.js",
      "require": "./utils.cjs",
      "types": "./utils.d.ts"
    },
    "./package.json": "./package.json"
  },
  "keywords": [
    "encryption",
    "utilities",
    "helpers",
    "validation",
    "conversion"
  ],
  "author": "Your Name",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jimzord12/hybrid-encryption-js-only.git"
  },
  "dependencies": {
    "@noble/ciphers": "^1.3.0",
    "@noble/hashes": "^1.8.0",
    "@noble/post-quantum": "^0.4.1",
    "buffer": "^6.0.3"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "utils.js",
    "utils.cjs",
    "utils.d.ts",
    "utils.d.cts",
    "utils.js.map",
    "utils.cjs.map",
    "utils.d.ts.map",
    "utils.d.cts.map"
  ]
}
EOF

# Create package directories if they don't exist
PACKAGES_DIR="packages/$ROOT_VERSION"
mkdir -p "$PACKAGES_DIR"

# Package each module
echo "📦 Creating client package..."
cd dist/client
npm pack --pack-destination "../../$PACKAGES_DIR/"
cd ../..

echo "📦 Creating server package..."
cd dist/server
npm pack --pack-destination "../../$PACKAGES_DIR/"
cd ../..

echo "📦 Creating core package..."
cd dist/core
npm pack --pack-destination "../../$PACKAGES_DIR/"
cd ../..

echo "📦 Creating utils package..."
cd dist/utils
npm pack --pack-destination "../../$PACKAGES_DIR/"
cd ../..

echo "✅ All packages created in ./$PACKAGES_DIR/ directory!"
echo ""
echo "📋 Created packages:"
ls -la "$PACKAGES_DIR/"

echo ""
echo "🚀 To install in another project:"
echo "npm install ./path/to/packages/$ROOT_VERSION/hybrid-encryption-client-$ROOT_VERSION.tgz"
echo "npm install ./path/to/packages/$ROOT_VERSION/hybrid-encryption-server-$ROOT_VERSION.tgz"
echo "npm install ./path/to/packages/$ROOT_VERSION/hybrid-encryption-core-$ROOT_VERSION.tgz"
echo "npm install ./path/to/packages/$ROOT_VERSION/hybrid-encryption-utils-$ROOT_VERSION.tgz"
