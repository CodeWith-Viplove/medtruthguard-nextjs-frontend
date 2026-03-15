import mongoose, { Schema } from "mongoose";

const CitizenSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: false },
    mobile: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

CitizenSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.Citizen ||
  mongoose.model("Citizen", CitizenSchema);
