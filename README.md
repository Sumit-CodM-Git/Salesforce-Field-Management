# CDM-OS Guardian & Governance Dashboard

The frontend is the human oversight layer for the CDM-OS control plane. It is built with Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide icons.

## Dashboard areas

- **Overview** — agent health, approval backlog, cost and drift signals, recent audit activity, and realtime connection status.
- **Agents** — agent status, tier, guardian, model configuration, recent activity, and pause/resume requests.
- **Approval Queue** — proposal context, risk evidence, and approve/reject decisions with a required reason.
- **Audit Trail** — searchable and filterable event history with export requests.
- **Policy Manager** — YAML policy editing with basic client validation and pull-request submission.
- **Digital Boardroom** — conflict review and auditable arbitration decisions.
- **Cost Dashboard** — cost summaries, agent-level spend, and daily trends.
- **Kill Switches** — agent, pod, capability, and global stops with a typed confirmation phrase and required reason.
- **Drift Monitor** — model, prompt, and knowledge baseline comparisons.

## Control-plane integration

The API base defaults to `http://localhost:8000/api/v1`; set `NEXT_PUBLIC_API_BASE` to override it. The frontend expects these JSON endpoints:

| Method | Path                                          | Purpose                                                                                             |
| ------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| GET    | `/dashboard/summary`                          | Overview snapshot (`agents`, `approvals`, `spend`, `driftAlerts`, `events`)                         |
| GET    | `/agents`                                     | Agent collection (`id`, `name`, `skill`, `status`, `tier`, `guardian`, `activity`, `cost`, `model`) |
| POST   | `/agents/{id}/pause` or `/agents/{id}/resume` | Guardian agent controls                                                                             |
| GET    | `/proposals/queue/pending`                    | Proposals waiting for human approval                                                                |
| PUT    | `/proposals/{id}/decide`                      | Decide a pending proposal (`decision: APPROVED\|REJECTED`, `reviewer_email`, `reason`)              |
| POST   | `/proposals/{id}/execute`                     | Execute a `HUMAN_APPROVED` or `POLICY_APPROVED` proposal                                            |
| GET    | `/audit/events`                               | Audit event collection                                                                              |
| POST   | `/audit/exports`                              | Create an audit export (`kind` and active filters)                                                  |
| GET    | `/policies/default`                           | Active policy (`content`, optional `name`)                                                          |
| POST   | `/policies/pull-requests`                     | Submit a policy proposal (`name`, `content`)                                                        |
| GET    | `/boardroom/conflicts`                        | Conflict collection (`id`, `title`, `agents`, `severity`, `summary`, `status`)                      |
| POST   | `/boardroom/conflicts/{id}/decision`          | Arbitration decision (`decision`)                                                                   |
| GET    | `/costs/summary`                              | Cost summary (`mtd`, `projected`, `perTask`, `remaining`, `items`, `daily`)                         |
| GET    | `/killswitch/status`                          | Current emergency-stop scopes                                                                       |
| POST   | `/killswitch`                                 | Audited stop request (`scope`, `target`, `reason`)                                                  |
| GET    | `/drift`                                      | Drift signal collection                                                                             |

Resource GET views show clearly labeled sample data with a retry notice if the control plane is unavailable; successful API responses replace the sample data. Mutations are never presented as successful unless the API responds successfully.

Set `NEXT_PUBLIC_WS_URL` to the control plane WebSocket URL. The default is `ws://localhost:8080/ws`. Events use `{ "type": "event.name", "payload": {} }`. `agent.status_changed` / `agent.updated`, `approval.created` / `approval.updated` or `proposal.created` / `proposal.updated`, `audit.event.created`, `cost.updated`, `drift.alert` / `drift.updated`, and `boardroom.conflict.created` / `boardroom.conflict.updated` refresh the corresponding live views. The provider exposes connection state and event subscriptions and retries a closed connection with backoff.

## Local development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
```
