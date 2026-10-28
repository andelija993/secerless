ALTER TABLE "Recipe" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Recipe_position_idx" ON "Recipe"("position");

-- Start with the current order (newest first) so nothing jumps around
UPDATE "Recipe" r SET "position" = o.rn
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC) AS rn FROM "Recipe") o
WHERE r.id = o.id;
