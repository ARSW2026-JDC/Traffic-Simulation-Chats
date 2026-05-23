/*
  Warnings:

  - You are about to drop the `ChangeLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChangeLog" DROP CONSTRAINT "ChangeLog_userId_fkey";

-- DropTable
DROP TABLE "ChangeLog";
