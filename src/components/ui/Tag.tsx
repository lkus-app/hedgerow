import React from "react";

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ children, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center justify-center bg-sky text-white font-sans font-semibold text-[13px] sm:text-[14px] rounded-tag px-3 py-1.5 select-none leading-none tracking-normal shadow-sm ${className}`}
    >
      {children}
    </span>
  );
};
