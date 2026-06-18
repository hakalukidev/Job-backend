// src/models/User.ts
import bcrypt from 'bcryptjs';
import mongoose, { CallbackWithoutResultAndOptionalError, Document, Schema } from 'mongoose';

export interface IUser extends Document {
  // ✅ User fields
  email: string;
  name: string;
  password?: string;
  photoUrl: string;
  provider: 'local' | 'google' | 'facebook';
  isVerified: boolean;
  phone?: string;
  lastLogin: Date;
  
  // ✅ Additional fields
  avatar?: string;
  enrolledCourses: mongoose.Types.ObjectId[];
  bookmarkedQuestions: mongoose.Types.ObjectId[];
  isActive: boolean;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  
  // ✅ Methods
  toPublicJSON(): any;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    // ✅ Core fields
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
      required: function(this: IUser) {
        return this.provider === 'local';
      },
    },
    photoUrl: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    
    // ✅ Additional fields
    avatar: {
      type: String,
      default: '',
    },
    enrolledCourses: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    bookmarkedQuestions: [{
      type: Schema.Types.ObjectId,
      ref: 'Question',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Pre-save middleware for password hashing
UserSchema.pre('save', async function(next: CallbackWithoutResultAndOptionalError) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// ✅ Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ toPublicJSON method
UserSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;