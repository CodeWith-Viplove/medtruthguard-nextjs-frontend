"use client";
import React from "react";

export default function MainSection({ children }) {
    return (
        <>
            <style>{`
        .home-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f8faff;
          position: relative;
        }
        .home-main-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .home-main-content::-webkit-scrollbar {
          width: 5px;
        }
        .home-main-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .home-main-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>

            <div className="home-main">
                <div className="home-main-content">
                    {children}
                </div>
            </div>
        </>
    );
}
