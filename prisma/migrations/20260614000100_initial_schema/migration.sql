CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES');
CREATE TYPE "Currency" AS ENUM ('INR', 'USD');
CREATE TYPE "ImportStatus" AS ENUM ('PENDING_REVIEW', 'CONFIRMED', 'REJECTED');
CREATE TYPE "AnomalyType" AS ENUM (
  'DUPLICATE_ROW',
  'DUPLICATE_EXPENSE',
  'SETTLEMENT_AS_EXPENSE',
  'CURRENCY_MISMATCH',
  'MEMBER_LEFT',
  'MEMBER_NOT_YET_JOINED',
  'NEGATIVE_AMOUNT',
  'INCONSISTENT_DATE_FORMAT',
  'MISSING_FIELD',
  'NAME_MISMATCH',
  'UNKNOWN_MEMBER',
  'SPLIT_DOESNT_ADD_UP'
);

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "groups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "group_members" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "joined_at" DATE NOT NULL,
  "left_at" DATE,
  CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "paid_by_user_id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "total_amount" DECIMAL(12,2) NOT NULL,
  "currency" "Currency" NOT NULL,
  "amount_in_inr" DECIMAL(12,2) NOT NULL,
  "split_type" "SplitType" NOT NULL,
  "expense_date" DATE NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "is_flagged_anomaly" BOOLEAN NOT NULL DEFAULT false,
  "anomaly_reason" TEXT,
  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expense_splits" (
  "id" TEXT NOT NULL,
  "expense_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "amount_owed" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "expense_splits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settlements" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "paid_by_user_id" TEXT NOT NULL,
  "paid_to_user_id" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "settled_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_sessions" (
  "id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "ImportStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  CONSTRAINT "import_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_anomalies" (
  "id" TEXT NOT NULL,
  "import_session_id" TEXT NOT NULL,
  "row_number" INTEGER NOT NULL,
  "raw_data" JSONB NOT NULL,
  "anomaly_type" "AnomalyType" NOT NULL,
  "anomaly_description" TEXT NOT NULL,
  "action_taken" TEXT NOT NULL,
  "approved_by_user_id" TEXT,
  "approved_at" TIMESTAMP(3),
  CONSTRAINT "import_anomalies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "group_members_group_id_joined_at_left_at_idx" ON "group_members"("group_id", "joined_at", "left_at");
CREATE UNIQUE INDEX "group_members_group_id_user_id_joined_at_key" ON "group_members"("group_id", "user_id", "joined_at");
CREATE INDEX "expenses_group_id_expense_date_idx" ON "expenses"("group_id", "expense_date");
CREATE INDEX "expenses_paid_by_user_id_idx" ON "expenses"("paid_by_user_id");
CREATE UNIQUE INDEX "expense_splits_expense_id_user_id_key" ON "expense_splits"("expense_id", "user_id");
CREATE INDEX "expense_splits_user_id_idx" ON "expense_splits"("user_id");
CREATE INDEX "settlements_group_id_settled_at_idx" ON "settlements"("group_id", "settled_at");
CREATE INDEX "import_anomalies_import_session_id_idx" ON "import_anomalies"("import_session_id");

ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_user_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_paid_by_user_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_paid_to_user_id_fkey" FOREIGN KEY ("paid_to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_anomalies" ADD CONSTRAINT "import_anomalies_import_session_id_fkey" FOREIGN KEY ("import_session_id") REFERENCES "import_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_anomalies" ADD CONSTRAINT "import_anomalies_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

