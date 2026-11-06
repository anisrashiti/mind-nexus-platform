-- DEMO: remove before production (retain applied migration history; drop the column in a follow-up migration).
ALTER TABLE "users" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;
