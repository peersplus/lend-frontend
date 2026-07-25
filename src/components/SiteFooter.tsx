import { Link } from "@tanstack/react-router";
import { LOGO_URL } from "@/lib/brand";

/** Shared footer with links to trust pages and support contact. */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm md:grid-cols-4">
        <div>
          <img src={LOGO_URL} alt="Peers+Help" className="h-8 w-auto" />
          <p className="mt-3 text-xs text-muted-foreground">
            A free community platform for neighbors to share, borrow and help.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community</p>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-primary">About us</Link></li>
            <li><Link to="/community" className="hover:text-primary">Community code</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact support</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trust & safety</p>
          <ul className="space-y-2">
            <li><Link to="/safety" className="hover:text-primary">Safety guide</Link></li>
            <li><Link to="/verification" className="hover:text-primary">Verification</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Get in touch</p>
          <p className="text-muted-foreground">Questions, reports, or ideas?</p>
          <a href="mailto:peersplushr@gmail.com" className="mt-1 inline-block font-medium text-leaf hover:underline">
            peersplushr@gmail.com
          </a>
        </div>
      </div>
      <div className="border-t border-border/60 px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Peers+Help — Neighbors helping neighbors.
      </div>
    </footer>
  );
}
