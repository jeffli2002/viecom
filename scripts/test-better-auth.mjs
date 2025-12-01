import { createAuthClient } from 'better-auth/react';
const client = createAuthClient({ baseURL: 'http://example.com' });
console.log('client keys', Object.keys(client));
