-- Add DEFAULT for ringcentral_tokens.id so Supabase upsert (insert) works without providing id.
-- gen_random_uuid() is built-in in PostgreSQL 13+.
ALTER TABLE "ringcentral_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
