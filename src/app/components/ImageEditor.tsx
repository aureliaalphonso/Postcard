import { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check } from "lucide-react";

type FitMode = "cover" | "contain" | "stretch";

interface ImageEditorProps {
  file: File;
  aspectRatio?: number; // w/h, default 4/3
  onConfirm: (dataUrl: string, blob: Blob) => void;
  onCancel: () => void;
}

export function ImageEditor({ file, aspectRatio = 4 / 3, onConfirm, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [mode, setMode] = useState<FitMode>("cover");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#F0E4D0";
    ctx.fillRect(0, 0, cw, ch);

    let drawW: number, drawH: number, dx: number, dy: number;

    if (mode === "stretch") {
      drawW = cw;
      drawH = ch;
      dx = 0;
      dy = 0;
    } else if (mode === "contain") {
      const scale = Math.min(cw / iw, ch / ih);
      drawW = iw * scale;
      drawH = ih * scale;
      dx = (cw - drawW) / 2;
      dy = (ch - drawH) / 2;
    } else {
      // cover: scale to fill, allow panning
      const scale = Math.max(cw / iw, ch / ih) * zoom;
      drawW = iw * scale;
      drawH = ih * scale;
      dx = (cw - drawW) / 2 + pan.x;
      dy = (ch - drawH) / 2 + pan.y;

      // Clamp pan so image always fills canvas
      const minX = cw - drawW;
      const minY = ch - drawH;
      dx = Math.min(0, Math.max(minX, dx));
      dy = Math.min(0, Math.max(minY, dy));
    }

    ctx.drawImage(img, dx, dy, drawW, drawH);
  }, [mode, zoom, pan]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Fit canvas to container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const w = container.clientWidth;
    const h = Math.round(w / aspectRatio);
    canvas.width = w;
    canvas.height = h;
    draw();
  }, [aspectRatio, draw]);

  // Mouse drag for cover mode
  function onMouseDown(e: React.MouseEvent) {
    if (mode !== "cover") return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setPan({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  }
  function onMouseUp() { setDragging(false); }

  // Touch drag
  const lastTouch = useRef({ x: 0, y: 0 });
  function onTouchStart(e: React.TouchEvent) {
    if (mode !== "cover") return;
    const t = e.touches[0];
    lastTouch.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (mode !== "cover") return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - lastTouch.current.x;
    const dy = t.clientY - lastTouch.current.y;
    lastTouch.current = { x: t.clientX, y: t.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }

  // Zoom wheel
  function onWheel(e: React.WheelEvent) {
    if (mode !== "cover") return;
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(4, z - e.deltaY * 0.001)));
  }

  function handleConfirm() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      onConfirm(dataUrl, blob);
    }, "image/jpeg", 0.92);
  }

  const MODES: { key: FitMode; label: string; desc: string }[] = [
    { key: "cover", label: "Fill & Crop", desc: "Fills frame, drag to reposition" },
    { key: "contain", label: "Fit Inside", desc: "Shows whole image with padding" },
    { key: "stretch", label: "Stretch", desc: "Stretches to fill frame exactly" },
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#FAF5EE", fontFamily: "'Lora', serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0CCAC]">
          <p className="text-sm font-semibold text-[#2C1810]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Edit Image
          </p>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-[#EDD9C0] text-[#6B5040]">
            <X size={15} />
          </button>
        </div>

        {/* Canvas preview */}
        <div
          ref={containerRef}
          className="w-full relative"
          style={{ cursor: mode === "cover" ? (dragging ? "grabbing" : "grab") : "default" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onWheel={onWheel}
        >
          <canvas ref={canvasRef} className="w-full block" />
          {mode === "cover" && (
            <div className="absolute bottom-2 left-2 text-[9px] text-white/80 bg-black/30 rounded px-1.5 py-0.5">
              Drag to reposition · scroll to zoom
            </div>
          )}
        </div>

        {/* Fit mode pills */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-[9px] uppercase tracking-widest text-[#8B7060] font-semibold mb-2">Resize Mode</p>
          <div className="flex gap-2">
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: mode === m.key ? "#2C1810" : "#EDD9C0",
                  color: mode === m.key ? "#F5E8D5" : "#4A3728",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-[#A08060] mt-1.5 text-center">
            {MODES.find(m => m.key === mode)?.desc}
          </p>
        </div>

        {/* Zoom controls (cover only) */}
        {mode === "cover" && (
          <div className="px-4 pb-2 flex items-center gap-3">
            <p className="text-[9px] text-[#8B7060] uppercase tracking-wider">Zoom</p>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-1.5 rounded-full bg-[#EDD9C0] hover:bg-[#E0CCAC] text-[#4A3728] transition-colors"
            >
              <ZoomOut size={12} />
            </button>
            <div className="flex-1">
              <input
                type="range" min="50" max="400" step="5"
                value={Math.round(zoom * 100)}
                onChange={e => setZoom(Number(e.target.value) / 100)}
                className="w-full accent-[#C8A878]"
              />
            </div>
            <button
              onClick={() => setZoom(z => Math.min(4, z + 0.1))}
              className="p-1.5 rounded-full bg-[#EDD9C0] hover:bg-[#E0CCAC] text-[#4A3728] transition-colors"
            >
              <ZoomIn size={12} />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1.5 rounded-full bg-[#EDD9C0] hover:bg-[#E0CCAC] text-[#4A3728] transition-colors"
              title="Reset"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E0CCAC]">
          <button
            onClick={onCancel}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-[#D4C4A0] hover:bg-[#C4B490] flex items-center justify-center transition-colors shadow-inner">
              <X size={16} className="text-[#4A3728]" />
            </div>
            <span className="text-[10px] text-[#6B5040]">Cancel</span>
          </button>

          <button
            onClick={handleConfirm}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-[#C8A878] hover:bg-[#B89868] flex items-center justify-center transition-colors shadow-inner">
              <Check size={16} className="text-[#2C1810]" />
            </div>
            <span className="text-[10px] text-[#6B5040]">Use This</span>
          </button>
        </div>
      </div>
    </div>
  );
}