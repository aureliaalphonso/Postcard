import { useState } from "react";
import { PostcardViewer } from "./PostcardViewer";
import { Postcard } from "./AddPostcardModal";

interface EnvelopeDisplayProps {
  postcard: Postcard;
}

export function EnvelopeDisplay({ postcard }: EnvelopeDisplayProps) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");

  function handleOpen() {
    if (phase !== "closed") return;
    setPhase("opening");
    setTimeout(() => setPhase("open"), 700);
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {phase !== "open" ? (
        <div
          className="w-full cursor-pointer select-none"
          style={{
            opacity: phase === "opening" ? 0 : 1,
            transform: phase === "opening" ? "scale(0.92) translateY(-16px)" : "scale(1) translateY(0)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
          onClick={handleOpen}
        >
          {/* Envelope visual */}
          <div
            className="relative w-full"
            style={{ aspectRatio: "5/3", filter: "drop-shadow(0 6px 24px rgba(0,0,0,0.14))" }}
          >
            {/* Main envelope body */}
            <div
              className="absolute inset-0 rounded-[4px]"
              style={{ backgroundColor: "#FFF3E6" }}
            />

            {/* Left side flap */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(0 0, 50% 50%, 0 100%)",
                backgroundColor: "#EDD5B8",
              }}
            />

            {/* Right side flap */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(100% 0, 50% 50%, 100% 100%)",
                backgroundColor: "#EDD5B8",
              }}
            />

            {/* Bottom flap */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(0 100%, 50% 50%, 100% 100%)",
                backgroundColor: "#E8CBA8",
              }}
            />

            {/* Top flap (sealed) */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(0 0, 50% 50%, 100% 0)",
                backgroundColor: "#F5E4CC",
              }}
            />

            {/* Wax seal / postcard hint in center */}
            <div
              className="absolute flex flex-col items-center justify-center"
              style={{ inset: "20% 30%" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: "#C8956C", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
              >
                ✉
              </div>
              {postcard.title && (
                <p
                  className="text-center mt-2 text-[#6B4A30]"
                  style={{
                    fontFamily: "'Italianno', cursive",
                    fontSize: "13px",
                    lineHeight: 1.2,
                    maxWidth: "90px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {postcard.title}
                </p>
              )}
            </div>

            {/* Border overlay */}
            <div
              className="absolute inset-0 rounded-[4px] pointer-events-none"
              style={{ border: "1px solid #D8BFA0" }}
            />
          </div>

          {/* CTA */}
          <div className="text-center mt-5">
            <p
              className="text-[#6B5040] text-sm"
              style={{ fontFamily: "'Lora', serif" }}
            >
              You received a postcard!
            </p>
            <p
              className="text-[#A08060] text-xs mt-1"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Click the envelope to open ✉️
            </p>
          </div>
        </div>
      ) : (
        <div
          className="w-full"
          style={{
            animation: "envelopeFadeIn 0.5s ease forwards",
          }}
        >
          <style>{`
            @keyframes envelopeFadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <p
            className="text-center text-xs text-[#A08060] mb-4"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Here's your postcard! 💌
          </p>
          <PostcardViewer postcard={postcard} showActions={false} />
        </div>
      )}
    </div>
  );
}
