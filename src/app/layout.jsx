"use client";

import { useEffect } from "react";
import initOneSignal from "../lib/OneSignalInit";

export default function RootLayout({ children }) {
  useEffect(() => {
    initOneSignal();
  }, []);

  return <html><body>{children}</body></html>;
}
