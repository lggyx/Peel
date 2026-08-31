const path = require('path');

function readNumberEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

const PORT = readNumberEnv('PORT', 3000);
const MAX_DOWNLOAD_BYTES = readNumberEnv('MAX_DOWNLOAD_BYTES', 128 * 1024 * 1024);
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR
  ? path.resolve(__dirname, process.env.DOWNLOAD_DIR)
  : path.join(__dirname, 'downloads');

module.exports = {
  PORT,
  MAX_DOWNLOAD_BYTES,
  DOWNLOAD_DIR,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  PUBLIC_BASE_URL: stripTrailingSlash(process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`),
  STEPFUN_API_KEY: process.env.STEPFUN_API_KEY,
  STEPFUN_MODEL: process.env.STEPFUN_MODEL || 'step-3.6',
  STEPFUN_URL: process.env.STEPFUN_URL || 'https://api.stepfun.com/v1/chat/completions',
};
