"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Check,
  CircleAlert,
  Clock3,
  DollarSign,
  GitPullRequest,
  Loader2, // ← add
  Pause,
  Play,
  Plus, // ← add
  Search, // ← add
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "@/app/lib/api/client";
import { useApiResource } from "@/app/lib/api/useApiResource";
import { useRealtime } from "@/app/lib/ws/RealtimeProvider";
import { useToast } from "@/app/Components/Toast/useToast";

type AgentStatus = "ACTIVE" | "IDLE" | "HALTED";
type Agent = {
  id: string;
  name: string;
  skill: string;
  status: AgentStatus;
  tier: number;
  guardian: string;
  activity: string;
  cost: string;
  model: string;
};

const AGENTS: Agent[] = [
  {
    id: "agent-01",
    name: "Field Cleanup Agent",
    skill: "Salesforce governance",
    status: "ACTIVE",
    tier: 3,
    guardian: "Sumit Haldar",
    activity: "Analyzed Account fields · 2 min ago",
    cost: "$18.42",
    model: "Claude 3.5 Sonnet",
  },
  {
    id: "agent-02",
    name: "Metadata Scout",
    skill: "Schema discovery",
    status: "ACTIVE",
    tier: 2,
    guardian: "Maya Chen",
    activity: "Completed Contact scan · 8 min ago",
    cost: "$12.08",
    model: "GPT-4o",
  },
  {
    id: "agent-03",
    name: "Policy Sentinel",
    skill: "Policy evaluation",
    status: "IDLE",
    tier: 1,
    guardian: "Ravi Shah",
    activity: "Policy check passed · 21 min ago",
    cost: "$4.76",
    model: "Claude 3.5 Sonnet",
  },
  {
    id: "agent-04",
    name: "Knowledge Curator",
    skill: "Knowledge sync",
    status: "HALTED",
    tier: 2,
    guardian: "Jordan Lee",
    activity: "Paused by guardian · 1 hr ago",
    cost: "$9.31",
    model: "Gemini 1.5 Pro",
  },
];

const approvalRows = [
  {
    id: "APR-2048",
    agent: "Field Cleanup Agent",
    action: "Delete 2 unused Account fields",
    tier: "Tier 3",
    age: "4 min",
    risk: "High",
  },
  {
    id: "APR-2047",
    agent: "Metadata Scout",
    action: "Publish schema change proposal",
    tier: "Tier 2",
    age: "18 min",
    risk: "Medium",
  },
  {
    id: "APR-2046",
    agent: "Knowledge Curator",
    action: "Update shared knowledge index",
    tier: "Tier 2",
    age: "32 min",
    risk: "Medium",
  },
];

const auditEvents = [
  {
    time: "09:42:18",
    title: "Approval requested",
    detail: "Field Cleanup Agent · Delete Account fields",
    color: "bg-amber-400",
  },
  {
    time: "09:38:05",
    title: "Policy evaluation passed",
    detail: "Metadata Scout · Tier 2 / PII checks clear",
    color: "bg-emerald-400",
  },
  {
    time: "09:31:42",
    title: "Agent halted",
    detail: "Knowledge Curator · Guardian Jordan Lee",
    color: "bg-red-400",
  },
];

export function SourceNotice({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error: string | null;
  reload: () => void;
}) {
  if (loading) {
    return (
      <div
        role="status"
        className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-200"
      >
        Connecting to the control plane…
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200"
      >
        <span>
          Live data unavailable ({error}). Showing sample data for preview.
        </span>
        <button
          type="button"
          onClick={reload}
          className="rounded-md border border-amber-400/30 px-2.5 py-1.5 font-semibold hover:bg-amber-400/10"
        >
          Retry
        </button>
      </div>
    );
  }
  return null;
}

function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80">
      <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
  change,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  change: string;
  icon: typeof Bot;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
    red: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`rounded-lg p-2 ring-1 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
        {change}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: AgentStatus }) {
  const tone =
    status === "ACTIVE"
      ? "bg-emerald-400/10 text-emerald-300"
      : status === "HALTED"
        ? "bg-rose-400/10 text-rose-300"
        : "bg-slate-700/70 text-slate-300";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "ACTIVE" ? "bg-emerald-400" : status === "HALTED" ? "bg-rose-400" : "bg-slate-400"}`}
      />
      {status}
    </span>
  );
}

