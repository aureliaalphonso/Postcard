import { useState, useRef } from "react";
import { useAuth, API_BASE } from "../context/AuthContext";
import { X, Upload } from "lucide-react";
import { Album } from "./AlbumCard";
import { ImageEditor } from "./ImageEditor";

interface AddAlbumModalProps {
  existingAlbum?: Album | null;
  onClose: () => void;
  onCreated: (album: Album) => void;
}

export function AddAlbumModal({ existingAlbum, onClose, onCreated }: AddAlbumModalProps) {
  const { apiHeaders } = useAuth();
  const [name, setName] = useState(existingAlbum?.name ?? "");
  const [date, setDate] = useState(existingAlbum?.date ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingAlbum?.coverImageUrl ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = "";
    setPendingFile(file);
    setShowEditor(true);
  }

  function handleEditorConfirm(dataUrl: string, blob: Blob) {
    setImagePreview(dataUrl);
    // Convert blob to File for upload
    const editedFile = new File([blob], pendingFile?.name ?? "cover.jpg", { type: "image/jpeg" });
    setImageFile(editedFile);
    setShowEditor(false);
    setPendingFile(null);
  }

  function handleEditorCancel() {
    setShowEditor(false);
    setPendingFile(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Please enter an album name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("date", date);
      if (imageFile) formData.append("coverImage", imageFile);

      let res: Response;
      if (existingAlbum) {
        res = await fetch(`${API_BASE}/albums/${existingAlbum.id}`, {
          method: "PUT",
          headers: apiHeaders(),
          body: formData,
        });
      } else {
        res = await fetch(`${API_BASE}/albums`, {
          method: "POST",
          headers: apiHeaders(),
          body: formData,
        });
      }
      const data = await res.json();
      if (!res.ok) {
        console.error("Save album failed:", res.status, data);
        setError(data.error ?? "Failed to save album");
        return;
      }
      onCreated(data);
      onClose();
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showEditor && pendingFile && (
        <ImageEditor
          file={pendingFile}
          aspectRatio={4 / 3}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
          style={{ backgroundColor: "#FAF5EE" }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-[#EDD9C0] text-[#6B5040] z-10"
          >
            <X size={16} />
          </button>

          {/* Title */}
          <p className="text-center text-sm font-semibold text-[#2C1810] pt-4 pb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {existingAlbum ? "Edit Album" : "New Album"}
          </p>

          {/* Image upload */}
          <div
            className="w-full cursor-pointer flex items-center justify-center relative"
            style={{ aspectRatio: "4/3", backgroundColor: "#F0E4D0" }}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} className="w-full h-full object-cover" alt="cover" />
                <div className="absolute bottom-2 right-2 bg-black/30 text-white text-[9px] rounded px-1.5 py-0.5">
                  Tap to change
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#A08060]">
                <Upload size={24} />
                <span className="text-sm" style={{ fontFamily: "'Lora', serif" }}>
                  Add Cover Image
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Form */}
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center border border-[#D0BFA8] rounded-lg px-3 py-2 bg-white/50">
              <input
                type="text"
                placeholder="Enter album name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#2C1810] placeholder-[#B0A090] focus:outline-none"
                style={{ fontFamily: "'Lora', serif" }}
              />
            </div>
            <div className="flex items-center border border-[#D0BFA8] rounded-lg px-3 py-2 bg-white/50">
              <input
                type="text"
                placeholder="Enter date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#2C1810] placeholder-[#B0A090] focus:outline-none"
                style={{ fontFamily: "'Lora', serif" }}
              />
            </div>

            {error && <p className="text-xs text-red-600 text-center">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <button onClick={onClose} disabled={loading} className="flex flex-col items-center gap-1 group">
                <div className="w-10 h-10 rounded-full bg-[#D4C4A0] flex items-center justify-center text-lg group-hover:bg-[#C4B490] transition-colors shadow-inner">
                  ✕
                </div>
                <span className="text-xs text-[#6B5040]" style={{ fontFamily: "'Lora', serif" }}>
                  Cancel
                </span>
              </button>

              <button onClick={handleSave} disabled={loading} className="flex flex-col items-center gap-1 group">
                <div className="w-10 h-10 rounded-full bg-[#C8A878] flex items-center justify-center text-lg group-hover:bg-[#B89868] transition-colors shadow-inner">
                  {loading ? "…" : "✓"}
                </div>
                <span className="text-xs text-[#6B5040]" style={{ fontFamily: "'Lora', serif" }}>
                  {loading ? "Saving…" : "Save"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
