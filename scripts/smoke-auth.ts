const baseUrl = process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

if (!baseUrl) {
  console.error('SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL is required.');
  process.exit(1);
}

const url = new URL('/api/health/auth', baseUrl).toString();

try {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'viecom-smoke/1.0' },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Auth health check failed (${response.status}).`, body);
    process.exit(1);
  }

  console.log('Auth health check passed.');
  process.exit(0);
} catch (error) {
  console.error('Auth health check failed with error:', error);
  process.exit(1);
}
