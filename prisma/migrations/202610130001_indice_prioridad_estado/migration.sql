-- DropIndex
DROP INDEX `Incidente_prioridad_idx` ON `Incidente`;

-- CreateIndex
CREATE INDEX `Incidente_prioridad_estado_idx` ON `Incidente`(`prioridad`, `estado`);

