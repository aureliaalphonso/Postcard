import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { API_BASE } from "../context/AuthContext";
import { PostcardViewer } from "../components/PostcardViewer";
import { Postcard } from "../components/AddPostcardModal";
import { publicAnonKey } from "/utils/supabase/info";

// ── Envelope visual (4-flap SVG + image inside) ───────────────────────────────
function EnvelopeVisual({ imageUrl }: { imageUrl: string | null }) {
  const W = 383;
  const H = 266;
  // Flap tips (centre of envelope)
  const cx = W / 2;          // 191.5
  const topTipY = H * 0.722; // ~192 — top flap points down here
  const botTipY = H * 0.376; // ~100 — bottom flap points up here
  const leftTipX = 183;
  const rightTipX = 200;
  const midY = (topTipY + botTipY) / 2; // ~146

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: `${W}/${H}` }}>
      {/* Envelope body */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#F7E2CC", borderRadius: 4 }} />

      {/* Postcard front image — visible through the diamond gap between flaps */}
      {imageUrl && (
        <div
          style={{
            position: "absolute",
            top: "9%",
            left: "17%",
            width: "66%",
            height: "78%",
            overflow: "hidden",
            borderRadius: 3,
          }}
        >
          <img
            src={imageUrl}
            alt="postcard front"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* SVG envelope flaps drawn on top of image */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <filter id="botFlap" x="-10%" y="-30%" width="120%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="17.5" result="blur" />
            <feOffset dy="4" />
            <feComposite in2="SourceAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend in="SourceGraphic" result="shape" />
          </filter>
          <filter id="sideFlap" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="4" dy="4" stdDeviation="2" floodColor="rgba(0,0,0,0.25)" />
          </filter>
        </defs>

        {/* Bottom flap — drawn first so top/side flaps cover its upper portion */}
        <polygon
          points={`0,${H} ${cx},${botTipY} ${W},${H}`}
          fill="#EDCCA8"
          filter="url(#botFlap)"
        />

        {/* Left side flap */}
        <polygon
          points={`0,0 ${leftTipX},${midY} 0,${H}`}
          fill="#F0D9BC"
          filter="url(#sideFlap)"
        />

        {/* Right side flap */}
        <polygon
          points={`${W},0 ${rightTipX},${midY} ${W},${H}`}
          fill="#F0D9BC"
          filter="url(#sideFlap)"
        />

        {/* Top flap — drawn last, sits over everything */}
        <polygon
          points={`0,0 ${W},0 ${cx},${topTipY}`}
          fill="#F7E2CC"
        />

        {/* Subtle fold line between flaps */}
        <line
          x1="0" y1="0" x2={cx} y2={topTipY}
          stroke="rgba(0,0,0,0.04)" strokeWidth="1"
        />
        <line
          x1={W} y1="0" x2={cx} y2={topTipY}
          stroke="rgba(0,0,0,0.04)" strokeWidth="1"
        />
      </svg>
    </div>
  );
}

// ── Card stack visual (two fanned postcards) ──────────────────────────────────
function CardStackVisual({ imageUrl }: { imageUrl: string | null }) {
  const cardStyle: React.CSSProperties = {
    position: "absolute",
    width: 268,
    height: 179,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#f7e2cc",
    boxShadow: "4px 4px 35px rgba(0,0,0,0.25)",
  };

  return (
    <div style={{ position: "relative", width: 328, height: 264 }}>
      {/* Card 1 — rotated behind */}
      <div
        style={{
          ...cardStyle,
          left: 20,
          top: 0,
          transform: "rotate(16.5deg)",
          transformOrigin: "center center",
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="postcard"
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleY(-1)" }}
          />
        )}
      </div>
      {/* Card 2 — straight on top */}
      <div style={{ ...cardStyle, left: 0, top: 85 }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="postcard"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    </div>
  );
}

// ── Flip hint ─────────────────────────────────────────────────────────────────
function FlipHint() {
  return (
    <div className="flex items-center gap-[7px] justify-center">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ transform: "rotate(180deg)" }}
      >
        <path
          d="M9 14L4 9L9 4"
          stroke="#7E7E7E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 9H14.5C17.5376 9 20 11.4624 20 14.5V15C20 18.0376 17.5376 20.5 14.5 20.5H11"
          stroke="#7E7E7E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 14,
          color: "#7e7e7e",
          lineHeight: "normal",
        }}
      >
        Click to flip
      </p>
    </div>
  );
}

