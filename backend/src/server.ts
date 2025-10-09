import dotenv from 'dotenv';

// Load environment variables - try multiple approaches
const result = dotenv.config();
if (result.error) {
  console.log('dotenv.config() error:', result.error);
  // Try alternative path
  const altResult = dotenv.config({ path: '.env' });
  if (altResult.error) {
    console.log('Alternative dotenv.config() error:', altResult.error);
  }
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import volunteerRouter from './volunteer/routes.js';
import authRouter from './auth/routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', volunteerRouter);
app.use('/api/auth/volunteer', authRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodlink';

console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
console.log('Using MONGO_URI:', MONGO_URI);

async function start() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully');
    app.listen(PORT, '0.0.0.0', () => console.log(`API running on http://0.0.0.0:${PORT}`));
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
}

start();


