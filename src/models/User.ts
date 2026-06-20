import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  photoUrl: string;
  provider: 'local' | 'google' | 'facebook';
  isVerified: boolean;
  phone?: string;
  lastLogin: Date;
  avatar?: string;
  enrolledCourses: mongoose.Types.ObjectId[];
  bookmarkedQuestions: mongoose.Types.ObjectId[];
  isActive: boolean;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  toPublicJSON(): any;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
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

// ❌ pre-save middleware সরিয়ে ফেলুন (কারণ আমরা admin.ts এ সরাসরি হ্যাশ করছি)
// UserSchema.pre('save', function(next) { ... });

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// toPublicJSON method
UserSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