// ── Main SharePage ─────────────────────────────────────────────────────────────
export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [postcard, setPostcard] = useState<Postcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPostcard() {
      try {
        const res = await fetch(`${API_BASE}/postcards/${id}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (res.ok) {
          setPostcard(await res.json());
        } else {
          const err = await res.json();
          setError(err.error ?? "Postcard not found");
        }
      } catch (err) {
        setError(`Error: ${err}`);
      } finally {
        setLoading(false);
      }
    }
    fetchPostcard();
  }, [id]);

  function handleCopyLink() {
    const url = window.location.href;
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;top:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {}
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isEnvelope = postcard?.displayMode === "envelope";

  return (
    <div
      className="min-h-screen bg-white relative flex flex-col"
      style={{ maxWidth: 402, margin: "0 auto", fontFamily: "'Instrument Serif', serif" }}
    >
      {/* ── Header ── */}
      <div className="px-[33px] pt-[29px] pb-0 flex-none">
        <p style={{ fontSize: 40, lineHeight: "normal", color: "black" }}>POSTCARD</p>
      </div>

      {/* ── Back + title row ── */}
      <div className="relative flex items-center px-[15px] mt-[5px] flex-none" style={{ minHeight: 36 }}>
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: 0, color: "black", textDecoration: "none" }}
        >
          {/* back chevron */}
          <svg width="12" height="24" viewBox="0 0 12 24" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.45 4.5L2.55 12L9.45 19.5L10.55 18.3L4.85 12L10.55 5.7L9.45 4.5Z"
              fill="black"
            />
          </svg>
        </Link>
        <p
          className="absolute left-0 right-0 text-center"
          style={{ fontSize: 20, color: "black", lineHeight: "normal", pointerEvents: "none" }}
        >
          {loading ? "" : postcard?.title ?? ""}
        </p>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: "#A08060", fontSize: 14 }}>Loading postcard…</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p style={{ color: "#ef4444", fontSize: 14 }}>{error}</p>
          <Link to="/" style={{ color: "#6B5040", fontSize: 14, textDecoration: "underline" }}>
            ← Go home
          </Link>
        </div>
      ) : postcard ? (
        <div className="flex-1 flex flex-col">
          {/* Visual section */}
          {isEnvelope ? (
            <div style={{ padding: "16px 6px 0" }}>
              <EnvelopeVisual imageUrl={postcard.frontImageUrl} />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "16px 36px 0",
                overflowX: "hidden",
              }}
            >
              <CardStackVisual imageUrl={postcard.frontImageUrl} />
            </div>
          )}

          {/* PostcardViewer — overlaps slightly with envelope for "card sliding out" effect */}
          <div
            style={{
              padding: "0 16px",
              marginTop: isEnvelope ? -32 : 16,
              position: "relative",
              zIndex: 10,
            }}
          >
            <PostcardViewer postcard={postcard} showActions={false} />
          </div>

          {/* Flip hint */}
          <div style={{ marginTop: 10 }}>
            <FlipHint />
          </div>

          {/* CTA section */}
          <div style={{ padding: "24px 33px 0", flex: 1 }}>
            <p style={{ fontSize: 14, color: "black", marginBottom: 16 }}>
              Create your own postcard!
            </p>

            {/* Copy link button */}
            <button
              onClick={handleCopyLink}
              style={{
                display: "block",
                width: "100%",
                background: copied ? "#4A7C59" : "white",
                color: copied ? "white" : "black",
                border: "1px solid black",
                borderRadius: 10,
                padding: "10px",
                textAlign: "center",
                fontSize: 16,
                marginBottom: 10,
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
                fontFamily: "'Instrument Serif', serif",
              }}
            >
              {copied ? "Link copied! ✓" : "Copy share link"}
            </button>

            {/* Continue / Get started */}
            <Link to="/" style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: "black",
                  color: "white",
                  borderRadius: 10,
                  padding: "10px",
                  textAlign: "center",
                  fontSize: 20,
                }}
              >
                Continue
              </div>
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: "0.5px solid #d9d9d9",
          padding: "20px 0",
          textAlign: "center",
          marginTop: 20,
          flexShrink: 0,
        }}
      >
        <p style={{ color: "#939393", fontSize: 10 }}>Designed &amp; build by @aurealphonso</p>
      </div>
    </div>
  );
}
