#!/usr/bin/env node
/**
 * Generate cryptographically secure secrets for the application
 * Run: node backend/scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n=== Generated Secure Secrets ===\n');

// Generate strong JWT secret (512 bits)
const jwtSecret = crypto.randomBytes(64).toString('base64');
console.log('JWT_SECRET (copy to .env):');
console.log(jwtSecret);
console.log('\n');

// Generate refresh token secret
const refreshSecret = crypto.randomBytes(64).toString('base64');
console.log('JWT_REFRESH_SECRET (copy to .env):');
console.log(refreshSecret);
console.log('\n');

console.log('⚠️  IMPORTANT: Keep these secrets secure!');
console.log('   - Never commit them to version control');
console.log('   - Rotate them regularly');
console.log('   - Use different secrets for dev/staging/production\n');
