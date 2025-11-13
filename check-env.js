#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * 
 * This script checks if your OpenAI API key is properly configured
 * as an environment variable for Next.js.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking OpenAI API Key Configuration...\n');

// Check .env file
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

let foundInEnv = false;
let foundInEnvLocal = false;
let keyValue = null;

// Check .env file
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^OPENAI_API_KEY=(.+)$/m);
  if (match) {
    foundInEnv = true;
    keyValue = match[1].trim();
    const preview = keyValue.substring(0, 20) + '...';
    console.log('✅ Found OPENAI_API_KEY in .env file');
    console.log(`   Preview: ${preview}`);
    console.log(`   Length: ${keyValue.length} characters\n`);
  }
}

// Check .env.local file (takes precedence over .env)
if (fs.existsSync(envLocalPath)) {
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  const match = envLocalContent.match(/^OPENAI_API_KEY=(.+)$/m);
  if (match) {
    foundInEnvLocal = true;
    keyValue = match[1].trim();
    const preview = keyValue.substring(0, 20) + '...';
    console.log('✅ Found OPENAI_API_KEY in .env.local file');
    console.log(`   Preview: ${preview}`);
    console.log(`   Length: ${keyValue.length} characters\n`);
    console.log('   ⚠️  Note: .env.local takes precedence over .env\n');
  }
}

// Summary
if (foundInEnvLocal) {
  console.log('✅ Status: OPENAI_API_KEY is configured in .env.local (will be used by Next.js)');
} else if (foundInEnv) {
  console.log('✅ Status: OPENAI_API_KEY is configured in .env (will be used by Next.js)');
} else {
  console.log('❌ Status: OPENAI_API_KEY NOT FOUND in any .env file');
  console.log('\n💡 To fix this:');
  console.log('   1. Create a .env.local file in the project root');
  console.log('   2. Add: OPENAI_API_KEY=sk-proj-your-key-here');
  console.log('   3. Restart your dev server\n');
  process.exit(1);
}

// Validate key format
if (keyValue) {
  if (keyValue.startsWith('sk-')) {
    console.log('✅ Key format looks correct (starts with sk-)');
  } else {
    console.log('⚠️  Warning: Key doesn\'t start with "sk-" - may be invalid');
  }
  
  if (keyValue.length < 20) {
    console.log('⚠️  Warning: Key seems too short - may be invalid');
  } else {
    console.log('✅ Key length looks reasonable');
  }
}

console.log('\n📝 Next Steps:');
console.log('   • Restart your dev server if you just added the key');
console.log('   • Next.js automatically loads .env.local in development');
console.log('   • For production, set the key in your hosting platform (Vercel, etc.)\n');

