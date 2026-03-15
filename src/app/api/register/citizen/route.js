import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Citizen from "@/models/Citizen";
import Doctor from "@/models/Doctor";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9+() -]{8,18}$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, mobile } = body || {};

    if (!firstName || !lastName || !email || !password || !mobile) {
      return NextResponse.json(
        { error: "All fields are required." },
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

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase();
    const existingCitizen = await Citizen.findOne({ email: normalizedEmail });
    const existingDoctor = await Doctor.findOne({ email: normalizedEmail });

    if (existingCitizen || existingDoctor) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await Citizen.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      mobile: mobile.trim(),
    });

    return NextResponse.json(
      { id: user._id.toString(), email: user.email },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 }
    );
  }
}
