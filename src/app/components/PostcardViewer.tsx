import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Postcard } from "./AddPostcardModal";
import { StickerItem } from "./StickerPicker";
import { ShareModal } from "./ShareModal";
import { Share2, Edit2, Trash2 } from "lucide-react";

import stamp0 from "../../imports/image-13.png";
import stamp1 from "../../imports/image-14.png";
import stamp2 from "../../imports/image-15.png";
import imgPostmark from "figma:asset/4413e91ca5c2c745bfddd176b708c998b839f504.png";

const STAMPS: string[] = [stamp0 as string, stamp1 as string, stamp2 as string];

interface PostcardViewerProps {
  postcard: Postcard;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

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
        <div
          style={{
            fontSize: `${h * 0.85}px`,
            lineHeight: 1,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sticker.content}
        </div>
      ) : isFrame ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {/* Fill image clipped to the frame's inner shape */}
          <img
            src={sticker.fillUrl ?? "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              clipPath: sticker.frameClip,
              opacity: sticker.fillUrl ? 1 : 0,
            }}
            alt=""
            draggable={false}
          />
          {/* Frame PNG — mix-blend-mode:multiply turns white → transparent */}
          <img
            src={sticker.content}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "fill",
              mixBlendMode: "multiply",
            }}
            alt="frame"
            draggable={false}
          />
        </div>
      ) : (
        <img
          src={sticker.content}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: "4px" }}
          alt="sticker"
          draggable={false}
        />
      )}
    </div>
  );
}

