import { useState, useEffect, useCallback } from "react";
import { useAuth, API_BASE } from "../context/AuthContext";
import { AlbumCard, Album } from "../components/AlbumCard";
import { AddAlbumModal } from "../components/AddAlbumModal";
import { Camera } from "lucide-react";

export function HomePage() {
  const { user, apiHeaders } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  const fetchAlbums = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/albums`, {
        headers: apiHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      } else {
        console.log("Fetch albums error:", await res.text());
      }
    } catch (err) {
      console.log("Fetch albums error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, apiHeaders]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  function handleAlbumSaved(album: Album) {
    setAlbums((prev) => {
      const idx = prev.findIndex((a) => a.id === album.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = album;
        return updated;
      }
      return [album, ...prev];
    });
  }

  async function handleDeleteAlbum(album: Album) {
    if (!confirm(`Delete album "${album.name}" and all its postcards?`)) return;
    try {
      const res = await fetch(`${API_BASE}/albums/${album.id}`, {
        method: "DELETE",
        headers: apiHeaders(),
      });
      if (res.ok) {
        setAlbums((prev) => prev.filter((a) => a.id !== album.id));
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete album");
      }
    } catch (err) {
      console.log("Delete album error:", err);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-5xl">✉️</div>
        <p
          className="text-[#6B5040] text-center text-sm max-w-xs"
          style={{ fontFamily: "'Lora', serif" }}
        >
          Please log in to view and manage your travel postcards.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="text-[#A08060] text-sm" style={{ fontFamily: "'Lora', serif" }}>
            Loading albums…
          </div>
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-4xl">📸</div>
          <p className="text-[#8B7060] text-sm text-center" style={{ fontFamily: "'Lora', serif" }}>
            No albums yet. Create your first travel album!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pt-4">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onEdit={(a) => setEditingAlbum(a)}
              onDelete={handleDeleteAlbum}
            />
          ))}
        </div>
      )}

      {/* Add album FAB */}
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-1">
        <button
          onClick={() => setShowAddAlbum(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: "#C8A878" }}
          title="Add album"
        >
          <Camera size={22} className="text-[#2C1810]" />
        </button>
        <span className="text-[10px] text-[#6B5040]" style={{ fontFamily: "'Lora', serif" }}>
          add album
        </span>
      </div>

      {showAddAlbum && (
        <AddAlbumModal
          onClose={() => setShowAddAlbum(false)}
          onCreated={handleAlbumSaved}
        />
      )}

      {editingAlbum && (
        <AddAlbumModal
          existingAlbum={editingAlbum}
          onClose={() => setEditingAlbum(null)}
          onCreated={(updated) => { handleAlbumSaved(updated); setEditingAlbum(null); }}
        />
      )}
    </div>
  );
}
