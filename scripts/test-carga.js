/**
 * Script de Prueba de Carga - Sistema PJUD
 * 
 * Simula la carga del sistema para determinar recursos necesarios
 * 
 * Uso:
 *   node scripts/test-carga.js
 *   node scripts/test-carga.js --scenarios 5 --duration 60
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuración
const SCENARIOS = process.argv.includes('--scenarios') 
  ? parseInt(process.argv[process.argv.indexOf('--scenarios') + 1]) || 3
  : 3;

const DURATION_MINUTES = process.argv.includes('--duration')
  ? parseInt(process.argv[process.argv.indexOf('--duration') + 1]) || 10
  : 10;

const DURATION_MS = DURATION_MINUTES * 60 * 1000;

// Métricas
const metrics = {
  startTime: Date.now(),
  cpuUsage: [],
  memoryUsage: [],
  diskUsage: [],
  apiRequests: 0,
  scrapingTasks: 0,
  errors: 0,
  peakMemory: 0,
  peakCpu: 0
};

/**
 * Obtener uso de CPU
 */
function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);
  
  return usage;
}

/**
 * Obtener uso de memoria
 */
function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const percent = (used / total) * 100;
  
  return {
    total: total / 1024 / 1024 / 1024, // GB
    used: used / 1024 / 1024 / 1024,   // GB
    free: free / 1024 / 1024 / 1024,    // GB
    percent: percent.toFixed(2)
  };
}

/**
 * Obtener uso de disco (simulado)
 */
function getDiskUsage() {
  try {
    const stats = fs.statSync(path.resolve(__dirname, '../src/outputs'));
    // Simulación básica - en producción usar 'df' o 'du'
    return {
      used: 0, // Se calcularía con du -sh
      available: 50, // GB asumidos
      percent: 0
    };
  } catch (e) {
    return { used: 0, available: 50, percent: 0 };
  }
}

/**
 * Simular petición a API
 */
async function simulateApiRequest() {
  return new Promise((resolve) => {
    // Simular tiempo de respuesta de API (10-50ms)
    const delay = Math.random() * 40 + 10;
    setTimeout(() => {
      metrics.apiRequests++;
      resolve();
    }, delay);
  });
}

/**
 * Simular tarea de scraping (más pesada)
 */
async function simulateScrapingTask() {
  return new Promise((resolve) => {
    // Simular tiempo de scraping (30-120 segundos)
    const delay = (Math.random() * 90 + 30) * 1000;
    
    // Simular uso de memoria durante scraping
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    setTimeout(() => {
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryDelta = endMemory - startMemory;
      
      metrics.scrapingTasks++;
      
      // Actualizar peak memory si es mayor
      if (memoryDelta > metrics.peakMemory) {
        metrics.peakMemory = memoryDelta;
      }
      
      resolve();
    }, delay);
  });
}

/**
 * Simular listener de BD
 */
