async function extractTable(page) {
  return await page.$$eval(
    'table.table.table-bordered.table-striped.table-hover tbody tr',
    trs => trs.map(tr => {
      const cells = [...tr.querySelectorAll('td')].map(td => td.innerText.trim());
      return cells;
    })
  );
}

module.exports = { extractTable };
