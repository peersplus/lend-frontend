import { toast } from "@/lib/sonner";

export function requestLocation(
  onSuccess: (coords: { lat: number; lng: number }) => void,
) {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    toast.error("Geolocation is not supported in this browser.");
    return;
  }

  const inIframe = window.self !== window.top;

  navigator.geolocation.getCurrentPosition(
    (p) => onSuccess({ lat: p.coords.latitude, lng: p.coords.longitude }),
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        if (inIframe) {
          toast.error(
            "Location is blocked inside the preview. Open the app in a new tab and allow location.",
            { duration: 6000 },
          );
        } else {
          toast.error(
            "Location permission denied. Enable it in your browser's site settings and try again.",
            { duration: 6000 },
          );
        }
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        toast.error("Your location is unavailable right now. Try again in a moment.");
      } else if (err.code === err.TIMEOUT) {
        toast.error("Getting your location took too long. Try again.");
      } else {
        toast.error(err.message || "Could not get your location.");
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}
