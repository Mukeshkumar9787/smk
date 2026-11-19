import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is missing in .env");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("sslmode=require") || DATABASE_URL.includes("db.prisma.io")
    ? { rejectUnauthorized: false }
    : false,
});

const TENANT_TABLES = [
  "TenantBranding",
  "TenantPaymentConfig",
  "Subscription",
  "AuditLog",
  "Category",
  "File",
  "Hsn",
  "Product",
  "ProductReview",
  "ProductNotification",
  "Size",
  "Color",
  "Otp",
  "OrderProducts",
  "Stock",
  "OrderStatusHistory",
  "Config",
];

const USER_SCOPED_TABLES = [
  "User",
  "Address",
  "CartItem",
  "WishlistItem",
  "Order",
];

async function applyRLS() {
  console.log("Connecting to PostgreSQL database...");
  await client.connect();

  console.log("1. Enabling and configuring Row-Level Security on tenant-scoped tables...");

  for (const table of TENANT_TABLES) {
    console.log(` - Securing table: "${table}"`);
    await client.query(`
      ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}";
      CREATE POLICY tenant_isolation_policy ON "${table}"
        FOR ALL
        TO PUBLIC
        USING (
          current_setting('app.bypass_rls', true) = 'true'
          OR "tenantId" = current_setting('app.current_tenant_id', true)
        )
        WITH CHECK (
          current_setting('app.bypass_rls', true) = 'true'
          OR "tenantId" = current_setting('app.current_tenant_id', true)
        );
    `);
  }

  console.log("2. Enabling and configuring Row-Level Security on user-scoped tables...");

  for (const table of USER_SCOPED_TABLES) {
    console.log(` - Securing user-scoped table: "${table}"`);
    const userCol = table === "User" ? '"id"' : '"userId"';

    await client.query(`
      ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS tenant_user_isolation_policy ON "${table}";
      CREATE POLICY tenant_user_isolation_policy ON "${table}"
        FOR ALL
        TO PUBLIC
        USING (
          current_setting('app.bypass_rls', true) = 'true'
          OR (
            "tenantId" = current_setting('app.current_tenant_id', true)
            AND (
              current_setting('app.is_store_admin', true) = 'true'
              OR current_setting('app.current_user_id', true) IS NULL
              OR current_setting('app.current_user_id', true) = ''
              OR ${userCol}::text = current_setting('app.current_user_id', true)
            )
          )
        )
        WITH CHECK (
          current_setting('app.bypass_rls', true) = 'true'
          OR (
            "tenantId" = current_setting('app.current_tenant_id', true)
            AND (
              current_setting('app.is_store_admin', true) = 'true'
              OR current_setting('app.current_user_id', true) IS NULL
              OR current_setting('app.current_user_id', true) = ''
              OR ${userCol}::text = current_setting('app.current_user_id', true)
            )
          )
        );
    `);
  }

  console.log("3. Granting privileges to prisma_application role if needed...");
  try {
    await client.query(`
      GRANT USAGE ON SCHEMA public TO prisma_application;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prisma_application;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prisma_application;
    `);
  } catch (err) {
    // On restricted superuser environments like Prisma Accelerate, permissions are pre-granted
    console.log("   (Role permissions pre-configured or restricted: " + err.message + ")");
  }

  console.log("✅ Row-Level Security successfully applied to all tables in SMK PostgreSQL database!");
  await client.end();
}

applyRLS().catch((err) => {
  console.error("❌ Failed to apply RLS:", err);
  process.exit(1);
});
