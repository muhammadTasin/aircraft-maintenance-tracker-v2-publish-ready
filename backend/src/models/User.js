import mongoose from 'mongoose';
import { USER_ROLES } from '../constants/domain.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'Engineer',
    },
    certificateNumber: {
      type: String,
      default: '',
      trim: true,
    },
    station: {
      type: String,
      default: 'Main Base',
      trim: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
