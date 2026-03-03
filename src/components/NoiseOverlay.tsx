import { useEffect, useRef } from "react";

interface NoiseOverlayProps {
  opacity?: number;
}

const NoiseOverlay = ({ opacity = 0.3 }: NoiseOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const SCALE = 3;

    const drawOneFrame = () => {
      const { width, height } = canvas;
      if (width === 0 || height === 0) return;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = (Math.random() * 65) | 0;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = Math.floor(w / SCALE);
      canvas.height = Math.floor(h / SCALE);
      drawOneFrame();
    };

    resize();
    animationId = requestAnimationFrame(() => {});
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        pointerEvents: "none",
        opacity: opacity,
        imageRendering: "pixelated",
        mixBlendMode: "overlay",
      }}
    />
  );
};

export default NoiseOverlay;
