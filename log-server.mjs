import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const logFile = path.join(process.cwd(), 'next-error.log');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  let contents = '';
  try {
    contents = fs.readFileSync(logFile, 'utf8');
  } catch (error) {
    contents = `[error reading log]: ${error instanceof Error ? error.message : String(error)}`;
  }
  res.end(contents || '[empty log]');
});

const port = parseInt(process.env.LOG_SERVER_PORT ?? '4545', 10);
server.listen(port, '127.0.0.1', () => {
  console.log(`[log-server] listening on http://127.0.0.1:${port}`);
});
