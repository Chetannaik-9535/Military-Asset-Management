// server.js
// Express application entry point.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { requestLogger } from './src/middlewares/loggerMiddleware.js';
import authRoutes from './src/routes/authRoutes.js';
import baseRoutes from './src/routes/baseRoutes.js';
import equipmentRoutes from './src/routes/equipmentRoutes.js';
import assetRoutes from './src/routes/assetRoutes.js';
import purchaseRoutes from './src/routes/purchaseRoutes.js';
import transferRoutes from './src/routes/transferRoutes.js';
import assignmentRoutes from './src/routes/assignmentRoutes.js';
import expenditureRoutes from './src/routes/expenditureRoutes.js';
import auditRoutes from './src/routes/auditRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// --- Global middleware ---
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'military-asset-management-api', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/equipment-types', equipmentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/users', userRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// --- Centralized error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);

  // Prisma "record not found" on update/delete
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Requested record was not found.' });
  }
  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ message: `Duplicate value for field(s): ${err.meta?.target?.join(', ') || 'unknown'}.` });
  }
  // Prisma foreign key violation
  if (err.code === 'P2003') {
    return res.status(400).json({ message: 'Referenced record does not exist.' });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`Military Asset Management API listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

export default app;
