

const isDev = process.env.NODE_ENV !== 'production';

function log(level, label, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${label}]`;

  if (isDev || level === 'error') {
    if (level === 'error') {
      console.error(prefix, ...args);
    } else if (level === 'warn') {
      console.warn(prefix, ...args);
    } else {
      console.log(prefix, ...args);
    }
  }
}

const logger = {
  info: (label, ...args) => log('info', label, ...args),
  warn: (label, ...args) => log('warn', label, ...args),
  error: (label, ...args) => log('error', label, ...args),
  debug: (label, ...args) => {
    if (isDev) log('debug', label, ...args);
  },
};

module.exports = logger;
