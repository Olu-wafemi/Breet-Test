import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorhandler';
import { NotFoundError } from './utils/errors';
import indexRouter from './routes/indexroute';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';
const app: Express = express();


connectDB();
connectRedis();

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', error);
  if (!isTestEnvironment) process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('UNHANDLED REJECTION! Shutting down...', error);
  if (!isTestEnvironment) process.exit(1);
});

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Shopping Cart API is running');
});

app.use('/api', indexRouter);


app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Cannot find ${req.originalUrl} on this server`));
});

app.use(errorHandler);

export default app;