ALTER TABLE "Recipe"
  ADD COLUMN "titleSr" TEXT,
  ADD COLUMN "descriptionSr" TEXT,
  ADD COLUMN "videoUrl" TEXT,
  ADD COLUMN "instagramId" TEXT;

CREATE UNIQUE INDEX "Recipe_instagramId_key" ON "Recipe"("instagramId");

ALTER TABLE "Ingredient" ADD COLUMN "textSr" TEXT;
ALTER TABLE "Step" ADD COLUMN "textSr" TEXT;
