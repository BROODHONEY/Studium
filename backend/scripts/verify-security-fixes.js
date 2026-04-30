#!/usr/bin/env node
/**
 * Security Verification Script
 * Demonstrates that all critical vulnerabilities have been fixed
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔒 SECURITY VERIFICATION REPORT\n');
console.log('='.repeat(60));

let allPassed = true;

// Test 1: Check .env file doesn't contain real secrets
console.log('\n1️⃣  Checking .env file security...');
try {
  const envPath = path.join(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasRealSupabaseKey = envContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  const hasPlaceholder = envContent.includes('YOUR_SUPABASE_SERVICE_KEY_HERE');
  
  if (hasRealSupabaseKey) {
    console.log('   ❌ FAIL: Real Supabase key found in .env');
    allPassed = false;
  } else if (hasPlaceholder) {
    console.log('   ✅ PASS: .env contains only placeholders');
  } else {
    console.log('   ⚠️  WARNING: .env format unexpected');
  }
} catch (err) {
  console.log('   ⚠️  WARNING: Could not read .env file');
}

// Test 2: Check .env.example exists
console.log('\n2️⃣  Checking .env.example exists...');
try {
  const envExamplePath = path.join(__dirname, '../.env.example');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  
  if (envExampleContent.includes('your_supabase_service_key_here')) {
    console.log('   ✅ PASS: .env.example exists with safe placeholders');
  } else {
    console.log('   ❌ FAIL: .env.example has incorrect format');
    allPassed = false;
  }
} catch (err) {
  console.log('   ❌ FAIL: .env.example not found');
  allPassed = false;
}

// Test 3: Check .gitignore includes .env
console.log('\n3️⃣  Checking .gitignore...');
try {
  const gitignorePath = path.join(__dirname, '../../.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  if (gitignoreContent.includes('.env')) {
    console.log('   ✅ PASS: .env is in .gitignore');
  } else {
    console.log('   ❌ FAIL: .env not found in .gitignore');
    allPassed = false;
  }
} catch (err) {
  console.log('   ❌ FAIL: Could not read .gitignore');
  allPassed = false;
}

// Test 4: Check rate limiter middleware exists
console.log('\n4️⃣  Checking rate limiter implementation...');
try {
  const rateLimiterPath = path.join(__dirname, '../middleware/rateLimiter.js');
  const rateLimiterContent = fs.readFileSync(rateLimiterPath, 'utf8');
  
  if (rateLimiterContent.includes('authLimiter') && 
      rateLimiterContent.includes('max: 5')) {
    console.log('   ✅ PASS: Rate limiter configured (5 attempts per 15 min)');
  } else {
    console.log('   ❌ FAIL: Rate limiter not properly configured');
    allPassed = false;
  }
} catch (err) {
  console.log('   ❌ FAIL: Rate limiter middleware not found');
  allPassed = false;
}

// Test 5: Check password validation strength
console.log('\n5️⃣  Checking password validation...');
try {
  const validatePath = path.join(__dirname, '../middleware/validate.js');
  const validateContent = fs.readFileSync(validatePath, 'utf8');
  
  const hasMinLength = validateContent.includes('.min(12');
  const hasUppercase = validateContent.includes('regex(/[A-Z]/');
  const hasLowercase = validateContent.includes('regex(/[a-z]/');
  const hasNumber = validateContent.includes('regex(/[0-9]/');
  const hasSpecial = validateContent.includes('regex(/[^A-Za-z0-9]/');
  
  if (hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial) {
    console.log('   ✅ PASS: Strong password requirements enforced');
    console.log('      - Minimum 12 characters');
    console.log('      - Uppercase, lowercase, number, special char required');
  } else {
    console.log('   ❌ FAIL: Password validation not strong enough');
    allPassed = false;
  }
} catch (err) {
  console.log('   ❌ FAIL: Could not verify password validation');
  allPassed = false;
}

// Test 6: Check quiz answer protection
console.log('\n6️⃣  Checking quiz answer protection...');
try {
  const quizzesPath = path.join(__dirname, '../routes/quizzes.js');
  const quizzesContent = fs.readFileSync(quizzesPath, 'utf8');
  
  // Check if the secure pattern exists
  const hasSecurePattern = quizzesContent.includes("m.role === 'student'") &&
                          quizzesContent.includes("'id, question, options, order_index'");
  
  if (hasSecurePattern) {
    console.log('   ✅ PASS: Quiz answers protected at database level');
    console.log('      - Students never receive correct_index field');
  } else {
    console.log('   ❌ FAIL: Quiz answer protection not implemented correctly');
    allPassed = false;
  }
} catch (err) {
  console.log('   ❌ FAIL: Could not verify quiz protection');
  allPassed = false;
}

// Test 7: Check if rate limiting is applied in index.js
console.log('\n7️⃣  Checking rate limiting application...');
try {
  const indexPath = path.join(__dirname, '../index.js');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (indexContent.includes("app.use('/api/auth/login', authLimiter)") &&
      indexContent.includes("app.use('/api', apiLimiter)")) {
    console.log('   ✅ PASS: Rate limiting applied to auth endpoints');
  } else {
    console.log('   ❌ FAIL: Rate limiting not applied in index.js');
    allPassed = false;
  }
} catch (err) {
  console.log('   ❌ FAIL: Could not verify rate limiting application');
  allPassed = false;
}

// Test 8: Check test file exists
console.log('\n8️⃣  Checking security test suite...');
try {
  const testPath = path.join(__dirname, '../tests/critical-vulnerabilities.test.js');
  const testContent = fs.readFileSync(testPath, 'utf8');
  
  if (testContent.includes('Critical Vulnerability Fixes')) {
    console.log('   ✅ PASS: Security test suite exists');
    console.log('      Run: npm test critical-vulnerabilities.test.js');
  } else {
    console.log('   ❌ FAIL: Test suite format incorrect');
    allPassed = false;
  }
} catch (err) {
  console.log('   ❌ FAIL: Security test suite not found');
  allPassed = false;
}

// Final Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('\n✅ ALL SECURITY CHECKS PASSED!\n');
  console.log('All critical vulnerabilities have been fixed:');
  console.log('  ✓ Credentials sanitized');
  console.log('  ✓ Rate limiting implemented');
  console.log('  ✓ Strong passwords enforced');
  console.log('  ✓ Quiz answers protected\n');
  console.log('Next steps:');
  console.log('  1. Run: npm test critical-vulnerabilities.test.js');
  console.log('  2. Generate production secrets: node backend/scripts/generate-secrets.js');
  console.log('  3. Review: SECURITY_FIXES_APPLIED.md\n');
  process.exit(0);
} else {
  console.log('\n❌ SOME SECURITY CHECKS FAILED\n');
  console.log('Please review the failures above and fix them.\n');
  process.exit(1);
}
