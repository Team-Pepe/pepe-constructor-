-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_material_id_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "job_id" INTEGER;

-- CreateTable
CREATE TABLE "jobs" (
    "idJob" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("idJob")
);

-- CreateTable
CREATE TABLE "material_requests" (
    "id" BIGSERIAL NOT NULL,
    "zone_id" BIGINT NOT NULL,
    "quantity_requested" DOUBLE PRECISION,
    "message" TEXT,
    "status" VARCHAR,
    "created_at" TIMESTAMP(6),
    "user_id" INTEGER,
    "material" TEXT,

    CONSTRAINT "material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "zone_id" INTEGER,
    "check_in_time" TIMESTAMP(6),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photo_url" TEXT,
    "status" VARCHAR DEFAULT 'active',
    "check_out_time" TIMESTAMP(6),
    "work_date" DATE,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "work_zone_id" INTEGER,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("idJob") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_work_zone_id_fkey" FOREIGN KEY ("work_zone_id") REFERENCES "work_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
