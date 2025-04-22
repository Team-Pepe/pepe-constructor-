-- Create material_requests table
CREATE TABLE IF NOT EXISTS "material_requests" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "zone_id" INTEGER NOT NULL,
  "material_id" INTEGER,
  "message" TEXT NOT NULL,
  "quantity_requested" INTEGER NOT NULL,
  "status" VARCHAR(255) NOT NULL DEFAULT 'pending',
  "admin_comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("zone_id") REFERENCES "work_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE
); 