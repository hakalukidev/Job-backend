// src/models/User.ts (এটাই রাখো, অন্যটা delete করো)
import bcrypt from 'bcryptjs';
import mongoose, { CallbackWithoutResultAndOptionalError, Document, Schema } from 'mongoose';

export interface IUser extends Document {
  // ✅ Google Login এর জন্য ফিল্ড
  email: string;
  name: string;
  password?: string;
  photoUrl: string;
  provider: 'local' | 'google' | 'facebook';
  isVerified: boolean;
  phone?: string;
  lastLogin: Date;
  
  // ✅ আগের ফিল্ডগুলো
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

const UserSchema = new Schema<IUser>({
  // ✅ নতুন ফিল্ড (Google Login)
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
  
  // ✅ পুরনো ফিল্ড
  avatar: {
    type: String,
  },
  enrolledCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  bookmarkedQuestions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
}, {
  timestamps: true,
});

// ✅ Hash password before saving (শুধুমাত্র local login এর জন্য)
UserSchema.pre('save', async function(this: IUser, next: CallbackWithoutResultAndOptionalError) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ✅ Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ toPublicJSON method
UserSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    photoUrl: this.photoUrl || this.avatar,
    provider: this.provider,
    isVerified: this.isVerified,
    role: this.role,
    isActive: this.isActive,
    enrolledCourses: this.enrolledCourses,
    bookmarkedQuestions: this.bookmarkedQuestions,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;