import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import app from './app.js';
import { env } from './config/env.js';
import { setupSockets } from './sockets/index.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.corsOrigins,
    credentials: true
  }
});

app.set('io', io);
setupSockets(io);

async function startServer() {
  try {
    console.log('Starting LifeConnect server...');
    console.log('NODE_ENV:', env.nodeEnv);
    console.log('PORT:', env.port);
    console.log('CORS_ORIGINS:', env.corsOrigins);

    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected successfully');

    server.listen(env.port, '0.0.0.0', () => {
      console.log(
        `LifeConnect server listening on 0.0.0.0:${env.port}`
      );
    });
  } catch (error) {
    console.error('SERVER STARTUP FAILED');
    console.error(error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});