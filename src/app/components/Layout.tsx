import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router";
import { LoginWidget } from "./LoginWidget";
import { getStoredBg } from "./AccountSettingsModal";
import imgPostcardStack from "figma:asset/a65a38d1c266086ab31552d1ae461254b75f9d6a.png";
import imgPostmark from "figma:asset/4413e91ca5c2c745bfddd176b708c998b839f504.png";

export function Layout() {
  const [bg, setBg] = useState<string>(getStoredBg());

  useEffect(() => {
    // Apply stored bg to body immediately on mount
    const stored = getStoredBg();
    document.body.style.backgroundColor = stored;
    setBg(stored);

    function onBgChange(e: Event) {
      const color = (e as CustomEvent<string>).detail;
      setBg(color);
      document.body.style.backgroundColor = color;
    }
    window.addEventListener("postcard-bg-change", onBgChange);
    return () => window.removeEventListener("postcard-bg-change", onBgChange);
  }, []);

  const isDark = isColorDark(bg);

  return (
    <div
      className="min-h-screen w-full transition-colors duration-300"
      style={{ backgroundColor: bg, fontFamily: "'Lora', serif" }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 pt-5 pb-2">
        <Link to="/" className={isDark ? "text-[#F5E8D5]" : "text-[#2C1810]"} style={{ textDecoration: "none" }}>
          <div className="flex items-center gap-0">
            {/* Vintage postcard stack image */}
            <div className="relative" style={{ width: "52px", height: "38px", flexShrink: 0 }}>
              <img
                src={imgPostcardStack}
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              {/* Postmark seal rotated over it */}
              <div className="absolute flex items-center justify-center" style={{ left: "4px", top: "4px", width: "30px", height: "30px" }}>
                <img
                  src={imgPostmark}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none"
                  style={{ transform: "rotate(56deg)" }}
                />
              </div>
            </div>
            <h1
              className="font-bold"
              style={{ fontFamily: "'Inria Serif', serif", fontSize: "28px", lineHeight: 1, letterSpacing: "-0.01em" }}
            >
              POSTCARD
            </h1>
          </div>
        </Link>
        <LoginWidget />
      </header>

      {/* Page content */}
      <main className="px-4">
        <Outlet />
      </main>
    </div>
  );
}

function isColorDark(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}