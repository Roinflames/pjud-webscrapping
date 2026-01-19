#!/bin/bash

# Script para crear la tabla de cola de scraping si no existe

echo "🔧 Creando tabla pjud_cola_scraping si no existe..."

# Leer configuración de .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-codi_ejamtest}
DB_PORT=${DB_PORT:-3306}

# Ejecutar SQL para crear la tabla
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -P "$DB_PORT" "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS pjud_cola_scraping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rit VARCHAR(50) NOT NULL,
  competencia_id INT,
  corte_id INT,
  tribunal_id INT,
  tipo_causa VARCHAR(10) DEFAULT 'C',
  estado ENUM('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR') DEFAULT 'PENDIENTE',
  intentos INT DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_procesamiento DATETIME NULL,
  fecha_completado DATETIME NULL,
  error_message TEXT NULL,
  INDEX idx_estado (estado),
  INDEX idx_rit (rit),
  INDEX idx_fecha_creacion (fecha_creacion)
);
EOF

if [ $? -eq 0 ]; then
    echo "✅ Tabla pjud_cola_scraping creada/verificada exitosamente"
else
    echo "❌ Error creando la tabla"
    exit 1
fi
