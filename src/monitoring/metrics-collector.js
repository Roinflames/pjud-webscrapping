/**
 * Prometheus Metrics Collector for PJUD Web Scraper
 * Collects and exposes metrics for monitoring scraping operations
 */

const promClient = require('prom-client');

class MetricsCollector {
  constructor() {
    // Create a Registry
    this.register = new promClient.Registry();

    // Add default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'pjud_scraper_',
    });

    this.initializeMetrics();
  }

  initializeMetrics() {
    // ============================================
    // BUSINESS METRICS
    // ============================================

    /**
     * Counter: Total number of causas processed
     * Labels: status (success, failed, skipped)
     */
    this.causasProcessed = new promClient.Counter({
      name: 'pjud_causas_processed_total',
      help: 'Total number of causas processed',
      labelNames: ['status'],
      registers: [this.register],
    });

    /**
     * Histogram: Duration of scraping operations
     * Labels: operation (form_fill, table_extract, pdf_extract, full_scrape)
     */
    this.scrapingDuration = new promClient.Histogram({
      name: 'pjud_scraping_duration_seconds',
      help: 'Duration of scraping operations in seconds',
      labelNames: ['operation'],
      buckets: [0.5, 1, 2, 5, 10, 30, 60, 120], // 0.5s to 2 minutes
      registers: [this.register],
    });

    /**
     * Counter: Total number of PDFs extracted
     * Labels: status (success, failed)
     */
    this.pdfsExtracted = new promClient.Counter({
      name: 'pjud_pdfs_extracted_total',
      help: 'Total number of PDF URLs extracted',
      labelNames: ['status'],
      registers: [this.register],
    });

    /**
     * Counter: Total number of PDFs downloaded
     * Labels: status (success, failed)
     */
    this.pdfsDownloaded = new promClient.Counter({
      name: 'pjud_pdfs_downloaded_total',
      help: 'Total number of PDFs downloaded',
      labelNames: ['status'],
      registers: [this.register],
    });

    /**
     * Counter: Total number of movimientos (rows) extracted
     */
    this.movimientosExtracted = new promClient.Counter({
      name: 'pjud_movimientos_extracted_total',
      help: 'Total number of movimientos extracted from causas',
      registers: [this.register],
    });

    // ============================================
    // SECURITY & ANTI-BOT METRICS
    // ============================================

    /**
     * Counter: CAPTCHA detections
     * Labels: type (recaptcha, hcaptcha, generic)
     */
    this.captchaDetected = new promClient.Counter({
      name: 'pjud_captcha_detected_total',
      help: 'Total number of CAPTCHAs detected',
      labelNames: ['type'],
      registers: [this.register],
    });

    /**
     * Counter: Blocked requests
     * Labels: reason (rate_limit, ip_blocked, unknown)
     */
    this.requestsBlocked = new promClient.Counter({
      name: 'pjud_requests_blocked_total',
      help: 'Total number of blocked requests',
      labelNames: ['reason'],
      registers: [this.register],
    });

    /**
     * Gauge: Circuit breaker state
     * Values: 0=closed, 1=open, 2=half_open
     */
    this.circuitBreakerState = new promClient.Gauge({
      name: 'pjud_circuit_breaker_state',
      help: 'Circuit breaker state (0=closed, 1=open, 2=half_open)',
      registers: [this.register],
    });

    // ============================================
    // PERFORMANCE METRICS
    // ============================================

    /**
     * Gauge: Current number of active scraping operations
     */
    this.activeScrapingOps = new promClient.Gauge({
      name: 'pjud_active_scraping_operations',
      help: 'Current number of active scraping operations',
      registers: [this.register],
    });

    /**
     * Gauge: Current checkpoint progress
     */
    this.checkpointProgress = new promClient.Gauge({
      name: 'pjud_checkpoint_progress',
      help: 'Current progress from checkpoint (0-100)',
      registers: [this.register],
    });

    /**
     * Counter: Total number of retries
     * Labels: reason (timeout, network_error, element_not_found)
     */
    this.retries = new promClient.Counter({
      name: 'pjud_retries_total',
      help: 'Total number of retry attempts',
      labelNames: ['reason'],
      registers: [this.register],
    });

    /**
     * Histogram: Page load times
     */
    this.pageLoadTime = new promClient.Histogram({
      name: 'pjud_page_load_seconds',
      help: 'Page load time in seconds',
      labelNames: ['page'],
      buckets: [0.5, 1, 2, 5, 10, 15],
      registers: [this.register],
    });

    // ============================================
    // ERROR METRICS
    // ============================================

    /**
     * Counter: Errors by type
     * Labels: type (navigation, form, extraction, export, unknown)
     */
    this.errors = new promClient.Counter({
      name: 'pjud_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity'],
      registers: [this.register],
    });

    /**
     * Gauge: Last scraping timestamp
     */
    this.lastScrapingTimestamp = new promClient.Gauge({
      name: 'pjud_last_scraping_timestamp',
      help: 'Timestamp of last scraping operation',
      registers: [this.register],
    });

    // ============================================
    // EXPORT METRICS
    // ============================================

    /**
     * Counter: Files exported
     * Labels: format (json, csv)
     */
    this.filesExported = new promClient.Counter({
      name: 'pjud_files_exported_total',
      help: 'Total number of files exported',
      labelNames: ['format'],
      registers: [this.register],
    });

    /**
     * Summary: Export file sizes
     * Labels: format (json, csv)
     */
    this.exportFileSize = new promClient.Summary({
      name: 'pjud_export_file_size_bytes',
      help: 'Size of exported files in bytes',
      labelNames: ['format'],
      registers: [this.register],
    });
  }

  // ============================================
  // PUBLIC API - Recording Methods
  // ============================================

  /**
   * Record a processed causa
   * @param {string} status - 'success', 'failed', or 'skipped'
   */
  recordCausaProcessed(status = 'success') {
    this.causasProcessed.inc({ status });
    this.lastScrapingTimestamp.setToCurrentTime();
  }

  /**
   * Record scraping operation duration
   * @param {string} operation - 'form_fill', 'table_extract', 'pdf_extract', 'full_scrape'
   * @param {number} durationSeconds - Duration in seconds
   */
  recordScrapingDuration(operation, durationSeconds) {
    this.scrapingDuration.observe({ operation }, durationSeconds);
  }

  /**
   * Start timing an operation (returns end function)
   * @param {string} operation - Operation name
   * @returns {Function} End function to call when operation completes
   */
  startTimer(operation) {
    const end = this.scrapingDuration.startTimer({ operation });
    return end;
  }

  /**
   * Record PDF extraction
   * @param {number} count - Number of PDFs extracted
   * @param {boolean} success - Whether extraction was successful
   */
  recordPDFExtraction(count, success = true) {
    const status = success ? 'success' : 'failed';
    this.pdfsExtracted.inc({ status }, count);
  }

  /**
   * Record PDF download
   * @param {boolean} success - Whether download was successful
   */
  recordPDFDownload(success = true) {
    const status = success ? 'success' : 'failed';
    this.pdfsDownloaded.inc({ status });
  }

  /**
   * Record movimientos extracted
   * @param {number} count - Number of movimientos
   */
  recordMovimientos(count) {
    this.movimientosExtracted.inc(count);
  }

  /**
   * Record CAPTCHA detection
   * @param {string} type - 'recaptcha', 'hcaptcha', 'generic'
   */
  recordCaptcha(type = 'generic') {
    this.captchaDetected.inc({ type });
  }

  /**
   * Record blocked request
   * @param {string} reason - 'rate_limit', 'ip_blocked', 'unknown'
   */
  recordBlockedRequest(reason = 'unknown') {
    this.requestsBlocked.inc({ reason });
  }

  /**
   * Set circuit breaker state
   * @param {string} state - 'CLOSED', 'OPEN', 'HALF_OPEN'
   */
  setCircuitBreakerState(state) {
    const stateMap = { CLOSED: 0, OPEN: 1, HALF_OPEN: 2 };
    this.circuitBreakerState.set(stateMap[state] || 0);
  }

  /**
   * Increment active operations
   */
  incrementActiveOps() {
    this.activeScrapingOps.inc();
  }

  /**
   * Decrement active operations
   */
  decrementActiveOps() {
    this.activeScrapingOps.dec();
  }

  /**
   * Update checkpoint progress
   * @param {number} percentage - Progress percentage (0-100)
   */
  updateCheckpointProgress(percentage) {
    this.checkpointProgress.set(percentage);
  }

  /**
   * Record a retry attempt
   * @param {string} reason - 'timeout', 'network_error', 'element_not_found'
   */
  recordRetry(reason) {
    this.retries.inc({ reason });
  }

  /**
   * Record page load time
   * @param {string} page - Page identifier
   * @param {number} seconds - Load time in seconds
   */
  recordPageLoad(page, seconds) {
    this.pageLoadTime.observe({ page }, seconds);
  }

  /**
   * Record an error
   * @param {string} type - 'navigation', 'form', 'extraction', 'export', 'unknown'
   * @param {string} severity - 'warning', 'error', 'critical'
   */
  recordError(type, severity = 'error') {
    this.errors.inc({ type, severity });
  }

  /**
   * Record file export
   * @param {string} format - 'json' or 'csv'
   * @param {number} sizeBytes - File size in bytes
   */
  recordFileExport(format, sizeBytes) {
    this.filesExported.inc({ format });
    if (sizeBytes) {
      this.exportFileSize.observe({ format }, sizeBytes);
    }
  }

  /**
   * Get all metrics in Prometheus format
   * @returns {Promise<string>} Metrics in Prometheus text format
   */
  async getMetrics() {
    return this.register.metrics();
  }

  /**
   * Get metrics as JSON
   * @returns {Promise<Array>} Metrics as JSON array
   */
  async getMetricsJSON() {
    return this.register.getMetricsAsJSON();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.register.resetMetrics();
  }
}

// Export singleton instance
const metricsCollector = new MetricsCollector();
module.exports = metricsCollector;
