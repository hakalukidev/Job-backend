import mongoose, { Document, Schema } from 'mongoose';

export interface IUserHistory extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'exam' | 'quiz' | 'note' | 'course';
  refId: mongoose.Types.ObjectId;
  resultId?: mongoose.Types.ObjectId;
  visitedAt: Date;
}

const userHistorySchema = new Schema<IUserHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['exam', 'quiz', 'note', 'course'],
    required: true
  },
  refId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  resultId: {
    type: Schema.Types.ObjectId,
    ref: 'ExamResult'
  },
  visitedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IUserHistory>('UserHistory', userHistorySchema);