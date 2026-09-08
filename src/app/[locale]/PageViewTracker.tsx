"use client";

import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

export function PageViewTracker({ page }: { page: string }) {
  useEffect(() => {
    trackPageView(page);
  }, [page]);

  return null;
}
