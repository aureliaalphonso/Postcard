import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth, API_BASE } from "../context/AuthContext";
import { X, Upload, Check, ImagePlus } from "lucide-react";
import { ImageEditor } from "./ImageEditor";

// New stamps: image-13, 14, 15
import stamp0 from "../../imports/image-13.png";
import stamp1 from "../../imports/image-14.png";
import stamp2 from "../../imports/image-15.png";
import imgPostmark from "figma:asset/4413e91ca5c2c745bfddd176b708c998b839f504.png";

const PRESET_STAMPS: string[] = [stamp0 as string, stamp1 as string, stamp2 as string];

// ─── Video chunked upload ─────────────────────────────────────────────────────
// Splits the video file into 1.5 MB raw chunks, encodes each as base64, and
// sends them one-by-one as JSON to our own edge function — no CORS issues, no
// Supabase Storage body-size limits. The server assembles and stores the file.
const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5 MB raw → ~2 MB base64 JSON

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:...;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function uploadVideoInChunks(
  file: File,
  apiHeaders: () => Record<string, string>,
  onProgress?: (pct: number) => void
): Promise<string> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = crypto.randomUUID();
  const fileName = file.name || "video.mp4";
  const contentType = file.type || "video/mp4";

  let storagePath = "";

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const slice = file.slice(start, end);
    const chunkData = await blobToBase64(slice);

    const res = await fetch(`${API_BASE}/upload/video-chunk`, {
      method: "POST",
      headers: { ...apiHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId,
        chunkIndex: i,
        totalChunks,
        chunkData,
        fileName,
        contentType,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Chunk ${i + 1}/${totalChunks} failed: ${err.error ?? res.status}`);
    }

    const data = await res.json();
    if (data.complete) {
      storagePath = data.path;
    }

    onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
  }

  if (!storagePath) throw new Error("Upload completed but no storage path returned");
  return storagePath;
}
// ─────────────────────────────────────────────────────────────────────────────

export interface Postcard {
  id: string;
  albumId: string;
  title: string;
  text: string;
  signature: string;
  frontImageUrl: string | null;
  mediaType?: string | null;
  stamp?: number | null;
  customStampUrl?: string | null;
  createdAt: string;
}

interface AddPostcardModalProps {
  albumId: string;
  existingPostcard?: Postcard | null;
  onClose: () => void;
  onSaved: (postcard: Postcard) => void;
}

function calcPickerPos(btnRect: DOMRect): React.CSSProperties {
  const pickerH = 320;
  const pickerW = 240; // wide enough for 3×52px stamps + 2×8px gaps + 2×16px padding
  const vp = { w: window.innerWidth, h: window.innerHeight };
  const spaceBelow = vp.h - btnRect.bottom;
  const spaceAbove = btnRect.top;
  const placeAbove = spaceAbove > spaceBelow && spaceAbove > pickerH;

  const style: React.CSSProperties = { position: "fixed", zIndex: 99999, width: `${pickerW}px` };

  if (placeAbove) {
    style.bottom = vp.h - btnRect.top + 8;
  } else {
    style.top = Math.min(btnRect.bottom + 8, vp.h - pickerH - 8);
  }

  const idealLeft = btnRect.right - pickerW;
  style.left = Math.max(8, Math.min(idealLeft, vp.w - pickerW - 8));

  return style;
}

export function AddPostcardModal({ albumId, existingPostcard, onClose, onSaved }: AddPostcardModalProps) {
  const { apiHeaders } = useAuth();
  const [text, setText] = useState(existingPostcard?.text ?? "");

  const parseAddress = (sig: string | undefined) => {
    const parts = (sig ?? "").split("\n");
    return { line1: parts[0] ?? "", line2: parts[1] ?? "", line3: parts[2] ?? "" };
  };
  const initAddr = parseAddress(existingPostcard?.signature);
  const [addrTo, setAddrTo] = useState(initAddr.line1);
  const [addrStreet, setAddrStreet] = useState(initAddr.line2);
  const [addrCity, setAddrCity] = useState(initAddr.line3);

  const videoPreviewUrlRef = useRef<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingPostcard?.frontImageUrl ?? null);
  const [isVideo, setIsVideo] = useState(existingPostcard?.mediaType?.startsWith("video/") ?? false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const [selectedStamp, setSelectedStamp] = useState<number | "custom" | null>(() => {
    if (existingPostcard?.customStampUrl) return "custom";
    if (existingPostcard?.stamp != null) return Number(existingPostcard.stamp);
    return null;
  });
  const [customStampFile, setCustomStampFile] = useState<File | null>(null);
  const [customStampPreview, setCustomStampPreview] = useState<string | null>(
    existingPostcard?.customStampUrl ?? null
  );
  const [stampVersion, setStampVersion] = useState(0);
  const [stampPickerOpen, setStampPickerOpen] = useState(false);
  const [pickerStyle, setPickerStyle] = useState<React.CSSProperties>({});

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const stampBtnRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close stamp picker on outside click — no backdrop needed, no z-index conflicts
  useEffect(() => {
    if (!stampPickerOpen) return;
    function handleDocClick(e: MouseEvent) {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        stampBtnRef.current && !stampBtnRef.current.contains(e.target as Node)
      ) {
        setStampPickerOpen(false);
      }
    }
    // Use capture so we get the event before stopPropagation in children
    document.addEventListener("mousedown", handleDocClick, true);
    return () => document.removeEventListener("mousedown", handleDocClick, true);
  }, [stampPickerOpen]);

  // Update picker position
  useEffect(() => {
    if (!stampPickerOpen || !stampBtnRef.current) return;
    setPickerStyle(calcPickerPos(stampBtnRef.current.getBoundingClientRect()));
  }, [stampPickerOpen]);

  // Revoke video object URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrlRef.current) {
        URL.revokeObjectURL(videoPreviewUrlRef.current);
      }
    };
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.type.startsWith("video/")) {
      if (videoPreviewUrlRef.current) URL.revokeObjectURL(videoPreviewUrlRef.current);
      const objectUrl = URL.createObjectURL(file);
      videoPreviewUrlRef.current = objectUrl;
      setImageFile(file);
      setIsVideo(true);
      setImagePreview(objectUrl);
    } else {
      setPendingFile(file);
      setShowEditor(true);
    }
  }

  function handleEditorConfirm(dataUrl: string, blob: Blob) {
    setImagePreview(dataUrl);
    setIsVideo(false);
    const editedFile = new File([blob], pendingFile?.name ?? "front.jpg", { type: "image/jpeg" });
    setImageFile(editedFile);
    setShowEditor(false);
    setPendingFile(null);
  }

  function handleEditorCancel() {
    setShowEditor(false);
    setPendingFile(null);
  }

  const selectPresetStamp = useCallback((i: number) => {
    setSelectedStamp(i);
    setCustomStampFile(null);
    setCustomStampPreview(null);
    setStampVersion((v) => v + 1);
    setStampPickerOpen(false);
  }, []);

  const removeStamp = useCallback(() => {
    setSelectedStamp(null);
    setCustomStampFile(null);
    setCustomStampPreview(null);
    setStampVersion((v) => v + 1);
    setStampPickerOpen(false);
  }, []);

  function handleCustomStampChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCustomStampFile(file);
    setSelectedStamp("custom");
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomStampPreview(reader.result as string);
      setStampVersion((v) => v + 1);
    };
    reader.readAsDataURL(file);
    setStampPickerOpen(false);
  }

  const previewStampSrc: string | null =
    selectedStamp === "custom"
      ? customStampPreview
      : typeof selectedStamp === "number"
      ? (PRESET_STAMPS[selectedStamp] ?? null)
      : null;

  async function handleSave() {
    setLoading(true);
    setError(null);
    setUploadProgress(null);
    try {
      const autoTitle = text.split("\n")[0].trim().slice(0, 80) || "Untitled";
      const combinedSignature = [addrTo, addrStreet, addrCity].join("\n").trimEnd();

      const formData = new FormData();
      formData.append("title", autoTitle);
      formData.append("text", text);
      formData.append("signature", combinedSignature);

      if (imageFile && isVideo) {
        // Chunked upload: avoids CORS issues and edge-function body limits on mobile
        const storagePath = await uploadVideoInChunks(
          imageFile,
          apiHeaders,
          (pct) => setUploadProgress(pct)
        );
        setUploadProgress(null);
        formData.append("frontImagePath", storagePath);
        formData.append("frontImageType", imageFile.type || "video/mp4");
      } else if (imageFile) {
        formData.append("frontImage", imageFile);
      }

      if (selectedStamp === "custom") {
        formData.append("stamp", "");
        if (customStampFile) formData.append("customStampFile", customStampFile);
      } else if (typeof selectedStamp === "number") {
        formData.append("stamp", String(selectedStamp));
        formData.append("clearCustomStamp", "1");
      } else {
        formData.append("stamp", "");
        formData.append("clearCustomStamp", "1");
      }

      let res: Response;
      if (existingPostcard) {
        res = await fetch(`${API_BASE}/postcards/${existingPostcard.id}`, {
          method: "PUT",
          headers: apiHeaders(),
          body: formData,
        });
      } else {
        res = await fetch(`${API_BASE}/albums/${albumId}/postcards`, {
          method: "POST",
          headers: apiHeaders(),
          body: formData,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save postcard");
        return;
      }
      onSaved(data);
      onClose();
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  // Stamp picker portal — no backdrop, uses document mousedown listener instead
  const stampPickerPortal = stampPickerOpen
    ? createPortal(
        <div
          ref={pickerRef}
          className="bg-[#FAF5EE] border border-[#D0BFA8] rounded-2xl shadow-2xl p-3"
          style={pickerStyle}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <p
            className="text-[9px] text-[#8B7060] font-semibold uppercase tracking-wider mb-3 text-center"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Pick a stamp
          </p>

          <div className="flex gap-2 justify-center mb-3">
            {PRESET_STAMPS.map((src, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => selectPresetStamp(i)}
                className="relative focus:outline-none"
                style={{
                  width: "52px",
                  height: "64px",
                  borderRadius: "2px",
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: selectedStamp === i ? "0 0 0 2.5px #2C1810" : "0 0 0 1px #C8A878",
                }}
              >
                <img
                  src={src}
                  alt={`Stamp ${i + 1}`}
                  className="w-full h-full object-cover block"
                  loading="eager"
                />
                {selectedStamp === i && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#2C1810] flex items-center justify-center shadow">
                    <Check size={9} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-dashed border-[#C9B49A] my-2" />

          <button
            type="button"
            onClick={() => stampInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[#C9B49A] text-[#6B5040] hover:bg-[#EDD9C0] transition-colors text-[10px]"
            style={{ fontFamily: "'Lora', serif" }}
          >
            <ImagePlus size={11} />
            {selectedStamp === "custom" ? "Change my photo" : "Use my photo"}
          </button>

          {selectedStamp === "custom" && customStampPreview && (
            <div className="mt-2 flex justify-center">
              <div
                className="relative"
                style={{ width: "52px", height: "64px", borderRadius: "2px", overflow: "hidden", boxShadow: "0 0 0 2.5px #2C1810" }}
              >
                <img src={customStampPreview} className="w-full h-full object-cover block" alt="Custom stamp" loading="eager" />
                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#2C1810] flex items-center justify-center shadow">
                  <Check size={9} className="text-white" />
                </div>
              </div>
            </div>
          )}

          {selectedStamp !== null && (
            <button
              type="button"
              onClick={() => removeStamp()}
              className="mt-2 w-full text-[9px] text-[#8B7060] hover:text-[#4A3728] text-center py-1 rounded hover:bg-[#EDD9C0] transition-colors"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Remove stamp
            </button>
          )}

          <input
            ref={stampInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomStampChange}
          />
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {showEditor && pendingFile && (
        <ImageEditor
          file={pendingFile}
          aspectRatio={3 / 2}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}

      {stampPickerPortal}

      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-md my-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 p-1 rounded-full bg-[#FAF5EE] border border-[#D0BFA8] hover:bg-[#EDD9C0] text-[#6B5040] shadow"
          >
            <X size={14} />
          </button>

          <div className="flex justify-center gap-4 mb-3">
            {["Front", "Back"].map((label, idx) => {
              const active = idx === 0 ? !flipped : flipped;
              return (
                <button
                  key={label}
                  onClick={() => setFlipped(idx === 1)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    active ? "bg-[#2C1810] text-[#F5E8D5]" : "bg-[#EDD9C0] text-[#6B5040]"
                  }`}
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {!flipped ? (
            /* ── FRONT ── */
            <div
              className="w-full rounded-[5px] shadow-md cursor-pointer flex items-center justify-center relative overflow-hidden"
              style={{ aspectRatio: "3/2", backgroundColor: "#f7e2cc" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                isVideo ? (
                  <video
                    src={imagePreview}
                    className="w-full h-full object-cover"
                    controls={false}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="postcard front" />
                )
              ) : (
                <div className="flex flex-col items-center gap-2" style={{ color: "#b09070" }}>
                  <Upload size={22} />
                  <span style={{ fontFamily: "'Inria Serif', serif", fontSize: "11px" }}>
                    Add Image Here
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div className="absolute bottom-2 right-2 bg-black/30 text-white text-[9px] rounded px-1.5 py-0.5">
                  {isVideo ? "🎥 Tap to change" : "Tap to change"}
                </div>
              )}
            </div>
          ) : (
            /* ── BACK ── */
            /* Wrapper has no overflow:hidden — stamp button sits outside the clipping context */
            <div className="w-full relative" style={{ aspectRatio: "3/2" }}>
              {/* Card background with overflow:hidden for rounded corners */}
              <div
                className="absolute inset-0 rounded-[5px] shadow-md"
                style={{ backgroundColor: "#f6ece2", overflow: "hidden" }}
              />

              {/* "POSTCARD" header — top left */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: "9px",
                  left: "12px",
                  fontFamily: "'Inria Serif', serif",
                  fontWeight: 700,
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  color: "#000",
                  zIndex: 1,
                }}
              >
                POSTCARD
              </div>

              {/* Stamp button — lives OUTSIDE overflow:hidden, no clipping issues */}
              <button
                ref={stampBtnRef}
                type="button"
                onClick={() => {
                  if (stampBtnRef.current) {
                    setPickerStyle(calcPickerPos(stampBtnRef.current.getBoundingClientRect()));
                  }
                  setStampPickerOpen((v) => !v);
                }}
                className="absolute focus:outline-none"
                style={{ top: "8px", right: "8px", width: "44px", height: "56px", zIndex: 5, position: "absolute" }}
                title="Choose a stamp"
              >
                {previewStampSrc ? (
                  <div className="relative w-full h-full">
                    <img
                      src={previewStampSrc}
                      alt="Stamp"
                      className="w-full h-full object-cover block"
                      style={{ borderRadius: "2px" }}
                      loading="eager"
                    />
                    <div
                      className="absolute pointer-events-none"
                      style={{ top: "6px", left: "-10px", width: "34px", height: "34px", opacity: 0.85 }}
                    >
                      <img
                        src={imgPostmark}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ transform: "rotate(56deg)" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center"
                    style={{ border: "1px solid #c0a888", borderRadius: "2px", backgroundColor: "#ecdeca" }}
                  >
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "5px", color: "#999", textAlign: "center", lineHeight: 1.4 }}>
                      Place<br />Stamp<br />Here
                    </span>
                  </div>
                )}
              </button>

              {/* Vertical divider */}
              <div
                className="absolute"
                style={{ left: "52%", top: "10px", bottom: "10px", width: "1px", backgroundColor: "#d0c0aa", zIndex: 1 }}
              />

              {/* LEFT: message */}
              <div
                className="absolute flex flex-col"
                style={{ top: "26px", left: "10px", right: "calc(48% + 8px)", bottom: "10px", zIndex: 2 }}
              >
                <textarea
                  placeholder="Write your message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 w-full bg-transparent focus:outline-none resize-none text-black placeholder-[#bbb]"
                  style={{ fontFamily: "'Italianno', cursive", fontSize: "13px", lineHeight: 1.5 }}
                />
              </div>

              {/* RIGHT: 3 labeled address lines */}
              <div
                className="absolute flex flex-col justify-center"
                style={{ top: "72px", left: "calc(52% + 8px)", right: "8px", bottom: "10px", gap: "6px", zIndex: 2 }}
              >
                <div style={{ borderBottom: "1px solid #d0c0aa", paddingBottom: "2px" }}>
                  <span style={{ fontFamily: "'Lora', serif", fontSize: "5px", color: "#b0a090", letterSpacing: "0.04em", textTransform: "uppercase" }}>To</span>
                  <input type="text" placeholder="Name" value={addrTo} onChange={(e) => setAddrTo(e.target.value)}
                    className="bg-transparent focus:outline-none text-black placeholder-[#bbb] w-full block"
                    style={{ fontFamily: "'Italianno', cursive", fontSize: "16px", lineHeight: 1 }} />
                </div>
                <div style={{ borderBottom: "1px solid #d0c0aa", paddingBottom: "2px" }}>
                  <span style={{ fontFamily: "'Lora', serif", fontSize: "5px", color: "#b0a090", letterSpacing: "0.04em", textTransform: "uppercase" }}>Address</span>
                  <input type="text" placeholder="Street" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)}
                    className="bg-transparent focus:outline-none text-black placeholder-[#bbb] w-full block"
                    style={{ fontFamily: "'Italianno', cursive", fontSize: "16px", lineHeight: 1 }} />
                </div>
                <div style={{ borderBottom: "1px solid #d0c0aa", paddingBottom: "2px" }}>
                  <span style={{ fontFamily: "'Lora', serif", fontSize: "5px", color: "#b0a090", letterSpacing: "0.04em", textTransform: "uppercase" }}>City / Country</span>
                  <input type="text" placeholder="City, Country" value={addrCity} onChange={(e) => setAddrCity(e.target.value)}
                    className="bg-transparent focus:outline-none text-black placeholder-[#bbb] w-full block"
                    style={{ fontFamily: "'Italianno', cursive", fontSize: "16px", lineHeight: 1 }} />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 text-center mt-2">{error}</p>}

          {/* Video upload progress bar */}
          {uploadProgress !== null && (
            <div className="mt-2 px-4">
              <div className="w-full bg-[#E8D8C0] rounded-full h-1.5">
                <div
                  className="bg-[#8B6040] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-[#8B7060] text-center mt-1" style={{ fontFamily: "'Lora', serif" }}>
                Uploading video… {uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 px-2">
            <button onClick={onClose} disabled={loading} className="flex flex-col items-center gap-1 group">
              <div className="w-12 h-12 rounded-full bg-[#D4C4A0] flex items-center justify-center text-lg group-hover:bg-[#C4B490] transition-colors shadow-inner select-none">
                🗑️
              </div>
              <span className="text-xs text-[#6B5040]" style={{ fontFamily: "'Lora', serif" }}>Cancel</span>
            </button>
            <button onClick={handleSave} disabled={loading} className="flex flex-col items-center gap-1 group">
              <div className="w-12 h-12 rounded-full bg-[#C8A878] flex items-center justify-center text-lg group-hover:bg-[#B89868] transition-colors shadow-inner select-none">
                📬
              </div>
              <span className="text-xs text-[#6B5040]" style={{ fontFamily: "'Lora', serif" }}>
                {uploadProgress !== null ? `${uploadProgress}%` : loading ? "Saving…" : "Save"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}