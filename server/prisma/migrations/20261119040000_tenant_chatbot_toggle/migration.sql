-- AlterTable
ALTER TABLE "TenantBranding" ADD COLUMN IF NOT EXISTS "aiChatbotActive" BOOLEAN NOT NULL DEFAULT true;
