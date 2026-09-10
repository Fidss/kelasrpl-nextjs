"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Turn off loading on route change complete
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Auto safety timeout
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Intercept click on <a> links to show instant top bar
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        !href.startsWith("javascript:") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        try {
          const url = new URL(href, window.location.origin);
          if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
            setIsLoading(true);
          }
        } catch {}
      }
    };

    document.addEventListener("click", handleLinkClick, false);
    return () => {
      document.removeEventListener("click", handleLinkClick, false);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
      <div className="h-1 w-full bg-gradient-to-r from-accent-500 via-pink-500 to-indigo-500 animate-pulse" />
      <div className="h-3 w-full bg-gradient-to-b from-accent-500/25 to-transparent blur-2xs" />
    </div>
  );
}
