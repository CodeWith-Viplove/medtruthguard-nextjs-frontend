"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Bell,
  PanelLeftOpen,
  PanelLeftClose,
  User,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function Navbar({ role, sidebarOpen, onToggleSidebar }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Determine page title from path
  const getPageTitle = () => {
    if (pathname.includes("/chat")) return "Medical Query Chat";
    if (pathname.includes("/doctor-responses")) return "Doctor Responses";
    if (pathname.includes("/dashboard")) return "Doctor Dashboard";
    if (pathname.includes("/citizen-query")) return "Patient Queries";
    return role === "doctor" ? "Doctor Portal" : "Citizen Portal";
  };

  const getPageSubtitle = () => {
    if (pathname.includes("/chat")) return "Ask verified medical questions";
    if (pathname.includes("/doctor-responses")) return "AI-verified consultations";
    if (pathname.includes("/dashboard")) return "Overview & analytics";
    if (pathname.includes("/citizen-query")) return "Respond to citizen queries";
    return "MedTruth Guard";
  };

  const userName = session?.user?.name || session?.user?.email || (role === "doctor" ? "Doctor" : "User");
  const userInitials = userName
    .split(" ")
    .filter((w) => !w.startsWith("Dr"))
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const now = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <>
      <style>{`
        .home-navbar {
          background: #1e2538;
          border-bottom: 1px solid #2d3748;
          padding: 0 22px;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 8px rgba(0,0,0,0.1);
          flex-shrink: 0;
          z-index: 5;
        }

        .hn-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .hn-toggle-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 7px;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .hn-toggle-btn:hover {
          background: rgba(255,255,255,0.15);
          color: #e2e8f0;
        }
        .hn-page-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 3px 12px rgba(99,102,241,0.4);
        }
        .hn-page-title {
          font-size: 15px;
          font-weight: 700;
          color: #f1f5f9;
        }
        .hn-page-sub {
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 1px;
        }

        .hn-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .hn-date-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 11.5px;
          color: #94a3b8;
          font-weight: 500;
        }
        .hn-notif-btn {
          position: relative;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 7px;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .hn-notif-btn:hover {
          color: #3b82f6;
          border-color: #3b82f6;
        }
        .hn-notif-dot {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid #1e293b;
        }

        .hn-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px 5px 5px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .hn-user-pill:hover {
          background: rgba(255,255,255,0.05);
        }
        .hn-user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0084d1;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hn-user-name {
          font-size: 12px;
          font-weight: 600;
          color: #f1f5f9;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .hn-date-chip { display: none; }
          .hn-user-name { display: none; }
          .hn-toggle-btn { display: none; }
          .home-navbar { padding-left: 62px; }
          .hn-page-title { font-size: 13px; }
          .hn-page-sub { font-size: 10px; }
          .hn-left { gap: 10px; }
          .hn-page-icon { width: 32px; height: 32px; border-radius: 8px; }
        }
      `}</style>

      <header className="home-navbar">
        <div className="hn-left">
          <button className="hn-toggle-btn" onClick={onToggleSidebar}>
            {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
          <div className="hn-page-icon">
            <Shield size={17} />
          </div>
          <div>
            <div className="hn-page-title">{getPageTitle()}</div>
            <div className="hn-page-sub">{getPageSubtitle()}</div>
          </div>
        </div>

        <div className="hn-right">
          <div className="hn-date-chip">
            <Calendar size={12} />
            {now}
          </div>

          <button className="hn-notif-btn">
            <Bell size={16} />
            <div className="hn-notif-dot" />
          </button>

          <div className="hn-user-pill">
            <div className="hn-user-avatar">{userInitials}</div>
            <span className="hn-user-name">{userName}</span>
            <ChevronDown size={12} style={{ color: "#94a3b8" }} />
          </div>
        </div>
      </header>
    </>
  );
}
