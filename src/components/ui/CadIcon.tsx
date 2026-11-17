"use client";

import React from "react";

export type CadIconName =
  | "bow"
  | "gas"
  | "mev"
  | "sentinel"
  | "gauge"
  | "rocket"
  | "actuator";

interface CadIconProps {
  name: CadIconName;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
  className?: string;
  alt?: string;
  blueprintBg?: boolean;
}

const iconSrcMap: Record<CadIconName, string> = {
  bow: "/hedgerow-3d-cad-icon.jpg",
  gas: "/icons/cad-gas-cell.png",
  mev: "/icons/cad-mev-gear.png",
  sentinel: "/icons/cad-sentinel-drone.png",
  gauge: "/icons/cad-volatility-gauge.png",
  rocket: "/icons/cad-rocket-thruster.png",
  actuator: "/icons/cad-finger-actuator.png",
};

const iconLabelMap: Record<CadIconName, string> = {
  bow: "Hedgerow 3D CAD Compound Bow & Croissant",
  gas: "3D CAD Lightning Gas Cell",
  mev: "3D CAD WEALD MEV Gear",
  sentinel: "3D CAD Friar Sentinel Drone",
  gauge: "3D CAD Volatility Pressure Gauge",
  rocket: "3D CAD Rocket Thruster Assembly",
  actuator: "3D CAD Mechanical Actuator",
};

export const CadIcon: React.FC<CadIconProps> = ({
  name,
  size = "md",
  className = "",
  alt,
  blueprintBg = false,
}) => {
  const sizeClasses = {
    xs: "w-5 h-5",
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
    "2xl": "w-28 h-28",
  };

  const dimension =
    typeof size === "number"
      ? { width: `${size}px`, height: `${size}px` }
      : undefined;

  const sizeClass = typeof size === "string" ? sizeClasses[size] : "";

  return (
    <div
      style={dimension}
      className={`relative inline-flex items-center justify-center rounded-tile overflow-hidden shadow-soft ${
        blueprintBg ? "bg-navy border border-sky/40" : ""
      } ${sizeClass} ${className}`}
    >
      <img
        src={iconSrcMap[name]}
        alt={alt || iconLabelMap[name]}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
