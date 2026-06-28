/*
  Warnings:

  - You are about to drop the column `prcessedBy` on the `Payout` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "prcessedBy",
ADD COLUMN     "processedBy" TEXT;
