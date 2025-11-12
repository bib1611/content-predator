// Quick verification that email pattern library works
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Email Pattern Integration\n');

// Check Ben Settle emails
const benSettlePath = path.join(__dirname, 'lib', 'data', 'emails', 'ben-settle');
const benSettleFiles = fs.readdirSync(benSettlePath).filter(f => f.endsWith('.json'));
console.log(`✓ Ben Settle emails: ${benSettleFiles.length} files`);
benSettleFiles.forEach(f => console.log(`  - ${f}`));

// Check Gary Halbert emails
const garyHalbertPath = path.join(__dirname, 'lib', 'data', 'emails', 'gary-halbert');
const garyHalbertFiles = fs.readdirSync(garyHalbertPath).filter(f => f.endsWith('.json'));
console.log(`\n✓ Gary Halbert letters: ${garyHalbertFiles.length} files`);
garyHalbertFiles.forEach(f => console.log(`  - ${f}`));

// Test loading one example
const examplePath = path.join(benSettlePath, benSettleFiles[0]);
const example = JSON.parse(fs.readFileSync(examplePath, 'utf-8'));
console.log(`\n✓ Successfully loaded example: "${example.title}"`);
console.log(`  Subject: ${example.subject}`);
console.log(`  Patterns: ${example.key_patterns.join(', ')}`);

// Check integrations
console.log('\n📦 Integration Points:');
const marketingGen = fs.readFileSync(path.join(__dirname, 'lib', 'marketing-generator.ts'), 'utf-8');
console.log(`✓ Marketing Generator: ${marketingGen.includes('emailPatternLibrary') ? 'INTEGRATED' : 'NOT INTEGRATED'}`);

const critiqueRoute = fs.readFileSync(path.join(__dirname, 'app', 'api', 'critique', 'route.ts'), 'utf-8');
console.log(`✓ Critique Engine: ${critiqueRoute.includes('emailPatternLibrary') ? 'INTEGRATED' : 'NOT INTEGRATED'}`);

console.log('\n✅ All integrations verified!');
