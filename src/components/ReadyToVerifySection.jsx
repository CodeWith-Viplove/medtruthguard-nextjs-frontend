import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReadyToVerifySection = ({ onGetStarted }) => {
  return (
    <section className="flex justify-center bg-background py-20">
      <div className="mx-auto w-[90%] rounded-3xl bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-12 text-center text-white shadow-lg sm:px-10 md:px-16">
        <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          Ready to Verify AI Medical Responses?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-sky-50/90 sm:text-base">
          Join thousands of healthcare professionals and patients who trust
          MedTruth Guard for accurate medical verification.
        </p>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-transparent px-8 text-sm font-semibold hover:bg-white/10"
            style={{ color: "white" }}
            onClick={onGetStarted}
          >
            Get Started Free
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReadyToVerifySection;
