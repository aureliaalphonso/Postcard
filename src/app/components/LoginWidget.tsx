import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Eye, EyeOff, Camera, Settings } from "lucide-react";
import { AccountSettingsModal } from "./AccountSettingsModal";

export function LoginWidget() {
  const { user, signIn, signUp, signOut, uploadAvatar } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const err = mode === "signin"
        ? await signIn(username, password)
        : await signUp(username, password);

      if (err) {
        setError(err);
        return;
      }

      // After successful signup, upload avatar if one was selected
      if (mode === "signup" && avatarFile) {
        await uploadAvatar(avatarFile);
      }

      setOpen(false);
      setUsername("");
      setPassword("");
      setAvatarFile(null);
      setAvatarPreview(null);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  // ── Logged-in state: circle avatar + name below ──
  if (user) {
    const initials = user.username.slice(0, 2).toUpperCase();
    return (
      <div className="flex flex-col items-center gap-1 relative" ref={ref}>
        {/* Avatar circle — click to open menu */}
        <button
          onClick={() => setOpen(!open)}
          className="relative group"
          title={user.username}
        >
          <div
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#D0BFA8] shadow-sm transition-all group-hover:border-[#8B6040]"
            style={{ backgroundColor: "#EDD9C0" }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span
                  className="text-xs font-semibold text-[#4A3728]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {initials}
                </span>
              </div>
            )}
          </div>
        </button>

        {/* Name below the circle */}
        <span
          className="text-[10px] text-[#6B5040] text-center leading-none"
          style={{ fontFamily: "'Lora', serif", maxWidth: "64px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {user.username}
        </span>

        {/* Dropdown menu */}
        {open && (
          <div
            className="absolute top-14 right-0 bg-[#FAF5EE] border border-[#D9C9B0] rounded-xl shadow-lg z-50 overflow-hidden"
            style={{ minWidth: "140px" }}
          >
            <button
              onClick={() => { setOpen(false); setShowSettings(true); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4A3728] hover:bg-[#EDD9C0] transition-colors"
              style={{ fontFamily: "'Lora', serif" }}
            >
              <Settings size={12} />
              Settings
            </button>
            <div className="border-t border-[#E8D8C0]" />
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#4A3728] hover:bg-[#EDD9C0] transition-colors"
              style={{ fontFamily: "'Lora', serif" }}
            >
              <LogOut size={12} />
              Sign out
            </button>
          </div>
        )}

        {/* Account settings modal */}
        {showSettings && (
          <AccountSettingsModal onClose={() => setShowSettings(false)} />
        )}
      </div>
    );
  }

  // ── Login / Signup form ──
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-1.5 rounded-full bg-[#2C1810] text-[#F5E8D5] text-xs font-medium hover:bg-[#3D2518] transition-colors"
        style={{ fontFamily: "'Lora', serif" }}
      >
        Login
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-68 bg-[#FAF5EE] border border-[#D9C9B0] rounded-2xl shadow-lg p-5 z-50" style={{ width: "272px" }}>
          <h3
            className="text-sm font-semibold text-[#2C1810] mb-4 text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Avatar picker — only on signup */}
            {mode === "signup" && (
              <div className="flex flex-col items-center gap-1.5 mb-1">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative group"
                  title="Add profile photo"
                >
                  <div
                    className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-[#C9B49A] hover:border-[#8B6040] transition-colors flex items-center justify-center"
                    style={{ backgroundColor: "#F0E4D0" }}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-[#A08060]">
                        <Camera size={20} />
                        <span className="text-[9px] text-center leading-tight">Add photo</span>
                      </div>
                    )}
                  </div>
                  {/* Edit overlay on hover when image exists */}
                  {avatarPreview && (
                    <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={16} className="text-white" />
                    </div>
                  )}
                </button>
                <span className="text-[9px] text-[#A08060]">optional</span>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            )}

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F0E4D0] border border-[#D0BFA8] text-[#2C1810] text-sm placeholder-[#A08060] focus:outline-none focus:border-[#8B6040]"
              style={{ fontFamily: "'Lora', serif" }}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F0E4D0] border border-[#D0BFA8] text-[#2C1810] text-sm placeholder-[#A08060] focus:outline-none focus:border-[#8B6040] pr-9"
                style={{ fontFamily: "'Lora', serif" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A08060] hover:text-[#6B4030]"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-[#2C1810] text-[#F5E8D5] text-sm font-medium hover:bg-[#3D2518] transition-colors disabled:opacity-60"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {loading
                ? "Please wait…"
                : mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <p className="text-xs text-center text-[#8B7060] mt-3">
            {mode === "signin" ? "Don't have an account? " : "Already have one? "}
            <button
              onClick={switchMode}
              className="text-[#5A3820] underline hover:no-underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}