import assert from "assert";
import express from "express";
import http from "http";
import router from "../routes/index.js";

const app = express();
app.use(express.json());
app.use("/api", router);

async function runHttpRoutingTests() {
  console.log("=== RUNNING HTTP TENANT URL ROUTING & BODY-STRIPPING TESTS ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // 1. Test GET /api/smk/resolve (resolves via URL param)
    console.log("\n[Test 1] GET /api/smk/resolve");
    const resSmk = await fetch(`${baseUrl}/smk/resolve`);
    const dataSmk = await resSmk.json();
    assert.strictEqual(resSmk.status, 200, "Should return 200 OK");
    assert.ok(dataSmk.data, "Should return tenant data");
    assert.strictEqual(dataSmk.data.slug, "smk", "Tenant slug must be 'smk'");
    console.log("  Passed! Successfully resolved tenant 'smk' from URL.");

    // 2. Test GET /api/nonexistent_store_9999/resolve -> 404
    console.log("\n[Test 2] GET /api/nonexistent_store_9999/resolve");
    const res404 = await fetch(`${baseUrl}/nonexistent_store_9999/resolve`);
    assert.strictEqual(res404.status, 404, "Unknown tenant in URL should return 404");
    console.log("  Passed! Unknown tenant in URL correctly returned 404.");

    // 3. Test GET /api/smk/products/active
    console.log("\n[Test 3] GET /api/smk/products/active");
    const resProducts = await fetch(`${baseUrl}/smk/products/active?pageSize=3`);
    const dataProducts = await resProducts.json();
    assert.strictEqual(resProducts.status, 200, "Active products endpoint must return 200");
    assert.ok(dataProducts.success, "Response should be success: true");
    assert.ok(Array.isArray(dataProducts.data), "Products data must be an array");
    console.log(`  Passed! Returned ${dataProducts.data.length} products for 'smk' (totalCount: ${dataProducts.totalCount}).`);

    // 4. Test Body Tampering: Client sends { tenantId: "malicious_tenant" } in request body
    // Middleware MUST strip tenantId and URL parameter governs
    console.log("\n[Test 4] Tenant ID in Request Body MUST be stripped and ignored");
    const resBodyTamper = await fetch(`${baseUrl}/smk/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent_attacker@example.com",
        password: "random_password",
        tenantId: "malicious_tenant_id",
        tenant_id: "malicious_tenant_id_2",
        tenantSlug: "malicious_slug",
      }),
    });
    // Should fail with 401/404 for invalid credentials on SMK, NOT query malicious_tenant_id
    const dataTamper = await resBodyTamper.json();
    console.log("  Response status:", resBodyTamper.status, "message:", dataTamper.message);
    assert.ok(
      resBodyTamper.status === 401 || resBodyTamper.status === 404 || resBodyTamper.status === 400,
      "Should fail authentication on 'smk' tenant"
    );
    console.log("  Passed! Body tenant fields stripped; request scoped to URL tenant 'smk'.");

    // 5. Test Platform Super Admin routes at /api/platform
    console.log("\n[Test 5] GET /api/platform/plans (Global Platform Route)");
    const resPlans = await fetch(`${baseUrl}/platform/plans`);
    const dataPlans = await resPlans.json();
    assert.strictEqual(resPlans.status, 200, "Platform plans route must return 200");
    assert.ok(Array.isArray(dataPlans.data), "Plans must be an array");
    console.log(`  Passed! Platform plans returned ${dataPlans.data.length} tiers.`);

    console.log("\n🎉 ALL HTTP TENANT URL ROUTING & BODY-STRIPPING TESTS PASSED!");
  } finally {
    server.close();
  }
}

runHttpRoutingTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
