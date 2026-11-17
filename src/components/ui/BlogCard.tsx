"use client";

import React from "react";
import { motion } from "framer-motion";
import { CadIcon, CadIconName } from "./CadIcon";

export interface BlogPost {
  category: string;
  author: string;
  title: string;
  readTime: string;
  color: "sky" | "coral" | "butter" | "pink";
  cadIcon: CadIconName;
}

interface BlogCardProps {
  post: BlogPost;
  onClick?: () => void;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, onClick }) => {
  const bgColors = {
    sky: "bg-sky/20 border-sky/30",
    coral: "bg-coral/20 border-coral/30",
    butter: "bg-butter/30 border-butter/40",
    pink: "bg-pink/25 border-pink/40",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className="group relative flex flex-col bg-white rounded-card overflow-hidden shadow-soft hover:shadow-lift border border-lavender cursor-pointer"
    >
      {/* Tall rounded image placeholder with 3D CAD icon */}
      <div
        className={`relative h-[190px] w-full ${bgColors[post.color]} flex items-center justify-center border-b transition-colors overflow-hidden`}
      >
        <CadIcon
          name={post.cadIcon}
          size={110}
          blueprintBg
          className="group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300 shadow-lift"
        />

        {/* Category tag overlapping top */}
        <div className="absolute top-3 left-3 bg-white text-navy font-sans font-bold text-xs uppercase px-2.5 py-1 rounded-tag shadow-sm tracking-wide">
          {post.category}
        </div>

        <div className="absolute bottom-3 right-3 text-xs font-mono text-charcoal/70 bg-white/80 px-2 py-0.5 rounded-tag">
          {post.readTime}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <div className="text-[14px] text-charcoal/75 font-sans font-medium mb-2">
            {post.author} —
          </div>
          <h4 className="font-sans font-bold text-[20px] sm:text-[22px] leading-snug text-charcoal line-clamp-2 group-hover:text-coral transition-colors">
            {post.title}
          </h4>
        </div>

        <div className="pt-4 flex items-center justify-between text-xs text-charcoal/60 border-t border-lavender/60 mt-4">
          <span className="font-medium text-sky group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-bold">
            read field report <span>›</span>
          </span>
          <span className="font-mono">#OG-00{(post.title.length % 8) + 1}</span>
        </div>
      </div>
    </motion.div>
  );
};
