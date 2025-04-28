import { createClient } from 'redis';
import dotenv from 'dotenv';




const REDIS_PASSWORD = process.env.REDIS_PASSWORD 
const REDIS_HOST = process.env.REDIS_HOST 
const REDIS_PORT = parseInt(process.env.REDIS_PORT!)

const redisClient = createClient({
    username: 'default',
    password: REDIS_PASSWORD,
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
    }
});

const connectRedis = async (): Promise<void> => {
    try {
        await redisClient.connect();
        console.log('Redis connected successfully');
        
        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
    } catch (error) {
        console.error('Redis connection error:', error);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

export { redisClient, connectRedis };