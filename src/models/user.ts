import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Model Interface
 * 
 * ASSUMPTIONS & DESIGN DECISIONS:
 * 1. Email uniqueness is enforced at database level
 * 2. Passwords are hashed using bcrypt before storage
 * 3. Role-based access control with two roles: customer and admin
 * 4. Mongoose timestamps track user creation and updates
 * 5. Password hashing occurs automatically when password field changes
 * 
 * @interface IUser
 * @extends Document
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema for MongoDB
 * 
 * Defines the structure and validation for user documents.
 * Includes security-focused features like password hashing and validation.
 */
const UserSchema: Schema = new Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      default: 'customer', 
      enum: ['customer', 'admin'] 
    }
  },
  { timestamps: true }
);


UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});


UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};


export default mongoose.model<IUser>('User', UserSchema);