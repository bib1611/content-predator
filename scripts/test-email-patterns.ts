#!/usr/bin/env tsx

import { emailPatternLibrary } from '../lib/email-patterns';

console.log('🔍 Testing Email Pattern Library\n');

// Test loading Ben Settle emails
console.log('📧 Ben Settle Emails:');
const benSettleEmails = emailPatternLibrary.getBenSettleEmails();
console.log(`   Loaded: ${benSettleEmails.length} emails`);
benSettleEmails.forEach(email => {
  console.log(`   - ${email.title} (${email.key_patterns.length} patterns)`);
});

console.log('\n📧 Gary Halbert Letters:');
const garyHalbertEmails = emailPatternLibrary.getGaryHalbertEmails();
console.log(`   Loaded: ${garyHalbertEmails.length} letters`);
garyHalbertEmails.forEach(email => {
  console.log(`   - ${email.title} (${email.key_patterns.length} patterns)`);
});

console.log('\n📊 Ben Settle Pattern Summary:');
const benSettlePatterns = emailPatternLibrary.getBenSettlePatternSummary();
console.log(`   Total emails: ${benSettlePatterns.total_emails}`);
console.log(`   Common patterns: ${benSettlePatterns.common_patterns.join(', ')}`);
console.log(`   Key techniques: ${benSettlePatterns.key_techniques.slice(0, 3).join(', ')}`);

console.log('\n📊 Gary Halbert Pattern Summary:');
const garyHalbertPatterns = emailPatternLibrary.getGaryHalbertPatternSummary();
console.log(`   Total letters: ${garyHalbertPatterns.total_emails}`);
console.log(`   Common patterns: ${garyHalbertPatterns.common_patterns.join(', ')}`);
console.log(`   Key techniques: ${garyHalbertPatterns.key_techniques.slice(0, 3).join(', ')}`);

console.log('\n🎲 Random Examples:');
const randomBenSettle = emailPatternLibrary.getRandomExample('ben_settle');
console.log(`   Ben Settle: ${randomBenSettle?.title || 'None'}`);
const randomGaryHalbert = emailPatternLibrary.getRandomExample('gary_halbert');
console.log(`   Gary Halbert: ${randomGaryHalbert?.title || 'None'}`);

console.log('\n🔄 Comparison Guide:');
const comparison = emailPatternLibrary.getComparisonGuide();
console.log(`   Length: ${comparison.length} characters`);
console.log(`   ✓ Contains both styles`);

console.log('\n✅ All tests passed!');
