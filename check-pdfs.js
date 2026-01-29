const { query } = require('./src/database/db-mariadb');

(async () => {
  console.log('📊 Estado actual de movimientos con/sin PDF:\n');

  const movs = await query(`
    SELECT
      m.id,
      m.rit,
      m.folio,
      m.indice,
      m.tiene_pdf,
      m.tramite,
      COUNT(p.id) as pdfs_guardados
    FROM movimientos m
    LEFT JOIN pdfs p ON p.movimiento_id = m.id
    WHERE m.causa_id = 16
    GROUP BY m.id
    ORDER BY m.folio DESC
    LIMIT 20
  `);

  console.log('Causa C-13786-2018:');
  console.log('===================');
  movs.forEach(m => {
    const flag = m.tiene_pdf ? 'SI' : 'NO';
    const saved = m.pdfs_guardados > 0 ? m.pdfs_guardados + ' PDF' : 'SIN PDF';
    const match = (m.tiene_pdf && m.pdfs_guardados > 0) || (!m.tiene_pdf && m.pdfs_guardados === 0);
    const status = match ? 'OK' : 'DESAJUSTE';
    console.log(`Folio ${m.folio} tiene_pdf=${flag} guardados=${saved} -> ${status}`);
  });

  process.exit(0);
})();
