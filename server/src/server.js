import app from './app.js';
import { connectDB } from './config/db.js';
import { env, validateEnv } from './config/env.js';

const PORT = env.PORT;

Promise.resolve()
  .then(() => validateEnv())
  .then(() => connectDB())
  .then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
  .catch((error) => {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  });
