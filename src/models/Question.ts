import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
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
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: Number, required: true },
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

const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
export default Question;
