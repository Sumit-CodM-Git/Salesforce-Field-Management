"use client";

import AuditFooterCard from "./AuditFooterCard";
import type { AuditInfoCard } from "./types";

interface AuditFooterInfoProps {
  cards: AuditInfoCard[];
  onExport: (kind: "Compliance Report" | "Log Data") => void;
}

export default function AuditFooterInfo({
  cards,
  onExport,
}: AuditFooterInfoProps) {
  return (
    <div className="flex w-full flex-col gap-4 font-sans md:flex-row">
      {cards.map((c) => (
        <AuditFooterCard
          key={c.id}
          title={c.title}
          label={c.label}
          value={c.value}
        />
      ))}

      {/* Action buttons column */}
      <div className="flex w-full flex-col justify-center gap-3 rounded-lg border border-slate-700/50 bg-[#1c1e26] p-4 md:w-[260px] md:shrink-0">
        <button
          onClick={() => onExport("Compliance Report")}
          className="w-full cursor-pointer rounded-md bg-[#4b7bec] px-3 py-2 text-center text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#3867d6]"
        >
          Compliance Report (CSV/PDF)
        </button>
        <button
          onClick={() => onExport("Log Data")}
          className="w-full cursor-pointer rounded-md bg-[#4b7bec] px-3 py-2 text-center text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#3867d6]"
        >
          Export Log Data
        </button>
      </div>
    </div>
  );
}