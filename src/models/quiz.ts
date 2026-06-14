import mongoose, { Document, Schema } from 'mongoose';

export interface IQuiz extends Document {
  subject?: string;
  topic?: string;
  title: string;
  questions: mongoose.Types.ObjectId[];
  durationMinutes: number;
  isActive: boolean;
}

const quizSchema = new Schema<IQuiz>({
  subject: String,
  topic: String,
  title: {
    type: String,
    required: true
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }],
  durationMinutes: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model<IQuiz>('Quiz', quizSchema);