/**
 * Configuración PM2 para el Sistema PJUD
 * 
 * Uso:
 *   pm2 start ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 * 
 * O usar el script de control:
 *   bash scripts/control-servicios.sh start
 *   bash scripts/control-servicios.sh stop
 *   bash scripts/control-servicios.sh enable   # Habilitar 24/7
 *   bash scripts/control-servicios.sh disable  # Deshabilitar 24/7
 */

module.exports = {
  apps: [
    {
      name: 'api-pjud',
      script: 'src/api/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3000
      },
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'listener-pjud',
      script: 'src/api/listener.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/listener-error.log',
      out_file: 'logs/listener-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Reiniciar si falla (importante para 24/7)
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Para ejecución continua 24/7
      restart_delay: 5000,
      exp_backoff_restart_delay: 100
    },
    {
      name: 'worker-pjud',
      script: 'src/worker_cola_scraping.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G', // Playwright necesita más memoria
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/worker-error.log',
      out_file: 'logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Reiniciar si falla (importante para 24/7)
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Para ejecución continua 24/7
      restart_delay: 5000,
      exp_backoff_restart_delay: 100
    },
    {
      name: 'listener-erp',
      script: 'src/api/listener-erp.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/listener-erp-error.log',
      out_file: 'logs/listener-erp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      exp_backoff_restart_delay: 100
    },
    {
      name: 'worker-eventos',
      script: 'src/worker-eventos.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/worker-eventos-error.log',
      out_file: 'logs/worker-eventos-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      exp_backoff_restart_delay: 100
    }
  ]
};
