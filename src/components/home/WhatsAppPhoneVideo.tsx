"use client";

import { useEffect, useRef } from "react";

function isBackdrop(r: number, g: number, b: number) {
  // Outer studio white / near-white only (flood-filled from edges)
  return r >= 238 && g >= 238 && b >= 238;
}

/** Plays the WhatsApp demo; removes only the outer white backdrop, not whites inside the phone. */
export function WhatsAppPhoneVideo({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const seenRef = useRef<Uint32Array | null>(null);
  const queueRef = useRef<Int32Array | null>(null);
  const genRef = useRef(1);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const draw = () => {
      if (video.readyState >= 2 && canvas.width > 0) {
        const w = canvas.width;
        const h = canvas.height;
        const n = w * h;

        if (!seenRef.current || seenRef.current.length !== n) {
          seenRef.current = new Uint32Array(n);
          queueRef.current = new Int32Array(n);
        }

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h);
        const data = frame.data;
        const seen = seenRef.current;
        const queue = queueRef.current!;
        let gen = genRef.current + 1;
        if (gen > 0xfffffff0) {
          seen.fill(0);
          gen = 1;
        }
        genRef.current = gen;

        let qh = 0;
        let qt = 0;

        const enqueue = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= w || y >= h) return;
          const idx = y * w + x;
          if (seen[idx] === gen) return;
          const i = idx * 4;
          if (!isBackdrop(data[i], data[i + 1], data[i + 2])) return;
          seen[idx] = gen;
          queue[qt++] = idx;
        };

        for (let x = 0; x < w; x++) {
          enqueue(x, 0);
          enqueue(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          enqueue(0, y);
          enqueue(w - 1, y);
        }

        while (qh < qt) {
          const idx = queue[qh++];
          const x = idx % w;
          const y = (idx / w) | 0;
          const i = idx * 4;
          data[i + 3] = 0;
          enqueue(x + 1, y);
          enqueue(x - 1, y);
          enqueue(x, y + 1);
          enqueue(x, y - 1);
        }

        // Soft fringe on remaining near-white pixels next to cleared backdrop
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const i = idx * 4;
            if (data[i + 3] === 0) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r < 232 || g < 232 || b < 232) continue;
            const neighbors =
              (seen[idx - 1] === gen ? 1 : 0) +
              (seen[idx + 1] === gen ? 1 : 0) +
              (seen[idx - w] === gen ? 1 : 0) +
              (seen[idx + w] === gen ? 1 : 0);
            if (neighbors > 0) {
              data[i + 3] = Math.round(255 * (1 - neighbors * 0.28));
            }
          }
        }

        ctx.putImageData(frame, 0, 0);
      }
      rafRef.current = window.requestAnimationFrame(draw);
    };

    const onReady = () => {
      const display = Math.min(560, video.videoWidth || 560);
      const ratio = (video.videoHeight || 1) / (video.videoWidth || 1);
      canvas.width = display;
      canvas.height = Math.round(display * ratio);
      void video.play().catch(() => undefined);
      if (rafRef.current == null) draw();
    };

    video.addEventListener("loadeddata", onReady);
    if (video.readyState >= 2) onReady();

    return () => {
      video.removeEventListener("loadeddata", onReady);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [src]);

  return (
    <div className="hukum-wa__media">
      <video
        ref={videoRef}
        className="hukum-wa__video-src"
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        tabIndex={-1}
      />
      <canvas ref={canvasRef} className="hukum-wa__video" role="img" aria-label={label} />
    </div>
  );
}
