console.log('=== Script Started ===');

try {
  console.log('Step 1: Loading modules...');
  
  const { resolve } = await import('node:path');
  const { config } = await import('dotenv');
  const { eq } = await import('drizzle-orm');
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const postgres = (await import('postgres')).default;
  
  console.log('Step 2: Loading schema...');
  const { generatedAsset, session, user } = await import('../src/server/db/schema.js');
  
  console.log('Step 3: Loading environment...');
  config({ path: resolve(process.cwd(), '.env.local') });
  
  const databaseUrl = process.env.DATABASE_URL;
  console.log('Step 4: Database URL:', databaseUrl ? `Found (${databaseUrl.length} chars)` : 'NOT FOUND');
  
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is required');
    process.exit(1);
  }
  
  const taskIds = [
    '902add2231e88cf4ec0ef304d7560cc0',
    '19d9247790f27f2120f5d3ee3ba91b6d',
    'a77b0132fef368fa07f82c1f9608867a',
    '413d63b2d66aba90cc7a916b4509b362',
    '6b5f81f34a8efa916279f9520a615c29',
    'f4baad63b02b0e8109706b428d68fba7',
    'cb36d52f434080c2f0aee7348fd586df',
    '27caa88eebe1612171009a87582f8f5c',
    '73c7043e1635c5ce708c7bea6158f5a9',
  ];
  
  console.log('Step 5: Connecting to database...');
  const client = postgres(databaseUrl);
  const db = drizzle(client);
  
  console.log('Step 6: Querying assets...');
  const allAssets = await db
    .select({
      id: generatedAsset.id,
      userId: generatedAsset.userId,
      userEmail: user.email,
      userName: user.name,
      createdAt: generatedAsset.createdAt,
      status: generatedAsset.status,
      metadata: generatedAsset.metadata,
    })
    .from(generatedAsset)
    .leftJoin(user, eq(generatedAsset.userId, user.id));
  
  console.log(`Step 7: Found ${allAssets.length} total assets`);
  
  const foundAssets: Array<{
    taskId: string;
    userEmail: string | null;
    userName: string | null;
    userId: string;
    createdAt: Date;
  }> = [];
  
  console.log('Step 8: Searching for matching task IDs...');
  for (const asset of allAssets) {
    if (asset.metadata && typeof asset.metadata === 'object') {
      const metadata = asset.metadata as Record<string, unknown>;
      const taskId = metadata.taskId;
      
      if (typeof taskId === 'string' && taskIds.includes(taskId)) {
        foundAssets.push({
          taskId: taskId,
          userEmail: asset.userEmail,
          userName: asset.userName,
          userId: asset.userId,
          createdAt: asset.createdAt,
        });
      }
    }
  }
  
  console.log(`\n=== Results: Found ${foundAssets.length} matching assets ===\n`);
  
  for (const asset of foundAssets) {
    console.log(`Task ID: ${asset.taskId}`);
    console.log(`  用户邮箱: ${asset.userEmail || 'N/A'}`);
    console.log(`  用户名: ${asset.userName || 'N/A'}`);
    console.log(`  用户ID: ${asset.userId}`);
    console.log(`  生成时间: ${asset.createdAt.toISOString()}`);
    
    // Get IP addresses
    const userSessions = await db
      .select({
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
      })
      .from(session)
      .where(eq(session.userId, asset.userId))
      .orderBy(session.createdAt);
    
    const timeWindowStart = new Date(asset.createdAt);
    timeWindowStart.setHours(timeWindowStart.getHours() - 1);
    const timeWindowEnd = new Date(asset.createdAt);
    timeWindowEnd.setHours(timeWindowEnd.getHours() + 1);
    
    const relevantIPs = new Set<string>();
    userSessions.forEach((sess) => {
      if (sess.ipAddress && sess.createdAt >= timeWindowStart && sess.createdAt <= timeWindowEnd) {
        relevantIPs.add(sess.ipAddress);
      }
    });
    
    // If no IPs in time window, use recent IPs
    if (relevantIPs.size === 0) {
      userSessions.slice(0, 5).forEach((sess) => {
        if (sess.ipAddress) {
          relevantIPs.add(sess.ipAddress);
        }
      });
    }
    
    console.log(`  IP地址: ${Array.from(relevantIPs).join(', ') || '未找到'}`);
    console.log('');
  }
  
  await client.end();
  console.log('=== Script Completed ===');
  process.exit(0);
  
} catch (error) {
  console.error('=== ERROR ===');
  console.error('Error type:', error?.constructor?.name);
  console.error('Error message:', error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
}














