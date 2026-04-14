import mongoose from 'mongoose';
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from '../constants/domain.js';

const signOffSchema = new mongoose.Schema(
  {
    signedOffBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    signedOffByName: {
      type: String,
      default: '',
    },
    certificateNumber: {
      type: String,
      default: '',
    },
    signedOffAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const maintenanceTaskSchema = new mongoose.Schema(
  {
    taskNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
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
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: TASK_CATEGORIES,
      default: 'Scheduled',
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'Medium',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    dueFlightHours: {
      type: Number,
      default: null,
      min: 0,
    },
    dueFlightCycles: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'Open',
      index: true,
    },
    assignedEngineer: {
      type: String,
      default: '',
      trim: true,
    },
    maintenanceType: {
      type: String,
      default: 'Routine',
      trim: true,
    },
    workPackage: {
      type: String,
      default: '',
      trim: true,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    requiresSignOff: {
      type: Boolean,
      default: false,
    },
    completionNotes: {
      type: String,
      default: '',
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedByName: {
      type: String,
      default: '',
    },
    signOff: {
      type: signOffSchema,
      default: () => ({})
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

maintenanceTaskSchema.index({ aircraft: 1, status: 1, dueDate: 1 });
maintenanceTaskSchema.index({ aircraft: 1, priority: 1 });

const MaintenanceTask = mongoose.model('MaintenanceTask', maintenanceTaskSchema);

export default MaintenanceTask;
