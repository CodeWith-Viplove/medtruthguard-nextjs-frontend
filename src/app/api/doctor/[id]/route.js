import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Doctor from "@/models/Doctor";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid doctor ID format" }, { status: 400 });
    }

    await connectToDatabase();
    const doctor = await Doctor.findById(id).select("name specialization");
    
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: doctor._id.toString(),
      name: doctor.name,
      specialty: doctor.specialization,
    });
  } catch (error) {
    console.error("Failed to fetch doctor details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
