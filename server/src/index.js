import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import { seedAdminUser } from './services/adminService.js';

const startServer = async () => {
  await connectDB();
  await seedAdminUser();

  app.listen(env.port, () => {
    console.log(`RozgaarSetu server running on port ${env.port}`);
  });
};

startServer();
