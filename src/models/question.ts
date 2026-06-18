import mongoose, { Document, Schema } from 'mongoose';

export interface IOption {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface IOptionImages {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
}

export interface IQuestion extends Document {
  text: string;
  imageUrl?: string;
  options: IOption;
  optionImages?: IOptionImages;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  subject?: string;
  topic?: string;
  source?: string;
  examYear?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const questionSchema = new Schema<IQuestion>({
  text: {
    type: String,
    required: [true, 'প্রশ্ন আবশ্যক']
  },
  imageUrl: String,
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true }
  },
  optionImages: {
    A: String,
    B: String,
    C: String,
    D: String
  },
  correctOption: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  explanation: String,
  subject: String,
  topic: String,
  source: String,
  examYear: Number,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
}, { timestamps: true });

export default mongoose.model<IQuestion>('Question', questionSchema);
