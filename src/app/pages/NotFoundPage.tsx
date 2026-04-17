import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-4"
      style={{ fontFamily: "'Lora', serif" }}
    >
      <div className="text-5xl">✉️</div>
      <h2
        className="text-xl text-[#2C1810]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Page not found
      </h2>
      <p className="text-sm text-[#8B7060]">This postcard must have gotten lost in the mail.</p>
      <Link
        to="/"
        className="mt-2 px-4 py-2 rounded-full text-sm text-[#F5E8D5] bg-[#2C1810] hover:bg-[#3D2518] transition-colors"
        style={{ textDecoration: "none" }}
      >
        ← Back home
      </Link>
    </div>
  );
}
