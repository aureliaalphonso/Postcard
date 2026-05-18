import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Postcard } from "./AddPostcardModal";
import { StickerItem } from "./StickerPicker";

import stamp0 from "../../imports/image-13.png";
import stamp1 from "../../imports/image-14.png";
import stamp2 from "../../imports/image-15.png";
import imgPostmark from "figma:asset/4413e91ca5c2c745bfddd176b708c998b839f504.png";

const STAMPS: string[] = [stamp0 as string, stamp1 as string, stamp2 as string];

function parseStickersProp(raw: StickerItem[] | undefined): StickerItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw as unknown as string); } catch { return []; }
}

function StickerDisplay({ sticker }: { sticker: StickerItem }) {
  const isEmoji = sticker.type === "emoji";
  const isFrame = sticker.type === "frame";
  const baseH = isEmoji ? 40 : 90;
  const h = baseH * sticker.scale;
  const aspect = isFrame ? (sticker.frameAspect ?? 1) : 1;
  const w = isFrame ? h * aspect : h;
  return (
    <div
      style={{
        position: "absolute",
        left: `calc(${sticker.x}% - ${w / 2}px)`,
        top: `calc(${sticker.y}% - ${h / 2}px)`,
        width: `${w}px`,
        height: `${h}px`,
        transform: `rotate(${sticker.rotation}deg)`,
        pointerEvents: "none",
        zIndex: 8,
      }}
    >
      {isEmoji ? (
        <div style={{ fontSize: `${h * 0.85}px`, lineHeight: 1, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {sticker.content}
        </div>
      ) : isFrame ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <img
            src={sticker.fillUrl ?? "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", clipPath: sticker.frameClip, opacity: sticker.fillUrl ? 1 : 0,
            }}
            alt="" draggable={false}
          />
          <img
            src={sticker.content}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", mixBlendMode: "multiply" }}
            alt="frame" draggable={false}
          />
        </div>
      ) : (
        <img src={sticker.content} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: "4px" }} alt="sticker" draggable={false} />
      )}
    </div>
  );
}

