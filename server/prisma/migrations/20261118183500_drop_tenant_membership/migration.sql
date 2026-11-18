-- Move tenantRole directly onto User and drop the redundant TenantMembership table

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantRole" "TenantRole" NOT NULL DEFAULT 'CUSTOMER';

-- Backfill User.tenantRole and sync User.role from TenantMembership before dropping it
UPDATE "User" u
SET
  "tenantRole" = m."role",
  "role" = CASE
    WHEN m."role" IN ('STORE_OWNER', 'STORE_STAFF') THEN 'ADMIN'::"Role"
    ELSE 'USER'::"Role"
  END
FROM (
  SELECT DISTINCT ON ("userId") "userId", "role"
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

CREATE INDEX IF NOT EXISTS "User_tenantId_tenantRole_idx" ON "User"("tenantId", "tenantRole");

DROP TABLE IF EXISTS "TenantMembership";
