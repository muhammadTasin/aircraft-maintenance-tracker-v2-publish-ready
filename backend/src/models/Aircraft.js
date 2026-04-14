import mongoose from 'mongoose';
import { AIRCRAFT_STATUSES, AIRWORTHINESS_STATUSES } from '../constants/domain.js';

const historyEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      default: 'System',
    },
    severity: {
      type: String,
      enum: ['Info', 'Warning', 'Critical'],
      default: 'Info',
    },
    reference: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const aircraftSchema = new mongoose.Schema(
  {
    registration: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    manufacturer: {
      type: String,
      default: '',
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      default: '',
      trim: true,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: AIRCRAFT_STATUSES,
      default: 'Serviceable',
      index: true,
    },
    airworthinessStatus: {
      type: String,
      enum: AIRWORTHINESS_STATUSES,
      default: 'Airworthy',
    },
    location: {
      type: String,
      default: 'Main Base',
      trim: true,
    },
    baseStation: {
      type: String,
      default: 'Main Base',
      trim: true,
    },
    lastInspectionDate: {
      type: Date,
      default: Date.now,
    },
    nextCheckType: {
      type: String,
      default: '',
      trim: true,
    },
    nextCheckDueDate: {
      type: Date,
      default: null,
    },
    totalFlightHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFlightCycles: {
      type: Number,
      default: 0,
      min: 0,
    },
    history: [historyEntrySchema],
  },
  { timestamps: true }
);

aircraftSchema.index({ registration: 1, status: 1 });
aircraftSchema.index({ nextCheckDueDate: 1 });

const Aircraft = mongoose.model('Aircraft', aircraftSchema);

export default Aircraft;
