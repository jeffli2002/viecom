// Polyfill Web APIs for Node.js test environment
// Use require for CommonJS compatibility

// Polyfill TextEncoder/TextDecoder (Node.js built-in, but need to expose globally)
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = require('node:util').TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = require('node:util').TextDecoder;
}

// Polyfill ReadableStream and TransformStream
if (typeof globalThis.ReadableStream === 'undefined') {
  try {
    const { ReadableStream: UndiciReadableStream } = require('undici');
    globalThis.ReadableStream = UndiciReadableStream;
  } catch (_e) {
    // Fallback: provide a minimal stub
    globalThis.ReadableStream = class ReadableStream {
      constructor() {
        throw new Error('ReadableStream is not available in test environment');
      }
    };
  }
}

if (typeof globalThis.TransformStream === 'undefined') {
  try {
    const { TransformStream: UndiciTransformStream } = require('undici');
    globalThis.TransformStream = UndiciTransformStream;
  } catch (_e) {
    // Fallback: provide a minimal stub
    globalThis.TransformStream = class TransformStream {
      constructor() {
        throw new Error('TransformStream is not available in test environment');
      }
    };
  }
}

// Polyfill Request/Response (Node.js 18+ has these via fetch, but need to expose globally)
if (typeof globalThis.Request === 'undefined') {
  // Node.js 18+ has fetch which includes Request/Response
  // Try to get them from the fetch implementation
  try {
    // Use undici's fetch which includes Request/Response
    const undici = require('undici');
    if (undici.Request) {
      globalThis.Request = undici.Request;
      globalThis.Response = undici.Response;
    } else {
      // Create Request/Response from fetch
      const fetch = undici.fetch;
      // Create a dummy request to get the Request constructor
      const testReq = new (fetch.constructor || fetch)('https://example.com');
      if (testReq?.constructor) {
        globalThis.Request = testReq.constructor;
      }
    }
  } catch (_e) {
    // If undici doesn't work, try using Node's built-in fetch (Node 18+)
    try {
      const { Request, Response } = require('undici');
      globalThis.Request = Request;
      globalThis.Response = Response;
    } catch (_e2) {
      // Last resort: provide minimal stubs that don't throw
      globalThis.Request = class Request {
        constructor(input, init) {
          this.url = typeof input === 'string' ? input : input?.url || '';
          this.method = init?.method || 'GET';
          this.headers = init?.headers || {};
        }
      };
      globalThis.Response = class Response {
        constructor(body, init) {
          this.body = body;
          this.status = init?.status || 200;
          this.headers = init?.headers || {};
        }
      };
    }
  }
}
