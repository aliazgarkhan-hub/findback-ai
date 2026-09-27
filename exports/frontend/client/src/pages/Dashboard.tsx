import AppShell from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, ClipboardList, Database, FileSearch, LoaderCircle, MessageCircle, Plus, Search, Sparkles } from "lucide-react";

function dateLabel(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { loading } = useAuth();
  const reportsQuery = trpc.reports.mine.useQuery(undefined, { enabled: !loading });
  const matchesQuery = trpc.matches.mine.useQuery(undefined, { enabled: !loading });
  const demoSeed = trpc.demo.seed.useMutation();
  const demoClear = trpc.demo.clear.useMutation();
  const utils = trpc.useUtils();
  const refresh = () => { void utils.reports.mine.invalidate(); void utils.matches.mine.invalidate(); };
  const reports = reportsQuery.data ?? [];
  const matches = matchesQuery.data ?? [];
  const recovered = reports.filter(item => item.status === "recovered").length;
  const active = reports.filter(item => item.status === "active" || item.status === "matched").length;

  return <AppShell>
    <div className="page-header">
      <div><p className="eyebrow">Personal workspace / {new Date().getFullYear()}</p><h1>Good morning. Let’s find back.</h1><p>See what’s active, what may match, and what needs your attention.</p></div>
      <div className="header-actions"><Link href="/report/lost" className="button button-primary button-small"><Plus size={15} /> New report</Link></div>
    </div>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-label"><span>Items reported</span><ClipboardList size={15} /></div><div className="stat-value">{reports.length}</div><div className="stat-foot">YOUR REPORTS</div></div>
      <div className="stat-card accent"><div className="stat-label"><span>Possible matches</span><Sparkles size={15} /></div><div className="stat-value">{matches.filter(item => item.status !== "not_match").length}</div><div className="stat-foot">CALCULATED FROM REPORTS</div></div>
      <div className="stat-card"><div className="stat-label"><span>Recovered</span><ArrowRight size={15} /></div><div className="stat-value">{recovered}</div><div className="stat-foot">MARKED BY YOU</div></div>
      <div className="stat-card"><div className="stat-label"><span>Active reports</span><FileSearch size={15} /></div><div className="stat-value">{active}</div><div className="stat-foot">STILL IN PLAY</div></div>
    </div>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-heading"><h2>Recent reports</h2><Link href="/report/lost" className="text-link">Add report <ArrowRight size={13} /></Link></div>
        {reportsQuery.isLoading ? <div className="loading-screen"><LoaderCircle className="spin" size={20} /></div> : reports.length === 0 ? <div className="empty-state"><ClipboardList size={20} /><strong>No reports yet</strong><span>Start with what you lost or what you found.</span></div> : <div className="report-list">{reports.slice(0, 5).map(report => <div className="report-row" key={report.id}><img className="report-thumb" src={report.imageUrl} alt={`Photo of ${report.itemName}`} /><div><strong>{report.itemName}</strong><span>{report.location} · {dateLabel(report.eventAt)}</span></div><span className={`type-badge ${report.type}`}>{report.type}</span></div>)}</div>}
      </section>
      <section className="panel"><div className="panel-heading"><h2>Quick actions</h2><span>MAKE A MOVE</span></div><div className="quick-actions"><Link href="/report/lost" className="quick-action"><span className="quick-icon"><Search size={15} /></span>Report something lost<ArrowRight size={14} /></Link><Link href="/report/found" className="quick-action found"><span className="quick-icon"><Plus size={15} /></span>Report something found<ArrowRight size={14} /></Link><Link href="/matches" className="quick-action"><span className="quick-icon"><MessageCircle size={15} /></span>Review possible matches<ArrowRight size={14} /></Link></div></section>
    </div>
    <section className="demo-panel"><div><p className="eyebrow"><Database size={12} /> Presentation mode</p><strong>Load a real matching example</strong><p>Seeds a lost + found laptop pair, then runs the same matching engine as any report.</p></div><div className="header-actions"><button className="button" disabled={demoSeed.isPending} onClick={() => demoSeed.mutate(undefined, { onSuccess: refresh })}>{demoSeed.isPending ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />} Load demo data</button><button className="button" disabled={demoClear.isPending} onClick={() => demoClear.mutate(undefined, { onSuccess: refresh })}>Clear demo</button></div></section>
    {matches.length > 0 && <section className="panel" style={{ marginTop: 16 }}><div className="panel-heading"><h2>Latest signal</h2><Link href="/matches" className="text-link">See all <ArrowRight size={13} /></Link></div><div className="report-row"><div className="score-number" style={{ fontSize: 24 }}>{matches[0].score}%</div><div><strong>{matches[0].lost?.itemName ?? "Possible match"}</strong><span>{matches[0].explanation}</span></div><span className="match-status">{matches[0].status.replace("_", " ")}</span></div></section>}
  </AppShell>;
}
