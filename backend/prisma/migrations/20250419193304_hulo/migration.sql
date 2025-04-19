/*
  Warnings:

  - A unique constraint covering the columns `[image_url]` on the table `materials` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "work_zones" ADD COLUMN     "latitud" REAL,
ADD COLUMN     "longitud" REAL;

-- CreateTable
CREATE TABLE "material_zone" (
    "id" SERIAL NOT NULL,
    "id_zona" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "cantidad_asignada" INTEGER NOT NULL,

    CONSTRAINT "material_zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materials_image_url_key" ON "materials"("image_url");

-- AddForeignKey
ALTER TABLE "material_zone" ADD CONSTRAINT "material_zone_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "work_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_zone" ADD CONSTRAINT "material_zone_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
