import { useEffect, useRef } from "react";

const NoiseOverlay = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    const FPS = 0; // 0 = statikus zaj (nincs animáció)
    const interval = FPS > 0 ? 1000 / FPS : 0;

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
        data[i + 3] = (Math.random() * 65) | 0; // 0-65 alpha
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = Math.floor(w / SCALE);
      canvas.height = Math.floor(h / SCALE);
      if (FPS === 0) drawOneFrame();
    };

    const drawNoise = (timestamp: number) => {
      if (FPS === 0) {
        drawOneFrame();
        return;
      }
      animationId = requestAnimationFrame(drawNoise);
      if (timestamp - lastTime < interval) return;
      lastTime = timestamp;
      drawOneFrame();
    };

    resize();
    animationId = requestAnimationFrame(drawNoise);
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
        opacity: 0.3,
        imageRendering: "pixelated",
        mixBlendMode: "overlay",
      }}
    />
  );
};

export default NoiseOverlay;
