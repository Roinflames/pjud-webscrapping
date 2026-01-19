// Script Node.js para respaldar y limpiar archivos generados por el scraping
// Comprime todos los archivos en un ZIP y luego los elimina

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve(__dirname, 'outputs');
const BACKUP_DIR = path.resolve(__dirname, '../backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const ZIP_FILE = path.join(BACKUP_DIR, `scraping_backup_${TIMESTAMP}.zip`);

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log('📦 Respaldando archivos del scraping...\n');

// Buscar archivos a respaldar
function findFiles(pattern) {
  const files = [];
  if (!fs.existsSync(OUTPUT_DIR)) {
    return files;
  }
  
  const allFiles = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
  
  for (const file of allFiles) {
    if (file.isFile()) {
      const filename = file.name;
      if (pattern.test(filename)) {
        files.push(path.join(OUTPUT_DIR, filename));
      }
    }
  }
  
  return files;
}

const jsonFiles = findFiles(/^(resultado_|movimientos_).*\.json$/);
const csvFiles = findFiles(/^resultado_.*\.csv$/);
const pdfFiles = findFiles(/.*_doc_.*\.pdf$/);

// Archivos pdf_urls NO se respaldan, se eliminan directamente
const pdfUrlsFiles = findFiles(/^pdf_urls_.*\.json$/);
if (pdfUrlsFiles.length > 0) {
  console.log(`   🗑️  Eliminando ${pdfUrlsFiles.length} archivos pdf_urls_*.json (no se respaldan)...`);
  pdfUrlsFiles.forEach(file => {
    try {
      fs.unlinkSync(file);
    } catch (err) {
      console.warn(`   ⚠️  No se pudo eliminar: ${path.basename(file)}`);
    }
  });
  console.log(`   ✅ Archivos pdf_urls eliminados\n`);
}

console.log(`   📄 JSONs encontrados: ${jsonFiles.length}`);
console.log(`   📊 CSVs encontrados: ${csvFiles.length}`);
console.log(`   📑 PDFs encontrados: ${pdfFiles.length}`);

const totalFiles = jsonFiles.length + csvFiles.length + pdfFiles.length;

if (totalFiles === 0) {
  console.log('\n   ℹ️  No hay archivos para respaldar');
  process.exit(0);
}

// Usar archiver para crear ZIP (o zip nativo si está disponible)
let useNativeZip = false;
try {
  execSync('which zip', { stdio: 'ignore' });
  useNativeZip = true;
} catch (e) {
  // zip no disponible, usar módulo archiver si está instalado
}

if (useNativeZip) {
  console.log(`\n   📦 Comprimiendo archivos en ${path.basename(ZIP_FILE)}...`);
  
  try {
    // Cambiar al directorio outputs y crear zip
    const originalCwd = process.cwd();
    process.chdir(OUTPUT_DIR);
    
    const filesToZip = [
      ...jsonFiles.map(f => path.basename(f)),
      ...csvFiles.map(f => path.basename(f)),
      ...pdfFiles.map(f => path.basename(f))
    ].join(' ');
    
    execSync(`zip -q "${ZIP_FILE}" ${filesToZip}`, { cwd: OUTPUT_DIR });
    
    process.chdir(originalCwd);
    
    // Mover el zip al directorio de backups
    const zipInOutputs = path.join(OUTPUT_DIR, path.basename(ZIP_FILE));
    if (fs.existsSync(zipInOutputs)) {
      fs.renameSync(zipInOutputs, ZIP_FILE);
    }
    
    console.log('   ✅ Backup creado');
    
    // Obtener tamaño del archivo
    const stats = fs.statSync(ZIP_FILE);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   📦 Tamaño: ${fileSizeMB} MB`);
    
    // Eliminar archivos originales
    console.log('\n   🗑️  Eliminando archivos originales...');
    
    [...jsonFiles, ...csvFiles, ...pdfFiles].forEach(file => {
      try {
        fs.unlinkSync(file);
      } catch (err) {
        console.warn(`   ⚠️  No se pudo eliminar: ${path.basename(file)}`);
      }
    });
    
    console.log('   ✅ Archivos eliminados');
    console.log(`\n   📦 Backup guardado en: ${ZIP_FILE}`);
    
  } catch (error) {
    console.error('   ❌ Error al crear el backup:', error.message);
    console.error('   Los archivos NO fueron eliminados.');
    process.exit(1);
  }
} else {
  // Intentar usar módulo archiver (si está instalado)
  try {
    const archiver = require('archiver');
    const output = fs.createWriteStream(ZIP_FILE);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const fileSizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
      console.log('   ✅ Backup creado');
      console.log(`   📦 Tamaño: ${fileSizeMB} MB`);
      
      // Eliminar archivos originales
      console.log('\n   🗑️  Eliminando archivos originales...');
      
      [...jsonFiles, ...csvFiles, ...pdfFiles].forEach(file => {
        try {
          fs.unlinkSync(file);
        } catch (err) {
          console.warn(`   ⚠️  No se pudo eliminar: ${path.basename(file)}`);
        }
      });
      
      console.log('   ✅ Archivos eliminados');
      console.log(`\n   📦 Backup guardado en: ${ZIP_FILE}`);
    });
    
    archive.on('error', (err) => {
      console.error('   ❌ Error al crear el backup:', err.message);
      console.error('   Los archivos NO fueron eliminados.');
      process.exit(1);
    });
    
    archive.pipe(output);
    
    // Agregar archivos al zip
    [...jsonFiles, ...csvFiles, ...pdfFiles].forEach(file => {
      archive.file(file, { name: path.basename(file) });
    });
    
    archive.finalize();
    
  } catch (error) {
    console.error('   ❌ Error: No se pudo crear el backup.');
    console.error('   Instala zip: brew install zip (macOS) o apt-get install zip (Linux)');
    console.error('   O instala archiver: npm install archiver');
    process.exit(1);
  }
}

