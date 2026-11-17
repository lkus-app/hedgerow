"use client";

import React from "react";
import { CadIcon } from "./CadIcon";

export const BackToTop: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="w-11 h-11 bg-white hover:bg-butter p-1 rounded-tag flex items-center justify-center shadow-soft hover:shadow-lift transition-all duration-200 cursor-pointer overflow-hidden border border-lavender"
      title="Back to Top · 3D CAD Blueprint"
    >
      <CadIcon name="bow" size="sm" />
    </button>
  );
};
