-- AlterTable
ALTER TABLE "EstateProperty" ADD COLUMN     "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Las que ya existían arrancan con su fecha de carga.
UPDATE "EstateProperty" SET "publishedAt" = "createdAt";
