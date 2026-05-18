import { useRef } from "react";
import { ImagePlus } from "lucide-react";

import frame0 from "../../imports/image-16.png";
import frame1 from "../../imports/image-17.png";
import frame2 from "../../imports/image-18.png";
import frame3 from "../../imports/image-19.png";
import frame4 from "../../imports/image-20.png";
import frame5 from "../../imports/image-21.png";
import frame6 from "../../imports/image-22.png";
import frame7 from "../../imports/image-23.png";
import frame8 from "../../imports/image-24.png";

// Each frame: src, photo area positioning (%), width-to-height aspect ratio
export interface FrameDef {
  src: string;
  photoArea: { width: string; height: string; left: string; top: string }; // CSS percentages
  aspect: number; // width / height
}

export const FRAMES: FrameDef[] = [
  // Group5-1: portrait gold (159x238, photo at 19,33 size 113x172)
  { src: frame0 as string, photoArea: { width: "71.1%", height: "72.3%", left: "11.9%", top: "13.9%" }, aspect: 0.67 },
  // Group6: ornate portrait gold (162x199, photo at 26,14 size 113x172)
  { src: frame1 as string, photoArea: { width: "69.8%", height: "86.4%", left: "16%", top: "7%" }, aspect: 0.81 },
  // Group9: landscape gold (286x186, photo at 39,31 size 209x124)
  { src: frame2 as string, photoArea: { width: "73.1%", height: "66.7%", left: "13.6%", top: "16.7%" }, aspect: 1.54 },
  // Group10: gold circle (157x150, photo at 14,10 size 129x129)
  { src: frame3 as string, photoArea: { width: "82.2%", height: "86%", left: "8.9%", top: "6.7%" }, aspect: 1.05 },
  // Group8: dark red oval (164x194, photo at 26,24 size 115x146)
  { src: frame4 as string, photoArea: { width: "70.1%", height: "75.3%", left: "15.9%", top: "12.4%" }, aspect: 0.85 },
  // Group11: blue lace circle (193x189, photo at 34,32 size 125x125)
  { src: frame5 as string, photoArea: { width: "64.8%", height: "66.1%", left: "17.6%", top: "16.9%" }, aspect: 1.02 },
  // Group7: olive oval (148.538x180.889, photo at 17,17 size 115x146)
  { src: frame6 as string, photoArea: { width: "77.4%", height: "80.7%", left: "11.4%", top: "9.4%" }, aspect: 0.82 },
  // ornate portrait alt (same as frame1)
  { src: frame7 as string, photoArea: { width: "69.8%", height: "86.4%", left: "16%", top: "7%" }, aspect: 0.81 },
  // portrait gold alt (same as frame0)
  { src: frame8 as string, photoArea: { width: "71.1%", height: "72.3%", left: "11.9%", top: "13.9%" }, aspect: 0.67 },
];

export interface StickerItem {
  id: string;
  type: "emoji" | "custom" | "frame";
  content: string;  // emoji char, base64 data URL for custom, frame PNG URL for frame
  fillUrl?: string; // user photo inside frame
  framePhotoArea?: { width: string; height: string; left: string; top: string }; // positioned photo div
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
