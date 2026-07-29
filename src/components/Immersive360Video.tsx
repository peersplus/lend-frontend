import { useEffect, useRef, useState } from "react";

type ThreeModule = typeof import("three");

const signedUrlCache = new Map<string, { url: string; exp: number }>();

async function postWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function resolveMediaUrl(path: string): Promise<string | null> {
  if (/^https?:\/\//.test(path)) return path;

  const cached = signedUrlCache.get(path);
  if (cached && cached.exp > Date.now()) return cached.url;

  const token = await (await import("@/lib/firebase")).getFirebaseIdToken();
  const publicUrlEndpoint = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/storage/photos/public-url`;
  let res: Response;
  try {
    res = await postWithTimeout(publicUrlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
      body: JSON.stringify({ path }),
    }, 25000);
  } catch (firstError: any) {
    if (firstError?.name !== "AbortError") throw firstError;
    res = await postWithTimeout(publicUrlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
      body: JSON.stringify({ path }),
    }, 25000);
  }
  const body = await res.json().catch(() => null);
  const nextUrl = body?.data?.publicUrl || body?.publicUrl;
  if (!nextUrl) return null;
  signedUrlCache.set(path, { url: nextUrl, exp: Date.now() + 55 * 60 * 1000 });
  return nextUrl;
}

export function Immersive360Video({
  path,
  className,
  compact = false,
}: {
  path: string | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!path || !containerRef.current) {
      setReady(false);
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const [THREE, mediaUrl] = await Promise.all([
          import("three") as Promise<ThreeModule>,
          resolveMediaUrl(path),
        ]);
        if (cancelled || !containerRef.current || !mediaUrl) return;

        const container = containerRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / Math.max(container.clientHeight, 1), 1, 1100);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        const video = document.createElement("video");
        video.src = mediaUrl;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("webkit-playsinline", "true");
        video.preload = "metadata";
        videoRef.current = video;
        void video.play().catch(() => {
          // autoplay can be blocked until user interaction
        });

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;

        const geometry = new THREE.SphereGeometry(500, 80, 60);
        geometry.scale(-1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        let lon = 0;
        let lat = 0;
        let isInteracting = false;
        let pointerX = 0;
        let pointerY = 0;
        let startLon = 0;
        let startLat = 0;
        let frame = 0;

        const onPointerDown = (ev: PointerEvent) => {
          isInteracting = true;
          pointerX = ev.clientX;
          pointerY = ev.clientY;
          startLon = lon;
          startLat = lat;
          container.setPointerCapture(ev.pointerId);
        };

        const onPointerMove = (ev: PointerEvent) => {
          if (!isInteracting) return;
          const dx = ev.clientX - pointerX;
          const dy = ev.clientY - pointerY;
          lon = startLon - dx * 0.12;
          lat = Math.max(-85, Math.min(85, startLat + dy * 0.12));
        };

        const onPointerUp = (ev: PointerEvent) => {
          isInteracting = false;
          container.releasePointerCapture(ev.pointerId);
        };

        const onWheel = (ev: WheelEvent) => {
          camera.fov = Math.max(40, Math.min(95, camera.fov + ev.deltaY * 0.03));
          camera.updateProjectionMatrix();
        };

        const onResize = () => {
          if (!container) return;
          camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        };

        container.addEventListener("pointerdown", onPointerDown);
        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("pointerup", onPointerUp);
        container.addEventListener("pointerleave", onPointerUp);
        container.addEventListener("wheel", onWheel, { passive: true });
        window.addEventListener("resize", onResize);

        const animate = () => {
          frame = window.requestAnimationFrame(animate);
          if (!isInteracting) lon += 0.025;
          const phi = THREE.MathUtils.degToRad(90 - lat);
          const theta = THREE.MathUtils.degToRad(lon);
          camera.position.set(
            500 * Math.sin(phi) * Math.cos(theta),
            500 * Math.cos(phi),
            500 * Math.sin(phi) * Math.sin(theta),
          );
          camera.lookAt(0, 0, 0);
          renderer.render(scene, camera);
        };

        animate();
        setFailed(false);
        setReady(true);

        cleanup = () => {
          window.cancelAnimationFrame(frame);
          container.removeEventListener("pointerdown", onPointerDown);
          container.removeEventListener("pointermove", onPointerMove);
          container.removeEventListener("pointerup", onPointerUp);
          container.removeEventListener("pointerleave", onPointerUp);
          container.removeEventListener("wheel", onWheel);
          window.removeEventListener("resize", onResize);
          video.pause();
          videoRef.current = null;
          texture.dispose();
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          container.innerHTML = "";
        };
      } catch {
        if (!cancelled) {
          setFailed(true);
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setReady(false);
      cleanup?.();
    };
  }, [path]);

  if (!path) return null;

  const controlPadding = compact ? "px-2 py-1" : "px-2 py-1";
  const controlText = compact ? "text-[9px]" : "text-[10px]";
  const badgePadding = compact ? "px-1.5 py-0.5" : "px-2 py-1";
  const badgeText = compact ? "text-[9px]" : "text-[10px]";
  const overlayOffset = compact ? "bottom-2 left-2" : "bottom-3 left-3";
  const controlsOffset = compact ? "right-2 top-2" : "right-3 top-3";

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (video.paused) {
      void video.play().catch(() => {
        // ignore play errors
      });
    }
  }

  async function enterFullscreen() {
    if (!containerRef.current) return;
    const element = containerRef.current as HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void };
    if (document.fullscreenElement) return;
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return;
    }
    if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    }
  }

  return (
    <div className={`relative overflow-hidden ${className || ""}`}>
      <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      {!ready && !failed && (
        <div className="absolute inset-0 grid place-items-center bg-muted text-xs text-muted-foreground">Preparing immersive 360 view...</div>
      )}
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-muted p-3 text-center text-xs text-muted-foreground">
          Unable to start immersive view. The video still remains available from list preview.
        </div>
      )}
      <div className={`pointer-events-none absolute rounded-md bg-black/65 ${badgePadding} ${badgeText} font-semibold uppercase tracking-wide text-white ${overlayOffset}`}>
        Drag to look around
      </div>
      <div className={`absolute flex gap-1.5 ${controlsOffset}`}>
        <button
          type="button"
          onClick={() => {
            void enterFullscreen();
          }}
          className={`rounded-md bg-black/65 ${controlPadding} ${controlText} font-semibold uppercase tracking-wide text-white hover:bg-black/80`}
        >
          Fullscreen
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className={`rounded-md bg-black/65 ${controlPadding} ${controlText} font-semibold uppercase tracking-wide text-white hover:bg-black/80`}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
}
