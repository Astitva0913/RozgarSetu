import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['worker', 'customer', 'admin'],
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, 'Experience must be a non-negative number'],
    },
    workType: {
      type: String,
      trim: true,
    },
    availability: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const publicData = {
    id: this._id,
    name: this.name,
    phone: this.phone,
    firebaseUid: this.firebaseUid,
    email: this.email,
    role: this.role,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (this.role === 'worker') {
    publicData.location = this.location || '';
    publicData.skills = this.skills || [];
    publicData.experience = this.experience ?? 0;
    publicData.workType = this.workType || '';
    publicData.availability = this.availability || '';
    publicData.bio = this.bio || '';
  }

  return publicData;
};

const User = mongoose.model('User', userSchema);

export default User;
