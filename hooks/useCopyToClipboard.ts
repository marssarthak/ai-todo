"use client";

import { useState, useCallback } from "react";

export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !navigator.clipboard?.writeText) {
        console.warn("Clipboard API not available");
        return;
      }

      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, timeout);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
          setCopied(false); // Ensure state is reset on error
        });
    },
    [timeout]
  );

  return { copied, copyToClipboard };
}
