-- CreateTable
CREATE TABLE `Incidente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(100) NOT NULL,
    `tipo` VARCHAR(40) NOT NULL,
    `fecha` DATE NOT NULL,
    `prioridad` ENUM('Alta', 'Media', 'Baja') NOT NULL DEFAULT 'Media',
    `estado` ENUM('Registrado', 'En revisión', 'Resuelto') NOT NULL DEFAULT 'Registrado',
    `descripcion` VARCHAR(1000) NOT NULL,
    `correo` VARCHAR(120) NOT NULL,
    `evidencia` VARCHAR(150) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Incidente_titulo_key`(`titulo`),
    INDEX `Incidente_estado_idx`(`estado`),
    INDEX `Incidente_prioridad_idx`(`prioridad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
