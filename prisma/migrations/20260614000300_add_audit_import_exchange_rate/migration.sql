CREATE TYPE "AuditAction" AS ENUM (
  'CREATE_GROUP',
  'ADD_MEMBER',
  'REMOVE_MEMBER',
  'CREATE_EXPENSE',
  'UPDATE_EXPENSE',
  'DELETE_EXPENSE',
  'CREATE_SETTLEMENT',
  'CREATE_IMPORT_SESSION',
  'CONFIRM_IMPORT',
  'REJECT_IMPORT'
);

ALTER TABLE "import_sessions"
  ADD COLUMN "group_id" TEXT,
  ADD COLUMN "uploaded_by_user_id" TEXT,
  ADD COLUMN "confirmed_by_user_id" TEXT,
  ADD COLUMN "rejected_by_user_id" TEXT,
  ADD COLUMN "confirmed_at" TIMESTAMP(3),
  ADD COLUMN "rejected_at" TIMESTAMP(3),
  ADD COLUMN "rejection_reason" TEXT;

ALTER TABLE "settlements" ADD COLUMN "import_session_id" TEXT;

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL,
  "actor_user_id" TEXT,
  "group_id" TEXT,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exchange_rates" (
  "id" TEXT NOT NULL,
  "from_currency" "Currency" NOT NULL,
  "to_currency" "Currency" NOT NULL,
  "rate" DECIMAL(18,6) NOT NULL,
  "effective_on" DATE NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_sessions_group_id_imported_at_idx" ON "import_sessions"("group_id", "imported_at");
CREATE INDEX "import_sessions_uploaded_by_user_id_idx" ON "import_sessions"("uploaded_by_user_id");
CREATE INDEX "settlements_import_session_id_idx" ON "settlements"("import_session_id");
CREATE INDEX "audit_logs_group_id_created_at_idx" ON "audit_logs"("group_id", "created_at");
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_effective_on_key" ON "exchange_rates"("from_currency", "to_currency", "effective_on");
CREATE INDEX "exchange_rates_from_currency_to_currency_effective_on_idx" ON "exchange_rates"("from_currency", "to_currency", "effective_on");

ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_rejected_by_user_id_fkey" FOREIGN KEY ("rejected_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_import_session_id_fkey" FOREIGN KEY ("import_session_id") REFERENCES "import_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
