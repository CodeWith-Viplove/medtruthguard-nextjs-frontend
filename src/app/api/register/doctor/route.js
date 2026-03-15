import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Doctor from "@/models/Doctor";
import Citizen from "@/models/Citizen";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9+() -]{8,18}$/;
const LICENSE_REGEX = /^[A-Za-z0-9-]{6,20}$/;

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

    if (!LICENSE_REGEX.test(licenseNumber)) {
      return NextResponse.json(
        { error: "License number should be 6-20 characters (letters, numbers, hyphen)." },
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
      licenseNumber: licenseNumber?.trim() || "",
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
    return NextResponse.json(
      { error: "Unable to create doctor account." },
      { status: 500 }
    );
  }
}
