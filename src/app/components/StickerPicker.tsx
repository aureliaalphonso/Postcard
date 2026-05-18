import { useRef } from "react";
import { ImagePlus } from "lucide-react";

import frame0 from "../../imports/Group5-3/285f0f888b77b5900ab55f6a38c37b4f768c60a3.png";
import frame1 from "../../imports/Group6-2/dfa7b5c0bb5e4d6a45dfc6448a6aa40e803a6de4.png";
import frame2 from "../../imports/Group9-2/ab958bc6befecccaa5f5396841a6d722e1dedcd0.png";
import frame3 from "../../imports/Group10-2/3ba1c268ddfd1b61d341959e390fc7153c66c24c.png";
import frame4 from "../../imports/Group8-2/cba613dd15efc6e4797dcad6a6593179435589f2.png";
import frame5 from "../../imports/Group11-2/4a65c0d74149e816e95fad6b1ef7f51037d440df.png";
import frame6 from "../../imports/Group7-2/38cf50efd085002266c78f3a97c9adf359c3778f.png";

// Each frame: src, photo area positioning (%), width-to-height aspect ratio
export interface FrameDef {
  src: string;
  photoArea: { width: string; height: string; left: string; top: string }; // CSS percentages
  photoShape?: "rect" | "circle" | "ellipse"; // Shape type for the photo area
  aspect: number; // width / height
}

export const FRAMES: FrameDef[] = [
  // Group5-3: portrait gold (159x238, photo at 19,33 size 113x172)
  { src: frame0 as string, photoArea: { width: "71.07%", height: "72.27%", left: "11.95%", top: "13.87%" }, photoShape: "rect", aspect: 0.67 },
  // Group6-2: ornate portrait gold (162x199, photo at 26,14 size 113x172)
  { src: frame1 as string, photoArea: { width: "69.75%", height: "86.43%", left: "16.05%", top: "7.04%" }, photoShape: "rect", aspect: 0.81 },
  // Group9-2: landscape gold (286x186, photo at 39,31 size 209x124)
  { src: frame2 as string, photoArea: { width: "73.08%", height: "66.67%", left: "13.64%", top: "16.67%" }, photoShape: "rect", aspect: 1.54 },
  // Group10-2: gold circle (157x150, photo at 14,10 size 129x129)
  { src: frame3 as string, photoArea: { width: "82.17%", height: "86%", left: "8.92%", top: "6.67%" }, photoShape: "circle", aspect: 1.05 },
  // Group8-2: dark red oval (164x194, photo at 26,24 size 115x146)
  { src: frame4 as string, photoArea: { width: "70.12%", height: "75.26%", left: "15.85%", top: "12.37%" }, photoShape: "ellipse", aspect: 0.85 },
  // Group11-2: blue lace circle (193x189, photo at 34,32 size 125x125)
  { src: frame5 as string, photoArea: { width: "64.77%", height: "66.14%", left: "17.62%", top: "16.93%" }, photoShape: "circle", aspect: 1.02 },
  // Group7-2: olive oval (148.538x180.889, photo at 17,17 size 115x146)
  { src: frame6 as string, photoArea: { width: "77.42%", height: "80.72%", left: "11.44%", top: "9.4%" }, photoShape: "ellipse", aspect: 0.82 },
];

export interface StickerItem {
  id: string;
  type: "emoji" | "custom" | "frame";
  content: string;  // emoji char, base64 data URL for custom, frame PNG URL for frame
  fillUrl?: string; // user photo inside frame
  framePhotoArea?: { width: string; height: string; left: string; top: string }; // positioned photo div
  framePhotoShape?: "rect" | "circle" | "ellipse"; // shape type for photo area
  frameAspect?: number; // width / height ratio of frame container
  x: number; // 0-100 percentage from left of card face
  y: number; // 0-100 percentage from top of card face
  scale: number;
  rotation: number; // degrees
  face: "front" | "back";
}

const PRESET_EMOJIS = [
  "🌸", "⭐", "❤️", "🌊", "✈️", "🌴",
  "🌙", "🦋", "🍃", "🌺", "🦄", "🌈",
  "🍀", "🐚", "🏖️", "📮", "🎀", "🎯",
];

interface StickerPickerProps {
  face: "front" | "back";
  onSelect: (partial: Omit<StickerItem, "id" | "x" | "y">) => void;
  style: React.CSSProperties;
  pickerRef: React.RefObject<HTMLDivElement | null>;
}

export function StickerPicker({ face, onSelect, style, pickerRef }: StickerPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleEmoji(emoji: string) {
    const rotation = Math.floor(Math.random() * 40) - 20;
    onSelect({ type: "emoji", content: emoji, scale: 1, rotation, face });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onloadend = () => {
      const rotation = Math.floor(Math.random() * 30) - 15;
      onSelect({ type: "custom", content: reader.result as string, scale: 1, rotation, face });
    };
    reader.readAsDataURL(file);
  }

  function handleFrame(frame: FrameDef) {
    const rotation = Math.floor(Math.random() * 20) - 10;
    onSelect({
      type: "frame",
      content: frame.src,
      fillUrl: undefined,
      framePhotoArea: frame.photoArea,
      framePhotoShape: frame.photoShape,
      frameAspect: frame.aspect,
      scale: 1,
      rotation,
      face,
    });
  }

  return (
    <div
      ref={pickerRef}
      className="bg-[#FAF5EE] border border-[#D0BFA8] rounded-2xl shadow-2xl p-3"
      style={{ ...style, width: "224px" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Emoji stickers */}
      <p
        className="text-[9px] text-[#8B7060] font-semibold uppercase tracking-wider mb-2 text-center"
        style={{ fontFamily: "'Lora', serif" }}
      >
        Stickers
      </p>
      <div className="grid grid-cols-6 gap-0.5 mb-2">
        {PRESET_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => handleEmoji(emoji)}
            className="hover:bg-[#EDD9C0] rounded-lg transition-colors flex items-center justify-center"
            style={{ fontSize: "20px", lineHeight: 1, width: "34px", height: "34px" }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="border-t border-dashed border-[#C9B49A] my-2" />

      {/* Frames */}
      <p
        className="text-[9px] text-[#8B7060] font-semibold uppercase tracking-wider mb-2 text-center"
        style={{ fontFamily: "'Lora', serif" }}
      >
        Frames · tap to add photo
      </p>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {FRAMES.map((frame, i) => (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => handleFrame(frame)}
            className="hover:opacity-80 active:scale-95 transition-all rounded-lg overflow-hidden border border-[#D0BFA8]"
            style={{ aspectRatio: "1/1", backgroundColor: "#f0e0cc" }}
          >
            <img
              src={frame.src}
              alt={`Frame ${i + 1}`}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </button>
        ))}
      </div>

      <div className="border-t border-dashed border-[#C9B49A] my-2" />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[#C9B49A] text-[#6B5040] hover:bg-[#EDD9C0] transition-colors text-[10px]"
        style={{ fontFamily: "'Lora', serif" }}
      >
        <ImagePlus size={11} />
        Upload image sticker
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
