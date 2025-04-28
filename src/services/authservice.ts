import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user';
import { RegisterUserInput, LoginUserInput } from '../schemas/userschema';
import { 
  UnauthorizedError, 
  BadRequestError, 
  DatabaseError,
  ConflictError
} from '../utils/errors';


const generateToken = (userId: string, role: string): string => {
   
    
    const jwtSign = (jwt.sign as any);
    return jwtSign(
      { id: userId, role }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
  };

export const registerUser = async (userData: RegisterUserInput): Promise<{ user: IUser; token: string }> => {
  try {
   
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }
    
    
    const user = await User.create(userData);
 
    const token = generateToken(user._id.toString(), user.role);
    
    return { 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as IUser, 
      token 
    };
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    throw new DatabaseError(`Failed to register user: ${(error as Error).message}`);
  }
};

export const loginUser = async (credentials: LoginUserInput): Promise<{ user: IUser; token: string }> => {
  try {
    
    const user = await User.findOne({ email: credentials.email });
    
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
   
    const isPasswordMatch = await user.comparePassword(credentials.password);
    
    if (!isPasswordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
 
    const token = generateToken(user._id.toString(), user.role);
    
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as IUser,
      token
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new DatabaseError(`Failed to login: ${(error as Error).message}`);
  }
};