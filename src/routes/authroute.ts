import express from 'express';
import { validate } from '../middleware/validate';
import { registerUserSchema, loginUserSchema } from '../schemas/userschema';
import { register, login, getMe } from '../controllers/authcontroller';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/register', validate(registerUserSchema), register);
router.post('/login', validate(loginUserSchema), login);
router.get('/me', protect, getMe);

export default router;