import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Doctor from "@/models/Doctor";
import Citizen from "@/models/Citizen";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9+() -]{8,18}$/;
const LICENSE_REGEX = /^[A-Z]{3,4}\/\d{4}\/\d{4,6}$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      licenseNumber,
      mobile,
      email,
      specialization,
      specializationOther,
      experience,
      password,
    } = body || {};

    if (!name || !licenseNumber || !mobile || !email || !specialization || !experience || !password) {
      return NextResponse.json(
        { error: "All required fields must be filled (including license number)." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email." },
        { status: 400 }
      );
    }

    if (!MOBILE_REGEX.test(mobile)) {
      return NextResponse.json(
        { error: "Please provide a valid mobile number." },
        { status: 400 }
      );
    }

    const normalizedLicenseNumber = licenseNumber.trim().toUpperCase();

    if (!LICENSE_REGEX.test(normalizedLicenseNumber)) {
      return NextResponse.json(
        { error: "License number must match format: e.g. MHMC/2018/123456" },
        { status: 400 }
      );
    }

    const resolvedSpecialization =
      specialization === "Other" ? specializationOther?.trim() : specialization;

    if (!resolvedSpecialization) {
      return NextResponse.json(
        { error: "Please provide your specialization." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase();
    const existingDoctor = await Doctor.findOne({ email: normalizedEmail });
    const existingCitizen = await Citizen.findOne({ email: normalizedEmail });

    if (existingDoctor || existingCitizen) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const doctor = await Doctor.create({
      name: name.trim(),
      licenseNumber: normalizedLicenseNumber,
      mobile: mobile.trim(),
      email: normalizedEmail,
      specialization: resolvedSpecialization,
      experience: experience.trim(),
      passwordHash,
    });

    return NextResponse.json(
      { id: doctor._id.toString(), email: doctor.email, status: doctor.status },
      { status: 201 }
    );
  } catch (error) {
    console.error("Doctor registration failed:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    if (error?.name === "ValidationError") {
      return NextResponse.json(
        { error: error.message || "Invalid registration data." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create doctor account." },
      { status: 500 }
    );
  }
}
