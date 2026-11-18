-- Tenant-scoped user accounts: same email can have independent profiles & passwords per tenant

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- Backfill User.tenantId from TenantMembership (preferring STORE_OWNER / STORE_STAFF)
UPDATE "User" u
SET "tenantId" = m."tenantId"
FROM (
  SELECT DISTINCT ON ("userId") "userId", "tenantId"
  FROM "TenantMembership"
  ORDER BY "userId",
    CASE
      WHEN "role" = 'STORE_OWNER' THEN 0
      WHEN "role" = 'STORE_STAFF' THEN 1
      ELSE 2
    END,
    "createdAt" ASC
) m
WHERE u."id" = m."userId";

-- Replace global email uniqueness with per-tenant (tenantId, email) uniqueness
DROP INDEX IF EXISTS "User_email_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_tenantId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
