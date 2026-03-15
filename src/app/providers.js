"use client";

import { SessionProvider } from "next-auth/react";
import { ConfigProvider } from "antd";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "var(--font-google-sans)",
          },
        }}
      >
        {children}
      </ConfigProvider>
    </SessionProvider>
  );
}
