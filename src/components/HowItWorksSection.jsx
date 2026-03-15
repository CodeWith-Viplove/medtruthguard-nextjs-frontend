import React from "react";

const steps = [
  {
    number: "01",
    title: "Enter Patient Context",
    desc: "Provide age, gender, conditions, and medications for personalized verification.",
  },
  {
    number: "02",
    title: "Submit AI Response",
    desc: "Paste the AI-generated medical advice you want to verify.",
  },
  {
    number: "03",
    title: "Get Verified Results",
    desc: "Receive color-coded safety status, sources, and alternatives if needed.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto w-[90%] text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          How It Works
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Three simple steps to verify any AI medical response.
        </p>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="mx-auto max-w-xs text-left"
            >
              <p className="text-4xl font-bold tracking-tight text-sky-100 sm:text-5xl">
                {step.number}
              </p>
              <h3 className="mt-3 text-sm font-semibold text-foreground sm:text-base">
                {step.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
