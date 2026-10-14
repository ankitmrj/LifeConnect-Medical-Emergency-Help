import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// Routes
import auth from './routes/auth.js';
import patients from './routes/patients.js';
import emergencies from './routes/emergencies.js';
import hospitals from './routes/hospitals.js';
import ambulances from './routes/ambulances.js';
import admin from './routes/admin.js';

// Middleware
import {
  notFound,
  errorHandler,
} from './middleware/error.js';

// Configuration
import { env } from './config/env.js';

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || env.corsOrigins.includes(origin)) {
        return cb(null, true);
      }

      cb(new Error('CORS blocked'));
    },
    credentials: true,
  })
);

// Parse JSON Request Bodies
app.use(
  express.json({
    limit: '1mb',
  })
);

// HTTP Request Logging
app.use(
  morgan(
    env.nodeEnv === 'production'
      ? 'combined'
      : 'dev'
  )
);

// Rate Limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health Check Route
app.get('/api/health', (_req, res) =>
  res.json({
    success: true,
    message: 'LifeConnect API healthy',
    data: {
      status: 'ok',
    },
  })
);

// API Routes
app.use('/api/auth', auth);
app.use('/api/patients', patients);
app.use('/api/emergencies', emergencies);
app.use('/api/hospitals', hospitals);
app.use('/api/ambulances', ambulances);
app.use('/api/admin', admin);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Export Express Application
export default app;