// ── Envelope visual ────────────────────────────────────────────────────────────
function EnvelopeVisual({ imageUrl }: { imageUrl: string | null }) {
  const W = 383;
  const H = 266;
  const cx = W / 2;
  const topTipY = H * 0.722;
  const botTipY = H * 0.376;
  const leftTipX = 183;
  const rightTipX = 200;
  const midY = (topTipY + botTipY) / 2;

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: `${W}/${H}` }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#F7E2CC", borderRadius: 4 }} />
      {imageUrl && (
        <div style={{ position: "absolute", top: "9%", left: "17%", width: "66%", height: "78%", overflow: "hidden", borderRadius: 3 }}>
          <img src={imageUrl} alt="postcard front" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <filter id="sm-botFlap" x="-10%" y="-30%" width="120%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="17.5" result="blur" />
            <feOffset dy="4" />
            <feComposite in2="SourceAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend in="SourceGraphic" result="shape" />
          </filter>
          <filter id="sm-sideFlap" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="4" dy="4" stdDeviation="2" floodColor="rgba(0,0,0,0.25)" />
          </filter>
        </defs>
        <polygon points={`0,${H} ${cx},${botTipY} ${W},${H}`} fill="#EDCCA8" filter="url(#sm-botFlap)" />
        <polygon points={`0,0 ${leftTipX},${midY} 0,${H}`} fill="#F0D9BC" filter="url(#sm-sideFlap)" />
        <polygon points={`${W},0 ${rightTipX},${midY} ${W},${H}`} fill="#F0D9BC" filter="url(#sm-sideFlap)" />
        <polygon points={`0,0 ${W},0 ${cx},${topTipY}`} fill="#F7E2CC" />
        <line x1="0" y1="0" x2={cx} y2={topTipY} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
        <line x1={W} y1="0" x2={cx} y2={topTipY} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── Card stack visual ──────────────────────────────────────────────────────────
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
      <div style={{ ...cardStyle, left: 20, top: 0, transform: "rotate(16.5deg)", transformOrigin: "center center" }}>
        {imageUrl && <img src={imageUrl} alt="postcard" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleY(-1)" }} />}
      </div>
      <div style={{ ...cardStyle, left: 0, top: 85 }}>
        {imageUrl && <img src={imageUrl} alt="postcard" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
    </div>
  );
}

// ── Inline flip card ───────────────────────────────────────────────────────────
function FlipCard({ postcard }: { postcard: Postcard }) {
  const [flipped, setFlipped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = postcard.mediaType?.startsWith("video/") ?? false;
  const stickers = parseStickersProp(postcard.stickers);
  const frontStickers = stickers.filter((s) => s.face === "front");
  const backStickers = stickers.filter((s) => s.face === "back");

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    const p = vid.play();
    if (p !== undefined) p.catch(() => {});
  }, [postcard.frontImageUrl, isVideo]);

  const stampSrc: string | null = (() => {
    if (postcard.customStampUrl) return postcard.customStampUrl;
    const idx = postcard.stamp != null ? Number(postcard.stamp) : null;
    if (idx !== null && idx >= 0 && idx < STAMPS.length) return STAMPS[idx];
    return null;
  })();

  const stampKey = postcard.customStampUrl
    ? `custom-${postcard.id}`
    : postcard.stamp != null ? `preset-${postcard.stamp}-${postcard.id}` : "none";

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div
        className="w-full max-w-md cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="relative">
          <div className="absolute rounded-[5px] pointer-events-none" style={{ backgroundColor: "#e0cdb5", top: "8px", left: "-6px", right: "6px", bottom: "-8px", transform: "rotate(-2.5deg)", zIndex: 0 }} />
          <div className="absolute rounded-[5px] pointer-events-none" style={{ backgroundColor: "#ecdecb", top: "4px", left: "-3px", right: "3px", bottom: "-4px", transform: "rotate(-1.2deg)", zIndex: 1 }} />
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "relative", width: "100%", aspectRatio: "3/2", transformStyle: "preserve-3d", zIndex: 2 }}
          >
            {/* FRONT */}
            <div className="absolute inset-0 rounded-[5px] overflow-hidden shadow-md" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", backgroundColor: "#f7e2cc" }}>
              {postcard.frontImageUrl ? (
                isVideo ? (
                  <video ref={videoRef} key={postcard.frontImageUrl} src={postcard.frontImageUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline controls={false} draggable={false} />
                ) : (
                  <img src={postcard.frontImageUrl} alt="Postcard front" className="w-full h-full object-cover" draggable={false} loading="eager" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p style={{ fontFamily: "'Inria Serif', serif", fontSize: "11px", color: "#b09070" }}>tap to flip ↺</p>
                </div>
              )}
              {frontStickers.map((s) => <StickerDisplay key={s.id} sticker={s} />)}
            </div>

            {/* BACK */}
            <div className="absolute inset-0 rounded-[5px] shadow-lg overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "#f6ece2" }}>
              <div className="absolute" style={{ top: "9px", left: "12px", fontFamily: "'Inria Serif', serif", fontWeight: 700, fontSize: "10px", letterSpacing: "0.06em", color: "#000" }}>
                POSTCARD
              </div>
              <div className="absolute" style={{ top: "8px", right: "8px", width: "44px", height: "56px" }}>
                {stampSrc ? (
                  <div className="relative w-full h-full">
                    <img key={stampKey} src={stampSrc} alt="Stamp" className="w-full h-full object-cover block" style={{ borderRadius: "2px" }} draggable={false} loading="eager" />
                    <div className="absolute pointer-events-none" style={{ top: "6px", left: "-10px", width: "34px", height: "34px", opacity: 0.85 }}>
                      <img src={imgPostmark} alt="" className="w-full h-full object-cover" style={{ transform: "rotate(56deg)" }} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ border: "1px solid #c0a888", borderRadius: "2px", backgroundColor: "#ecdeca" }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "5px", color: "#999", textAlign: "center", lineHeight: 1.4 }}>Place<br />Stamp<br />Here</span>
                  </div>
                )}
              </div>
              <div className="absolute" style={{ left: "52%", top: "10px", bottom: "10px", width: "1px", backgroundColor: "#d0c0aa" }} />
              <div className="absolute overflow-hidden" style={{ top: "26px", left: "10px", right: "calc(48% + 8px)", bottom: "10px" }}>
                {postcard.text ? (
                  <p className="text-black whitespace-pre-wrap break-words" style={{ fontFamily: "'Italianno', cursive", fontSize: "13px", lineHeight: 1.5 }}>{postcard.text}</p>
                ) : (
                  <p style={{ fontFamily: "'Italianno', cursive", fontSize: "13px", color: "#bbb" }}>No message yet…</p>
                )}
              </div>
              <div className="absolute flex flex-col justify-center" style={{ top: "72px", left: "calc(52% + 8px)", right: "8px", bottom: "10px", gap: "6px" }}>
                {(() => {
                  const lines = (postcard.signature ?? "").split("\n");
                  const labels = ["To", "Address", "City / Country"];
                  return [0, 1, 2].map((i) => (
                    <div key={i} style={{ borderBottom: "1px solid #d0c0aa", paddingBottom: "2px" }}>
                      <span style={{ fontFamily: "'Lora', serif", fontSize: "5px", color: "#b0a090", letterSpacing: "0.04em", textTransform: "uppercase", display: "block" }}>{labels[i]}</span>
                      {lines[i] ? (
                        <p className="text-black truncate" style={{ fontFamily: "'Italianno', cursive", fontSize: "16px", lineHeight: 1, margin: 0 }}>{lines[i]}</p>
                      ) : (
                        <p style={{ fontFamily: "'Italianno', cursive", fontSize: "16px", lineHeight: 1, color: "transparent", margin: 0 }}>&nbsp;</p>
                      )}
                    </div>
                  ));
                })()}
              </div>
              {backStickers.map((s) => <StickerDisplay key={s.id} sticker={s} />)}
            </div>
          </motion.div>
        </div>
      </div>
      <p className="text-[10px] text-[#A08060]" style={{ fontFamily: "'Lora', serif" }}>
        {flipped ? "Tap to flip back ↺" : "Click to flip"}
      </p>
    </div>
  );
}

