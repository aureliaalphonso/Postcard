import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { API_BASE } from "../context/AuthContext";
import { PostcardViewer } from "../components/PostcardViewer";
import { Postcard } from "../components/AddPostcardModal";
import { publicAnonKey } from "/utils/supabase/info";

export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [postcard, setPostcard] = useState<Postcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPostcard() {
      try {
        const res = await fetch(`${API_BASE}/postcards/${id}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPostcard(data);
        } else {
          const err = await res.json();
          setError(err.error ?? "Postcard not found");
        }
      } catch (err) {
        setError(`Error: ${err}`);
      } finally {
        setLoading(false);
      }
    }
    fetchPostcard();
  }, [id]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: "#FAF5EE", fontFamily: "'Lora', serif" }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1
            className="text-2xl font-semibold text-[#2C1810]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Travel Postcard
          </h1>
        </Link>
        <p className="text-xs text-[#A08060] mt-1">A postcard was shared with you</p>
      </div>

      {loading ? (
        <p className="text-[#A08060] text-sm">Loading postcard…</p>
      ) : error ? (
        <div className="text-center">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <Link to="/" className="text-[#6B5040] text-sm underline">
            ← Go home
          </Link>
        </div>
      ) : postcard ? (
        <div className="w-full max-w-sm">
          <PostcardViewer postcard={postcard} showActions={false} />
          <div className="mt-6 text-center">
            <p className="text-xs text-[#A08060] mb-2">Want to create your own travel postcards?</p>
            <Link
              to="/"
              className="px-4 py-2 rounded-full text-xs text-[#F5E8D5] bg-[#2C1810] hover:bg-[#3D2518] transition-colors"
              style={{ textDecoration: "none" }}
            >
              Get started →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}