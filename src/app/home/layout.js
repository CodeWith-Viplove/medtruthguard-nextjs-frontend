"use client";
import React from "react";
import Sidebar from "@/components/home/Sidebar";
import { usePathname } from "next/navigation";

export default function HomeLayout({ children }) {
    const pathname = usePathname();

    // Determine role from URL path
    const role = pathname.startsWith("/home/doctor") ? "doctor" : "citizen";

    return (
        <>
            <style>{`
        .home-layout-root {
          display: flex;
          height: 100vh;
          background: #f0f4ff;
          overflow: hidden;
          position: relative;
        }
        .home-layout-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
      `}</style>

            <div className="home-layout-root">
                <Sidebar role={role} />

                <div className="home-layout-content">
                    {children}
                </div>
            </div>
        </>
    );
}
