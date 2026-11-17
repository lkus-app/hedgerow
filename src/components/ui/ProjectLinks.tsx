"use client";

import React, { useState } from "react";
import { explorerAddressUrl, projectLinks, wealdTokenAddress } from "@/lib/chain";

const base =
  "inline-flex items-center justify-center gap-2 h-12 px-5 rounded-tile font-sans font-bold text-[15px] transition-all select-none";
// "dark" sits on the coral footer, "light" on the white hero card.
const tones = {
  dark: {
    enabled: "bg-white text-navy hover:bg-butter shadow-soft hover:shadow-lift",
    disabled: "bg-white/25 text-white/70 cursor-not-allowed",
    caBox: "bg-white shadow-soft",
    caBoxOff: "bg-white/25",
    caText: "text-navy hover:bg-butter transition-colors",
    caTextOff: "text-white/70 cursor-not-allowed",
  },
  light: {
    enabled: "bg-coral text-white hover:brightness-95 shadow-soft hover:shadow-lift",
    disabled: "bg-lavender text-charcoal/50 cursor-not-allowed",
    caBox: "bg-lavender/70",
    caBoxOff: "bg-lavender/50",
    caText: "text-navy hover:bg-butter transition-colors",
    caTextOff: "text-charcoal/50 cursor-not-allowed",
  },
};

const XLogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/** X, contract address and website buttons. Unconfigured links are shown disabled, never faked. */
export const ProjectLinks: React.FC<{ className?: string; tone?: keyof typeof tones }> = ({
  className = "",
  tone = "dark",
}) => {
  const { enabled, disabled, caBox, caBoxOff, caText, caTextOff } = tones[tone];
  const [copied, setCopied] = useState(false);
  const ca = wealdTokenAddress;

  const copyCa = async () => {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the address stays visible to copy by hand */
    }
  };

  const caExplorer = ca ? explorerAddressUrl(ca) : undefined;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="grid grid-cols-2 gap-3">
        {projectLinks.x ? (
          <a href={projectLinks.x} target="_blank" rel="noreferrer" className={`${base} ${enabled}`}>
            <XLogo /> X
          </a>
        ) : (
          <span className={`${base} ${disabled}`} title="X link not configured (NEXT_PUBLIC_X_URL)">
            <XLogo /> X
          </span>
        )}
        {projectLinks.website ? (
          <a href={projectLinks.website} target="_blank" rel="noreferrer" className={`${base} ${enabled}`}>
            Website ↗
          </a>
        ) : (
          <span className={`${base} ${disabled}`} title="Website not configured (NEXT_PUBLIC_WEBSITE_URL)">
            Website ↗
          </span>
        )}
      </div>

      <div className={`flex items-stretch rounded-tile overflow-hidden ${ca ? caBox : caBoxOff}`}>
        <button
          onClick={copyCa}
          disabled={!ca}
          aria-label={ca ? "Copy $WEALD contract address" : "$WEALD contract not deployed"}
          className={`flex-1 min-w-0 flex items-center gap-3 px-4 h-12 text-left ${
            ca ? caText : caTextOff
          }`}
        >
          <span className="shrink-0 font-sans font-bold text-[15px]">CA</span>
          <span className="truncate font-mono text-xs sm:text-[13px]">
            {ca ?? "$WEALD not deployed yet"}
          </span>
          {ca && (
            <span className="shrink-0 ml-auto text-[11px] font-mono font-bold text-coral">
              {copied ? "copied ✓" : "copy"}
            </span>
          )}
        </button>
        {caExplorer && (
          <a
            href={caExplorer}
            target="_blank"
            rel="noreferrer"
            aria-label="View contract in explorer"
            className="shrink-0 flex items-center px-4 border-l border-lavender text-navy font-bold hover:bg-butter transition-colors"
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
};