export function PostcardViewer({ postcard, onEdit, onDelete, showActions = true }: PostcardViewerProps) {
  const [flipped, setFlipped] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = postcard.mediaType?.startsWith("video/") ?? false;
  const stickers = parseStickersProp(postcard.stickers);
  const frontStickers = stickers.filter((s) => s.face === "front");
  const backStickers = stickers.filter((s) => s.face === "back");

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const resume = () => { vid.play().catch(() => {}); };
        document.addEventListener("click", resume, { once: true });
        document.addEventListener("touchstart", resume, { once: true });
      });
    }
  }, [postcard.frontImageUrl, isVideo]);


  const stampSrc: string | null = (() => {
    if (postcard.customStampUrl) return postcard.customStampUrl;
    const idx = postcard.stamp != null ? Number(postcard.stamp) : null;
    if (idx !== null && idx >= 0 && idx < STAMPS.length) return STAMPS[idx];
    return null;
  })();

  const stampKey = postcard.customStampUrl
    ? `custom-${postcard.id}`
    : postcard.stamp != null
    ? `preset-${postcard.stamp}-${postcard.id}`
    : "none";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Actions */}
      {showActions && (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDD9C0] border border-[#D0BFA8] text-[#4A3728] text-xs hover:bg-[#E0CCAC] transition-colors"
              style={{ fontFamily: "'Lora', serif" }}
            >
              <Share2 size={12} />
              Share link
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 rounded-full bg-[#EDD9C0] border border-[#D0BFA8] text-[#4A3728] hover:bg-[#E0CCAC] transition-colors"
                title="Edit"
              >
                <Edit2 size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-full bg-[#EDD9C0] border border-[#D0BFA8] text-red-500 hover:bg-[#E0CCAC] transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
          {/* Display mode badge */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#D0BFA8] text-[#8B7060]"
            style={{ fontFamily: "'Lora', serif", fontSize: "9px" }}
            title="Sharing style — change in Edit"
          >
            {postcard.displayMode === "envelope" ? (
              <>✉️ <span>Shared as envelope</span></>
            ) : (
              <>📬 <span>Shared as card</span></>
            )}
          </div>
        </div>
      )}

      {/* 3-D flip card */}
      <div
        className="w-full max-w-md cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
        title="Click to flip"
      >
        <div className="relative">
          {/* Stacked paper shadows */}
          <div
            className="absolute rounded-[5px] pointer-events-none"
            style={{ backgroundColor: "#e0cdb5", top: "8px", left: "-6px", right: "6px", bottom: "-8px", transform: "rotate(-2.5deg)", zIndex: 0 }}
          />
          <div
            className="absolute rounded-[5px] pointer-events-none"
            style={{ backgroundColor: "#ecdecb", top: "4px", left: "-3px", right: "3px", bottom: "-4px", transform: "rotate(-1.2deg)", zIndex: 1 }}
          />

          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "relative", width: "100%", aspectRatio: "3/2", transformStyle: "preserve-3d", zIndex: 2 }}
          >
            {/* ── FRONT ── */}
            <div
              className="absolute inset-0 rounded-[5px] overflow-hidden shadow-md"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", backgroundColor: "#f7e2cc" }}
            >
              {postcard.frontImageUrl ? (
                isVideo ? (
                  <video
                    ref={videoRef}
                    key={postcard.frontImageUrl}
                    src={postcard.frontImageUrl}
                    className="w-full h-full object-cover"
                    autoPlay muted loop playsInline controls={false}
                    draggable={false}
                  />
                ) : (
                  <img
                    src={postcard.frontImageUrl}
                    alt="Postcard front"
                    className="w-full h-full object-cover"
                    draggable={false}
                    loading="eager"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p style={{ fontFamily: "'Inria Serif', serif", fontSize: "11px", color: "#b09070" }}>
                    tap to flip ↺
                  </p>
                </div>
              )}
              {/* Front stickers */}
              {frontStickers.map((s) => <StickerDisplay key={s.id} sticker={s} />)}
            </div>

            {/* ── BACK ── */}
            <div
              className="absolute inset-0 rounded-[5px] shadow-lg overflow-hidden"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "#f6ece2" }}
            >
              {/* "POSTCARD" header top-left */}
              <div
                className="absolute"
                style={{ top: "9px", left: "12px", fontFamily: "'Inria Serif', serif", fontWeight: 700, fontSize: "10px", letterSpacing: "0.06em", color: "#000" }}
              >
                POSTCARD
              </div>

              {/* Stamp top-right */}
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
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "5px", color: "#999", textAlign: "center", lineHeight: 1.4 }}>
                      Place<br />Stamp<br />Here
                    </span>
                  </div>
                )}
              </div>

              {/* Vertical divider */}
              <div className="absolute" style={{ left: "52%", top: "10px", bottom: "10px", width: "1px", backgroundColor: "#d0c0aa" }} />

              {/* LEFT: message */}
              <div className="absolute overflow-hidden" style={{ top: "26px", left: "10px", right: "calc(48% + 8px)", bottom: "10px" }}>
                {postcard.text ? (
                  <p className="text-black whitespace-pre-wrap break-words" style={{ fontFamily: "'Italianno', cursive", fontSize: "13px", lineHeight: 1.5 }}>
                    {postcard.text}
                  </p>
                ) : (
                  <p style={{ fontFamily: "'Italianno', cursive", fontSize: "13px", color: "#bbb" }}>No message yet…</p>
                )}
              </div>

              {/* RIGHT: address lines */}
              <div className="absolute flex flex-col justify-center" style={{ top: "72px", left: "calc(52% + 8px)", right: "8px", bottom: "10px", gap: "6px" }}>
                {(() => {
                  const lines = (postcard.signature ?? "").split("\n");
                  const labels = ["To", "Address", "City / Country"];
                  return [0, 1, 2].map((i) => (
                    <div key={i} style={{ borderBottom: "1px solid #d0c0aa", paddingBottom: "2px" }}>
                      <span style={{ fontFamily: "'Lora', serif", fontSize: "5px", color: "#b0a090", letterSpacing: "0.04em", textTransform: "uppercase", display: "block" }}>
                        {labels[i]}
                      </span>
                      {lines[i] ? (
                        <p className="text-black truncate" style={{ fontFamily: "'Italianno', cursive", fontSize: "16px", lineHeight: 1, margin: 0 }}>
                          {lines[i]}
                        </p>
                      ) : (
                        <p style={{ fontFamily: "'Italianno', cursive", fontSize: "16px", lineHeight: 1, color: "transparent", margin: 0 }}>&nbsp;</p>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {/* Back stickers */}
              {backStickers.map((s) => <StickerDisplay key={s.id} sticker={s} />)}
            </div>
          </motion.div>
        </div>
      </div>

      <p className="text-[10px] text-[#A08060]" style={{ fontFamily: "'Lora', serif" }}>
        {flipped ? "Tap to flip back ↺" : "Tap postcard to read ↺"}
      </p>

      {shareModalOpen && (
        <ShareModal postcard={postcard} onClose={() => setShareModalOpen(false)} />
      )}
    </div>
  );
}
