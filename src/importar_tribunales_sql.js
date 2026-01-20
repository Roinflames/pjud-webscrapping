// Script para importar tribunales PJUD a MySQL
// Genera archivo SQL con las tablas: pjud_competencias, pjud_cortes, pjud_tribunales

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'outputs', 'tribunales_pjud_completo.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'importar_tribunales.sql');

function escapeSQL(str) {
  if (!str) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function generateSQL() {
  console.log('📂 Leyendo JSON de tribunales...');
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

  const sql = [];

  // Header
  sql.push('-- Script generado automáticamente para importar tribunales PJUD');
  sql.push(`-- Fecha extracción: ${data.fecha_extraccion}`);
  sql.push(`-- Generado: ${new Date().toISOString()}`);
  sql.push('');
  sql.push('SET NAMES utf8mb4;');
  sql.push('SET FOREIGN_KEY_CHECKS = 0;');
  sql.push('');

  // Tabla competencias
  sql.push('-- =============================================');
  sql.push('-- TABLA: pjud_competencias');
  sql.push('-- =============================================');
  sql.push(`
DROP TABLE IF EXISTS pjud_competencias;
CREATE TABLE pjud_competencias (
  id INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);

  // Insertar competencias
  sql.push('INSERT INTO pjud_competencias (id, nombre) VALUES');
  const compValues = data.competencias.map(c => `  (${c.id}, ${escapeSQL(c.nombre)})`);
  sql.push(compValues.join(',\n') + ';');
  sql.push('');

  // Tabla cortes
  sql.push('-- =============================================');
  sql.push('-- TABLA: pjud_cortes');
  sql.push('-- =============================================');
  sql.push(`
DROP TABLE IF EXISTS pjud_cortes;
CREATE TABLE pjud_cortes (
  id INT PRIMARY KEY,
  competencia_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_competencia (competencia_id),
  FOREIGN KEY (competencia_id) REFERENCES pjud_competencias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);

  // Tabla tribunales
  sql.push('-- =============================================');
  sql.push('-- TABLA: pjud_tribunales');
  sql.push('-- =============================================');
  sql.push(`
DROP TABLE IF EXISTS pjud_tribunales;
CREATE TABLE pjud_tribunales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pjud_id INT NOT NULL,
  corte_id INT NOT NULL,
  competencia_id INT NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  disabled TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tribunal_comp (pjud_id, competencia_id),
  INDEX idx_corte (corte_id),
  INDEX idx_competencia (competencia_id),
  INDEX idx_pjud_id (pjud_id),
  FOREIGN KEY (corte_id) REFERENCES pjud_cortes(id),
  FOREIGN KEY (competencia_id) REFERENCES pjud_competencias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);

  // Recolectar cortes y tribunales
  const cortesSet = new Map();
  const tribunalesMap = new Map(); // Clave: "pjud_id-competencia_id"

  for (const competenciaGroup of data.cortes) {
    const competenciaId = competenciaGroup.competencia.id;

    for (const corteGroup of competenciaGroup.cortes) {
      const corteId = corteGroup.corte.id;
      const corteNombre = corteGroup.corte.nombre;

      // Guardar corte (evitar duplicados)
      if (!cortesSet.has(corteId)) {
        cortesSet.set(corteId, {
          id: corteId,
          competencia_id: competenciaId,
          nombre: corteNombre
        });
      }

      // Guardar tribunales (evitar duplicados por pjud_id + competencia)
      for (const tribunal of corteGroup.tribunales) {
        const key = `${tribunal.value}-${competenciaId}`;
        if (!tribunalesMap.has(key)) {
          tribunalesMap.set(key, {
            id: tribunal.value,
            corte_id: corteId,
            competencia_id: competenciaId,
            nombre: tribunal.text,
            disabled: tribunal.disabled ? 1 : 0
          });
        }
      }
    }
  }

  const tribunales = Array.from(tribunalesMap.values());

  // Insertar cortes
  sql.push('-- Insertar cortes');
  sql.push('INSERT INTO pjud_cortes (id, competencia_id, nombre) VALUES');
  const corteValues = Array.from(cortesSet.values()).map(c =>
    `  (${c.id}, ${c.competencia_id}, ${escapeSQL(c.nombre)})`
  );
  sql.push(corteValues.join(',\n') + ';');
  sql.push('');

  // Insertar tribunales en lotes de 100
  sql.push('-- Insertar tribunales');
  const BATCH_SIZE = 100;
  for (let i = 0; i < tribunales.length; i += BATCH_SIZE) {
    const batch = tribunales.slice(i, i + BATCH_SIZE);
    sql.push('INSERT INTO pjud_tribunales (pjud_id, corte_id, competencia_id, nombre, disabled) VALUES');
    const tribValues = batch.map(t =>
      `  (${t.id}, ${t.corte_id}, ${t.competencia_id}, ${escapeSQL(t.nombre)}, ${t.disabled})`
    );
    sql.push(tribValues.join(',\n') + ';');
    sql.push('');
  }

  // Footer
  sql.push('SET FOREIGN_KEY_CHECKS = 1;');
  sql.push('');
  sql.push('-- Resumen');
  sql.push(`-- Competencias: ${data.competencias.length}`);
  sql.push(`-- Cortes: ${cortesSet.size}`);
  sql.push(`-- Tribunales: ${tribunales.length}`);

  return {
    sql: sql.join('\n'),
    stats: {
      competencias: data.competencias.length,
      cortes: cortesSet.size,
      tribunales: tribunales.length
    }
  };
}

// Ejecutar
try {
  const result = generateSQL();
  fs.writeFileSync(OUTPUT_FILE, result.sql, 'utf8');

  console.log('✅ Archivo SQL generado:', OUTPUT_FILE);
  console.log('');
  console.log('📊 Estadísticas:');
  console.log(`   Competencias: ${result.stats.competencias}`);
  console.log(`   Cortes: ${result.stats.cortes}`);
  console.log(`   Tribunales: ${result.stats.tribunales}`);
  console.log('');
  console.log('🚀 Para importar ejecuta:');
  console.log('   mysql -u root -p codi_ejamtest < importar_tribunales.sql');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
