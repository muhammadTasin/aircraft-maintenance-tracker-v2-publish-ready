import mongoose from 'mongoose';
import { DEFECT_IMPACTS, DEFECT_PRIORITIES, DEFECT_STATUSES } from '../constants/domain.js';

const defectSchema = new mongoose.Schema(
  {
    defectNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    aircraft: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aircraft',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: DEFECT_PRIORITIES,
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: DEFECT_STATUSES,
      default: 'Open',
      index: true,
    },
    impact: {
      type: String,
      enum: DEFECT_IMPACTS,
      default: 'Monitoring',
      index: true,
    },
    ataChapter: {
      type: String,
      default: '',
      trim: true,
    },
    rootCause: {
      type: String,
      default: '',
      trim: true,
    },
    correctiveAction: {
      type: String,
      default: '',
      trim: true,
    },
    deferredUntil: {
      type: Date,
      default: null,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

defectSchema.index({ aircraft: 1, status: 1, priority: 1 });
defectSchema.index({ aircraft: 1, impact: 1 });

const Defect = mongoose.model('Defect', defectSchema);

export default Defect;
