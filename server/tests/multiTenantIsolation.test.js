import assert from "assert";
import prisma, { rawPrisma } from "../prisma/client.js";
import { resolveTenant } from "../middlewares/tenantMiddleware.js";
import { runWithTenant } from "../utils/tenantContext.js";
import tenantService from "../services/tenants.js";
import productService from "../services/products.js";
import categoryService from "../services/categories.js";
import userService from "../services/users.js";

const TEST_SLUG = `iso-test-${Date.now()}`;
const TEST_EMAIL = `${TEST_SLUG}@example.com`;

let createdTenantId = null;
let createdUserId = null;

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

  // 2. Super Admin verification for mukeshkumar87086@gmail.com
  const superAdminRow = await rawPrisma.user.findUnique({
    where: { email: "mukeshkumar87086@gmail.com" },
    select: { id: true, isPlatformAdmin: true },
  });
  assert.ok(superAdminRow, "Super Admin account mukeshkumar87086@gmail.com must exist");
  assert.strictEqual(superAdminRow.isPlatformAdmin, true, "isPlatformAdmin must be true");

  const superAdminInfo = await runWithTenant(smkTenant, () =>
    userService.getUserInfo({ id: superAdminRow.id })
  );
  assert.strictEqual(superAdminInfo.isPlatformAdmin, true);
  assert.strictEqual(superAdminInfo.role, "ADMIN");

  // 3. Provision a brand-new isolated tenant
  const provisioned = await tenantService.provisionTenant({
    storeName: "Isolation Smoke Store",
    slug: TEST_SLUG,
    ownerName: "Smoke Owner",
    ownerEmail: TEST_EMAIL,
    ownerPassword: "TestPassword123!",
    planCode: "STARTER",
    primaryColor: "#10B981",
    accentColor: "#059669",
  });
  createdTenantId = provisioned.tenant.id;
  createdUserId = provisioned.owner.id;
  assert.strictEqual(provisioned.tenant.slug, TEST_SLUG);
  assert.strictEqual(provisioned.tenant.branding.primaryColor, "#10B981");

  const newTenant = await resolveTenant({ slug: TEST_SLUG });
  assert.strictEqual(newTenant.id, createdTenantId);

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

  // 6. Verify store owner has ADMIN on own store, but USER (no admin) on SMK
  const ownerOnOwnStore = await runWithTenant(newTenant, () =>
    userService.getUserInfo({ id: createdUserId })
  );
  assert.strictEqual(ownerOnOwnStore.role, "ADMIN");
  assert.strictEqual(ownerOnOwnStore.isPlatformAdmin, false);

  const ownerOnSmk = await runWithTenant(smkTenant, () =>
    userService.getUserInfo({ id: createdUserId })
  );
  assert.strictEqual(ownerOnSmk.role, "USER", "Store B owner must NOT be ADMIN on Store A");

  // 7. Verify branding update on new tenant does NOT touch SMK branding
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

  console.log("✅ ALL MULTI-TENANT ISOLATION TESTS PASSED!");
} finally {
  if (createdTenantId) {
    await rawPrisma.tenant.delete({ where: { id: createdTenantId } }).catch(() => {});
  }
  if (createdUserId) {
    await rawPrisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
  }
  await rawPrisma.$disconnect();
}
