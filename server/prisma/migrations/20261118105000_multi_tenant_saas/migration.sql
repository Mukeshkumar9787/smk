-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('STORE_OWNER', 'STORE_STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- DropIndex
DROP INDEX "Category_title_key";

-- DropIndex
DROP INDEX "Category_slug_key";

-- DropIndex
DROP INDEX "Hsn_code_key";

-- DropIndex
DROP INDEX "Product_title_key";

-- DropIndex
DROP INDEX "Product_slug_key";

-- DropIndex
DROP INDEX "CartItem_userId_productId_key";

-- DropIndex
DROP INDEX "WishlistItem_userId_productId_key";

-- DropIndex
DROP INDEX "ProductNotification_userId_productId_key";

-- DropIndex
DROP INDEX "Size_title_key";

-- DropIndex
DROP INDEX "Color_title_key";

-- DropIndex
DROP INDEX "Color_code_key";

-- DropIndex
DROP INDEX "Order_orderNo_key";

-- DropIndex
DROP INDEX "Config_key_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Hsn" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "ProductNotification" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Size" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Color" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "OrderProducts" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "OrderStatusHistory" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'tenant_smk_default';

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" INTEGER NOT NULL DEFAULT 0,
    "priceYearly" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "maxProducts" INTEGER NOT NULL DEFAULT 50,
    "maxStorageMb" INTEGER NOT NULL DEFAULT 500,
    "customDomainAllowed" BOOLEAN NOT NULL DEFAULT false,
    "aiChatbotEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoProcurementEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "customDomain" TEXT,
    "customDomainVerified" BOOLEAN NOT NULL DEFAULT false,
    "planId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantBranding" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "tagline" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3C50E0',
    "primaryDarkColor" TEXT NOT NULL DEFAULT '#1C3FB7',
    "accentColor" TEXT NOT NULL DEFAULT '#0EA5E9',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F6FAFF',
    "surfaceColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textPrimaryColor" TEXT NOT NULL DEFAULT '#1C274C',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "providerSubId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPaymentConfig" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "keyId" TEXT,
    "encryptedKeySecret" TEXT,
    "encryptedWebhookSecret" TEXT,
    "codEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMembership" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "TenantBranding_tenantId_key" ON "TenantBranding"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerSubId_key" ON "Subscription"("providerSubId");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantPaymentConfig_tenantId_key" ON "TenantPaymentConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TenantMembership_tenantId_role_idx" ON "TenantMembership"("tenantId", "role");

-- CreateIndex
CREATE INDEX "TenantMembership_userId_idx" ON "TenantMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMembership_tenantId_userId_key" ON "TenantMembership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Address_tenantId_idx" ON "Address"("tenantId");

-- CreateIndex
CREATE INDEX "Category_tenantId_idx" ON "Category"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_tenantId_title_key" ON "Category"("tenantId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Category_tenantId_slug_key" ON "Category"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "File_tenantId_idx" ON "File"("tenantId");

-- CreateIndex
CREATE INDEX "Hsn_tenantId_idx" ON "Hsn"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Hsn_tenantId_code_key" ON "Hsn"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_title_key" ON "Product"("tenantId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_slug_key" ON "Product"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "ProductReview_tenantId_idx" ON "ProductReview"("tenantId");

-- CreateIndex
CREATE INDEX "CartItem_tenantId_idx" ON "CartItem"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_tenantId_userId_productId_key" ON "CartItem"("tenantId", "userId", "productId");

-- CreateIndex
CREATE INDEX "WishlistItem_tenantId_idx" ON "WishlistItem"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_tenantId_userId_productId_key" ON "WishlistItem"("tenantId", "userId", "productId");

-- CreateIndex
CREATE INDEX "ProductNotification_tenantId_idx" ON "ProductNotification"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductNotification_tenantId_userId_productId_key" ON "ProductNotification"("tenantId", "userId", "productId");

-- CreateIndex
CREATE INDEX "Size_tenantId_idx" ON "Size"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Size_tenantId_title_key" ON "Size"("tenantId", "title");

-- CreateIndex
CREATE INDEX "Color_tenantId_idx" ON "Color"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Color_tenantId_title_key" ON "Color"("tenantId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Color_tenantId_code_key" ON "Color"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Otp_tenantId_idx" ON "Otp"("tenantId");

-- CreateIndex
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_orderNo_key" ON "Order"("tenantId", "orderNo");

-- CreateIndex
CREATE INDEX "OrderProducts_tenantId_idx" ON "OrderProducts"("tenantId");

-- CreateIndex
CREATE INDEX "Stock_tenantId_idx" ON "Stock"("tenantId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_tenantId_idx" ON "OrderStatusHistory"("tenantId");

-- CreateIndex
CREATE INDEX "Config_tenantId_idx" ON "Config"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_tenantId_key_key" ON "Config"("tenantId", "key");


-- Seed Default SaaS Plans, Default SMK Tenant, Branding, Memberships, and Super Admin
INSERT INTO "Plan" ("code", "name", "description", "priceMonthly", "priceYearly", "currency", "maxProducts", "maxStorageMb", "customDomainAllowed", "aiChatbotEnabled", "autoProcurementEnabled", "isActive", "updatedAt")
VALUES
  ('STARTER', 'Starter', 'Launch your own branded online storefront with custom logo, color theme, and up to 50 products.', 999, 9990, 'INR', 50, 500, false, false, false, true, CURRENT_TIMESTAMP),
  ('GROWTH', 'Growth', 'Scale your store with custom domain support, up to 500 products, and priority tools.', 2499, 24990, 'INR', 500, 5000, true, false, false, true, CURRENT_TIMESTAMP),
  ('PRO', 'Pro AI', 'Full autonomous commerce suite with unlimited catalog growth, AI shopping assistant, and auto-restock agents.', 4999, 49990, 'INR', 5000, 25000, true, true, true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Tenant" ("id", "name", "slug", "isDefault", "status", "planId", "updatedAt")
SELECT
  'tenant_smk_default',
  'SMK',
  'smk',
  true,
  'ACTIVE'::"TenantStatus",
  p."id",
  CURRENT_TIMESTAMP
FROM "Plan" p
WHERE p."code" = 'PRO'
LIMIT 1
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "TenantBranding" (
  "tenantId",
  "storeName",
  "tagline",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "primaryDarkColor",
  "accentColor",
  "backgroundColor",
  "surfaceColor",
  "textPrimaryColor",
  "seoTitle",
  "seoDescription",
  "updatedAt"
)
VALUES (
  'tenant_smk_default',
  'SMK',
  'Curated collections & everyday essentials',
  '/images/logo/smk.jpg',
  '/favicon.ico',
  '#3C50E0',
  '#1C3FB7',
  '#0EA5E9',
  '#F6FAFF',
  '#FFFFFF',
  '#1C274C',
  'SMK | Online Shopping Store',
  'Shop curated collections, everyday essentials, and new arrivals at SMK with transparent pricing, real-time stock availability, and secure online checkout.',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("tenantId") DO NOTHING;

INSERT INTO "Subscription" ("tenantId", "planId", "provider", "status", "updatedAt")
SELECT
  'tenant_smk_default',
  p."id",
  'PLATFORM',
  'ACTIVE'::"SubscriptionStatus",
  CURRENT_TIMESTAMP
FROM "Plan" p
WHERE p."code" = 'PRO'
LIMIT 1;

-- Elevate designated Super Admin account
UPDATE "User"
SET "isPlatformAdmin" = true, "role" = 'ADMIN'::"Role"
WHERE LOWER("email") = 'mukeshkumar87086@gmail.com';

-- Backfill TenantMembership for all existing users on the default SMK tenant
INSERT INTO "TenantMembership" ("tenantId", "userId", "role", "status", "updatedAt")
SELECT
  'tenant_smk_default',
  u."id",
  CASE
    WHEN LOWER(u."email") = 'mukeshkumar87086@gmail.com' OR u."role" = 'ADMIN'::"Role" THEN 'STORE_OWNER'::"TenantRole"
    ELSE 'CUSTOMER'::"TenantRole"
  END,
  u."status",
  CURRENT_TIMESTAMP
FROM "User" u
ON CONFLICT ("tenantId", "userId") DO NOTHING;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantBranding" ADD CONSTRAINT "TenantBranding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPaymentConfig" ADD CONSTRAINT "TenantPaymentConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hsn" ADD CONSTRAINT "Hsn_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductNotification" ADD CONSTRAINT "ProductNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Size" ADD CONSTRAINT "Size_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Color" ADD CONSTRAINT "Color_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProducts" ADD CONSTRAINT "OrderProducts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
