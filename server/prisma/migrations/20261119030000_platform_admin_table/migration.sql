-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformAdmin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlatformAdmin_email_idx" ON "PlatformAdmin"("email");

-- Backfill PlatformAdmin from existing platform admins in User
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'isPlatformAdmin'
    ) THEN
        INSERT INTO "PlatformAdmin" ("email", "name")
        SELECT DISTINCT LOWER("email"), "name"
        FROM "User"
        WHERE "isPlatformAdmin" = true OR LOWER("email") = 'mukeshkumar87086@gmail.com'
        ON CONFLICT ("email") DO NOTHING;
    END IF;
END $$;

-- Ensure primary super admin is in PlatformAdmin
INSERT INTO "PlatformAdmin" ("email", "name")
VALUES ('mukeshkumar87086@gmail.com', 'Mukesh Kumar')
ON CONFLICT ("email") DO NOTHING;

-- DropColumn isPlatformAdmin from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "isPlatformAdmin";
