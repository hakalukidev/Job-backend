import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  type: 'live' | 'model' | 'subject' | 'weekly';
  subject?: string;
  topic?: string;
  scheduledAt: Date;
  durationMinutes: number;
  totalMarks: number;
  questions: mongoose.Types.ObjectId[];
  isPublished: boolean;
}

const examSchema = new Schema<IExam>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'পরীক্ষার নাম আবশ্যক']
  },
  type: {
    type: String,
    enum: ['live', 'model', 'subject', 'weekly'],
    required: true
  },
  subject: String,
  topic: String,
  scheduledAt: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }],
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model<IExam>('Exam', examSchema);