import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    preferences: {
      weeklyDigest: { type: Boolean, default: true },
      digestDay: { type: String, default: 'sunday' },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const User = mongoose.model('User', userSchema);

export default User;
