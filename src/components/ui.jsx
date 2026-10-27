// SUDS Quito · componentes básicos de interfaz · © 2026 Paulina Lima.
import React from "react";
import { AlertTriangle, Info } from "lucide-react";

export const inputCls =
  "w-full rounded-xl border border-[#1F2A24]/15 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2F6F5E]";

export function Section({ number, title, children, id }) {
  return (
    <section className="mb-8" id={id}>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-display text-xs text-[#2F6F5E] font-semibold">{number}</span>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <div className="h-px flex-1 bg-[#1F2A24]/10" />
      </div>
      {children}
    </section>
  );
}

export function ScenarioCard({ active, onClick, label, desc, value }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left rounded-2xl border p-4 transition-colors ${
        active ? "border-[#2F6F5E] bg-white shadow-sm" : "border-[#1F2A24]/10 bg-white/60 hover:border-[#2F6F5E]/40"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-sm">{label}</span>
        <span className="font-display text-xl font-semibold text-[#2F6F5E] shrink-0">{value}</span>
      </div>
      <p className="text-xs text-[#1F2A24]/55 mt-1">{desc}</p>
    </button>
  );
}

export function StatBlock({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-white border border-[#1F2A24]/10 p-4">
      <div className="text-xs text-[#1F2A24]/50 mb-1">{label}</div>
      <div className="font-display text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-[#1F2A24]/45 mt-0.5">{sub}</div>}
    </div>
  );
}

export function NumberField({ label, value, onChange, step = "0.1", min = "0", placeholder, hint, id }) {
  const fieldId = id || `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={fieldId} className="text-xs font-medium text-[#1F2A24]/60 mb-1.5 block">
        {label}
      </label>
      <input
        id={fieldId}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
      {hint && <p className="text-xs text-[#1F2A24]/45 mt-1">{hint}</p>}
    </div>
  );
}

const TONES = {
  warn: { box: "border-amber-300/50 bg-amber-50 text-amber-900", Icon: AlertTriangle },
  info: { box: "border-[#2F6F5E]/20 bg-[#2F6F5E]/[0.06] text-[#1F2A24]/80", Icon: Info },
  bad: { box: "border-red-300/60 bg-red-50 text-red-900", Icon: AlertTriangle },
};

export function Notice({ tone = "warn", children, className = "" }) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl border p-4 flex gap-2.5 text-xs leading-relaxed ${t.box} ${className}`}>
      <t.Icon size={15} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function Toggle({ options, value, onChange, small }) {
  return (
    <div className="inline-flex rounded-full border border-[#1F2A24]/15 bg-white p-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`${small ? "px-3 py-1" : "px-4 py-1.5"} rounded-full text-xs font-medium transition-colors ${
            value === o.id ? "bg-[#1F2A24] text-[#F6F4EE]" : "text-[#1F2A24]/60 hover:text-[#1F2A24]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
