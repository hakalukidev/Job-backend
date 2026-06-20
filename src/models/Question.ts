import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'bcs' | 'bank' | 'primary' | 'job-solution';
  courseId?: mongoose.Types.ObjectId;
  examId?: mongoose.Types.ObjectId;
  source: 'manual' | 'pdf' | 'excel';
  sourceFile?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true }
    },
    correctOption: { 
      type: String, 
      enum: ['A', 'B', 'C', 'D'], 
      required: true 
    },
    explanation: { type: String },
    marks: { type: Number, default: 1 },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'], 
      default: 'medium' 
    },
    category: { 
      type: String, 
      enum: ['bcs', 'bank', 'primary', 'job-solution'],
      required: true 
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam' },
    source: { 
      type: String, 
      enum: ['manual', 'pdf', 'excel'], 
      default: 'manual' 
    },
    sourceFile: { type: String },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

// ✅ Fix: Check if model exists before creating
const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
export default Question;
