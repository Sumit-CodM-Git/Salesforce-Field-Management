"use client";

import { useEffect, useMemo, useState } from "react";
import AuditHeadSection from "./AuditHeadSection";
import { useToast } from "@/app/Components/Toast/useToast";
import type { AuditInfoCard, AuditLog } from "./types";
import { useApiResource } from "@/app/lib/api/useApiResource";
import { api } from "@/app/lib/api/client";
import { SourceNotice } from "@/app/Components/Governance/GovernancePages";
import { useRealtime } from "@/app/lib/ws/RealtimeProvider";

/* ---- Mock data — swap with API later ---- */
const AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    timestamp: "08:32:27, 14:35",
    workflowId: "7129008388",
    actor: "Developer 3",
    actionType: "Tool Call:\nsalesforce_deprecate_field",
    detailsText:
      '{\n "resource": "1",\n "custom_field_s",\n "resource": "1"\n}',
    riskTier: "Tier 3 (HITL)",
    hmacStatus: "Verified",
  },
  {
    id: 2,
    timestamp: "08:32:27, 14:39",
    workflowId: "7139003893",
    actor: "Developer 3",
    actionType: "Policy Evaluated:\nTier 3 action",
    riskTier: "Tier 3 (HITL)",
    hmacStatus: "Verified",
  },
  {
    id: 3,
    timestamp: "08:32:27, 14:58",
    workflowId: "7129503886",
    actor: "Developer 3",
    actionType: "HITL Approval:\nApproved remediation",
    riskTier: "Tier 1 (Auto)",
    hmacStatus: "Unverified",
  },
  {
    id: 4,
    timestamp: "08:32:27, 14:38",
    workflowId: "7129803835",
    actor: "Developer 3",
    actionType: "Tool Call:\nsalesforce_delete_field",
    riskTier: "Tier 3 (HITL)",
    hmacStatus: "Verified",
  },
  {
    id: 5,
    timestamp: "08:32:27, 14:19",
    workflowId: "7139003293",
    actor: "Developer 3",
    actionType:
      "Tool Call: salesforce_delete_field\nreferences from <IMAGE 1>, and <IMAGE 0>",
    detailsText: '{\n "resource": "1...\n}',
    riskTier: "Tier 3 (HITL)",
    hmacStatus: "Verified",
    isAlert: true,
  },
];

const INFO_CARDS: AuditInfoCard[] = [
  {
    id: "verified",
    title: "Latest Verified Events",
    label: "Agent Status:",
    value: "P3 - HMAC validation in knowledge_runtime …",
  },
  {
    id: "deviations",
    title: "Critical Policy Deviations",
    label: "Agent Status:",
    value: "P3 - HMAC validation in knowledge_runtime …",
  },
];

export default function AuditLogPage() {
  const source = useApiResource<AuditLog[]>("/audit/events", AUDIT_LOGS);
  const { reload } = source;
  const { subscribe } = useRealtime();
  const logs = source.data;
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const toast = useToast();

  useEffect(
    () => subscribe((event) => {
      if (event.type === "audit.event.created") reload();
    }),
    [reload, subscribe],
  );

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = logs.filter((l) => {
      const matchesSearch =
        !q ||
        l.actor.toLowerCase().includes(q) ||
        l.actionType.toLowerCase().includes(q) ||
        l.workflowId.toLowerCase().includes(q);
      const matchesAgent =
        !agentFilter || l.actor.toLowerCase() === agentFilter.toLowerCase();
      return matchesSearch && matchesAgent;
    });
    return sortAsc ? rows : [...rows].reverse();
  }, [logs, search, agentFilter, sortAsc]);

  const handleViewDetails = (log: AuditLog) => {
    toast.info(`Workflow ${log.workflowId}`, "Details");
  };

  const handleExport = async (kind: "Compliance Report" | "Log Data") => {
    try {
      await api("/audit/exports", {
        method: "POST",
        body: JSON.stringify({
          kind,
          search,
          agent: agentFilter,
          dateRange,
        }),
      });
      toast.success(`Export request submitted: ${kind}`, "Audit export");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to export audit data.", "Export failed");
    }
  };

  return (
    <div className="space-y-2">
      <h1 className="p-1 text-xl font-bold sm:text-2xl">Audit Log</h1>

      <div className="rounded-lg border border-slate-700 bg-slate-900">
        <SourceNotice loading={source.loading} error={source.error} reload={source.reload} />
        <AuditHeadSection
          search={search}
          onSearchChange={setSearch}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          agentFilter={agentFilter}
          onAgentFilterChange={setAgentFilter}
          logs={filteredLogs}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc((v) => !v)}
          onViewDetails={handleViewDetails}
          infoCards={INFO_CARDS}
          onExport={(kind) => void handleExport(kind)}
        />
      </div>
    </div>
  );
}
