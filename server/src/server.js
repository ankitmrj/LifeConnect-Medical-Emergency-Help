import http from 'http'; import mongoose from 'mongoose'; import {Server} from 'socket.io'; import app from './app.js'; import {env} from './config/env.js'; import {setupSockets} from './sockets/index.js';
const server=http.createServer(app); const io=new Server(server,{cors:{origin:env.corsOrigins,credentials:true}}); app.set('io',io); setupSockets(io);
await mongoose.connect(env.mongoUri); server.listen(env.port,()=>console.log(`LifeConnect server running on http://localhost:${env.port}`));
process.on('SIGINT',async()=>{await mongoose.disconnect();server.close(()=>process.exit(0));});
