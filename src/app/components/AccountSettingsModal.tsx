import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Camera, Check } from "lucide-react";

interface AccountSettingsModalProps {
  onClose: () => void;
}

const BG_KEY = "postcard_bg";

const BG_PRESETS = [
  { label: "Cream", value: "#FAF5EE" },
  { label: "Warm", value: "#FFFBF5" },
  { label: "Rose", value: "#F7EEE9" },
  { label: "Sage", value: "#EEF3EE" },
  { label: "Sky", value: "#EEF3F8" },
  { label: "Slate", value: "#2C2825" },
];

export function dispatchBgChange(color: string) {
  localStorage.setItem(BG_KEY, color);
  // Apply directly to body for instant, reliable change
  document.body.style.backgroundColor = color;
  // Also dispatch event for Layout component to sync its state
  window.dispatchEvent(new CustomEvent("postcard-bg-change", { detail: color }));
}

export function getStoredBg(): string {
  return localStorage.getItem(BG_KEY) ?? "#FAF5EE";
}

export function AccountSettingsModal({ onClose }: AccountSettingsModalProps) {
  const { user, uploadAvatar } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBg, setSelectedBg] = useState<string>(getStoredBg());
  const [customBg, setCustomBg] = useState<string>(getStoredBg());

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setSuccess(false);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleBgSelect(color: string) {
    setSelectedBg(color);
    setCustomBg(color);
    // Apply live preview immediately
    dispatchBgChange(color);
  }

  function handleCustomBgInput(e: React.ChangeEvent<HTMLInputElement>) {
    const color = e.target.value;
    setCustomBg(color);
    setSelectedBg(color);
    // Apply live preview immediately
    dispatchBgChange(color);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    // Always persist the current background color
    dispatchBgChange(selectedBg);

    // Upload avatar if a new one was selected
    if (avatarFile) {
      const err = await uploadAvatar(avatarFile);
      if (err) {
        setError(err);
        setSaving(false);
        return;
      }
      setAvatarFile(null);
    }

    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-xs bg-[#FAF5EE] border border-[#D9C9B0] rounded-2xl shadow-xl p-6 overflow-y-auto"
        style={{ fontFamily: "'Lora', serif", maxHeight: "90vh" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[#EDD9C0] text-[#6B5040] transition-colors"
        >
          <X size={14} />
        </button>

        <h2
          className="text-base font-semibold text-[#2C1810] text-center mb-5"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Account Settings
        </h2>

        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            title="Change profile photo"
          >
            <div
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#D0BFA8] group-hover:border-[#8B6040] transition-colors shadow-sm"
              style={{ backgroundColor: "#EDD9C0" }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="text-xl font-semibold text-[#4A3728]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {initials}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={18} className="text-white" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          {avatarFile ? (
            <p className="text-[10px] text-[#6B9E6B] text-center">New photo ready — click Save Changes</p>
          ) : (
            <p className="text-[10px] text-[#8B7060] text-center">Tap to change photo</p>
          )}
        </div>

        {/* Username */}
        <div className="mb-5">
          <label className="block text-[9px] tracking-widest text-[#8B7060] font-semibold uppercase mb-1">
            Username
          </label>
          <div className="w-full px-3 py-2 rounded-lg bg-[#F0E4D0] border border-[#D0BFA8] text-[#4A3728] text-sm">
            {user?.username ?? "—"}
          </div>
          <p className="text-[10px] text-[#B0A090] mt-1">Username cannot be changed</p>
        </div>

        {/* Background colour */}
        <div className="mb-5">
          <label className="block text-[9px] tracking-widest text-[#8B7060] font-semibold uppercase mb-2">
            App Background
          </label>

          {/* Preset swatches */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {BG_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleBgSelect(preset.value)}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className="w-full h-9 rounded-lg border-2 transition-all relative flex items-center justify-center"
                  style={{
                    backgroundColor: preset.value,
                    borderColor: selectedBg === preset.value ? "#8B6040" : "#D0BFA8",
                  }}
                >
                  {selectedBg === preset.value && (
                    <Check size={12} className="text-[#8B6040]" />
                  )}
                </div>
                <span className="text-[9px] text-[#8B7060]">{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Custom colour picker */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className="w-8 h-8 rounded-lg border-2 border-[#D0BFA8] overflow-hidden relative shrink-0"
              style={{ backgroundColor: customBg }}
            >
              <input
                type="color"
                value={customBg}
                onChange={handleCustomBgInput}
                onInput={(e) => handleCustomBgInput(e as any)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-xs text-[#6B5040]">Custom colour</span>
            <span className="text-[10px] text-[#B0A090] font-mono ml-auto">{customBg}</span>
          </label>
          <p className="text-[9px] text-[#B0A090] mt-1.5 text-center">
            Changes preview instantly — click Save Changes to keep them
          </p>
        </div>

        {error && <p className="text-xs text-red-600 text-center mb-3">{error}</p>}

        {/* Save changes button — always enabled */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: success ? "#6B9E6B" : "#2C1810",
            color: "#F5E8D5",
            fontFamily: "'Lora', serif",
          }}
        >
          {saving ? "Saving…" : success ? (
            <><Check size={13} /> Saved!</>
          ) : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
