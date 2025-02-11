module.exports = {
  apps: [{
    name: 'wazo-notes',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8081
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Monitoring configuration
    monitoring: {
      cpu: true,
      memory: true,
      http: true,
      custom_metrics: {
        http_req_per_min: {
          type: 'counter',
          unit: 'req/min',
          agg_type: 'sum',
          measurement: 'requests'
        },
        response_time: {
          type: 'histogram',
          unit: 'ms',
          measurement: 'latency'
        }
      }
    }
  }]
}
