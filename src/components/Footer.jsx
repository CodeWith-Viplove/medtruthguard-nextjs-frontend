"use client"
import React from "react";
import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-sky-500" />
          <span className="font-semibold text-foreground">MedTruth Guard</span>
        </div>
        <p className="text-center text-xs sm:text-sm">
          © 2025 MedTruth Guard. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
