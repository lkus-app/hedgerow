import React from "react";

interface InsetSectionProps {
  children: React.ReactNode;
  bg?: "surface" | "sky" | "coral" | "blush" | "lavender" | "butter" | "navy" | "transparent";
  className?: string;
  id?: string;
  noPadding?: boolean;
}

export const InsetSection: React.FC<InsetSectionProps> = ({
  children,
  bg = "surface",
  className = "",
  id,
  noPadding = false,
}) => {
  const bgClasses = {
    surface: "bg-surface text-charcoal",
    sky: "bg-sky text-navy",
    coral: "bg-coral text-white",
    blush: "bg-blush text-navy",
    lavender: "bg-lavender text-navy",
    butter: "bg-butter text-navy",
    navy: "bg-navy text-white",
    transparent: "bg-transparent text-charcoal",
  };

  return (
    <section id={id} className="w-full my-3 sm:my-4">
      <div
        className={`w-full rounded-panel ${bgClasses[bg]} overflow-hidden shadow-soft ${
          noPadding ? "" : "py-16 sm:py-24 md:py-32 px-6 sm:px-10 md:px-14 lg:px-20"
        } ${className}`}
      >
        <div className="max-w-[1280px] mx-auto w-full">{children}</div>
      </div>
    </section>
  );
};
