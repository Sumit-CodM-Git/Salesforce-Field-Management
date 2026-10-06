"use client";

import { Activity, KeyRound, Server, ShieldCheck } from "lucide-react";
import { useRealtime } from "@/app/lib/ws/RealtimeProvider";

export default function SettingsPage() {
  const { status } = useRealtime();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "/control-plane/api";
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Platform settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Review service connectivity and configuration boundaries for this dashboard.
          Agent policies are managed in Policy Manager and agent controls are available in Agents.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-300"><Server className="h-5 w-5" /></span>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Control-plane API</h2>
              <p className="mt-1 text-xs text-slate-500">API base URL</p>
            </div>
          </div>
          <code className="mt-5 block break-all rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">{apiBase}</code>
          <p className="mt-3 text-xs leading-5 text-slate-500">Set <code>NEXT_PUBLIC_API_BASE</code> in the frontend environment to change this value.</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300"><Activity className="h-5 w-5" /></span>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Realtime event stream</h2>
              <p className="mt-1 text-xs text-slate-500">WebSocket endpoint</p>
            </div>
          </div>
          <code className="mt-5 block break-all rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">{wsUrl}</code>
          <p className="mt-3 text-xs text-slate-500">Connection status: <span className={status === "connected" ? "text-emerald-300" : "text-amber-300"}>{status}</span></p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Set <code>NEXT_PUBLIC_WS_URL</code> to use the deployed control-plane event stream.</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/80">
        <header className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-100">Security boundaries</h2>
          <p className="mt-1 text-xs text-slate-500">Sensitive configuration is owned by the control plane and deployment environment.</p>
        </header>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="flex gap-3">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div><h3 className="text-sm font-medium text-slate-200">Credentials stay server-side</h3><p className="mt-1 text-xs leading-5 text-slate-500">Provider tokens, database credentials, and Salesforce OAuth secrets are not rendered or editable in the browser.</p></div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <div><h3 className="text-sm font-medium text-slate-200">Governed changes</h3><p className="mt-1 text-xs leading-5 text-slate-500">Policy modifications are submitted for review. Approval decisions and emergency actions include an operator reason and are sent to the audited API.</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}
