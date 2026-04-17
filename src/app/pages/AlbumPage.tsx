import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAuth, API_BASE } from "../context/AuthContext";
import { AddPostcardModal, Postcard } from "../components/AddPostcardModal";
import { PostcardViewer } from "../components/PostcardViewer";
import { ArrowLeft, PenLine, Trash2, Share2 } from "lucide-react";

interface Album {
  id: string;
  name: string;
  date: string;
  coverImageUrl: string | null;
  postcards: Postcard[];
}

export function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const { user, apiHeaders } = useAuth();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPostcard, setShowAddPostcard] = useState(false);
  const [editingPostcard, setEditingPostcard] = useState<Postcard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAlbum = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/albums/${id}`, {
        headers: apiHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAlbum(data);
      } else {
        const err = await res.json();
        setError(err.error ?? "Failed to load album");
      }
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [user, id, apiHeaders]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  function handlePostcardSaved(postcard: Postcard) {
    setAlbum((prev) => {
      if (!prev) return prev;
      const existing = prev.postcards.findIndex((p) => p.id === postcard.id);
      if (existing >= 0) {
        const updated = [...prev.postcards];
        updated[existing] = postcard;
        return { ...prev, postcards: updated };
      }
      return { ...prev, postcards: [postcard, ...prev.postcards] };
    });
  }

  async function handleDeletePostcard(postcard: Postcard) {
    if (!confirm(`Delete "${postcard.title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/postcards/${postcard.id}`, {
        method: "DELETE",
        headers: apiHeaders(),
      });
      if (res.ok) {
        setAlbum((prev) =>
          prev ? { ...prev, postcards: prev.postcards.filter((p) => p.id !== postcard.id) } : prev
        );
      }
    } catch (err) {
      console.log("Delete postcard error:", err);
    }
  }

  async function handleDeleteAlbum() {
    if (!album || !confirm(`Delete album "${album.name}" and all its postcards?`)) return;
    try {
      const res = await fetch(`${API_BASE}/albums/${album.id}`, {
        method: "DELETE",
        headers: apiHeaders(),
      });
      if (res.ok) navigate("/");
    } catch (err) {
      console.log("Delete album error:", err);
    }
  }

  function handleShare(postcard: Postcard) {
    const url = `${window.location.origin}/share/${postcard.id}`;
    // Fallback copy that works in iframes / permission-restricted contexts
    let copied = false;
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      copied = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {}
    // Also try modern API where available (non-blocking)
    if (!copied && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedId(postcard.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-[#6B5040] text-sm" style={{ fontFamily: "'Lora', serif" }}>
          Please log in to view this album.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-[#A08060] text-sm" style={{ fontFamily: "'Lora', serif" }}>
          Loading album…
        </p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <p className="text-red-500 text-sm">{error ?? "Album not found"}</p>
        <Link to="/" className="text-[#6B5040] text-sm underline">← Back home</Link>
      </div>
    );
  }

  return (
    <div className="pb-24" style={{ fontFamily: "'Lora', serif" }}>
      {/* Back + album header */}
      <div className="flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-1.5 text-[#6B5040] text-sm hover:text-[#2C1810] transition-colors">
          <ArrowLeft size={14} />
          <span>Albums</span>
        </Link>
        <button
          onClick={handleDeleteAlbum}
          className="p-1.5 rounded hover:bg-[#EDD9C0] text-[#A08060] hover:text-red-500 transition-colors"
          title="Delete album"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mb-4">
        <h1
          className="text-lg font-semibold text-[#2C1810] leading-snug"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {album.name}
        </h1>
        {album.date && (
          <p className="text-xs text-[#8B7060] mt-0.5">{album.date}</p>
        )}
      </div>

      {/* Postcards list — alternating layout */}
      {album.postcards.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="text-4xl">✉️</div>
          <p className="text-[#8B7060] text-sm text-center">
            No postcards yet. Add your first postcard!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {album.postcards.map((postcard) => (
            <div key={postcard.id} className="flex flex-col gap-3">
              {/* Full postcard viewer — same layering as SharePage */}
              <PostcardViewer postcard={postcard} showActions={false} />

              {/* Title + action row */}
              <div className="flex items-center justify-between px-1">
                <p
                  className="text-sm font-medium text-[#2C1810] truncate"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {postcard.title}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleShare(postcard)}
                    className="p-1.5 rounded-full bg-[#EDD9C0] hover:bg-[#E0CCAC] text-[#6B5040] transition-colors"
                    title={copiedId === postcard.id ? "Copied!" : "Share"}
                  >
                    <Share2 size={11} className={copiedId === postcard.id ? "text-green-600" : ""} />
                  </button>
                  <button
                    onClick={() => setEditingPostcard(postcard)}
                    className="p-1.5 rounded-full bg-[#EDD9C0] hover:bg-[#E0CCAC] text-[#6B5040] transition-colors"
                    title="Edit"
                  >
                    <PenLine size={11} />
                  </button>
                  <button
                    onClick={() => handleDeletePostcard(postcard)}
                    className="p-1.5 rounded-full bg-[#EDD9C0] hover:bg-[#E0CCAC] text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add postcard FAB */}
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-1">
        <button
          onClick={() => setShowAddPostcard(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: "#C8A878" }}
          title="Add postcard"
        >
          <PenLine size={20} className="text-[#2C1810]" />
        </button>
        <span className="text-[10px] text-[#6B5040]">add postcard</span>
      </div>

      {showAddPostcard && (
        <AddPostcardModal
          albumId={album.id}
          onClose={() => setShowAddPostcard(false)}
          onSaved={handlePostcardSaved}
        />
      )}

      {editingPostcard && (
        <AddPostcardModal
          albumId={album.id}
          existingPostcard={editingPostcard}
          onClose={() => setEditingPostcard(null)}
          onSaved={(pc) => { handlePostcardSaved(pc); setEditingPostcard(null); }}
        />
      )}
    </div>
  );
}