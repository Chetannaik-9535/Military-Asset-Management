// src/middlewares/loggerMiddleware.js
// Thin wrapper around morgan for HTTP access logging. This is distinct
// from the business-level audit trail written by src/utils/audit.js —
// this logs every HTTP request; the audit trail logs every asset mutation.

import morgan from 'morgan';

const format =
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :response-time ms - :res[content-length]';

export const requestLogger = morgan(format);
