#!/bin/bash

# Build script for creating distributable npm packages with version bumping
set -e

# Function to display usage
show_usage() {
    echo "Usage: $0 [patch|minor|major]"
    echo ""
    echo "Arguments:"
    echo "  patch  - Bump patch version (0.0.1 -> 0.0.2)"
    echo "  minor  - Bump minor version (0.0.1 -> 0.1.0)"
    echo "  major  - Bump major version (0.0.1 -> 1.0.0)"
    echo ""
    echo "Note: Pre-release suffixes (-beta, -alpha) are preserved"
    echo "Example: 0.0.2-beta -> 0.0.3-beta (patch)"
    exit 1
}

# Function to bump version
bump_version() {
    local version=$1
    local bump_type=$2

    # Extract version parts and pre-release suffix
    if [[ $version =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(-.*)?$ ]]; then
        local major=${BASH_REMATCH[1]}
        local minor=${BASH_REMATCH[2]}
        local patch=${BASH_REMATCH[3]}
        local prerelease=${BASH_REMATCH[4]}

        case $bump_type in
            patch)
                patch=$((patch + 1))
                ;;
            minor)
                minor=$((minor + 1))
                patch=0
                ;;
            major)
                major=$((major + 1))
                minor=0
                patch=0
                ;;
            *)
                echo "❌ Invalid bump type: $bump_type"
                show_usage
                ;;
        esac

        echo "${major}.${minor}.${patch}${prerelease}"
    else
        echo "❌ Invalid version format: $version"
        exit 1
    fi
}

# Function to update package.json version
update_root_version() {
    local new_version=$1

    # Create a backup
    cp package.json package.json.backup

    # Update version using node
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = '$new_version';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "

    echo "📝 Updated root package.json version to: $new_version"
}

echo "🏗️  Building hybrid encryption packages..."

# Check if version bump argument is provided
if [ $# -eq 1 ]; then
    BUMP_TYPE=$1

    # Validate bump type
    if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
        echo "❌ Invalid argument: $BUMP_TYPE"
        show_usage
    fi

    # Get current version
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    echo "📋 Current version: $CURRENT_VERSION"

    # Calculate new version
    NEW_VERSION=$(bump_version "$CURRENT_VERSION" "$BUMP_TYPE")
    echo "🔄 Bumping $BUMP_TYPE version: $CURRENT_VERSION -> $NEW_VERSION"

    # Update root package.json
    update_root_version "$NEW_VERSION"

    ROOT_VERSION=$NEW_VERSION
elif [ $# -eq 0 ]; then
    # No arguments - use existing version
    ROOT_VERSION=$(node -p "require('./package.json').version")
    echo "📋 Using existing version: $ROOT_VERSION"
else
    echo "❌ Too many arguments provided"
    show_usage
fi

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

# Clean up backup if everything succeeded
if [ -f "package.json.backup" ]; then
    rm package.json.backup
    echo "🧹 Cleaned up backup file"
fi

echo ""
echo "🎉 Build completed successfully with version: $ROOT_VERSION"