// ── ShareModal ─────────────────────────────────────────────────────────────────
interface ShareModalProps {
  postcard: Postcard;
  onClose: () => void;
}

export function ShareModal({ postcard, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const isEnvelope = postcard.displayMode === "envelope";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const url = `${window.location.origin}/share/${postcard.id}`;
    let ok = false;
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {}
    if (!ok && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setToastVisible(true);
    const t = setTimeout(() => setToastVisible(false), 2500);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [postcard.id]);

  function handleCopyLink() {
    const url = `${window.location.origin}/share/${postcard.id}`;
    let ok = false;
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {}
    if (!ok && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "white",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          maxWidth: 402,
          margin: "0 auto",
          width: "100%",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Instrument Serif', serif",
        }}
      >
        {/* Header */}
        <div style={{ padding: "29px 33px 0" }}>
          <p style={{ fontSize: 40, lineHeight: "normal", color: "black" }}>POSTCARD</p>
        </div>

        {/* Back + title row */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "5px 15px 0", minHeight: 36 }}>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, color: "black" }}
          >
            <svg width="12" height="24" viewBox="0 0 12 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M9.45 4.5L2.55 12L9.45 19.5L10.55 18.3L4.85 12L10.55 5.7L9.45 4.5Z" fill="black" />
            </svg>
          </button>
          <p
            style={{
              position: "absolute", left: 0, right: 0, textAlign: "center",
              fontSize: 20, color: "black", lineHeight: "normal", pointerEvents: "none",
            }}
          >
            {postcard.title ?? ""}
          </p>
        </div>

        {/* "Link copied!" toast */}
        <div
          style={{
            margin: "10px 16px 0",
            padding: "8px 16px",
            borderRadius: 10,
            backgroundColor: "#4A7C59",
            color: "white",
            textAlign: "center",
            fontSize: 14,
            opacity: toastVisible ? 1 : 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        >
          ✓ Link copied to clipboard!
        </div>

        {/* Visual section */}
        {isEnvelope ? (
          <div style={{ padding: "16px 6px 0" }}>
            <EnvelopeVisual imageUrl={postcard.frontImageUrl} />
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", padding: "16px 36px 0", overflowX: "hidden" }}>
            <CardStackVisual imageUrl={postcard.frontImageUrl} />
          </div>
        )}

        {/* Flip card — overlaps envelope for card-sliding-out effect */}
        <div style={{ padding: "0 16px", marginTop: isEnvelope ? -32 : 16, position: "relative", zIndex: 10 }}>
          <FlipCard postcard={postcard} />
        </div>

        {/* CTA */}
        <div style={{ padding: "24px 33px 0", flex: 1 }}>
          <p style={{ fontSize: 14, color: "black", marginBottom: 16 }}>
            Create your own postcard!
          </p>

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

          <a
            href={`${window.location.origin}/share/${postcard.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              background: "white",
              color: "black",
              border: "1px solid black",
              borderRadius: 10,
              padding: "10px",
              textAlign: "center",
              fontSize: 16,
              marginBottom: 10,
              cursor: "pointer",
              fontFamily: "'Instrument Serif', serif",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Open share page ↗
          </a>

          <button
            onClick={onClose}
            style={{
              display: "block",
              width: "100%",
              background: "black",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "10px",
              textAlign: "center",
              fontSize: 20,
              cursor: "pointer",
              fontFamily: "'Instrument Serif', serif",
            }}
          >
            Continue
          </button>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "0.5px solid #d9d9d9", padding: "20px 0", textAlign: "center", marginTop: 20 }}>
          <p style={{ color: "#939393", fontSize: 10 }}>Designed &amp; build by @aurealphonso</p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
