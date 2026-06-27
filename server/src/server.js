import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
