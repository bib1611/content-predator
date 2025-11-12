#!/usr/bin/env node

/**
 * Setup Verification Script for Content Predator
 * Run: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== CONTENT PREDATOR SETUP VERIFICATION ===\n');

let errors = 0;
let warnings = 0;

// Check Node version
console.log('Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error('❌ Node.js 18+ required. You have:', nodeVersion);
  errors++;
} else {
  console.log('✅ Node.js version OK:', nodeVersion);
}

// Check if .env.local exists
console.log('\nChecking .env.local file...');
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found. Copy .env.local.example and configure it.');
  errors++;
} else {
  console.log('✅ .env.local exists');

  // Check environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ];

  console.log('\nChecking environment variables...');
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(`${varName}=`) &&
                   !envContent.includes(`${varName}=your_`);
    if (hasVar) {
      console.log(`✅ ${varName} configured`);
    } else {
      console.error(`❌ ${varName} missing or not configured`);
      errors++;
    }
  });
}

// Check if node_modules exists
console.log('\nChecking dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ node_modules not found. Run: npm install');
  errors++;
} else {
  console.log('✅ node_modules exists');

  // Check for key dependencies
  const deps = ['next', '@supabase/supabase-js', '@anthropic-ai/sdk'];
  deps.forEach(dep => {
    const depPath = path.join(nodeModulesPath, dep);
    if (fs.existsSync(depPath)) {
      console.log(`✅ ${dep} installed`);
    } else {
      console.error(`❌ ${dep} not installed`);
      errors++;
    }
  });
}

// Check required files
console.log('\nChecking required files...');
const requiredFiles = [
  'app/page.tsx',
  'app/scan/page.tsx',
  'app/api/scan/route.ts',
  'app/api/generate/route.ts',
  'app/api/opportunities/route.ts',
  'lib/analyzer.ts',
  'lib/generator.ts',
  'lib/supabase.ts',
  'supabase-schema.sql',
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ ${file} missing`);
    errors++;
  }
});

// Check package.json scripts
console.log('\nChecking package.json...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.scripts && pkg.scripts.dev) {
    console.log('✅ package.json has dev script');
  } else {
    console.error('❌ package.json missing dev script');
    errors++;
  }
} else {
  console.error('❌ package.json not found');
  errors++;
}

// Summary
console.log('\n=== SUMMARY ===\n');
if (errors === 0) {
  console.log('✅ All checks passed! You\'re ready to hunt.');
  console.log('\nNext steps:');
  console.log('1. Make sure you\'ve run the SQL schema in Supabase');
  console.log('2. Start the dev server: npm run dev');
  console.log('3. Open http://localhost:3000');
  console.log('4. Click "HUNT FOR BLOOD" and run your first scan');
} else {
  console.error(`❌ ${errors} error(s) found. Fix them before proceeding.`);
  process.exit(1);
}

if (warnings > 0) {
  console.warn(`\n⚠️  ${warnings} warning(s) - app may work but check them.`);
}

console.log('\n');
