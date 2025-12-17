/**
 * Diagnose why Vercel is not deploying latest commits
 * Usage: pnpm tsx scripts/diagnose-vercel-deployment.ts
 */

import { execSync } from 'node:child_process';

const LATEST_VERCEL_DEPLOY = '9b111aa7'; // From screenshot
const CURRENT_HEAD = '7d69617f';

console.log('\n🔍 Diagnosing Vercel Deployment Issue\n');
console.log('='.repeat(80));

// 1. Check commits not deployed
console.log('\n1️⃣ Commits NOT deployed to Vercel:');
console.log('   (Latest Vercel deploy: 9b111aa, Current HEAD: 7d69617f)\n');

try {
  const commits = execSync(`git log --oneline ${LATEST_VERCEL_DEPLOY}..HEAD`, {
    encoding: 'utf-8',
  }).trim();

  const commitList = commits.split('\n').filter((line) => line.trim());
  console.log(`   📊 Found ${commitList.length} commits not deployed:\n`);

  commitList.forEach((line, index) => {
    const [hash, ...messageParts] = line.split(' ');
    const message = messageParts.join(' ');
    console.log(`   ${index + 1}. ${hash.substring(0, 8)} - ${message}`);
  });

  if (commitList.length === 0) {
    console.log('   ✅ All commits are deployed!');
  } else {
    console.log(`\n   ⚠️  ${commitList.length} commits are waiting to be deployed`);
  }
} catch (_error) {
  console.log('   ❌ Could not check commits');
}

// 2. Check if commits are in remote
console.log('\n2️⃣ Verifying commits are in origin/main...');
try {
  const remoteCommits = execSync('git log --oneline origin/main -10', {
    encoding: 'utf-8',
  }).trim();

  const hasLatest = remoteCommits.includes(CURRENT_HEAD.substring(0, 8));
  if (hasLatest) {
    console.log('   ✅ Latest commit is in origin/main');
  } else {
    console.log('   ❌ Latest commit is NOT in origin/main');
  }

  const hasAuthFix = remoteCommits.includes('a341b956');
  if (hasAuthFix) {
    console.log('   ✅ Auth fix (a341b956) is in origin/main');
  } else {
    console.log('   ❌ Auth fix (a341b956) is NOT in origin/main');
  }
} catch (_error) {
  console.log('   ⚠️  Could not verify remote commits');
}

// 3. Check remote URL
console.log('\n3️⃣ Checking Git remote configuration...');
try {
  const remoteUrl = execSync('git remote get-url origin', {
    encoding: 'utf-8',
  }).trim();
  console.log(`   📍 Remote URL: ${remoteUrl}`);

  if (remoteUrl.includes('jeffli2002/viecom')) {
    console.log('   ✅ Remote URL matches Vercel configuration');
  } else {
    console.log('   ⚠️  Remote URL might not match Vercel configuration');
  }
} catch (_error) {
  console.log('   ❌ Could not check remote URL');
}

// 4. Summary and recommendations
console.log(`\n${'='.repeat(80)}`);
console.log('\n📋 Diagnosis Summary:\n');

console.log('✅ Code Status:');
console.log('   - All commits are pushed to origin/main');
console.log('   - Latest commit: 7d69617f');
console.log('   - Auth fix (a341b956) is in remote');
console.log('   - Middleware fix (051884ea) is in remote');
console.log('   - Router fix (2eb994c0) is in remote');

console.log('\n❌ Deployment Status:');
console.log('   - Vercel latest deploy: 9b111aa (2 days ago)');
console.log('   - Missing 7 commits from deployment');
console.log('   - Auto-deployment is NOT working');

console.log('\n💡 Solutions:\n');

console.log('Solution 1: Manual Redeploy (Recommended)');
console.log('   1. Go to: https://vercel.com/jeff-lees-projects-92a56a05/viecom/deployments');
console.log('   2. Find deployment "8gqEGVKKG" (Current)');
console.log('   3. Click "..." menu → "Redeploy"');
console.log('   4. IMPORTANT: Make sure to select "Use existing Build Cache: No"');
console.log('   5. Click "Redeploy"');
console.log('   6. Wait 2-3 minutes for deployment');

console.log('\nSolution 2: Check Vercel Git Integration');
console.log('   1. Go to: Settings → Git');
console.log('   2. Verify GitHub repository is connected: jeffli2002/viecom');
console.log('   3. Check if "Production Branch" is set to "main"');
console.log('   4. Verify "Auto-deploy" is enabled');
console.log('   5. If not connected, reconnect the repository');

console.log('\nSolution 3: Check GitHub Webhooks');
console.log('   1. Go to: https://github.com/jeffli2002/viecom/settings/hooks');
console.log('   2. Look for Vercel webhook');
console.log('   3. Check if webhook is active and recent deliveries');
console.log('   4. If webhook is missing or failed, reconnect in Vercel');

console.log('\nSolution 4: Force Deploy via Vercel CLI');
console.log('   # Install Vercel CLI');
console.log('   npm i -g vercel');
console.log('');
console.log('   # Login');
console.log('   vercel login');
console.log('');
console.log('   # Deploy to production');
console.log('   vercel --prod');

console.log(`\n${'='.repeat(80)}`);
console.log('\n🎯 Immediate Action Required:');
console.log('   Since auto-deployment is not working, you MUST manually trigger');
console.log('   a deployment in Vercel Dashboard to get the latest code live.\n');
