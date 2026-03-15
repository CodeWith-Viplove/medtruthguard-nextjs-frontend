"use client";
import React from "react";
import Sidebar from "@/components/home/Sidebar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function HomeLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Clean up OAuth query parameters (code, state, etc.) from the URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const authParams = ["code", "state", "iss", "scope", "authuser", "prompt"];
        const hasAuthParams = authParams.some(param => params.has(param));

        if (hasAuthParams) {
            authParams.forEach(param => params.delete(param));
            const queryString = params.toString();
            const newUrl = pathname + (queryString ? `?${queryString}` : "");
            
            // Use window.history.replaceState to clean URL without a full Next.js transition if possible,
            // or just use router.replace for simplicity in Next.js.
            router.replace(newUrl);
        }
    }, [searchParams, router, pathname]);

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
