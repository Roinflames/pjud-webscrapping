require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para extraer tribunales usando curl directamente
 * Más rápido y eficiente que usar navegador
 */

// IDs de cortes
const CORTES = [
  { id: '10', nombre: 'C.A. de Arica' },
  { id: '11', nombre: 'C.A. de Iquique' },
  { id: '15', nombre: 'C.A. de Antofagasta' },
  { id: '20', nombre: 'C.A. de Copiapó' },
  { id: '25', nombre: 'C.A. de La Serena' },
  { id: '30', nombre: 'C.A. de Valparaíso' },
  { id: '35', nombre: 'C.A. de Rancagua' },
  { id: '40', nombre: 'C.A. de Talca' },
  { id: '45', nombre: 'C.A. de Chillan' },
  { id: '46', nombre: 'C.A. de Concepción' },
  { id: '50', nombre: 'C.A. de Temuco' },
  { id: '55', nombre: 'C.A. de Valdivia' },
  { id: '56', nombre: 'C.A. de Puerto Montt' },
  { id: '60', nombre: 'C.A. de Coyhaique' },
  { id: '61', nombre: 'C.A. de Punta Arenas' },
  { id: '90', nombre: 'C.A. de Santiago' },
  { id: '91', nombre: 'C.A. de San Miguel' }
];

const COMPETENCIAS = [
  { id: '1', nombre: 'Corte Suprema' },
  { id: '2', nombre: 'Corte Apelaciones' },
  { id: '3', nombre: 'Civil' },
  { id: '4', nombre: 'Laboral' },
  { id: '5', nombre: 'Penal' },
  { id: '6', nombre: 'Cobranza' },
  { id: '7', nombre: 'Familia' }
];

const BASE_URL = process.env.OJV_URL || 'https://oficinajudicialvirtual.pjud.cl';

/**
 * Obtener cookies de sesión primero
 */
function getSessionCookies() {
  try {
    console.log('🍪 Obteniendo cookies de sesión...');
    const cookieJar = path.resolve(__dirname, 'outputs/cookies.txt');
    
    const curlCmd = `curl -s -c "${cookieJar}" -L "${BASE_URL}/indexN.php" -o /dev/null`;
    execSync(curlCmd);
    
    console.log('✅ Cookies obtenidas');
    return cookieJar;
  } catch (error) {
    console.warn('⚠️ No se pudieron obtener cookies, continuando sin ellas');
    return null;
  }
}

/**
 * Hacer petición curl para obtener tribunales
 */
function getTribunalesPorCorte(competenciaId, corteId, cookieJar) {
  try {
    // Intentar diferentes endpoints posibles
    const endpoints = [
      `${BASE_URL}/includes/ajax/getTribunales.php`,
      `${BASE_URL}/ajax/getTribunales.php`,
      `${BASE_URL}/indexN.php?action=getTribunales`,
      `${BASE_URL}/includes/getTribunales.php`
    ];

    for (const endpoint of endpoints) {
      try {
        let curlCmd = `curl -s -L "${endpoint}"`;
        
        if (cookieJar) {
          curlCmd += ` -b "${cookieJar}"`;
        }

        // Intentar POST
        curlCmd += ` -d "competencia=${competenciaId}&corte=${corteId}"`;
        curlCmd += ` -H "Content-Type: application/x-www-form-urlencoded"`;
        curlCmd += ` -H "X-Requested-With: XMLHttpRequest"`;

        const response = execSync(curlCmd, { encoding: 'utf-8', timeout: 10000 });
        
        // Verificar si la respuesta contiene datos de tribunales
        if (response && (response.includes('<option') || response.includes('tribunal') || response.includes('value'))) {
          return parseTribunalesFromHTML(response);
        }
      } catch (e) {
        continue;
      }
    }

    return [];
  } catch (error) {
    console.warn(`   ⚠️ Error obteniendo tribunales: ${error.message}`);
    return [];
  }
}

/**
 * Parsear HTML para extraer opciones de tribunales
 */
function parseTribunalesFromHTML(html) {
  const tribunales = [];
  const optionRegex = /<option\s+value="(\d+)"[^>]*>([^<]+)<\/option>/gi;
  let match;

  while ((match = optionRegex.exec(html)) !== null) {
    const value = match[1];
    const text = match[2].trim();
    
    if (value && value !== '0' && text && !text.includes('Seleccione')) {
      tribunales.push({
        value: value,
        text: text
      });
    }
  }

  return tribunales;
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Extrayendo tribunales mediante curl...\n');

  const cookieJar = getSessionCookies();

  const resultado = {
    fecha_extraccion: new Date().toISOString(),
    url: BASE_URL,
    competencias: COMPETENCIAS,
    cortes: [],
    resumen: {
      total_competencias: COMPETENCIAS.length,
      total_cortes: CORTES.length,
      total_tribunales: 0
    }
  };

  // Procesar cada competencia
  for (const competencia of COMPETENCIAS) {
    console.log(`\n📋 Procesando Competencia: ${competencia.id} - ${competencia.nombre}`);
    
    const cortesConTribunales = [];

    // Procesar cada corte
    for (const corte of CORTES) {
      console.log(`   🔍 Procesando Corte: ${corte.id} - ${corte.nombre}`);

      const tribunales = getTribunalesPorCorte(competencia.id, corte.id, cookieJar);

      if (tribunales.length > 0) {
        console.log(`      ✅ Encontrados ${tribunales.length} tribunales`);
        tribunales.slice(0, 5).forEach(t => {
          console.log(`         - ${t.value}: ${t.text}`);
        });
        if (tribunales.length > 5) {
          console.log(`         ... y ${tribunales.length - 5} más`);
        }
      } else {
        console.log(`      ⚠️ No se encontraron tribunales`);
      }

      cortesConTribunales.push({
        corte: corte,
        tribunales: tribunales
      });

      resultado.resumen.total_tribunales += tribunales.length;

      // Delay entre peticiones
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    resultado.cortes.push({
      competencia: competencia,
      cortes: cortesConTribunales
    });
  }

  // Guardar resultados
  const outputDir = path.resolve(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'tribunales_pjud_curl.json');
  fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2), 'utf-8');
  console.log(`\n✅ Resultados guardados en: ${outputPath}`);

  // Versión simplificada
  const idsSimples = {
    competencias: COMPETENCIAS,
    cortes: CORTES,
    tribunales: resultado.cortes.flatMap(comp => 
      comp.cortes.flatMap(corte => 
        corte.tribunales.map(t => ({
          id: t.value,
          nombre: t.text,
          corte_id: corte.corte.id,
          corte_nombre: corte.corte.nombre,
          competencia_id: comp.competencia.id,
          competencia_nombre: comp.competencia.nombre
        }))
      )
    )
  };

  const idsPath = path.join(outputDir, 'tribunales_pjud_curl_ids.json');
  fs.writeFileSync(idsPath, JSON.stringify(idsSimples, null, 2), 'utf-8');
  console.log(`✅ IDs simplificados guardados en: ${idsPath}`);

  console.log('\n📊 Resumen Final:');
  console.log(`   - Competencias: ${resultado.resumen.total_competencias}`);
  console.log(`   - Cortes: ${resultado.resumen.total_cortes}`);
  console.log(`   - Tribunales totales: ${resultado.resumen.total_tribunales}`);
}

// Ejecutar
main().catch(error => {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
});


