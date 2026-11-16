"use client";

import React from "react";

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
      className="w-10 h-10 bg-white hover:bg-butter rounded-tag flex items-center justify-center text-xl shadow-soft hover:shadow-lift transition-all duration-200 cursor-pointer"
      title="Back to the Greenwood"
    >
      🥐
    </button>
  );
};
