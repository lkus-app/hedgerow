"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CadIcon } from "./CadIcon";
import { BasketPanel } from "./BasketPanel";
import {
  basketVaultAddress,
  explorerAddressUrl,
  projectLinks,
  targetChain,
  vaultAddresses,
  wealdExplorerUrl,
  wealdTokenAddress,
  type VaultId,
} from "@/lib/chain";
import {
  articles,
  pages,
  strategies,
  CONCEPT_REALITY,
  VAULT_REALITY,
  type PageId,
  type StrategyId,
} from "@/lib/strategies";

export type Detail =
  | { kind: "strategy"; id: StrategyId }
  | { kind: "article"; index: number }
  | { kind: "page"; id: PageId };

interface DetailModalProps {
  detail: Detail | null;
  onClose: () => void;
  onNavigate: (detail: Detail) => void;
  onStake: (vault: VaultId) => void;
}

const viewTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const };

export const DetailModal: React.FC<DetailModalProps> = ({ detail, onClose, onNavigate, onStake }) => {
  const isOpen = detail !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const key = detail ? `${detail.kind}-${detail.kind === "article" ? detail.index : detail.id}` : "none";

  return (
    <AnimatePresence>
      {detail && (
        <motion.div
          key="detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
        >
          <div onClick={onClose} className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
            className="relative z-10 w-full max-w-[600px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-panel shadow-lift border-2 border-lavender text-navy"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-lavender hover:bg-pink/40 text-navy font-bold flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={viewTransition}
                className="p-6 sm:p-8"
              >
                {detail.kind === "strategy" ? (
                  <StrategyView id={detail.id} onNavigate={onNavigate} onStake={onStake} />
                ) : detail.kind === "page" ? (
                  <PageView id={detail.id} onNavigate={onNavigate} />
                ) : (
                  <ArticleView index={detail.index} onNavigate={onNavigate} />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block text-xs font-mono font-bold text-charcoal/60 uppercase tracking-wider mb-3">{children}</span>
);

const StrategyView: React.FC<{
  id: StrategyId;
  onNavigate: DetailModalProps["onNavigate"];
  onStake: DetailModalProps["onStake"];
}> = ({ id, onNavigate, onStake }) => {
  const s = strategies[id];
  const isOverview = id === "overview";
  const liveVaults = (["GME", "TSLA", "NVDA", "WEALD"] as VaultId[]).map((v) => ({
    vault: v,
    strategy: Object.values(strategies).find((x) => x.vault === v)!,
  }));

  return (
    <>
      <div className="flex items-start gap-4 pr-10">
        <CadIcon name={s.cadIcon} size="lg" blueprintBg className="shrink-0" />
        <div>
          <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider bg-sky/20 text-navy px-2 py-0.5 rounded-tag mb-1.5">
            {s.badge}
          </span>
          <h3 id="detail-title" className="font-display font-black text-2xl leading-tight">
            {s.title}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-[15px] text-charcoal/85 leading-relaxed">{s.tagline}</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {s.params.map((p) => (
          <div key={p.label} className="bg-lavender/70 rounded-card px-3 py-2.5">
            <span className="block text-[10px] font-mono font-bold uppercase text-charcoal/60">{p.label}</span>
            <span className="block text-[13px] font-bold leading-snug mt-0.5">{p.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <SectionLabel>{isOverview ? "the contracts" : "how it works"}</SectionLabel>
        <ol className="space-y-3">
          {s.mechanism.map((m, i) => (
            <li key={m.title} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div>
                <span className="block font-bold text-[15px]">{m.title}</span>
                <span className="block text-sm text-charcoal/80 leading-relaxed">{m.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {isOverview && (
        <div className="mt-6">
          <SectionLabel>vaults on {targetChain.name}</SectionLabel>
          <div className="grid gap-2">
            {liveVaults.map(({ vault, strategy }) => (
              <div key={vault} className="flex items-center gap-3 border border-lavender rounded-card p-3">
                <CadIcon name={strategy.cadIcon} size="sm" blueprintBg />
                <button
                  onClick={() => onNavigate({ kind: "strategy", id: strategy.id })}
                  className="flex-1 text-left font-bold text-sm hover:text-coral transition-colors"
                >
                  {strategy.title} <span className="font-mono text-xs text-charcoal/60">· ${vault}</span>
                </button>
                <span className={`text-[11px] font-mono font-bold ${vaultAddresses[vault] ? "text-emerald-600" : "text-charcoal/50"}`}>
                  {vaultAddresses[vault] ? "deployed" : "not deployed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {s.basket ? (
        basketVaultAddress ? (
          <BasketPanel />
        ) : (
          <div className="mt-6 rounded-card p-4 text-sm leading-relaxed bg-butter/30">
            <span className="block font-bold mb-1">Status: built, not deployed on {targetChain.name}</span>
            <span className="text-charcoal/85">
              The BasketVault contract is written and tested, but no basket has been deployed on this network yet, so
              there is nothing to deposit into here.
            </span>
          </div>
        )
      ) : (
        !isOverview && (
          <div className={`mt-6 rounded-card p-4 text-sm leading-relaxed ${s.vault ? "bg-sky/15" : "bg-butter/30"}`}>
            <span className="block font-bold mb-1">
              {s.vault ? "What the contract does today" : "Status: not deployed"}
            </span>
            <span className="text-charcoal/85">{s.vault ? VAULT_REALITY : CONCEPT_REALITY}</span>
          </div>
        )
      )}

      <div className="mt-6">
        <SectionLabel>risks</SectionLabel>
        <ul className="space-y-1.5 text-sm text-charcoal/85">
          {s.risks.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-coral font-bold">!</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {s.related && !isOverview && (
        <div className="mt-6 flex flex-wrap gap-2">
          {s.related.map((r) => (
            <button
              key={r}
              onClick={() => onNavigate({ kind: "strategy", id: r })}
              className="text-xs font-bold bg-lavender hover:bg-pink/40 px-3 py-1.5 rounded-tag transition-colors"
            >
              {strategies[r].title} ›
            </button>
          ))}
        </div>
      )}

      {s.vault && (
        <button
          onClick={() => onStake(s.vault!)}
          className="mt-7 w-full bg-coral hover:brightness-95 text-white font-sans font-bold text-lg py-3.5 rounded-full shadow-soft transition-all lowercase"
        >
          stake into the ${s.vault} vault ›
        </button>
      )}
    </>
  );
};

const ArticleView: React.FC<{ index: number; onNavigate: DetailModalProps["onNavigate"] }> = ({ index, onNavigate }) => {
  const a = articles[index];
  return (
    <article>
      <div className="flex items-center gap-3 pr-10 mb-4">
        <CadIcon name={a.cadIcon} size="md" blueprintBg />
        <span className="text-xs font-mono font-bold text-coral uppercase tracking-wider">
          {a.category} · {a.readTime}
        </span>
      </div>
      <h3 id="detail-title" className="font-display font-black text-2xl leading-tight">
        {a.title}
      </h3>
      <span className="block mt-2 text-sm text-charcoal/60">by {a.author}</span>
      <div className="mt-5 space-y-4 text-[15px] text-charcoal/85 leading-relaxed">
        {a.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="mt-7 flex flex-wrap gap-2">
        {a.related && (
          <button
            onClick={() => onNavigate({ kind: "strategy", id: a.related! })}
            className="text-sm font-bold bg-sky/20 hover:bg-sky/35 px-4 py-2 rounded-tag transition-colors"
          >
            related: {strategies[a.related].title} ›
          </button>
        )}
        {articles.length > 1 && (
          <button
            onClick={() => onNavigate({ kind: "article", index: (index + 1) % articles.length })}
            className="text-sm font-bold bg-lavender hover:bg-pink/40 px-4 py-2 rounded-tag transition-colors"
          >
            next dispatch ›
          </button>
        )}
      </div>
    </article>
  );
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const AddressRow: React.FC<{ label: string; address?: string; mainnet?: boolean }> = ({ label, address, mainnet }) => {
  const url = address ? (mainnet ? wealdExplorerUrl(address) : explorerAddressUrl(address)) : undefined;
  return (
    <div className="flex items-center justify-between gap-3 border border-lavender rounded-card px-3 py-2.5 text-sm">
      <span className="font-bold">{label}</span>
      {address ? (
        url ? (
          <a href={url} target="_blank" rel="noreferrer" className="font-mono text-xs underline decoration-2 underline-offset-2 hover:text-coral">
            {short(address)} ↗
          </a>
        ) : (
          <span className="font-mono text-xs" title={address}>
            {short(address)}
          </span>
        )
      ) : (
        <span className="font-mono text-xs text-charcoal/50">not deployed</span>
      )}
    </div>
  );
};

const PageView: React.FC<{ id: PageId; onNavigate: DetailModalProps["onNavigate"] }> = ({ id, onNavigate }) => {
  const p = pages[id];
  const links = [
    { label: "X", href: projectLinks.x },
    { label: "Website ↗", href: projectLinks.website },
  ];
  return (
    <>
      <div className="flex items-start gap-4 pr-10">
        <CadIcon name={p.cadIcon} size="lg" blueprintBg className="shrink-0" />
        <div>
          <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider bg-sky/20 text-navy px-2 py-0.5 rounded-tag mb-1.5">
            {p.badge}
          </span>
          <h3 id="detail-title" className="font-display font-black text-2xl leading-tight">
            {p.title}
          </h3>
        </div>
      </div>
      <p className="mt-4 text-[15px] text-charcoal/85 leading-relaxed">{p.intro}</p>

      <div className="mt-6 space-y-5">
        {p.sections.map((sec) => (
          <div key={sec.title}>
            <span className="block font-bold text-[15px] mb-1">{sec.title}</span>
            <span className="block text-sm text-charcoal/80 leading-relaxed">{sec.body}</span>
            {sec.code && (
              <code className="mt-2 inline-block font-mono text-xs bg-lavender rounded-tag px-2.5 py-1.5">{sec.code}</code>
            )}
          </div>
        ))}
      </div>

      {(id === "contact" || id === "governance") && (
        <div className="mt-6">
          <SectionLabel>contracts on {targetChain.name}</SectionLabel>
          <div className="grid gap-2">
            <AddressRow label="$WEALD token (CA)" address={wealdTokenAddress} mainnet />
            {(Object.keys(vaultAddresses) as VaultId[]).map((v) => (
              <AddressRow key={v} label={`${v} vault`} address={vaultAddresses[v]} />
            ))}
          </div>
        </div>
      )}

      {id === "contact" && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {links.map((l) =>
            l.href ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-center font-bold bg-coral text-white rounded-tile py-3 hover:brightness-95 transition-all"
              >
                {l.label}
              </a>
            ) : (
              <span key={l.label} className="text-center font-bold bg-lavender text-charcoal/50 rounded-tile py-3" title="Not configured yet">
                {l.label}
              </span>
            )
          )}
        </div>
      )}

      {id === "about" && (
        <button
          onClick={() => onNavigate({ kind: "strategy", id: "overview" })}
          className="mt-6 text-sm font-bold bg-sky/20 hover:bg-sky/35 px-4 py-2 rounded-tag transition-colors"
        >
          see all vaults ›
        </button>
      )}
      {id === "mechanics" && (
        <button
          onClick={() => onNavigate({ kind: "page", id: "governance" })}
          className="mt-6 text-sm font-bold bg-sky/20 hover:bg-sky/35 px-4 py-2 rounded-tag transition-colors"
        >
          who controls the vaults ›
        </button>
      )}
    </>
  );
};
