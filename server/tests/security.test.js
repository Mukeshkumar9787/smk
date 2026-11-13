import assert from "assert";
import { globalRateLimiter, authRateLimiter, ordersRateLimiter } from "../middlewares/rateLimitMiddleware.js";
import { verifyTurnstileToken } from "../middlewares/turnstileMiddleware.js";

console.log("=== RUNNING RATE LIMITING & TURNSTILE TESTS (SMK SERVER) ===");

// Helper to mock Express req, res, next
function createMockHttp(reqOverrides = {}) {
  let statusCode = 200;
  let responseData = null;
  let headers = {};

  const req = {
    ip: "127.0.0.1",
    headers: {},
    body: {},
    ...reqOverrides,
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    getHeader(name) {
      return headers[name.toLowerCase()];
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
    getStatus: () => statusCode,
    getData: () => responseData,
  };

  return { req, res };
}

// 1. Test Rate Limiters exist and are functions
console.log("\n[Test 1] Rate limiters are valid Express middlewares");
assert.strictEqual(typeof globalRateLimiter, "function");
assert.strictEqual(typeof authRateLimiter, "function");
assert.strictEqual(typeof ordersRateLimiter, "function");
console.log("  Passed! globalRateLimiter, authRateLimiter, ordersRateLimiter are middleware functions.");

// 2. Test Turnstile Middleware when unconfigured
console.log("\n[Test 2] Turnstile middleware skips verification gracefully when secret is unconfigured");
delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
let nextCalled = false;
const { req: req1, res: res1 } = createMockHttp();
await verifyTurnstileToken(req1, res1, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, true, "next() should be called when unconfigured");
console.log("  Passed! Gracefully skipped and called next().");

// 3. Test Turnstile Middleware when secret is set but token is missing
console.log("\n[Test 3] Turnstile middleware rejects when token is missing");
process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = "test_turnstile_secret_key";
nextCalled = false;
const { req: req2, res: res2 } = createMockHttp({ body: {} });
await verifyTurnstileToken(req2, res2, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, false, "next() should NOT be called when token is missing");
assert.strictEqual(res2.getStatus(), 400, "Status should be 400 Bad Request");
assert.strictEqual(res2.getData().success, false);
assert.ok(res2.getData().message.includes("Turnstile"));
console.log("  Passed! Rejected missing token with HTTP 400.");

// 4. Test Turnstile Middleware with Cloudflare official always-pass test key
console.log("\n[Test 4] Turnstile middleware passes with Cloudflare always-pass test key");
process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
nextCalled = false;
const { req: req3, res: res3 } = createMockHttp({
  body: { turnstileToken: "XXXX.DUMMY.TOKEN.XXXX" },
});
await verifyTurnstileToken(req3, res3, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, true, "next() should be called with valid token");
assert.strictEqual(res3.getStatus(), 200);
console.log("  Passed! Token verified successfully with Cloudflare siteverify API.");

// 5. Test Turnstile token provided via header
console.log("\n[Test 5] Turnstile middleware extracts token from x-turnstile-token header");
nextCalled = false;
const { req: req4, res: res4 } = createMockHttp({
  headers: { "x-turnstile-token": "XXXX.DUMMY.TOKEN.XXXX" },
});
await verifyTurnstileToken(req4, res4, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, true, "next() should be called when token is in header");
console.log("  Passed! Token successfully extracted from headers.");

console.log("\n🎉 ALL SMK SERVER SECURITY TESTS PASSED SUCCESSFULLY!\n");

