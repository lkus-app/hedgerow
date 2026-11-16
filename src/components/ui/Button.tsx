"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "coral" | "sky" | "navy" | "outline";
  children: React.ReactNode;
  shimmer?: boolean;
  spinBorder?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "coral",
  children,
  shimmer = false,
  spinBorder = false,
  fullWidth = false,
  className = "",
  ...props
}) => {
  const baseStyles =
    "group relative inline-flex items-center justify-center font-display font-bold text-[18px] md:text-[20px] rounded-tag px-6 py-3.5 transition-all duration-300 ease-out active:scale-[0.98] focus:outline-none shadow-soft hover:shadow-lift lowercase select-none overflow-hidden cursor-pointer";

  const variantStyles = {
    coral: "bg-coral text-white hover:brightness-95",
    sky: "bg-sky text-navy hover:brightness-95",
    navy: "bg-navy text-white hover:brightness-110",
    outline: "bg-transparent border-[3px] border-lavender text-white hover:bg-lavender/10",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {spinBorder && (
        <span className="absolute inset-0 rounded-tag border-[2px] border-dashed border-butter animate-spin-around pointer-events-none" />
      )}

      {shimmer && (
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-slide pointer-events-none" />
      )}

      <span className="flex items-center gap-2 relative z-10">
        <span>{children}</span>
        <span className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1 font-sans text-xl">
          ›
        </span>
      </span>
    </button>
  );
};