async function simulateListenerCheck() {
  return new Promise((resolve) => {
    // Simular verificación de BD (100-500ms)
    const delay = Math.random() * 400 + 100;
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

/**
 * Escenario 1: Carga Normal
 * - 1 scraping cada 5 minutos
 * - 10 peticiones API por minuto
 * - Listener cada 10 segundos
 */
async function scenarioNormal() {
  console.log('📊 Escenario: Carga Normal');
  
  const scrapingInterval = setInterval(() => {
    simulateScrapingTask().catch(err => {
      console.error('Error en scraping:', err);
      metrics.errors++;
    });
  }, 5 * 60 * 1000); // Cada 5 minutos

  const apiInterval = setInterval(() => {
    for (let i = 0; i < 10; i++) {
      simulateApiRequest();
    }
  }, 60 * 1000); // Cada minuto

  const listenerInterval = setInterval(() => {
    simulateListenerCheck();
  }, 10 * 1000); // Cada 10 segundos

  return () => {
    clearInterval(scrapingInterval);
    clearInterval(apiInterval);
    clearInterval(listenerInterval);
  };
}

/**
 * Escenario 2: Carga Media
 * - 1 scraping cada 2 minutos
 * - 30 peticiones API por minuto
 * - Listener cada 5 segundos
 */
async function scenarioMedium() {
  console.log('📊 Escenario: Carga Media');
  
  const scrapingInterval = setInterval(() => {
    simulateScrapingTask().catch(err => {
      console.error('Error en scraping:', err);
      metrics.errors++;
    });
  }, 2 * 60 * 1000); // Cada 2 minutos

  const apiInterval = setInterval(() => {
    for (let i = 0; i < 30; i++) {
      simulateApiRequest();
    }
  }, 60 * 1000); // Cada minuto

  const listenerInterval = setInterval(() => {
    simulateListenerCheck();
  }, 5 * 1000); // Cada 5 segundos

  return () => {
    clearInterval(scrapingInterval);
    clearInterval(apiInterval);
    clearInterval(listenerInterval);
  };
}

/**
 * Escenario 3: Carga Alta
 * - 1 scraping cada minuto
 * - 60 peticiones API por minuto
 * - Listener cada 2 segundos
 */
async function scenarioHigh() {
  console.log('📊 Escenario: Carga Alta');
  
  const scrapingInterval = setInterval(() => {
    simulateScrapingTask().catch(err => {
      console.error('Error en scraping:', err);
      metrics.errors++;
    });
  }, 60 * 1000); // Cada minuto

  const apiInterval = setInterval(() => {
    for (let i = 0; i < 60; i++) {
      simulateApiRequest();
    }
  }, 60 * 1000); // Cada minuto

  const listenerInterval = setInterval(() => {
    simulateListenerCheck();
  }, 2 * 1000); // Cada 2 segundos

  return () => {
    clearInterval(scrapingInterval);
    clearInterval(apiInterval);
    clearInterval(listenerInterval);
  };
}

/**
 * Escenario 4: Carga Pico (Máxima)
 * - 1 scraping cada 30 segundos
 * - 100 peticiones API por minuto
 * - Listener cada segundo
 */
async function scenarioPeak() {
  console.log('📊 Escenario: Carga Pico (Máxima)');
  
  const scrapingInterval = setInterval(() => {
    simulateScrapingTask().catch(err => {
      console.error('Error en scraping:', err);
      metrics.errors++;
    });
  }, 30 * 1000); // Cada 30 segundos

  const apiInterval = setInterval(() => {
    for (let i = 0; i < 100; i++) {
      simulateApiRequest();
    }
  }, 60 * 1000); // Cada minuto

  const listenerInterval = setInterval(() => {
    simulateListenerCheck();
  }, 1000); // Cada segundo

  return () => {
    clearInterval(scrapingInterval);
    clearInterval(apiInterval);
    clearInterval(listenerInterval);
  };
}

/**
 * Monitorear recursos
 */
function startMonitoring() {
  const monitorInterval = setInterval(() => {
    const cpu = getCpuUsage();
    const memory = getMemoryUsage();
    const disk = getDiskUsage();
    
    metrics.cpuUsage.push(cpu);
    metrics.memoryUsage.push(memory);
    metrics.diskUsage.push(disk);
    
    if (cpu > metrics.peakCpu) {
      metrics.peakCpu = cpu;
    }
    
    if (memory.used > metrics.peakMemory) {
      metrics.peakMemory = memory.used;
    }
    
    // Mostrar métricas cada 30 segundos
    const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(0);
    console.log(`[${elapsed}s] CPU: ${cpu}% | RAM: ${memory.used.toFixed(2)}GB (${memory.percent}%) | API: ${metrics.apiRequests} | Scraping: ${metrics.scrapingTasks}`);
  }, 5000); // Cada 5 segundos
  
  return monitorInterval;
}

/**
 * Generar reporte final
 */
function generateReport() {
  const endTime = Date.now();
  const duration = (endTime - metrics.startTime) / 1000 / 60; // minutos
  
  const avgCpu = metrics.cpuUsage.length > 0
    ? (metrics.cpuUsage.reduce((a, b) => a + b, 0) / metrics.cpuUsage.length).toFixed(2)
    : 0;
  
  const avgMemory = metrics.memoryUsage.length > 0
    ? (metrics.memoryUsage.reduce((a, b) => a + b.used, 0) / metrics.memoryUsage.length).toFixed(2)
    : 0;
  
  const maxMemory = Math.max(...metrics.memoryUsage.map(m => m.used)).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DE PRUEBA DE CARGA');
  console.log('='.repeat(60));
  console.log(`⏱️  Duración: ${duration.toFixed(2)} minutos`);
  console.log(`📈 Escenarios ejecutados: ${SCENARIOS}`);
  console.log('');
  console.log('💻 RECURSOS:');
  console.log(`   CPU promedio: ${avgCpu}%`);
  console.log(`   CPU pico: ${metrics.peakCpu}%`);
  console.log(`   RAM promedio: ${avgMemory} GB`);
  console.log(`   RAM pico: ${maxMemory} GB`);
  console.log(`   RAM total disponible: ${os.totalmem() / 1024 / 1024 / 1024} GB`);
  console.log('');
  console.log('📊 ACTIVIDAD:');
  console.log(`   Peticiones API: ${metrics.apiRequests}`);
  console.log(`   Tareas scraping: ${metrics.scrapingTasks}`);
  console.log(`   Errores: ${metrics.errors}`);
  console.log('');
  console.log('💡 RECOMENDACIONES:');
  
  const recommendedRam = Math.ceil(parseFloat(maxMemory) * 1.5); // 50% margen
  const recommendedCpu = Math.ceil(metrics.peakCpu / 100 * 2); // 2 vCPU base
  
  console.log(`   RAM recomendada: ${recommendedRam} GB (mínimo ${Math.ceil(parseFloat(maxMemory))} GB)`);
  console.log(`   CPU recomendada: ${recommendedCpu} vCPU (mínimo 2 vCPU)`);
  console.log(`   Disco: 50 GB mínimo (PDFs se acumulan)`);
  console.log('');
  
  if (metrics.peakCpu > 80) {
    console.log('⚠️  ADVERTENCIA: CPU muy alta, considera más vCPU');
  }
  
  if (parseFloat(maxMemory) > os.totalmem() / 1024 / 1024 / 1024 * 0.8) {
    console.log('⚠️  ADVERTENCIA: RAM muy alta, considera más memoria');
  }
  
  console.log('='.repeat(60));
  
  // Guardar reporte en archivo
  const reportPath = path.resolve(__dirname, '../logs/test-carga-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    duration_minutes: duration,
    scenarios: SCENARIOS,
    metrics: {
      cpu: {
        average: parseFloat(avgCpu),
        peak: metrics.peakCpu
      },
      memory: {
        average_gb: parseFloat(avgMemory),
        peak_gb: parseFloat(maxMemory),
        total_gb: os.totalmem() / 1024 / 1024 / 1024
      },
      activity: {
        api_requests: metrics.apiRequests,
        scraping_tasks: metrics.scrapingTasks,
        errors: metrics.errors
      }
    },
    recommendations: {
      ram_gb: recommendedRam,
      cpu_vcpu: recommendedCpu,
      disk_gb: 50
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);
}

/**
 * Función principal
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PRUEBA DE CARGA - Sistema PJUD');
  console.log('='.repeat(60));
  console.log(`📊 Escenarios: ${SCENARIOS}`);
  console.log(`⏱️  Duración: ${DURATION_MINUTES} minutos`);
  console.log(`💻 CPU disponibles: ${os.cpus().length}`);
  console.log(`💾 RAM total: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log('='.repeat(60) + '\n');
  
  const scenarios = [
    scenarioNormal,
    scenarioMedium,
    scenarioHigh,
    scenarioPeak
  ];
  
  const cleaners = [];
  const monitorInterval = startMonitoring();
  
  // Ejecutar escenarios seleccionados
  for (let i = 0; i < Math.min(SCENARIOS, scenarios.length); i++) {
    const cleaner = await scenarios[i]();
    cleaners.push(cleaner);
    
    if (i < SCENARIOS - 1) {
      console.log(`\n⏸️  Esperando 30 segundos antes del siguiente escenario...\n`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  // Ejecutar por la duración especificada
  console.log(`\n⏳ Ejecutando prueba por ${DURATION_MINUTES} minutos...\n`);
  await new Promise(resolve => setTimeout(resolve, DURATION_MS));
  
  // Limpiar
  console.log('\n🛑 Deteniendo prueba...');
  cleaners.forEach(cleaner => cleaner());
  clearInterval(monitorInterval);
  
  // Generar reporte
  generateReport();
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error en prueba de carga:', error);
  process.exit(1);
});
