import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { PenLine, Trash2 } from "lucide-react";

export interface Album {
  id: string;
  name: string;
  date: string;
  coverImageUrl: string | null;
  postcardCount?: number;
}

interface AlbumCardProps {
  album: Album;
  onEdit?: (album: Album) => void;
  onDelete?: (album: Album) => void;
}

const HOLD_MS = 500;

export function AlbumCard({ album, onEdit, onDelete }: AlbumCardProps) {
  const [held, setHeld] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const navigate = useNavigate();

  const cancelHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    holdTimer.current = null;
    rafRef.current = null;
    setProgress(0);
  }, []);

  const startHold = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!onEdit && !onDelete) return;
      cancelHold();
      startRef.current = performance.now();

      function tick() {
        const elapsed = performance.now() - startRef.current;
        const p = Math.min(elapsed / HOLD_MS, 1);
        setProgress(p);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);

      holdTimer.current = setTimeout(() => {
        setHeld(true);
        setProgress(0);
      }, HOLD_MS);
    },
    [onEdit, onDelete, cancelHold]
  );

  const endHold = useCallback(() => cancelHold(), [cancelHold]);

  function dismiss() {
    setHeld(false);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    dismiss();
    // defer slightly so dismiss state settles before parent opens modal
    setTimeout(() => onEdit?.(album), 0);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    dismiss();
    setTimeout(() => onDelete?.(album), 0);
  }

  return (
    // Outer wrapper — position:relative, NO transform (avoids stacking context trap)
    <div className="block relative select-none">
      {/* Full-screen dim backdrop when held — z-40 */}
      {held && (
        <div className="fixed inset-0" style={{ zIndex: 40 }} onClick={dismiss} />
      )}

      {/* Card area — position:relative so action overlay can abs-position over it */}
      <div className="relative" style={{ zIndex: held ? 41 : "auto" }}>
        {/* Thumbnail — overflow:hidden + transform live here; no children that need z-index above backdrop */}
        <div
          className="w-full overflow-hidden"
          style={{
            aspectRatio: "4/3",
            backgroundColor: "#F0E4D0",
            border: held ? "2px solid #C8A878" : "1px solid #DDD0BC",
            borderRadius: "5px",
            transition: "border-color 0.2s, transform 0.2s",
            transform: held
              ? "scale(1.03)"
              : progress > 0
              ? `scale(${1 + progress * 0.03})`
              : "scale(1)",
          }}
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          onTouchCancel={endHold}
          onClick={(e) => {
            if (held) { e.preventDefault(); return; }
            navigate(`/album/${album.id}`);
          }}
        >
          {album.coverImageUrl ? (
            <img
              src={album.coverImageUrl}
              alt={album.name}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center pointer-events-none">
              <div
                className="border border-[#C9B49A] px-4 py-2 text-xs text-[#A08060]"
                style={{ fontFamily: "'Lora', serif", borderRadius: "3px" }}
              >
                No Cover
              </div>
            </div>
          )}

          {/* Hold progress ring — inside overflow:hidden but pointer-events:none, fine */}
          {progress > 0 && !held && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg width="44" height="44" className="drop-shadow">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress)}`}
                  transform="rotate(-90 22 22)"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Action overlay — SIBLING to the thumbnail div, NOT inside overflow:hidden.
            Positioned absolutely over the thumbnail. No stacking context trap. */}
        {held && (onEdit || onDelete) && (
          <div
            className="absolute inset-0 flex items-center justify-center gap-4 pointer-events-auto"
            style={{
              background: "rgba(0,0,0,0.38)",
              borderRadius: "5px",
            }}
          >
            {onEdit && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleEdit}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center text-[#2C1810] group-hover:bg-white transition-colors shadow-lg">
                  <PenLine size={16} />
                </div>
                <span className="text-[10px] text-white font-medium" style={{ fontFamily: "'Lora', serif" }}>
                  Edit
                </span>
              </button>
            )}
            {onDelete && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleDelete}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center text-red-500 group-hover:bg-white transition-colors shadow-lg">
                  <Trash2 size={16} />
                </div>
                <span className="text-[10px] text-white font-medium" style={{ fontFamily: "'Lora', serif" }}>
                  Delete
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Album info */}
      <div className="mt-2 px-0.5">
        <p
          className="text-sm font-medium text-[#2C1810]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {album.name}
        </p>
        <p className="text-xs text-[#8B7060] mt-0.5">
          {album.date || "No date"}
        </p>
      </div>
    </div>
  );
}
