import mongoose, { Schema } from "mongoose";

const LICENSE_REGEX = /^[A-Za-z0-9-]{6,20}$/;

const DoctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => LICENSE_REGEX.test(value),
        message: "Invalid license number format.",
      },
    },
    mobile: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    specialization: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

DoctorSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);
