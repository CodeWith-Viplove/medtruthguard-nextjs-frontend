import React from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = ({ onCitizenClick, onDoctorClick }) => {
  return (
    <header className="w-full bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-[90%] items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-500">
            <Shield className="size-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">
              MedTruth Guard
            </span>
            <span className="text-xs text-muted-foreground">
              Medical AI Verification
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-sky-200 px-6 text-sm font-semibold text-sky-700 hover:border-sky-300 hover:bg-sky-50"
            onClick={onCitizenClick}
          >
            Citizen
          </Button>

          <Button
            size="lg"
            className="rounded-full px-6 text-sm font-semibold"
            style={{ backgroundColor: "#0084d1", color: "white" }}
            onClick={onDoctorClick}
          >
            Doctor
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
