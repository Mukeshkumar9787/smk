import assert from "assert";
import jwt from "jsonwebtoken";
import prisma, { rawPrisma } from "../prisma/client.js";
import { resolveTenant } from "../middlewares/tenantMiddleware.js";
import { runWithTenant } from "../utils/tenantContext.js";
import tenantService from "../services/tenants.js";
import productService from "../services/products.js";
import categoryService from "../services/categories.js";
import userService from "../services/users.js";
import authService from "../services/auth.js";
import { hashedPassword } from "../utils/cryptoUtils.js";

const TEST_SLUG = `iso-test-${Date.now()}`;
const TEST_OWNER_EMAIL = `store-owner-${Date.now()}@example.com`;
const SHARED_CUSTOMER_EMAIL = `shared-customer-${Date.now()}@example.com`;
const SUPER_ADMIN_EMAIL = "mukeshkumar87086@gmail.com";

let createdTenantId = null;
let smkCustomerId = null;
let storeBCustomerId = null;

try {
  // 1. Default SMK tenant resolves and contains SMK products
  const smkTenant = await resolveTenant({});
  assert.ok(smkTenant, "Default SMK tenant must resolve");
  assert.strictEqual(smkTenant.slug, "smk");

  const smkProducts = await runWithTenant(smkTenant, () =>
    productService.getProducts({ status: "ACTIVE", pageSize: 100 })
  );
  assert.ok(smkProducts.totalCount > 0, "SMK tenant should have active products");
  const sampleSmkProductId = smkProducts.products[0].id;
  const sampleSmkSlug = smkProducts.products[0].slug;

  // 2. Global Platform Admin verification in PlatformAdmin table
  const platformAdminRecord = await rawPrisma.platformAdmin.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });
  assert.ok(platformAdminRecord, "Super Admin mukeshkumar87086@gmail.com must exist in PlatformAdmin table");

  const superAdminRow = await rawPrisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId: smkTenant.id,
        email: SUPER_ADMIN_EMAIL,
      },
    },
    select: { id: true, name: true, password: true, role: true, tenantRole: true },
  });
  assert.ok(superAdminRow, "Super Admin account mukeshkumar87086@gmail.com must exist on SMK");

  const superAdminInfo = await runWithTenant(smkTenant, () =>
    userService.getUserInfo({ id: superAdminRow.id })
  );
  assert.strictEqual(superAdminInfo.isPlatformAdmin, true, "isPlatformAdmin must be true from PlatformAdmin table");
  assert.strictEqual(superAdminInfo.role, "ADMIN");

  // 3. Provision a brand-new isolated tenant for a new store owner
  const provisioned = await tenantService.provisionTenant({
    storeName: "Isolation Smoke Store",
    slug: TEST_SLUG,
    ownerName: "Smoke Store Owner",
    ownerEmail: TEST_OWNER_EMAIL,
    ownerPassword: "StoreBOwnerPass@2026",
    planCode: "STARTER",
    primaryColor: "#10B981",
    accentColor: "#059669",
  });
  createdTenantId = provisioned.tenant.id;
  const createdOwnerId = provisioned.owner.id;
  assert.notStrictEqual(
    createdOwnerId,
    superAdminRow.id,
    "New tenant owner must be a separate User record"
  );
  assert.strictEqual(provisioned.tenant.slug, TEST_SLUG);
  assert.strictEqual(provisioned.tenant.branding.primaryColor, "#10B981");

  const decodedOwnerJwt = jwt.verify(provisioned.token, process.env.JWT_SECRET);
  assert.strictEqual(decodedOwnerJwt.tenantId, createdTenantId, "JWT must be bound to new tenant");

  const newTenant = await resolveTenant({ slug: TEST_SLUG });
  assert.strictEqual(newTenant.id, createdTenantId);

  // Verify SMK Super Admin row was completely untouched
  const superAdminAfterProvision = await rawPrisma.user.findUnique({
    where: { id: superAdminRow.id },
    select: { name: true, password: true, role: true, tenantRole: true },
  });
  assert.strictEqual(superAdminAfterProvision.name, superAdminRow.name);
  assert.strictEqual(superAdminAfterProvision.password, superAdminRow.password);

  // 4. Verify complete catalog isolation: new tenant sees 0 SMK products & only its own seeded category
  const newTenantProducts = await runWithTenant(newTenant, () =>
    productService.getProducts({ status: "ACTIVE", pageSize: 100 })
  );
  assert.strictEqual(newTenantProducts.totalCount, 0, "New tenant must see 0 products from SMK");

  const newTenantCategories = await runWithTenant(newTenant, () =>
    categoryService.getCategories({ status: "ACTIVE" })
  );
  assert.strictEqual(newTenantCategories.length, 1, "New tenant should only see its own starter category");
  assert.strictEqual(newTenantCategories[0].slug, "featured");

  // 5. Cross-tenant access by slug & ID must fail / return null
  await assert.rejects(
    () => runWithTenant(newTenant, () => productService.getProductBySlug(sampleSmkSlug)),
    (err) => err.statusCode === 404,
    "New tenant must get 404 for SMK product slug"
  );

  const crossTenantById = await runWithTenant(newTenant, async () =>
    await prisma.product.findUnique({ where: { id: sampleSmkProductId } })
  );
  assert.strictEqual(crossTenantById, null, "New tenant findUnique on SMK product ID must return null");

  await assert.rejects(
    () => runWithTenant(newTenant, async () => await prisma.product.delete({ where: { id: sampleSmkProductId } })),
    (err) => err.statusCode === 404,
    "New tenant must not be able to delete SMK product by ID"
  );

  // 6. Verify store owner has ADMIN on own store, is NOT Platform Admin on own store, and does NOT exist on SMK
  const ownerOnOwnStore = await runWithTenant(newTenant, () =>
    userService.getUserInfo({ id: createdOwnerId })
  );
  assert.strictEqual(ownerOnOwnStore.role, "ADMIN");
  assert.strictEqual(ownerOnOwnStore.isPlatformAdmin, false);

  const ownerOnSmk = await runWithTenant(smkTenant, () =>
    userService.getUserInfo({ id: createdOwnerId })
  );
  assert.strictEqual(ownerOnSmk, null, "Store B user must NOT be accessible in Store A");

  // 7. Per-tenant user profile & password isolation for the SAME email across two stores
  const smkPassHash = await hashedPassword("SmkAlice@123");
  const storeBPassHash = await hashedPassword("StoreBAlice@456");

  const smkUser = await runWithTenant(smkTenant, async () =>
    await prisma.user.create({
      data: {
        name: "SMK Alice",
        email: SHARED_CUSTOMER_EMAIL,
        password: smkPassHash,
        mobile: "9999900001",
      },
    })
  );
  smkCustomerId = smkUser.id;

  const storeBUser = await runWithTenant(newTenant, async () =>
    await prisma.user.create({
      data: {
        name: "StoreB Alice",
        email: SHARED_CUSTOMER_EMAIL,
        password: storeBPassHash,
        mobile: "8888800002",
      },
    })
  );
  storeBCustomerId = storeBUser.id;

  assert.notStrictEqual(smkUser.id, storeBUser.id, "Same email across tenants must create distinct user IDs");

  // Login on SMK succeeds with SMK password and fails with Store B password
  const smkLogin = await runWithTenant(smkTenant, () =>
    authService.login({ email: SHARED_CUSTOMER_EMAIL, password: "SmkAlice@123" })
  );
  assert.strictEqual(smkLogin.name, "SMK Alice");
  assert.strictEqual(jwt.verify(smkLogin.token, process.env.JWT_SECRET).tenantId, smkTenant.id);

  await assert.rejects(
    () => runWithTenant(smkTenant, () => authService.login({ email: SHARED_CUSTOMER_EMAIL, password: "StoreBAlice@456" })),
    (err) => err.statusCode === 400,
    "SMK login must reject Store B password"
  );

  // Login on Store B succeeds with Store B password and fails with SMK password
  const storeBLogin = await runWithTenant(newTenant, () =>
    authService.login({ email: SHARED_CUSTOMER_EMAIL, password: "StoreBAlice@456" })
  );
  assert.strictEqual(storeBLogin.name, "StoreB Alice");
  assert.strictEqual(jwt.verify(storeBLogin.token, process.env.JWT_SECRET).tenantId, newTenant.id);

  await assert.rejects(
    () => runWithTenant(newTenant, () => authService.login({ email: SHARED_CUSTOMER_EMAIL, password: "SmkAlice@123" })),
    (err) => err.statusCode === 400,
    "Store B login must reject SMK password"
  );

  // Updating Store B profile does NOT affect SMK profile
  const updatedStoreBProfile = await runWithTenant(newTenant, () =>
    userService.updateProfile(storeBCustomerId, {
      name: "StoreB Alice Edited",
      mobile: "7777700003",
    })
  );
  assert.strictEqual(updatedStoreBProfile.name, "StoreB Alice Edited");
  assert.strictEqual(updatedStoreBProfile.mobile, "7777700003");

  const smkProfileAfter = await runWithTenant(smkTenant, () =>
    userService.getUserInfo({ id: smkCustomerId })
  );
  assert.strictEqual(smkProfileAfter.name, "SMK Alice", "SMK profile name must remain isolated");
  assert.strictEqual(smkProfileAfter.mobile, "9999900001", "SMK profile mobile must remain isolated");

  // 8. Verify branding update on new tenant does NOT touch SMK branding
  const updatedBranding = await runWithTenant(newTenant, () =>
    tenantService.updateCurrentBranding({
      storeName: "Isolation Smoke Updated",
      primaryColor: "#E11D48",
      logoUrl: "https://example.com/logo.png",
    })
  );
  assert.strictEqual(updatedBranding.branding.primaryColor, "#E11D48");
  assert.strictEqual(updatedBranding.branding.logoUrl, "https://example.com/logo.png");

  const smkBrandingAfter = await runWithTenant(smkTenant, () =>
    tenantService.getCurrentBranding()
  );
  assert.strictEqual(smkBrandingAfter.branding.primaryColor, "#3C50E0");
  assert.strictEqual(smkBrandingAfter.branding.storeName, "SMK");

  // 9. Plan Accessibility and AI Chatbot Feature Toggle Tests
  // New tenant was provisioned with STARTER plan (aiChatbotEnabled: false)
  // Attempting to activate AI Chatbot on STARTER plan must fail with 403
  await assert.rejects(
    () =>
      runWithTenant(newTenant, () =>
        tenantService.updateCurrentBranding({ aiChatbotActive: true })
      ),
    (err) => err.statusCode === 403,
    "Activating AI chatbot on STARTER plan must be rejected with 403"
  );

  // Platform Admin upgrades the tenant to PRO plan (aiChatbotEnabled: true)
  const upgradedTenant = await tenantService.updateTenantPlan({
    tenantId: createdTenantId,
    planCode: "PRO",
  });
  assert.strictEqual(upgradedTenant.plan.code, "PRO");
  assert.strictEqual(upgradedTenant.plan.aiChatbotEnabled, true);

  // Now on PRO plan, store owner can freely toggle AI Chatbot ON and OFF
  const chatbotTurnedOn = await runWithTenant(newTenant, () =>
    tenantService.updateCurrentBranding({ aiChatbotActive: true })
  );
  assert.strictEqual(chatbotTurnedOn.branding.aiChatbotActive, true);

  const chatbotTurnedOff = await runWithTenant(newTenant, () =>
    tenantService.updateCurrentBranding({ aiChatbotActive: false })
  );
  assert.strictEqual(chatbotTurnedOff.branding.aiChatbotActive, false);

  // Verify resolveTenant returns the updated chatbot toggle state
  const resolvedNewTenant = await resolveTenant({ slug: TEST_SLUG });
  assert.strictEqual(resolvedNewTenant.branding.aiChatbotActive, false);

  console.log("✅ ALL MULTI-TENANT & PER-TENANT USER ISOLATION TESTS PASSED!");
} finally {
  if (smkCustomerId) {
    await rawPrisma.user.delete({ where: { id: smkCustomerId } }).catch(() => {});
  }
  if (storeBCustomerId) {
    await rawPrisma.user.delete({ where: { id: storeBCustomerId } }).catch(() => {});
  }
  if (createdTenantId) {
    // Deleting the tenant cascades its TenantBranding, Categories, Sizes, Colors, Configs, and Users
    await rawPrisma.tenant.delete({ where: { id: createdTenantId } }).catch(() => {});
  }
  await rawPrisma.$disconnect();
}
