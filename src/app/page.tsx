"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ScriptHeading } from "@/components/ui/ScriptHeading";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { CaseStudy, CaseStudyItem } from "@/components/ui/CaseStudy";
import { IndustryTile } from "@/components/ui/IndustryTile";
import { BlogCard, BlogPost } from "@/components/ui/BlogCard";
import { BentoMosaic } from "@/components/ui/BentoMosaic";
import { SocialIcons } from "@/components/ui/SocialIcons";
import { FloatingHelpButton } from "@/components/ui/FloatingHelpButton";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import { BackToTop } from "@/components/ui/BackToTop";
import { InsetSection } from "@/components/ui/InsetSection";
import { AmbushModal } from "@/components/ui/AmbushModal";
import { CadIcon } from "@/components/ui/CadIcon";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Case study data
  const caseStudies: CaseStudyItem[] = [
    {
      eyebrow: "Epoch #001 · Robinhood Chain L2",
      title: "The Sunday Squeeze: GameStop ($GME-RWA) Ambush",
      description:
        "When traditional brokers halted weekend trading, overleveraged shorts left 4.2M shares unhedged. The Friar AI sentinel activated an automated liquidity sweep, returning +382.4% gamma yield directly to retail vault stakers.",
      tags: ["Off-Hours Ambush", "Short Borrow 142%", "Robinhood Chain L2", "Arbitrum Orbit"],
      accentColor: "pink",
      statLabel: "Total Squeeze Profits Recycled",
      statValue: "$2.84M USD",
      illustrationType: "squeeze",
    },
    {
      eyebrow: "Epoch #002 · Dark Hours Engine",
      title: "NVIDIA ($NVDA-RWA) Post-Earnings Delta Straddle",
      description:
        "Baking volatility fresh out of the oven. At 4:05 PM EST, traditional Wall Street spreads blew out to $14. Our synthetic AMM curve absorbed retail flow at zero slippage and captured the TradFi gap upon Monday's opening bell.",
      tags: ["Earnings Straddle", "Zero PFOF", "Synthetic Delta", "24/7 Trading"],
      accentColor: "butter",
      statLabel: "Arbitrage Spread Harvested",
      statValue: "+$1.15M USDC",
      illustrationType: "straddle",
    },
    {
      eyebrow: "Epoch #003 · Autonomous Agents",
      title: "Friar-1 AI Sentinel: The Citadel Killer",
      description:
        "Autonomous algorithmic highwayman running directly in the EVM. Batches retail swaps into private mempool bundles, front-running predatory high-frequency traders and redistributing 100% of MEV rebates to $WEALD stakers.",
      tags: ["AI-Native Agent", "Reverse PFOF", "Zero Gas Griefing", "Anti-Frontrun"],
      accentColor: "coral",
      statLabel: "Retail Order Flow Protected",
      statValue: "100% MEV Rebated",
      illustrationType: "sentinel",
    },
    {
      eyebrow: "Epoch #004 · Tokenized Equities",
      title: "Tesla ($TSLA-RWA) Weekend Liquidity Harvest",
      description:
        "Traditional markets lock retail out for 63 hours every weekend. Hedgerow pools capital into automated call-ladders and spot accumulation, turning after-hours illiquidity into an asymmetric financial weapon.",
      tags: ["Weekend AMM", "Tokenized Stock", "Yield Vault", "Chain ID 4663"],
      accentColor: "sky",
      statLabel: "Off-Market Volume Settled",
      statValue: "$8.9M 24h Vol",
      illustrationType: "arbitrage",
    },
  ];

  // Blog posts
  const blogPosts: BlogPost[] = [
    {
      category: "Protocol Lore",
      author: "Friar Tuck",
      title: "Why Robinhood Chain is the Trojan Horse for Decentralized Retail Vengeance",
      readTime: "4 min read",
      color: "coral",
      cadIcon: "bow",
    },
    {
      category: "Mechanics",
      author: "Little John",
      title: "Baking the Math: How Reverse-PFOF Steals the Spread from Market Makers",
      readTime: "6 min read",
      color: "butter",
      cadIcon: "mev",
    },
    {
      category: "Architecture",
      author: "Will Scarlet",
      title: "Arbitrum Orbit + Ethereum Blobs: The Sub-Second Settlement Engine (ID 4663)",
      readTime: "5 min read",
      color: "sky",
      cadIcon: "gas",
    },
    {
      category: "Manifesto",
      author: "The Greenwood Guild",
      title: "We Don't Do Catering: Codifying WallStreetBets as an Immutable Financial Weapon",
      readTime: "3 min read",
      color: "pink",
      cadIcon: "sentinel",
    },
  ];

  const handleOpenApp = () => setIsModalOpen(true);

  return (
    <div className="page-inset-wrapper">
      {/* Global Scroll Indicator */}
      <ScrollIndicator />

      {/* Global Floating Help Button */}
      <FloatingHelpButton onOpenApp={handleOpenApp} />

      {/* Interactive Vault Ambush Modal */}
      <AmbushModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 bg-sky p-8 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-6 border-b border-navy/20">
              <div className="flex items-center gap-3">
                <CadIcon name="bow" size="md" blueprintBg />
                <span className="font-display font-black text-2xl text-navy">hedgerow</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-navy text-white font-bold flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-6 py-8">
              {["vaults", "how it works", "strategies", "tokenomics", "chronicles", "robinhood chain ↗"].map(
                (item, idx) => (
                  <a
                    key={idx}
                    href={`#${item.replace(/\s+/g, "-")}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-sans font-bold text-3xl sm:text-4xl text-navy hover:text-coral transition-colors lowercase"
                  >
                    {item}
                  </a>
                )
              )}
            </nav>

            <div className="pt-6 border-t border-navy/20">
              <Button
                variant="coral"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenApp();
                }}
              >
                launch ambush vault ›
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 3.1 HEADER / HERO SPLIT (100vh)                           */}
      {/* ========================================================= */}
      <section className="min-h-screen w-full flex flex-col justify-between pt-2 pb-6">
        {/* Top bar on small devices */}
        <div className="lg:hidden flex items-center justify-between py-4 px-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-tile overflow-hidden shadow-soft border-2 border-pink bg-navy flex-shrink-0">
              <img
                src="/hedgerow-3d-cad-icon.jpg"
                alt="Hedgerow 3D CAD Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-display font-black text-xl text-navy tracking-tight block leading-tight">hedgerow</span>
              <span className="block text-[10px] font-mono font-bold text-coral uppercase tracking-wider">
                alpha lab · rwh-l2
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-tag bg-lavender text-navy font-bold flex items-center justify-center text-xl shadow-soft"
          >
            ☰
          </button>
        </div>

        {/* 2-Column Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 items-stretch">
          {/* Left Column (~35% -> lg:col-span-4 or 5) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-bg p-4 sm:p-6 lg:p-8 rounded-panel border-2 border-lavender/60 shadow-soft">
            {/* Logo Mark */}
            <div className="hidden lg:flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-tile overflow-hidden shadow-soft hover:shadow-lift border-2 border-pink bg-navy flex-shrink-0 hover:rotate-3 transition-transform">
                <img
                  src="/hedgerow-3d-cad-icon.jpg"
                  alt="Hedgerow 3D CAD Icon"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-display font-black text-2xl text-navy tracking-tight block leading-none">
                  hedgerow
                </span>
                <span className="text-[11px] font-mono font-bold text-coral uppercase tracking-wider mt-1 block">
                  asymmetric alpha lab · robinhood chain l2
                </span>
              </div>
            </div>

            {/* Vertical Big Nav (Poppins 700, 30px, --pink, tight leading) */}
            <nav className="my-8 lg:my-auto flex flex-col gap-4">
              {[
                { name: "vaults", href: "#vaults" },
                { name: "how it works", href: "#manifesto" },
                { name: "strategies", href: "#strategies" },
                { name: "tokenomics ($weald)", href: "#weald" },
                { name: "chronicles", href: "#gazette" },
                { name: "robinhood chain (id: 4663) ↗", href: "https://robinhoodchain.blockscout.com", external: true },
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  className="font-sans font-bold text-[24px] sm:text-[28px] lg:text-[30px] leading-[1.1] text-pink hover:text-coral transition-all duration-200 transform hover:translate-x-2 select-none lowercase flex items-center gap-1.5"
                >
                  <span>{link.name}</span>
                </a>
              ))}
            </nav>

            {/* Bottom Actions of Left Column */}
            <div className="space-y-5 pt-4">
              {/* Wide Coral CTA ("start a project ›" -> "start an ambush ›") */}
              <Button
                variant="coral"
                fullWidth
                shimmer
                onClick={handleOpenApp}
                className="py-4 text-xl"
              >
                start an ambush ›
              </Button>

              {/* Social icons row + Chain Explorer link */}
              <div className="flex items-center justify-between pt-2 border-t border-lavender/70">
                <SocialIcons color="coral" />
                <span className="text-xs font-mono font-bold text-charcoal/70 bg-lavender/60 px-2.5 py-1 rounded-tag">
                  L2 Mainnet
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (~65% -> lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col">
            <BentoMosaic />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3.2 INTRO / MANIFESTO                                     */}
      {/* ========================================================= */}
      <section id="manifesto" className="w-full my-6 sm:my-8 relative">
        <div className="relative rounded-panel overflow-hidden bg-navy min-h-[520px] md:min-h-[640px] flex flex-col justify-end p-6 sm:p-10 lg:p-14 border-4 border-lavender shadow-soft">
          {/* Looping Ambient Background Canvas / Video Simulation */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#003b54] to-navy opacity-95">
            {/* Animated particles / background grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38CCFF_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-sky/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-coral/20 blur-3xl" />
          </div>

          {/* Overlapping Blush Card (~55% width) sliding up over the video's bottom-left */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 w-full lg:w-[58%] bg-blush rounded-card p-6 sm:p-10 md:p-12 shadow-lift border-2 border-white/60 mb-8"
          >
            <div className="font-display font-black text-[54px] sm:text-[76px] md:text-[92px] lg:text-[108px] leading-[0.92] text-coral select-none">
              we are
              <br />
              hedgerow.
            </div>

            <p className="font-display font-bold text-[18px] sm:text-[22px] md:text-[24px] text-pink mt-4 sm:mt-6 leading-tight">
              the sweetest asymmetric alpha lab on robinhood chain.
            </p>

            <p className="font-sans font-bold text-[16px] sm:text-[18px] text-sky mt-3">
              we don’t do catering. we hunt overleveraged shorts.
            </p>
          </motion.div>

          {/* Below, offset right: small pink lead-in + 3-line brush script headline in sky */}
          <div className="relative z-10 self-end text-right max-w-xl pr-2 sm:pr-4">
            <span className="font-sans font-bold text-pink text-sm sm:text-base block mb-2 lowercase tracking-wide">
              to put it simply,
            </span>
            <ScriptHeading
              lines={["WE BAKE", "SWEET REVENGE", "FOR RETAIL"]}
              color="sky"
              size="large"
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3.3 SERVICES / VAULTS (bg `--sky`, full-bleed panel)      */}
      {/* ========================================================= */}
      <InsetSection id="vaults" bg="sky" className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left sticky column */}
          <div className="lg:col-span-5 lg:sticky lg:top-12 h-fit">
            <ScriptHeading
              lines={["WE ARE BAKERS", "AND THIS IS", "OUR RECIPE."]}
              color="navy"
              size="normal"
              className="mb-6"
            />

            <p className="font-sans font-bold text-[18px] sm:text-[20px] text-white leading-relaxed mb-4">
              traditional hedge funds charge 2-and-20 to front-run retail order flow. we bake permissionless, mathematically-sound asymmetric gamma ladders directly into robinhood chain.
            </p>

            <p className="font-sans font-normal text-[15px] sm:text-[16px] text-navy/90 leading-relaxed mb-6">
              leveraging arbitrum orbit L2 speed, tokenized equities (RWAs), and autonomous AI sentinels that hunt after-hours borrow spikes when traditional exchanges are locked tight.
            </p>

            <div className="p-4 bg-white/30 rounded-card backdrop-blur-sm border border-white/40">
              <span className="text-xs font-mono font-bold text-navy uppercase block mb-1">
                The Outlaw Guarantee
              </span>
              <p className="font-sans italic text-sm text-navy leading-snug">
                no dark pools. no payment for order flow. just fresh croissants and pure retail vengeance. 🥐✨
              </p>
            </div>
          </div>

          {/* Right: 2-Column Grid of Service Cards (--lavender, 12px radius) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <ServiceCard
              badge="Vault #01"
              title="midnight ambush vaults"
              description="captures off-hours short borrow spikes while tradfi equity markets sleep on weekends and overnight sessions."
              onClick={handleOpenApp}
            />
            <ServiceCard
              badge="Vault #02"
              title="asymmetric gamma pies"
              description="automated synthetic call ladders for tokenized equities on robinhood chain with zero theta decay and concentrated liquidity."
              onClick={handleOpenApp}
            />
            <ServiceCard
              badge="Autonomous"
              title="friar ai sentinels"
              description="on-chain AI micro-agents scanning SEC 13F filings, borrow rates, and dark order book imbalances in real-time."
              onClick={handleOpenApp}
            />
            <ServiceCard
              badge="Yield Engine"
              title="reverse-pfof sprinkles"
              description="extracts MEV from institutional market makers and batches orders, dropping 100% of the arb profits back to stakers."
              onClick={handleOpenApp}
            />
            <ServiceCard
              badge="RWA Vault"
              title="tokenized equity baskets"
              description="24/7 compounded yield vaults holding tokenized US stocks, treasuries, and native ETH simultaneously."
              onClick={handleOpenApp}
            />
            <ServiceCard
              isOutline
              badge="All Strategies"
              title="overview of all vaults"
              description="explore the open-source contracts, audited by the Greenwood Guild on Robinhood Chain testnet & mainnet."
              onClick={handleOpenApp}
            />
          </div>
        </div>
      </InsetSection>

      {/* ========================================================= */}
      {/* 3.4 FEATURED WORK / CASE STUDIES (white `--surface` panel) */}
      {/* ========================================================= */}
      <InsetSection id="strategies" bg="surface">
        <div className="mb-8">
          <span className="font-sans font-bold text-pink text-sm uppercase tracking-wider block mb-2">
            live ambush epochs
          </span>
          <ScriptHeading lines={["FRESH OUT", "THE OVEN"]} color="coral" size="normal" />
        </div>

        {/* Zig-zag case-study list */}
        <div className="divide-y divide-lavender">
          {caseStudies.map((item, idx) => (
            <CaseStudy
              key={idx}
              item={item}
              align={idx % 2 === 0 ? "left" : "right"}
              onInteract={handleOpenApp}
            />
          ))}
        </div>

        {/* Centered coral CTA ("that’s just a taste ›") */}
        <div className="mt-12 text-center">
          <Button
            variant="coral"
            onClick={handleOpenApp}
            className="w-full sm:w-[380px] py-4 text-xl"
          >
            that’s just a taste ›
          </Button>
        </div>
      </InsetSection>

      {/* ========================================================= */}
      {/* 3.5 INDUSTRIES / MARKETS WE LOVE WORKING WITH             */}
      {/* ========================================================= */}
      <InsetSection bg="surface">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="font-sans font-bold text-pink text-sm uppercase tracking-wider block mb-2">
            asymmetric hunting grounds
          </span>
          <ScriptHeading
            lines={["MARKETS WE LOVE", "AMBUSHING"]}
            color="navy"
            size="normal"
            className="text-center"
          />
        </div>

        {/* 2-Column Grid of Pill Tiles (--lavender, 8px radius, 75px tall) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {[
            { label: "tokenized tech equities (RWA)", count: "8 pools" },
            { label: "weekend crypto-tradfi arbitrage", count: "128 hrs/wk" },
            { label: "high short-interest meme assets", count: "142% apr" },
            { label: "after-hours earnings announcements", count: "4:00 PM EST" },
            { label: "overnight treasury yield curve", count: "US-TBill" },
            { label: "autonomous AI agent order flows", count: "EVM-Native" },
          ].map((item, idx) => (
            <IndustryTile
              key={idx}
              label={item.label}
              count={item.count}
              onClick={handleOpenApp}
            />
          ))}
        </div>
      </InsetSection>

      {/* ========================================================= */}
      {/* 3.6 BLOG / JOURNAL ("THE GREENWOOD GAZETTE")             */}
      {/* ========================================================= */}
      <InsetSection id="gazette" bg="surface">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="font-sans font-bold text-pink text-sm uppercase tracking-wider block mb-2">
              dispatches from sherwood
            </span>
            <ScriptHeading
              lines={["THE GREENWOOD", "GAZETTE"]}
              color="coral"
              size="normal"
            />
          </div>
          <p className="font-sans text-charcoal/70 max-w-md text-sm sm:text-base mt-4 md:mt-0">
            research papers, gamma mechanics, and after-hours field logs published directly by our on-chain outlaws.
          </p>
        </div>

        {/* 4-Column Card Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {blogPosts.map((post, idx) => (
            <BlogCard key={idx} post={post} onClick={handleOpenApp} />
          ))}
        </div>

        {/* Centered sky CTA ("we got more ›") */}
        <div className="text-center">
          <Button
            variant="sky"
            onClick={handleOpenApp}
            className="w-full sm:w-[280px] py-3.5 text-lg"
          >
            we got more ›
          </Button>
        </div>
      </InsetSection>

      {/* ========================================================= */}
      {/* 3.7 FOOTER (bg `--coral`, full inset panel)               */}
      {/* ========================================================= */}
      <InsetSection id="footer" bg="coral" className="relative text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pb-12 border-b border-white/20">
          {/* Left Column: Big tilted sticker illustration + CTA */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Sticker Illustration */}
              <div className="inline-block p-4 bg-white rounded-card shadow-lift transform -rotate-3 hover:rotate-0 transition-transform mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-tile overflow-hidden shadow-soft border-2 border-lavender bg-navy flex-shrink-0">
                    <img
                      src="/hedgerow-3d-cad-icon.jpg"
                      alt="Hedgerow 3D CAD Icon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-display font-black text-2xl text-navy block leading-none">
                      HEDGEROW
                    </span>
                    <span className="text-[11px] font-mono font-bold text-coral uppercase tracking-wider">
                      OG Badge #0001 · Robinhood L2
                    </span>
                  </div>
                </div>
              </div>

              <div className="font-display font-bold text-2xl sm:text-3xl text-white mb-2 leading-tight">
                ready to rob the shorts and give to the stakers?
              </div>
              <p className="text-white/80 text-sm mb-6 max-w-sm">
                join the greenwood syndicate. deploy liquidity on robinhood chain before mainnet public gates shut.
              </p>

              <div className="mb-6">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-butter block mb-1">
                  Direct Dispatch
                </span>
                <a
                  href="mailto:outlaws@hedgerow.fi"
                  className="font-display font-bold text-2xl text-white hover:text-butter transition-colors underline decoration-2 underline-offset-4"
                >
                  outlaws@hedgerow.fi
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {/* Navy CTA ("start an ambush ›") */}
              <Button
                variant="navy"
                fullWidth
                onClick={handleOpenApp}
                className="py-4 text-xl"
              >
                start an ambush ›
              </Button>

              <SocialIcons color="white" />
            </div>
          </div>

          {/* Middle/Right: Nav lists */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Column 1: Big Nav */}
            <div>
              <span className="text-xs font-mono font-bold text-butter uppercase tracking-wider block mb-4">
                Directory
              </span>
              <ul className="space-y-3 font-display font-extrabold text-[22px] sm:text-[24px]">
                {["vaults", "about us", "mechanics", "governance", "contact"].map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={`#${item.replace(/\s+/g, "-")}`}
                      className="hover:text-butter transition-colors lowercase"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Vaults & Services */}
            <div>
              <h4 className="font-display font-extrabold text-[26px] text-white pb-2 mb-4 border-b-4 border-white inline-block">
                Vaults
              </h4>
              <ul className="space-y-2.5 font-sans font-normal text-sm sm:text-base text-white/90">
                <li>
                  <button onClick={handleOpenApp} className="hover:text-butter transition-colors text-left">
                    $GME Sunday Squeeze
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenApp} className="hover:text-butter transition-colors text-left">
                    $NVDA Dark Hours
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenApp} className="hover:text-butter transition-colors text-left">
                    $TSLA Gamma Ladder
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenApp} className="hover:text-butter transition-colors text-left">
                    $WEALD Genesis Staking
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenApp} className="hover:text-butter transition-colors text-left">
                    Reverse-PFOF Recycler
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: More Stuff */}
            <div>
              <h4 className="font-display font-extrabold text-[26px] text-white pb-2 mb-4 border-b-4 border-white inline-block">
                more stuff
              </h4>
              <ul className="space-y-2.5 font-sans font-normal text-sm sm:text-base text-white/90">
                <li>
                  <a
                    href="https://robinhoodchain.blockscout.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-butter transition-colors inline-flex items-center gap-1"
                  >
                    Blockscout Explorer <span className="text-sky">↗</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://arbitrum.io"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-butter transition-colors inline-flex items-center gap-1"
                  >
                    Arbitrum Orbit Docs <span className="text-sky">↗</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-butter transition-colors inline-flex items-center gap-1"
                  >
                    Audits &amp; Contracts <span className="text-sky">↗</span>
                  </a>
                </li>
                <li>
                  <button onClick={handleOpenApp} className="hover:text-butter transition-colors text-left">
                    OG Badge Verification
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenApp} className="hover:text-butter transition-colors text-left">
                    Brand Assets &amp; Stickers
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <p className="italic text-white/90 text-center sm:text-left">
            © 2026 hedgerow — baked with love and righteous spite on robinhood chain (chain id: 4663)
          </p>
          <BackToTop />
        </div>
      </InsetSection>
    </div>
  );
}
