-- AlterTable
ALTER TABLE "EstateProperty" ADD COLUMN     "pool" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EstatePropertyType" ADD COLUMN     "icon" TEXT;
