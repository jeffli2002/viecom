// Direct check without going through env.ts validation
console.log('=== Runtime Environment Check ===\n');

console.log('Direct process.env:');
console.log(
  'NEXT_PUBLIC_CREEM_TEST_MODE:',
  JSON.stringify(process.env.NEXT_PUBLIC_CREEM_TEST_MODE)
);
console.log('CREEM_API_KEY (first 15 chars):', process.env.CREEM_API_KEY?.substring(0, 15) + '...');

console.log('\nNow loading through env.ts...');
try {
  const { env } = await import('../src/env.ts');
  console.log('\nThrough env.ts:');
  console.log('env.NEXT_PUBLIC_CREEM_TEST_MODE:', JSON.stringify(env.NEXT_PUBLIC_CREEM_TEST_MODE));
  console.log('env.CREEM_API_KEY (first 15 chars):', env.CREEM_API_KEY?.substring(0, 15) + '...');
} catch (error) {
  console.error('Error loading env.ts:', error.message);
}

console.log('\nNow checking creem-service.ts...');
try {
  const { getCreemTestMode, getCreemApiKey } = await import('../src/lib/creem/creem-service.ts');
  console.log('\nFrom creem-service.ts:');
  console.log('getCreemTestMode():', getCreemTestMode());
  console.log('getCreemApiKey() (first 15 chars):', getCreemApiKey()?.substring(0, 15) + '...');

  const testMode = getCreemTestMode();
  const serverIdx = testMode ? 1 : 0;
  console.log('\nServerIdx that will be used:', serverIdx, testMode ? '(sandbox)' : '(production)');
} catch (error) {
  console.error('Error loading creem-service.ts:', error.message);
}
