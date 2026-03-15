import React from "react";
import { UserCheck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = ({ onStartVerify, onJoinDoctor }) => {
  return (
    <section className="w-full bg-gradient-to-b from-sky-50 to-background py-20">
      <div className="mx-auto flex w-[90%] flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1 text-xs font-medium text-sky-800">
          <CheckCircle className="size-4" />
          <span>Trusted by Healthcare Professionals</span>
        </div>

        <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Verify AI Medical Responses
          <span className="block text-sky-600">with MedTruth Guard</span>
        </h1>

        <p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          Don't trust AI blindly. Our platform cross-references AI-generated
          medical advice with trusted sources, considering patient context for
          safer healthcare decisions.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            className="rounded-full px-8 text-sm font-semibold"
            style={{ backgroundColor: "#0084d1", color: "white" }}
            onClick={onStartVerify}
          >
            Start Verifying
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-sky-200 bg-white px-7 text-sm font-semibold text-sky-700 hover:border-sky-300 hover:bg-sky-50"
            onClick={onJoinDoctor}
          >
            <UserCheck className="mr-2 size-4" />
            Join as Doctor
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
