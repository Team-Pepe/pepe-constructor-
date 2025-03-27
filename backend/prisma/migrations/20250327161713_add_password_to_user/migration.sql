/*
  Warnings:

  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_user_id_fkey";

-- AlterTable
ALTER TABLE "materials" ALTER COLUMN "name" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "metrics" ALTER COLUMN "metric_type" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "requests" ALTER COLUMN "status" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "role_name" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE VARCHAR,
ALTER COLUMN "evidence_url" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "work_zones" ALTER COLUMN "name" SET DATA TYPE VARCHAR;
