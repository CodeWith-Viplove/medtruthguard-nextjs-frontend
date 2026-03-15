"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  MessageSquare,
  Stethoscope,
  LayoutDashboard,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

const citizenLinks = [
  {
    label: "Medical Chat",
    href: "/home/citizen/chat",
    icon: MessageSquare,
    color: "#3b82f6",
  },
  {
    label: "Doctor Responses",
    href: "/home/citizen/doctor-responses",
    icon: Stethoscope,
    color: "#8b5cf6",
  },
];

const doctorLinks = [
  {
    label: "Dashboard",
    href: "/home/doctor/dashboard",
    icon: LayoutDashboard,
    color: "#3b82f6",
  },
  {
    label: "Patient Queries",
    href: "/home/doctor/citizen-query",
    icon: Users,
    color: "#8b5cf6",
  },
];

const MOBILE_BREAKPOINT = 768; // md breakpoint

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const links = role === "doctor" ? doctorLinks : citizenLinks;

  // Detect screen size and auto-close on mobile/tablet
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) {
        setMobileOpen(false); // auto-close on resize to mobile
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const handleNavClick = (href) => {
    router.push(href);
    if (isMobile) setMobileOpen(false);
  };

  // On mobile: sidebar is hidden by default, shown via mobileOpen
  // On desktop: sidebar is always visible, toggled via expanded
  const showSidebar = isMobile ? mobileOpen : true;
  const sidebarWidth = isMobile
    ? "w-[260px] min-w-[260px]"
    : expanded
      ? "w-[240px] min-w-[240px]"
      : "w-[68px] min-w-[68px]";

  return (
    <>
      {/* ── Mobile Toggle Button ── */}
      {isMobile && !mobileOpen && (
        <button
          className="fixed top-[14px] left-[14px] z-[150] w-[42px] h-[42px] rounded-[12px] bg-white border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer text-slate-600 transition-all duration-200 hover:bg-[#2793ef] hover:text-white hover:border-[#2793ef] hover:shadow-[0_4px_16px_rgba(39,147,239,0.35)] active:scale-95"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* ── Mobile Overlay/Backdrop ── */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-[4px] z-[90] animate-[fadeIn_0.2s_ease]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col items-center p-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden border-r border-[#e2e8f0] bg-white ${isMobile
            ? `fixed top-0 left-0 bottom-0 z-[100] w-[260px] shadow-[4px_0_24px_rgba(0,0,0,0.12)] ${mobileOpen
              ? "translate-x-0"
              : "-translate-x-full pointer-events-none"
            }`
            : `relative z-20 ${expanded ? "w-[240px] min-w-[240px]" : "w-[68px] min-w-[68px]"}`
          }`}
      >
        {/* Logo + Mobile Close */}
        <div className="w-full pt-[18px] pb-[14px] px-[14px] flex items-center justify-between border-b border-[#e2e8f0] shrink-0 overflow-hidden">
          <div className="flex items-center gap-[10px]">
            <div
              className="w-[40px] h-[40px] min-w-[40px] bg-[#e0f2fe] rounded-[13px] flex items-center justify-center text-[#0ea5e9] transition-transform duration-250 cursor-pointer hover:scale-105"
              onClick={() => handleNavClick("/")}
            >
              <Shield size={20} />
            </div>
            <div
              className={`whitespace-nowrap overflow-hidden ${expanded || isMobile ? "block" : "hidden"
                }`}
            >
              <div className="text-[14px] font-extrabold text-[#0f172a] tracking-[-0.3px]">
                MedTruth Guard
              </div>
              <div className="text-[10px] text-[#64748b] font-medium mt-[1px]">
                {role === "doctor" ? "Doctor Portal" : "Citizen Portal"}
              </div>
            </div>
          </div>

          {/* Close button — mobile only */}
          {isMobile && (
            <button
              className="w-[34px] h-[34px] rounded-[10px] bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer text-slate-400 transition-all duration-200 shrink-0 hover:text-red-500 hover:border-red-400 hover:bg-red-50"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 w-full flex flex-col gap-[4px] py-[16px] px-[10px] overflow-y-auto [&::-webkit-scrollbar]:w-0">
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                className={`group relative flex items-center gap-[12px] w-full h-[46px] min-h-[46px] rounded-[12px] border-none bg-transparent cursor-pointer transition-all duration-200 overflow-hidden hover:bg-[#f1f5f9] ${expanded || isMobile
                  ? "px-[14px] justify-start"
                  : "px-0 justify-center"
                  } ${isActive ? "bg-[#f0f9ff]" : ""}`}
                onClick={() => handleNavClick(link.href)}
                style={{ "--link-color": link.color }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[24px] rounded-[0_4px_4px_0] bg-[#0084d1]" />
                )}
                <div
                  className={`w-[36px] h-[36px] min-w-[36px] rounded-[10px] flex items-center justify-center transition-all duration-200 group-hover:text-[#0f172a] ${isActive
                    ? "bg-[#e0f2fe] text-[#0084d1]"
                    : "text-[#64748b]"
                    }`}
                >
                  <Icon size={20} />
                </div>
                <span
                  className={`text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-[#0f172a] ${expanded || isMobile ? "block" : "hidden"
                    } ${isActive ? "text-[#0f172a]" : "text-[#64748b]"}`}
                >
                  {link.label}
                </span>
                {/* Tooltip for collapsed desktop sidebar */}
                {!isMobile && !expanded && (
                  <span className="absolute top-1/2 -translate-y-1/2 bg-[#1e293b] text-[#e2e8f0] text-[12px] font-semibold py-[6px] px-[12px] rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 transition-all duration-150 shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#e2e8f0] z-[100] group-hover:opacity-100 group-hover:left-[66px] left-[62px]">
                    {link.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div
          className={`h-[1px] bg-[#e2e8f0] mx-auto my-[6px] transition-[width] duration-300 ${expanded || isMobile ? "w-[calc(100%-28px)]" : "w-[36px]"
            }`}
        />

        {/* Logout */}
        <button
          className={`flex items-center gap-[12px] h-[42px] m-[0_10px_10px] rounded-[10px] border-none bg-[#ef4444]/10 cursor-pointer transition-all duration-200 justify-center shrink-0 text-[#94a3b8] overflow-hidden hover:bg-[#ef4444]/20 hover:text-[#ef4444] ${expanded || isMobile
            ? "w-[calc(100%-20px)] px-[14px]"
            : "w-[48px] px-0"
            }`}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span
            className={`text-[12px] font-semibold whitespace-nowrap items-center ${expanded || isMobile ? "block" : "hidden"
              }`}
          >
            Sign Out
          </span>
        </button>

        {/* Expand/Collapse Toggle — desktop only */}
        {!isMobile && (
          <button
            className="w-full py-[10px] px-0 flex items-center justify-center gap-[8px] bg-[#2793ef] border-t border-[#e2e8f0] cursor-pointer text-white text-[13px] font-medium transition-colors duration-200 shrink-0 hover:text-[#0f172a]"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronLeft size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            {expanded && <span>Collapse</span>}
          </button>
        )}
      </aside>
    </>
  );
}
