import mongoose, { Schema } from "mongoose";

const LICENSE_REGEX = /^[A-Z]{3,4}\/\d{4}\/\d{4,6}$/;

const DoctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => LICENSE_REGEX.test((value || "").trim().toUpperCase()),
        message: "License number must match format: e.g. MHMC/2018/123456",
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

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);
