import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  courseId: mongoose.Types.ObjectId;
  subject?: string;
  topic?: string;
  title: string;
  content?: string;
  pdfUrl?: string;
  videoUrl?: string;
  type: 'lecture' | 'note' | 'reference';
  isPublished: boolean;
}

const noteSchema = new Schema<INote>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  subject: String,
  topic: String,
  title: {
    type: String,
    required: true
  },
  content: String,
  pdfUrl: String,
  videoUrl: String,
  type: {
    type: String,
    enum: ['lecture', 'note', 'reference'],
    default: 'note'
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model<INote>('Note', noteSchema);