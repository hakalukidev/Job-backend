import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseCategory extends Document {
  name: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  order: number;
}

const courseCategorySchema = new Schema<ICourseCategory>({
  name: {
    type: String,
    required: [true, 'ক্যাটাগরির নাম আবশ্যক'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  icon: String,
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model<ICourseCategory>('CourseCategory', courseCategorySchema);