-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bloodType" TEXT,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "users_id_seq";
