import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>({
  question: {
    type: String,
    required: [true, 'প্রশ্ন আবশ্যক'],
    trim: true
  },
  answer: {
    type: String,
    required: [true, 'উত্তর আবশ্যক']
  },
  category: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model<IFAQ>('FAQ', faqSchema);