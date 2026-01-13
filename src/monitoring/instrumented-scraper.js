/**
 * Instrumented Scraper - Wrapper with Prometheus metrics
 * This module wraps existing scraping functions with metrics collection
 */

const metrics = require('./metrics-collector');

/**
 * Wraps a scraping operation with metrics
 * @param {string} operation - Operation name
 * @param {Function} fn - Async function to execute
 * @param {Object} context - Additional context for logging
 * @returns {Promise} Result from the function
 */
async function withMetrics(operation, fn, context = {}) {
  const endTimer = metrics.startTimer(operation);
  metrics.incrementActiveOps();

  try {
    const result = await fn();
    metrics.recordCausaProcessed('success');
    return result;
  } catch (error) {
    metrics.recordCausaProcessed('failed');

    // Classify error type
    const errorType = classifyError(error);
    metrics.recordError(errorType, 'error');

    throw error;
  } finally {
    endTimer();
    metrics.decrementActiveOps();
  }
}

/**
 * Classify error type for metrics
 */
function classifyError(error) {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('timeout') || message.includes('navigation')) {
    return 'navigation';
  }
  if (message.includes('selector') || message.includes('element')) {
    return 'form';
  }
  if (message.includes('extract') || message.includes('table')) {
    return 'extraction';
  }
  if (message.includes('export') || message.includes('write')) {
    return 'export';
  }

  return 'unknown';
}

/**
 * Instrumented form filling
 */
async function fillFormWithMetrics(page, context, config, requireTribunal) {
  const { fillForm } = require('../form');
  const endTimer = metrics.startTimer('form_fill');

  try {
    const result = await fillForm(page, context, config, requireTribunal);
    return result;
  } catch (error) {
    metrics.recordError('form', 'error');
    throw error;
  } finally {
    endTimer();
  }
}

/**
 * Instrumented table extraction
 */
async function extractTableWithMetrics(page) {
  const { extractTableAsArray } = require('../table');
  const endTimer = metrics.startTimer('table_extract');

  try {
    const rows = await extractTableAsArray(page);
    metrics.recordMovimientos(rows.length);
    return rows;
  } catch (error) {
    metrics.recordError('extraction', 'error');
    throw error;
  } finally {
    endTimer();
  }
}

/**
 * Instrumented PDF extraction
 */
async function extractPDFsWithMetrics(page) {
  const { downloadPDFsFromTable } = require('../pdfDownloader');
  const endTimer = metrics.startTimer('pdf_extract');

  try {
    const pdfUrls = await downloadPDFsFromTable(page);
    metrics.recordPDFExtraction(pdfUrls.length, true);
    return pdfUrls;
  } catch (error) {
    metrics.recordPDFExtraction(0, false);
    metrics.recordError('extraction', 'error');
    throw error;
  } finally {
    endTimer();
  }
}

/**
 * Instrumented export operations
 */
async function exportWithMetrics(rows, outputDir, ritClean, format = 'json') {
  const { exportToJSON, exportToCSV } = require('../exporter');
  const fs = require('fs');

  try {
    let filePath;

    if (format === 'json') {
      filePath = await exportToJSON(rows, outputDir, ritClean);
    } else {
      filePath = await exportToCSV(rows, outputDir, ritClean);
    }

    // Get file size
    const stats = fs.statSync(filePath);
    metrics.recordFileExport(format, stats.size);

    return filePath;
  } catch (error) {
    metrics.recordError('export', 'error');
    throw error;
  }
}

/**
 * Record CAPTCHA detection
 */
function recordCaptchaDetection(captchaInfo) {
  if (captchaInfo.detected) {
    const type = captchaInfo.type || 'generic';
    metrics.recordCaptcha(type);
  }
}

/**
 * Record blocked request
 */
function recordBlockedRequest(reason = 'unknown') {
  metrics.recordBlockedRequest(reason);
}

/**
 * Update checkpoint progress
 */
function updateProgress(processed, total) {
  const percentage = Math.round((processed / total) * 100);
  metrics.updateCheckpointProgress(percentage);
}

/**
 * Record page load
 */
async function recordPageNavigation(page, pageName) {
  const startTime = Date.now();

  return {
    end: () => {
      const duration = (Date.now() - startTime) / 1000;
      metrics.recordPageLoad(pageName, duration);
    }
  };
}

/**
 * Full instrumented scraping operation
 */
async function scrapeCausaWithMetrics(page, context, config, outputDir, requireTribunal = true) {
  const endTimer = metrics.startTimer('full_scrape');
  metrics.incrementActiveOps();

  try {
    // Navigation
    const { goToConsultaCausas, closeModalIfExists } = require('../navigation');
    const navTimer = await recordPageNavigation(page, 'consulta_causas');
    await goToConsultaCausas(page);
    navTimer.end();

    // Fill form
    await fillFormWithMetrics(page, context, config, requireTribunal);

    // Open detail modal
    const { openDetalle } = require('../form');
    await openDetalle(page, config.rit);

    // Wait for table
    await page.waitForSelector('table.table', { timeout: 15000 });

    // Extract table
    const rows = await extractTableWithMetrics(page);

    // Extract PDFs
    let pdfUrls = [];
    try {
      pdfUrls = await extractPDFsWithMetrics(page);
    } catch (error) {
      console.warn('⚠️ Error extracting PDFs:', error.message);
    }

    // Export
    const ritClean = config.rit.replace(/[^a-zA-Z0-9]/g, '_');
    await exportWithMetrics(rows, outputDir, ritClean, 'json');
    await exportWithMetrics(rows, outputDir, ritClean, 'csv');

    // Close modal
    await closeModalIfExists(page);

    metrics.recordCausaProcessed('success');

    return {
      success: true,
      movimientos: rows.length,
      pdfs: pdfUrls.length,
    };

  } catch (error) {
    metrics.recordCausaProcessed('failed');
    metrics.recordError(classifyError(error), 'error');
    throw error;
  } finally {
    endTimer();
    metrics.decrementActiveOps();
  }
}

module.exports = {
  withMetrics,
  fillFormWithMetrics,
  extractTableWithMetrics,
  extractPDFsWithMetrics,
  exportWithMetrics,
  scrapeCausaWithMetrics,
  recordCaptchaDetection,
  recordBlockedRequest,
  updateProgress,
  recordPageNavigation,
  metrics,
};
