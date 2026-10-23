-- Migración inicial en PostgreSQL (Unidad 8). Reemplaza las tres migraciones de MySQL
-- (crear_incidentes, crear_usuarios e indice_prioridad_estado): el esquema final es el mismo.
-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('Alta', 'Media', 'Baja');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('Registrado', 'En revisión', 'Resuelto');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ANALISTA', 'SUPERVISOR', 'ADMIN');

-- CreateTable
CREATE TABLE "Incidente" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(40) NOT NULL,
    "fecha" DATE NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'Media',
    "estado" "Estado" NOT NULL DEFAULT 'Registrado',
    "descripcion" VARCHAR(1000) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "evidencia" VARCHAR(150) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incidente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "passwordHash" VARCHAR(100) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ANALISTA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Incidente_titulo_key" ON "Incidente"("titulo");

-- CreateIndex
CREATE INDEX "Incidente_estado_idx" ON "Incidente"("estado");

-- CreateIndex
CREATE INDEX "Incidente_prioridad_estado_idx" ON "Incidente"("prioridad", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

