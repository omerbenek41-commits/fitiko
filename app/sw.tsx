"use client";
import { useEffect } from "react";

/** Service worker kaydı: uygulamanın internetsiz açılabilmesini sağlar */
export default function SW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol !== "file:" && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }, []);
  return null;
}
