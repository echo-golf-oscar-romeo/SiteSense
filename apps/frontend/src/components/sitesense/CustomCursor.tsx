"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function CustomCursor() {
  const pathname = usePathname();

  useEffect(() => {
    // Only active on /sitesense routes
    if (!pathname?.startsWith("/sitesense")) return;

    const body = document.body;
    body.classList.add("ss-cursor-active");

    const cursor = document.getElementById("ss-cursor");
    if (!cursor) return;

    let raf = 0;
    let cx = -100, cy = -100;

    const onMove = (e: MouseEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      });

      // Hide over MapLibre canvas
      const target = e.target as Element;
      const isMap = target.closest(".maplibregl-canvas-container");
      cursor.style.opacity = isMap ? "0" : "1";

      // Hover state
      const isHoverable =
        target.closest("a, button, input, textarea, select, [role=button]") !== null;
      cursor.classList.toggle("hover", isHoverable);
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      body.classList.remove("ss-cursor-active");
      if (cursor) cursor.style.opacity = "0";
    };
  }, [pathname]);

  // Only render on /sitesense
  if (!pathname?.startsWith("/sitesense")) return null;

  return (
    <div
      id="ss-cursor"
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
        opacity: 0,
        transition: "opacity 120ms",
      }}
    >
      <span className="ss-ring ss-ring-outer" />
      <span className="ss-ring ss-ring-middle" />
      <span className="ss-ring ss-ring-center" />
    </div>
  );
}
