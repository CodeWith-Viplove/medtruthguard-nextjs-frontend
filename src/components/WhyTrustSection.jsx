import React from "react";
import { ShieldCheck, User, Brain, FileCheck, BookOpen } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "AI Response Verification",
    desc: "Cross-reference AI medical responses for higher accuracy and safety.",
  },
  {
    icon: User,
    title: "Patient–Context Aware",
    desc: "Considers age, gender, pregnancy status, and existing conditions for personalized safety checks.",
  },
  {
    icon: Brain,
    title: "Doctor Feedback Loop",
    desc: "Verified medical professionals review and improve AI responses over time.",
  },
  {
    icon: FileCheck,
    title: "Evidence–Based Results",
    desc: "Every verification includes sources, justifications, and safer alternatives when needed.",
  },
  {
    icon: BookOpen,
    title: "Trusted Medical Sources",
    desc: "All queries are validated against authoritative standard databases such as WHO and PubMed.",
  }
];

const WhyTrustSection = () => {
  return (
    <section className="bg-sky-50/60 py-20">
      <div className="mx-auto w-[90%] text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Why Trust <span className="text-sky-600">MedTruth Guard?</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Our comprehensive verification system ensures AI medical responses are
          safe and accurate for you.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex h-full flex-col rounded-2xl border border-transparent bg-card p-5 text-left shadow-xs transition-all hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <Icon className="size-5" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-foreground sm:text-base">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyTrustSection;
