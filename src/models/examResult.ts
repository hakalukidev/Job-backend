import mongoose, { Document, Schema } from 'mongoose';

export interface ISubjectWise {
  correct: number;
  wrong: number;
  total: number;
}

export interface IExamResult extends Document {
  userId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  answers: Map<string, string>;
  score: number;
  totalCorrect: number;
  totalWrong: number;
  rank: number;
  percentile: number;
  subjectWise: Map<string, ISubjectWise>;
  submittedAt: Date;
}

const examResultSchema = new Schema<IExamResult>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examId: {
    type: Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  answers: {
    type: Map,
    of: String
  },
  score: {
    type: Number,
    required: true
  },
  totalCorrect: Number,
  totalWrong: Number,
  rank: Number,
  percentile: Number,
  subjectWise: {
    type: Map,
    of: {
      correct: Number,
      wrong: Number,
      total: Number
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IExamResult>('ExamResult', examResultSchema);