function AgentTable({
  rows,
  onSelect,
}: {
  rows: Agent[];
  onSelect?: (agent: Agent) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            {["Agent", "Status", "Tier", "Guardian", "Last activity"].map(
              (label) => (
                <th key={label} className="pb-3 pr-4 font-medium">
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((agent) => (
            <tr key={agent.id} className="group">
              <td className="py-3 pr-4">
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(agent)}
                    className="text-left font-medium text-slate-100 hover:text-blue-300"
                  >
                    {agent.name}
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {agent.skill}
                    </span>
                  </button>
                ) : (
                  <>
                    <span className="font-medium text-slate-100">
                      {agent.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {agent.skill}
                    </span>
                  </>
                )}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={agent.status} />
              </td>
              <td className="py-3 pr-4 text-slate-300">Tier {agent.tier}</td>
              <td className="py-3 pr-4 text-slate-300">{agent.guardian}</td>
              <td className="py-3 text-xs text-slate-400">{agent.activity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OverviewPage() {
  const { last, status, subscribe } = useRealtime();
  const source = useApiResource("/dashboard/summary", {
    agents: AGENTS,
    approvals: approvalRows,
    spend: "$1,284.56",
    driftAlerts: 2,
    events: auditEvents,
  });
  const { reload } = source;
  const data = source.data;
  useEffect(
    () =>
      subscribe((event) => {
        if (
          [
            "agent.status_changed",
            "approval.created",
            "approval.updated",
            "audit.event.created",
            "cost.updated",
            "drift.alert",
          ].includes(event.type)
        ) {
          reload();
        }
      }),
    [reload, subscribe],
  );
  const lastEvent = last
    ? `${last.type} event received`
    : "Awaiting control-plane events";
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeading
        eyebrow="Human & governance layer"
        title="Guardian overview"
        description="A clear view of agent health, pending decisions, spend, and governance signals across your control plane."
      >
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">
          <span
            className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-emerald-400" : "bg-amber-400"}`}
          />
          Realtime {status}
        </div>
      </PageHeading>
      <SourceNotice
        loading={source.loading}
        error={source.error}
        reload={source.reload}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Agents online"
          value={`${data.agents.filter((agent) => agent.status === "ACTIVE").length} / ${data.agents.length}`}
          change="Based on current agent status"
          icon={Bot}
          tone="green"
        />
        <Metric
          label="Awaiting approval"
          value={String(data.approvals.length)}
          change={
            data.approvals[0]
              ? `Oldest request · ${data.approvals[0].age}`
              : "No pending approvals"
          }
          icon={Clock3}
          tone="amber"
        />
        <Metric
          label="Spend this month"
          value={data.spend}
          change="Month-to-date"
          icon={DollarSign}
        />
        <Metric
          label="Drift alerts"
          value={String(data.driftAlerts)}
          change="Review drift signals"
          icon={Activity}
          tone="red"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Panel
          title="Agent fleet"
          subtitle="Current status, owner, tier, and most recent activity"
          action={
            <span className="text-xs text-slate-500">
              {data.agents.length} registered
            </span>
          }
        >
          <AgentTable rows={data.agents} />
        </Panel>
        <Panel
          title="Approval queue"
          subtitle="Human decisions required before actions proceed"
          action={
            <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              {data.approvals.length} pending
            </span>
          }
        >
          <div className="space-y-4">
            {data.approvals.slice(0, 3).map((row) => (
              <div
                key={row.id}
                className="flex items-start gap-3 border-b border-slate-800 pb-4 last:border-0 last:pb-0"
              >
                <span className="mt-0.5 rounded-md bg-amber-400/10 p-2 text-amber-300">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {row.action}
                    </p>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {row.age}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.agent} · {row.tier} · {row.risk} risk
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Recent governance activity"
          subtitle="Latest audited changes and policy outcomes"
        >
          <ol className="space-y-4">
            {data.events.map((event) => (
              <li key={event.time} className="flex gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.color}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-medium text-slate-200">
                      {event.title}
                    </p>
                    <time className="shrink-0 text-xs text-slate-500">
                      {event.time}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{event.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel
          title="Realtime event stream"
          subtitle="Live updates from the control plane"
        >
          <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <Activity className="mt-0.5 h-4 w-4 text-blue-300" />
            <div>
              <p className="text-sm font-medium text-slate-200">{lastEvent}</p>
              <p className="mt-1 text-xs text-slate-500">
                {last
                  ? "Most recently received event"
                  : "Status updates and approval requests will appear here as they arrive."}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Events are informational; sensitive actions still require explicit
            human approval.
          </p>
        </Panel>
      </div>
    </div>
  );
}

export function AgentsPage() {
  const { subscribe } = useRealtime();
  const [selectedId, setSelectedId] = useState(AGENTS[0].id);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Search state
  const [search, setSearch] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Debounce typed value -> activeQuery (fires as user types)
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveQuery(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Swap endpoint when a query is active
  const source = useApiResource<Agent[] | Agent>(
    activeQuery ? `/agents/${encodeURIComponent(activeQuery)}` : "/agents/",
    AGENTS,
  );
  const { reload } = source;

  // Normalize single-object vs array response
  const agents = useMemo(() => {
    const raw = source.data as Agent[] | Agent | null | undefined;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }, [source.data]);

  const selected =
    agents.find((agent) => agent.id === selectedId) ?? agents[0] ?? null;

  const toast = useToast();

  useEffect(
    () =>
      subscribe((event) => {
        if (
          event.type === "agent.status_changed" ||
          event.type === "agent.updated"
        )
          reload();
      }),
    [reload, subscribe],
  );

  const runSearch = () => setActiveQuery(search.trim());

  const clearSearch = () => {
    setSearch("");
    setActiveQuery("");
  };

  const updateAgent = async (agent: Agent, action: "pause" | "resume") => {
    try {
      await api(`/agents/${encodeURIComponent(agent.id)}/${action}`, {
        method: "POST",
        body: JSON.stringify({ reason: `Guardian ${action} from dashboard` }),
      });
      toast.success(`${agent.name} ${action} requested`, "Agent control");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update agent status.",
        "Control-plane request failed",
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeading
        eyebrow="Agent governance"
        title="Agent overview"
        description="Review each agent's status, risk tier, assigned guardian, configuration, and recent activity."
      >
        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Register new Agent
        </button>
      </PageHeading>

      <SourceNotice
        loading={source.loading}
        error={source.error}
        reload={source.reload}
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.85fr]">
        <Panel
          title="Registered agents"
          subtitle="Select an agent to inspect its configuration and controls"
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runSearch();
                    if (event.key === "Escape") clearSearch();
                  }}
                  placeholder="Search by agent ID…"
                  aria-label="Search agent by ID"
                  className="w-52 rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-7 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={runSearch}
                disabled={!search.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
            </div>
          }
        >
          {agents.length === 0 ? (
            <EmptyState
              title={activeQuery ? "No agent found" : "No agents registered"}
              body={
                activeQuery
                  ? `No agent matches ID "${activeQuery}". Try a different ID or clear the search.`
                  : "Register a new agent to get started."
              }
            />
          ) : (
            <AgentTable
              rows={agents}
              onSelect={(agent) => setSelectedId(agent.id)}
            />
          )}
        </Panel>

        {selected ? (
          <Panel
            title="Agent detail"
            subtitle="Configuration and recent operational context"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">
                  {selected.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">{selected.id}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <Detail label="Agent ID" value={selected.agent_id} />
              <Detail label="Version" value={selected.version} />
              <Detail label="Owner" value={selected.owner} />
              <Detail label="Status" value={selected.status} />
              <Detail label="Primary model" value={selected.model_primary} />
              <Detail label="Fallback model" value={selected.model_fallback} />
              <Detail
                label="Created"
                value={
                  selected.created_at
                    ? new Date(selected.created_at).toLocaleString()
                    : "—"
                }
              />
              <Detail
                label="Updated"
                value={
                  selected.updated_at
                    ? new Date(selected.updated_at).toLocaleString()
                    : "—"
                }
              />
              <Detail label="Description" value={selected.description} />
            </dl>

            <div className="mt-5 flex gap-2 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() =>
                  void updateAgent(
                    selected,
                    selected.status === "HALTED" ? "resume" : "pause",
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                {selected.status === "HALTED" ? (
                  <Play className="h-3.5 w-3.5" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
                {selected.status === "HALTED"
                  ? "Request resume"
                  : "Pause agent"}
              </button>
              <span className="self-center text-[11px] text-slate-500">
                Action is recorded in the audit trail.
              </span>
            </div>
          </Panel>
        ) : (
          <Panel title="Agent detail" subtitle="No agent selected">
            <EmptyState
              title="Nothing to show"
              body="Search for an agent by ID, or clear the search to see the full list."
            />
          </Panel>
        )}
      </div>

      <RegisterAgentModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={reload}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-200">{value}</dd>
    </div>
  );
}

export function PolicyPage() {
  const samplePolicy =
    "version: 1\nname: default-governance\nrules:\n  - id: destructive-actions\n    action: delete\n    minimum_tier: 3\n    require_approval: true\n    guardian: assigned";
  const source = useApiResource<{ content: string; name?: string }>(
    "/policies/default",
    { content: samplePolicy, name: "default-governance" },
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();
  const yaml = draft ?? source.data.content;
  const valid = useMemo(
    () =>
      /^\s*version:\s*\d+/m.test(yaml) &&
      /^\s*rules:\s*$/m.test(yaml) &&
      yaml.includes("require_approval:"),
    [yaml],
  );
  const submitPolicy = async () => {
    try {
      const result = await api<{ url?: string }>("/policies/pull-requests", {
        method: "POST",
        body: JSON.stringify({ name: "default-governance", content: yaml }),
      });
      setSubmitted(true);
      toast.success(
        result.url
          ? `Review proposal created: ${result.url}`
          : "Policy review proposal created.",
        "Submitted for governance review",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to submit policy for review.",
        "Policy submission failed",
      );
    }
  };
  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeading
        eyebrow="Governance controls"
        title="Policy manager"
        description="Inspect and propose policy changes. Updates are submitted for review and do not take effect directly from this editor."
      />
      <SourceNotice
        loading={source.loading}
        error={source.error}
        reload={source.reload}
      />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <Panel
          title="default-governance.yaml"
          subtitle="Policy changes require a pull-request review before deployment"
          action={
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              <Check className="h-3 w-3" />
              Current policy active
            </span>
          }
        >
          <label
            htmlFor="policy-yaml"
            className="mb-2 block text-xs font-medium text-slate-400"
          >
            Policy definition (YAML)
          </label>
          <textarea
            id="policy-yaml"
            value={yaml}
            onChange={(event) => {
              setDraft(event.target.value);
              setSubmitted(false);
            }}
            spellCheck={false}
            rows={16}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200 outline-none focus:border-blue-500"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p
              role="status"
              className={`flex items-center gap-2 text-xs ${valid ? "text-emerald-300" : "text-rose-300"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${valid ? "bg-emerald-400" : "bg-rose-400"}`}
              />
              {valid
                ? "Basic structure and approval rule validated"
                : "Add a version, rules section, and require_approval rule"}
            </p>
            <button
              type="button"
              disabled={!valid}
              onClick={() => void submitPolicy()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GitPullRequest className="h-4 w-4" />
              {submitted ? "Submit another proposal" : "Propose policy change"}
            </button>
          </div>
        </Panel>
        <Panel title="Governance guardrails" subtitle="Current policy summary">
          <div className="space-y-4">
            {[
              ["Destructive actions", "Tier 3 + guardian approval"],
              ["Sensitive data access", "PII policy check required"],
              ["Policy edits", "Pull request + reviewer sign-off"],
              ["Emergency controls", "Reason and audit event required"],
            ].map(([key, value]) => (
              <div
                key={key}
                className="border-b border-slate-800 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-xs text-slate-500">{key}</p>
                <p className="mt-1 text-sm text-slate-200">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs leading-5 text-blue-200">
            The editor performs lightweight client-side checks. The control
            plane remains authoritative for schema validation and policy
            enforcement.
          </div>
        </Panel>
      </div>
    </div>
  );
}

type Conflict = {
  id: string;
  title: string;
  agents: string;
  severity: string;
  summary: string;
  status: "Needs arbitration" | "Resolved";
};

export function BoardroomPage() {
  const { subscribe } = useRealtime();
  const sampleConflicts: Conflict[] = [
    {
      id: "CON-118",
      title: "Competing field-removal plans",
      agents: "Field Cleanup Agent ↔ Metadata Scout",
      severity: "High",
      summary:
        "Both agents proposed incompatible changes to the Account schema.",
      status: "Needs arbitration",
    },
    {
      id: "CON-117",
      title: "Conflicting retention windows",
      agents: "Policy Sentinel ↔ Knowledge Curator",
      severity: "Medium",
      summary: "Retention policy differs between source and shared knowledge.",
      status: "Needs arbitration",
    },
  ];
  const source = useApiResource<Conflict[]>(
    "/boardroom/conflicts",
    sampleConflicts,
  );
  const { reload } = source;
  const conflicts = source.data;
  const toast = useToast();
  useEffect(
    () =>
      subscribe((event) => {
        if (
          event.type === "boardroom.conflict.created" ||
          event.type === "boardroom.conflict.updated"
        )
          reload();
      }),
    [reload, subscribe],
  );
  const decide = async (conflict: Conflict, decision: "approve" | "reject") => {
    try {
      await api(
        `/boardroom/conflicts/${encodeURIComponent(conflict.id)}/decision`,
        { method: "POST", body: JSON.stringify({ decision }) },
      );
      source.setData((items) =>
        items.map((item) =>
          item.id === conflict.id ? { ...item, status: "Resolved" } : item,
        ),
      );
      toast.success(
        `Decision recorded for ${conflict.id}`,
        "Arbitration complete",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to record arbitration decision.",
        "Decision not recorded",
      );
    }
  };
  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeading
        eyebrow="Human arbitration"
        title="Digital boardroom"
        description="Resolve competing agent recommendations with full context and an auditable decision record."
      />
      <SourceNotice
        loading={source.loading}
        error={source.error}
        reload={source.reload}
      />
      {conflicts.length === 0 ? (
        <EmptyState
          title="No agent conflicts"
          body="Conflicts requiring human arbitration will appear here."
        />
      ) : (
        <div className="grid gap-4">
          {conflicts.map((conflict) => (
            <Panel
              key={conflict.id}
              title={`${conflict.id} · ${conflict.title}`}
              subtitle={conflict.agents}
              action={
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${conflict.status === "Resolved" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}
                >
                  {conflict.status}
                </span>
              }
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-300">{conflict.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Severity:{" "}
                    <span
                      className={
                        conflict.severity === "High"
                          ? "text-rose-300"
                          : "text-amber-300"
                      }
                    >
                      {conflict.severity}
                    </span>{" "}
                    · Compare evidence in the agent detail and audit views
                    before deciding.
                  </p>
                </div>
                {conflict.status !== "Resolved" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void decide(conflict, "approve")}
                      className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      Accept recommendation
                    </button>
                    <button
                      type="button"
                      onClick={() => void decide(conflict, "reject")}
                      className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-600"
                    >
                      Reject both
                    </button>
                  </div>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

const costItems = [
  {
    name: "Field Cleanup Agent",
    amount: 438,
    share: 82,
    trend: "+8.2%",
    tone: "bg-blue-400",
  },
  {
    name: "Metadata Scout",
    amount: 326,
    share: 61,
    trend: "-2.1%",
    tone: "bg-violet-400",
  },
  {
    name: "Knowledge Curator",
    amount: 291,
    share: 54,
    trend: "+1.4%",
    tone: "bg-cyan-400",
  },
  {
    name: "Policy Sentinel",
    amount: 229,
    share: 43,
    trend: "-4.6%",
    tone: "bg-emerald-400",
  },
];

export function CostsPage() {
  const { subscribe } = useRealtime();
  const sampleCost = {
    mtd: "$1,284.56",
    projected: "$1,706.20",
    perTask: "$0.084",
    remaining: "$715.44",
    items: costItems,
    daily: [44, 62, 48, 78, 56, 92, 70],
  };
  const source = useApiResource<typeof sampleCost>(
    "/costs/summary",
    sampleCost,
  );
  const { reload } = source;
  const data = source.data;
  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === "cost.updated") reload();
      }),
    [reload, subscribe],
  );
  return (
    <div className="mx-auto max-w-[1300px] space-y-6">
      <PageHeading
        eyebrow="FinOps"
        title="Cost dashboard"
        description="Track model and execution spend across agents, tasks, skills, and guardians. Values shown are the current month-to-date view."
      />
      <SourceNotice
        loading={source.loading}
        error={source.error}
        reload={source.reload}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Month-to-date"
          value={data.mtd}
          change="Month-to-date spend"
          icon={DollarSign}
        />
        <Metric
          label="Projected monthly"
          value={data.projected}
          change="Against the configured budget"
          icon={ArrowUpRight}
          tone="green"
        />
        <Metric
          label="Average / task"
          value={data.perTask}
          change="Average task cost"
          icon={Activity}
          tone="blue"
        />
        <Metric
          label="Budget remaining"
          value={data.remaining}
          change="Current budget balance"
          icon={CircleAlert}
          tone="amber"
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Spend by agent" subtitle="Month-to-date cost · USD">
          <div className="space-y-5">
            {data.items.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="text-slate-200">{item.name}</span>
                  <span className="text-slate-300">
                    ${item.amount}.00{" "}
                    <span className="ml-2 text-xs text-slate-500">
                      {item.trend}
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${item.tone}`}
                    style={{ width: `${item.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Daily spend trend" subtitle="Last 7 days · USD">
          <div className="flex h-48 items-end justify-between gap-2 border-b border-l border-slate-800 px-2 pb-0">
            {data.daily.map((height, index) => (
              <div
                key={index}
                className="group flex h-full flex-1 flex-col justify-end"
              >
                <div
                  title={`Day ${index + 1}`}
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-600/70 to-cyan-300/80"
                  style={{ height: `${height}%` }}
                />
                <span className="py-2 text-center text-[10px] text-slate-600">
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <ArrowDownRight className="h-4 w-4 text-emerald-400" />
            Spend is stable against the configured budget.
          </p>
        </Panel>
      </div>
    </div>
  );
}

type KillScope = "agent" | "pod" | "capability" | "global";
const killTargets: {
  scope: KillScope;
  target: string;
  description: string;
  active: boolean;
}[] = [
  {
    scope: "agent",
    target: "agent-01",
    description: "Field Cleanup Agent",
    active: true,
  },
  {
    scope: "pod",
    target: "salesforce-governance",
    description: "Salesforce Governance Pod",
    active: true,
  },
  {
    scope: "capability",
    target: "field-delete",
    description: "Field deletion capability",
    active: true,
  },
  {
    scope: "global",
    target: "all-agents",
    description: "All agents and queued work",
    active: true,
  },
];

export function KillSwitchPage() {
  const source = useApiResource<typeof killTargets>(
    "/killswitch/status",
    killTargets,
  );
  const [selected, setSelected] = useState<{
    scope: KillScope;
    target: string;
    description: string;
  } | null>(null);
  const [phrase, setPhrase] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const required = selected
    ? `KILL ${selected.scope.toUpperCase()} ${selected.target}`
    : "";
  const confirm = async () => {
    if (!selected || phrase !== required || reason.trim().length < 8 || busy)
      return;
    setBusy(true);
    try {
      await api("/killswitch", {
        method: "POST",
        body: JSON.stringify({
          scope: selected.scope,
          target: selected.target,
          reason: reason.trim(),
        }),
      });
      source.setData((items) =>
        items.map((item) =>
          item.scope === selected.scope && item.target === selected.target
            ? { ...item, active: false }
            : item,
        ),
      );
      toast.success(
        `Emergency stop requested for ${selected.description}.`,
        "Kill switch activated",
      );
      setSelected(null);
      setPhrase("");
      setReason("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to activate the kill switch.",
        "Emergency stop failed",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeading
        eyebrow="Emergency controls"
        title="Kill switch panel"
        description="Pause execution at a defined scope. Every request requires a reason, an exact confirmation phrase, and is audited."
      />
      <SourceNotice
        loading={source.loading}
        error={source.error}
        reload={source.reload}
      />
      <div
        role="alert"
        className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200"
      >
        <CircleAlert className="h-5 w-5 shrink-0" />
        <p>
          Use only when agent behavior presents an operational risk. Emergency
          stop requests interrupt active work and may require operator recovery.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {source.data.map((item) => (
          <div
            key={`${item.scope}:${item.target}`}
            className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5"
          >
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {item.description}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.scope} · {item.target}
              </p>
              <span
                className={`mt-3 inline-flex items-center gap-1.5 text-[11px] ${item.active ? "text-emerald-300" : "text-rose-300"}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${item.active ? "bg-emerald-400" : "bg-rose-400"}`}
                />
                {item.active ? "Running" : "Stopped"}
              </span>
            </div>
            <button
              type="button"
              disabled={!item.active}
              onClick={() => {
                setSelected(item);
                setPhrase("");
                setReason("");
              }}
              className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Emergency stop
            </button>
          </div>
        ))}
      </div>
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kill-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-xl border border-rose-500/30 bg-slate-900 p-5 shadow-2xl">
            <div className="flex justify-between gap-3">
              <div>
                <h2
                  id="kill-title"
                  className="text-lg font-semibold text-white"
                >
                  Confirm emergency stop
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selected.description} · {selected.scope}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close confirmation"
                className="h-fit rounded-md p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label
              htmlFor="kill-reason"
              className="mt-5 block text-xs font-medium text-slate-300"
            >
              Reason for stopping{" "}
              <span className="text-slate-500">
                (required; at least 8 characters)
              </span>
            </label>
            <textarea
              id="kill-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 outline-none focus:border-rose-400"
            />
            <label
              htmlFor="kill-phrase"
              className="mt-4 block text-xs font-medium text-slate-300"
            >
              Type{" "}
              <code className="rounded bg-slate-800 px-1.5 py-1 text-rose-200">
                {required}
              </code>{" "}
              to confirm
            </label>
            <input
              id="kill-phrase"
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-400"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  phrase !== required || reason.trim().length < 8 || busy
                }
                onClick={() => void confirm()}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Sending request…" : "Confirm stop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DriftPage() {
  const { subscribe } = useRealtime();
  const sampleDrift = [
    {
      agent: "Field Cleanup Agent",
      dimension: "Action distribution",
      baseline: "Prompt v12",
      current: "Prompt v13",
      score: 0.31,
      threshold: 0.25,
      severity: "Review",
    },
    {
      agent: "Metadata Scout",
      dimension: "Model response variance",
      baseline: "Claude 3.5 Sonnet",
      current: "Claude 3.5 Sonnet",
      score: 0.12,
      threshold: 0.25,
      severity: "Normal",
    },
    {
      agent: "Knowledge Curator",
      dimension: "Knowledge source coverage",
      baseline: "Index 2026.09",
      current: "Index 2026.10",
      score: 0.27,
      threshold: 0.25,
      severity: "Review",
    },
  ];
  const source = useApiResource<typeof sampleDrift>("/drift", sampleDrift);
  const { reload } = source;
  const drift = source.data;
  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === "drift.updated" || event.type === "drift.alert")
          reload();
      }),
    [reload, subscribe],
  );
  return (
    <div className="mx-auto max-w-[1300px] space-y-6">
      <PageHeading
        eyebrow="Continuous oversight"
        title="Drift monitor"
        description="Track changes in behavior against model, prompt, and knowledge baselines. Alerts are signals for review, not automatic enforcement."
      />
      <SourceNotice
        loading={source.loading}
        error={source.error}
        reload={source.reload}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Agents monitored"
          value="4"
          change="Across model, prompt & knowledge"
          icon={Activity}
        />
        <Metric
          label="Drift alerts"
          value={String(
            drift.filter((item) => item.score > item.threshold).length,
          )}
          change="Signals above configured threshold"
          icon={CircleAlert}
          tone="amber"
        />
        <Metric
          label="Last baseline update"
          value="2h ago"
          change="Prompt and knowledge snapshots"
          icon={Clock3}
        />
      </div>
      <Panel
        title="Behavioral drift signals"
        subtitle="Score is normalized from 0 (no deviation) to 1 (largest observed deviation)"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  "Agent / signal",
                  "Baseline → current",
                  "Drift score",
                  "Threshold",
                  "Status",
                ].map((item) => (
                  <th key={item} className="pb-3 pr-4 font-medium">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {drift.map((item) => (
                <tr key={item.agent}>
                  <td className="py-4 pr-4">
                    <p className="font-medium text-slate-200">{item.agent}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.dimension}
                    </p>
                  </td>
                  <td className="py-4 pr-4 text-xs text-slate-400">
                    {item.baseline}
                    <span className="mx-2 text-slate-600">→</span>
                    {item.current}
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full ${item.score > item.threshold ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${item.score * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-300">
                        {item.score.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 font-mono text-xs text-slate-500">
                    {item.threshold.toFixed(2)}
                  </td>
                  <td className="py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.score > item.threshold ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}
                    >
                      {item.score > item.threshold ? "Review" : "Normal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500";

const DEFAULT_REGISTER_FORM = {
  agent_id: "",
  name: "",
  version: "1.0.0",
  description: "",
  owner: "",
  model_primary: "anthropic/claude-3-5-sonnet-20241022",
  model_fallback: "",
  config_yaml: "",
};

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-300">
        {label} {required && <span className="text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function RegisterAgentModal({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [form, setForm] = useState(DEFAULT_REGISTER_FORM);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_REGISTER_FORM);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const update =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const valid =
    form.agent_id.trim().length > 0 &&
    form.name.trim().length > 0 &&
    form.version.trim().length > 0 &&
    form.owner.trim().length > 0 &&
    form.model_primary.trim().length > 0;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await api("/agents", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success(`${form.name} registered`, "Agent registration");
      onRegistered();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to register agent.",
        "Registration failed",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-agent-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex justify-between gap-3">
          <div>
            <h2
              id="register-agent-title"
              className="text-lg font-semibold text-white"
            >
              Register new agent
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Define the agent&apos;s identity, ownership, and model
              configuration.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration dialog"
            className="h-fit rounded-md p-1 text-slate-400 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Agent ID" required>
            <input
              value={form.agent_id}
              onChange={update("agent_id")}
              placeholder="field-cleanup-agent"
              className={inputClass}
            />
          </Field>
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={update("name")}
              placeholder="Field Cleanup Agent"
              className={inputClass}
            />
          </Field>
          <Field label="Version" required>
            <input
              value={form.version}
              onChange={update("version")}
              placeholder="1.0.0"
              className={inputClass}
            />
          </Field>
          <Field label="Owner" required>
            <input
              value={form.owner}
              onChange={update("owner")}
              placeholder="team-governance"
              className={inputClass}
            />
          </Field>
          <Field label="Primary model" required className="sm:col-span-2">
            <input
              value={form.model_primary}
              onChange={update("model_primary")}
              className={inputClass}
            />
          </Field>
          <Field label="Fallback model" className="sm:col-span-2">
            <input
              value={form.model_fallback}
              onChange={update("model_fallback")}
              placeholder="openai/gpt-4o-mini"
              className={inputClass}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={form.description}
              onChange={update("description")}
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </Field>
          <Field label="Config YAML" className="sm:col-span-2">
            <textarea
              value={form.config_yaml}
              onChange={update("config_yaml")}
              rows={7}
              spellCheck={false}
              placeholder={
                "tools:\n  - salesforce_query_field_usage\n  - salesforce_delete_field"
              }
              className={`${inputClass} resize-y font-mono text-xs leading-6`}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || busy}
            onClick={() => void submit()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {busy ? "Registering…" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}
