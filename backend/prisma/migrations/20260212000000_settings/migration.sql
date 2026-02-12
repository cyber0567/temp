-- AlterTable: add timezone and currency to profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC';
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';

-- AlterTable: add industry and company_size to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "company_size" TEXT;

-- CreateTable: user notification settings
CREATE TABLE IF NOT EXISTS "user_notification_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "email_alerts" BOOLEAN NOT NULL DEFAULT true,
    "flagged_calls" BOOLEAN NOT NULL DEFAULT true,
    "daily_digest" BOOLEAN NOT NULL DEFAULT false,
    "weekly_report" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_notification_settings_user_id_key" ON "user_notification_settings"("user_id");

-- CreateTable: org compliance settings
CREATE TABLE IF NOT EXISTS "org_compliance_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "auto_review" BOOLEAN NOT NULL DEFAULT true,
    "require_disclosure" BOOLEAN NOT NULL DEFAULT true,
    "auto_flag_threshold" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "org_compliance_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "org_compliance_settings_org_id_key" ON "org_compliance_settings"("org_id");
ALTER TABLE "org_compliance_settings" ADD CONSTRAINT "org_compliance_settings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: org quality settings
CREATE TABLE IF NOT EXISTS "org_quality_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "min_qa_score" INTEGER NOT NULL DEFAULT 70,
    "auto_approve_threshold" INTEGER NOT NULL DEFAULT 85,
    "enable_escalation" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "org_quality_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "org_quality_settings_org_id_key" ON "org_quality_settings"("org_id");
ALTER TABLE "org_quality_settings" ADD CONSTRAINT "org_quality_settings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
