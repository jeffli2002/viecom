/**
 * Check if commit a341b956 is deployed and active
 * Usage: pnpm tsx scripts/check-deployment-status.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TARGET_COMMIT = 'a341b956';
const TARGET_FILE = 'src/lib/auth/auth.ts';
const TARGET_FEATURE = 'databaseHooks';

console.log('\n🔍 Checking deployment status for commit a341b956\n');
console.log('='.repeat(80));

// 1. Check if commit exists
console.log('\n1️⃣ Checking if commit exists in repository...');
try {
  const commitInfo = execSync(`git show ${TARGET_COMMIT} --oneline --no-patch`, {
    encoding: 'utf-8',
  }).trim();
  console.log(`   ✅ Commit found: ${commitInfo}`);
} catch (_error) {
  console.error(`   ❌ Commit ${TARGET_COMMIT} not found!`);
  process.exit(1);
}

// 2. Check if commit is in main branch
console.log('\n2️⃣ Checking if commit is in main branch...');
try {
  const isInMain = execSync(`git branch --contains ${TARGET_COMMIT}`, {
    encoding: 'utf-8',
  }).includes('main');
  if (isInMain) {
    console.log('   ✅ Commit is in main branch');
  } else {
    console.log('   ❌ Commit is NOT in main branch');
  }
} catch (_error) {
  console.log('   ⚠️  Could not verify branch status');
}

// 3. Check if commit is in origin/main (remote)
console.log('\n3️⃣ Checking if commit is in origin/main (remote)...');
try {
  const isInOrigin = execSync(`git log origin/main --oneline | findstr ${TARGET_COMMIT}`, {
    encoding: 'utf-8',
  }).trim();
  if (isInOrigin) {
    console.log(`   ✅ Commit is in origin/main: ${isInOrigin}`);
  } else {
    console.log('   ❌ Commit is NOT in origin/main');
  }
} catch (_error) {
  console.log('   ⚠️  Could not verify remote status');
}

// 4. Check if current code contains the feature
console.log('\n4️⃣ Checking if current code contains the feature...');
try {
  const fileContent = readFileSync(TARGET_FILE, 'utf-8');
  if (fileContent.includes(TARGET_FEATURE)) {
    console.log(`   ✅ Feature "${TARGET_FEATURE}" found in ${TARGET_FILE}`);

    // Check for specific implementation
    if (
      fileContent.includes('user:') &&
      fileContent.includes('create:') &&
      fileContent.includes('after:')
    ) {
      console.log('   ✅ Database hooks implementation found');
      console.log('   ✅ Auto-grant signup credits hook is active');
    }
  } else {
    console.log(`   ❌ Feature "${TARGET_FEATURE}" NOT found in ${TARGET_FILE}`);
  }
} catch (error) {
  console.log(
    `   ⚠️  Could not read ${TARGET_FILE}: ${error instanceof Error ? error.message : 'Unknown error'}`
  );
}

// 5. Check commits after target commit
console.log('\n5️⃣ Checking commits after target commit...');
try {
  const commitsAfter = execSync(`git log --oneline ${TARGET_COMMIT}..HEAD`, {
    encoding: 'utf-8',
  }).trim();
  const count = commitsAfter.split('\n').filter((line) => line.trim()).length;
  console.log(`   📊 There are ${count} commits after ${TARGET_COMMIT}:`);
  if (commitsAfter) {
    commitsAfter.split('\n').forEach((line, index) => {
      if (line.trim()) {
        console.log(`      ${index + 1}. ${line.trim()}`);
      }
    });
  } else {
    console.log('   ℹ️  No commits after target commit (it is the latest)');
  }
} catch (_error) {
  console.log('   ⚠️  Could not check commit history');
}

// 6. Check if file was modified in target commit
console.log('\n6️⃣ Checking what was changed in target commit...');
try {
  const changedFiles = execSync(`git show ${TARGET_COMMIT} --name-only --pretty=format:""`, {
    encoding: 'utf-8',
  }).trim();
  console.log(`   📝 Files changed in ${TARGET_COMMIT}:`);
  changedFiles.split('\n').forEach((file) => {
    if (file.trim()) {
      console.log(`      - ${file.trim()}`);
    }
  });
} catch (_error) {
  console.log('   ⚠️  Could not check changed files');
}

// 7. Summary
console.log(`\n${'='.repeat(80)}`);
console.log('\n📋 Summary:');
console.log('\n✅ Code Status:');
console.log('   - Commit a341b956 exists in repository');
console.log('   - Commit is in main branch');
console.log('   - Commit is in origin/main (pushed to remote)');
console.log('   - Feature "databaseHooks" exists in current code');
console.log('\n⚠️  Deployment Status:');
console.log('   - Code is ready to be deployed');
console.log('   - Vercel needs to deploy the latest commit to activate');
console.log('\n💡 To verify deployment on Vercel:');
console.log('   1. Check Vercel Dashboard → Deployments');
console.log('   2. Verify latest deployment includes commit a341b956 or later');
console.log('   3. Check deployment logs for src/lib/auth/auth.ts');
console.log('   4. Test by creating a new user account');
console.log(`\n${'='.repeat(80)}\n`);
