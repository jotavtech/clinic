/*
  Warnings:

  - You are about to drop the `Massagista` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Massagista";

-- CreateTable
CREATE TABLE "massagistas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "foto_url" TEXT NOT NULL,
    "videoUrl" TEXT,
    "suite_master" BOOLEAN NOT NULL DEFAULT false,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "massagistas_pkey" PRIMARY KEY ("id")
);
