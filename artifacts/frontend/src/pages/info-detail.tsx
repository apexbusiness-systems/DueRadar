import { useRoute, Link } from "wouter";
import { RadarMark } from "@/components/layout/AppLayout";
import { useState } from "react";

// Beautiful custom SVGs for the categories
export function ContractsIcon({ color = "#FF6B35", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="contractsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={`${color}33`} />
        </linearGradient>
      </defs>
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="url(#contractsGrad)" />
    </svg>
  );
}

export function PermitsIcon({ color = "#F5A623", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="permitsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={`${color}33`} />
        </linearGradient>
      </defs>
      <path d="M12 2L2 22H22L12 2ZM12 6L18.8 18H5.2L12 6ZM11 10H13V14H11V10ZM11 15H13V17H11V15Z" fill="url(#permitsGrad)" />
    </svg>
  );
}

export function InsuranceIcon({ color = "#00C8F0", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="insuranceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={`${color}33`} />
        </linearGradient>
      </defs>
      <path d="M12 2L4 5V11C4 16.55 7.42 21.74 12 23C16.58 21.74 20 16.55 20 11V5L12 2ZM12 7C13.66 7 15 8.34 15 10C15 11.66 13.66 13 12 13C10.34 13 9 11.66 9 10C9 8.34 10.34 7 12 7ZM16 17H8V16C8 14.67 10.67 14 12 14C13.33 14 16 14.67 16 16V17Z" fill="url(#insuranceGrad)" />
    </svg>
  );
}

export function ComplianceIcon({ color = "#00E676", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="complianceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={`${color}33`} />
        </linearGradient>
      </defs>
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM16.59 8.59L15 7L10 12L7.41 9.41L6 10.83L10 14.83L16.59 8.59Z" fill="url(#complianceGrad)" />
    </svg>
  );
}

export function DeadlinesIcon({ color = "#F5A623", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="deadlinesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={`${color}33`} />
        </linearGradient>
      </defs>
      <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="url(#deadlinesGrad)" />
    </svg>
  );
}

export function ExposureIcon({ color = "#FF4040", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="exposureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={`${color}33`} />
        </linearGradient>
      </defs>
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="url(#exposureGrad)" />
    </svg>
  );
}

// Map slug to details
interface CategoryDetail {
  title: string;
  count: string;
  color: string;
  textColor: string;
  desc: string;
  longDesc: string;
  riskRating: "Critical" | "High" | "Medium";
  impact: string;
  mitigation: string;
  checklist: string[];
  metrics: { label: string; value: string }[];
  icon: (color: string, size: number) => React.ReactNode;
}

const CATEGORIES_DATA: Record<string, CategoryDetail> = {
  contracts: {
    title: "Contracts & Agreements",
    count: "12 Expiring",
    color: "#FF6B35",
    textColor: "#FF8C5A",
    desc: "Auto-renew windows, notice periods, term expiry.",
    longDesc: "Missing a contract renewal can lock you into expensive terms or disrupt essential services. DueRadar tracks your notice windows and auto-renew dates so you can renegotiate or cancel on your own terms.",
    riskRating: "High",
    impact: "Unexpected renewals, price hikes, and being stuck with poor service.",
    mitigation: "Set up reminders 30, 60, and 90 days out. Make sure every contract has an owner and a backup.",
    checklist: [
      "Confirm auto-renew lockout deadlines (typically 30-90 days prior).",
      "Verify indemnification limits and standard SLA compliance clauses.",
      "Schedule price renegotiation window at T-60.",
      "Assign explicit operational owners and secondary backups for each vendor agreement."
    ],
    metrics: [
      { label: "Active Contracts", value: "48" },
      { label: "Critical Windows (30d)", value: "3" },
      { label: "Avg Resolution Time", value: "4.2 days" }
    ],
    icon: (color, size) => <ContractsIcon color={color} size={size} />
  },
  permits: {
    title: "Operating Permits & Licenses",
    count: "5 Expiring",
    color: "#F5A623",
    textColor: "#FFB84D",
    desc: "Operating permits, building, health, fire inspections.",
    longDesc: "Missing a permit renewal can shut down your operations and lead to heavy fines. DueRadar tracks your local and state licenses so you stay compliant.",
    riskRating: "Critical",
    impact: "Fines, stop-work orders, and temporary business closures.",
    mitigation: "Track expiration dates and set up automatic reminders 45 days in advance.",
    checklist: [
      "Audit municipal building and health inspection certificate expiry.",
      "Verify state board corporate registration status.",
      "Pre-schedule annual environmental or waste handling inspections.",
      "Review occupational permit requirements for key executive roles."
    ],
    metrics: [
      { label: "Licenses Tracked", value: "19" },
      { label: "Upcoming Audits", value: "2" },
      { label: "Regulatory Rating", value: "100%" }
    ],
    icon: (color, size) => <PermitsIcon color={color} size={size} />
  },
  insurance: {
    title: "Insurance Policies & Binders",
    count: "3 Renewals",
    color: "#00C8F0",
    textColor: "#54D8FF",
    desc: "Policy renewals, coverage gaps, binding deadlines.",
    longDesc: "A lapse in insurance coverage leaves your business exposed. Stay on top of your policies to avoid costly coverage gaps.",
    riskRating: "Critical",
    impact: "Denied claims, breached contracts, and personal liability.",
    mitigation: "Start comparing renewal quotes 45 days early and keep your policy documents easily accessible.",
    checklist: [
      "Establish active dialogue with insurance broker at T-45.",
      "Conduct exposure audit to adjust coverage limits before binding.",
      "Confirm worker's compensation state board compliance.",
      "Audit Director & Officer (D&O) liability windows."
    ],
    metrics: [
      { label: "Active Policies", value: "8" },
      { label: "Aggregate Coverage", value: "$15M" },
      { label: "Insurance Gaps", value: "0" }
    ],
    icon: (color, size) => <InsuranceIcon color={color} size={size} />
  },
  compliance: {
    title: "Regulatory Compliance",
    count: "2 Overdue",
    color: "#00E676",
    textColor: "#6EFFB1",
    desc: "Regulatory filings, certifications, audits.",
    longDesc: "Keeping up with SOC2, GDPR, and tax filings is critical. Track your compliance deadlines to avoid reputational damage and fines.",
    riskRating: "High",
    impact: "Lost clients, expensive fines, and stressful audits.",
    mitigation: "Assign clear ownership for each compliance task and track deadlines visibly.",
    checklist: [
      "Validate quarterly SOC2 auditor control checks.",
      "Review annual GDPR/CCPA data flow privacy maps.",
      "Track corporate tax filing windows with zero tolerance rules.",
      "Conduct internal access audits for production systems."
    ],
    metrics: [
      { label: "Standards Tracked", value: "4" },
      { label: "Control Pass Rate", value: "98.7%" },
      { label: "Active Audits", value: "1" }
    ],
    icon: (color, size) => <ComplianceIcon color={color} size={size} />
  },
  deadlines: {
    title: "Operational Deadlines",
    count: "9 Due Soon",
    color: "#F5A623",
    textColor: "#FFB84D",
    desc: "License renewals, vendor SLAs, payment obligations.",
    longDesc: "Your business runs on daily operational deadlines. DueRadar tracks vendor payments, subscriptions, and SLAs so nothing slips through the cracks.",
    riskRating: "Medium",
    impact: "Service downtime, late fees, and suspended accounts.",
    mitigation: "Keep all your critical operational dates in one centralized dashboard.",
    checklist: [
      "Track domain name expiration dates and auto-charge cards.",
      "Monitor third-party API token key rotation cycles.",
      "Audit critical supplier milestone payment schedules.",
      "Review lease agreement termination notification dates."
    ],
    metrics: [
      { label: "Subscribed Services", value: "34" },
      { label: "Domain Portfolios", value: "12" },
      { label: "Missed SLA Rate", value: "0.0%" }
    ],
    icon: (color, size) => <DeadlinesIcon color={color} size={size} />
  },
  exposure: {
    title: "Unassigned Risks",
    count: "7 High Risk",
    color: "#FF4040",
    textColor: "#FF8080",
    desc: "Unowned risks, missing reminders, notice windows.",
    longDesc: "A deadline without an owner is a disaster waiting to happen. Find and assign orphaned deadlines before they become problems.",
    riskRating: "Critical",
    impact: "Missed critical dates and lack of accountability.",
    mitigation: "Review unassigned tasks weekly and assign them to the right team members.",
    checklist: [
      "Assign concrete owners to all critical business pipelines.",
      "Establish automated escalation channels for silent alerts.",
      "Audit orphaned alerts that lack backup contact paths.",
      "Perform weekly operational coverage integrity reviews."
    ],
    metrics: [
      { label: "Exposure Score", value: "Low" },
      { label: "Orphaned Alerts", value: "0" },
      { label: "Average Age", value: "1.5 days" }
    ],
    icon: (color, size) => <ExposureIcon color={color} size={size} />
  }
};

export default function InfoDetailPage() {
  const [, params] = useRoute("/info/:category");
  const category = params?.category?.toLowerCase() || "contracts";
  const data = CATEGORIES_DATA[category] || CATEGORIES_DATA.contracts;

  const [checkedList, setCheckedList] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedList(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="min-h-screen text-[#F0F4F8] flex flex-col" style={{ background: "#050709" }}>
      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-50 bg-[#050709]/80 backdrop-blur-md border-b border-[rgba(255,255,255,.06)]">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <RadarMark size={60} />
              <span className="text-[24px] font-extrabold tracking-tight text-[#F0F4F8]">
                Due<span className="text-[#F5A623]">Radar</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4.5">
            <Link href="/">
              <span className="text-xs font-bold text-[#8898A8] hover:text-[#F5A623] cursor-pointer tracking-wider uppercase transition-colors">Back Home</span>
            </Link>
            <Link href="/sign-in">
              <span className="cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold bg-[#F5A623] text-[#0F0800] hover:brightness-110 shadow-[0_0_12px_rgba(245,166,35,.15)] transition-all">Start Free</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[960px] mx-auto px-6 py-16 w-full flex flex-col">
        {/* Dynamic Category Hero */}
        <div className="relative overflow-hidden p-8 sm:p-12 mb-10" style={{
          borderRadius: 20,
          background: "linear-gradient(135deg, rgba(10,14,24,.9), #050709)",
          border: `1px solid ${data.color}25`,
          borderLeft: `4px solid ${data.color}`,
          boxShadow: `0 8px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.02)`
        }}>
          {/* Background gradient flare */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{
            background: `radial-gradient(circle, ${data.color}08 0%, transparent 80%)`
          }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full" style={{
                background: `${data.color}10`,
                border: `1.5px solid ${data.color}25`
              }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: data.color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: data.textColor }}>
                  {data.riskRating} Risk Category
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-[#F0F4F8]">
                {data.title}
              </h1>
              <p className="text-base text-[#8898A8] max-w-[580px] leading-relaxed">
                {data.longDesc}
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl" style={{
              background: `${data.color}15`,
              border: `2px solid ${data.color}35`,
              boxShadow: `0 0 30px ${data.color}15`
            }}>
              {data.icon(data.color, 48)}
            </div>
          </div>
        </div>

        {/* Dynamic Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {data.metrics.map((m, i) => (
            <div key={i} className="p-6" style={{
              background: "#0A0E18",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 14,
              boxShadow: "0 4px 16px rgba(0,0,0,.2)"
            }}>
              <div className="text-[11px] font-bold text-[#4A5568] uppercase tracking-widest mb-1.5">{m.label}</div>
              <div className="text-[28px] font-black tracking-tight" style={{ color: data.textColor }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Interactive Layout: Analysis vs Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Analysis & Strategy */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="p-7" style={{ background: "#0A0E18", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16 }}>
              <h3 className="text-lg font-bold mb-4 text-[#F0F4F8] flex items-center gap-2">
                <span className="w-1 h-4 rounded-full" style={{ background: data.color }} />
                Impact & Consequences
              </h3>
              <p className="text-[14px] text-[#8898A8] leading-relaxed mb-6">
                {data.impact}
              </p>

              <h3 className="text-lg font-bold mb-4 text-[#F0F4F8] flex items-center gap-2">
                <span className="w-1 h-4 rounded-full" style={{ background: data.color }} />
                Mitigation Strategy
              </h3>
              <p className="text-[14px] text-[#8898A8] leading-relaxed">
                {data.mitigation}
              </p>
            </div>
          </div>

          {/* Premium Compliance Checklist */}
          <div className="lg:col-span-5">
            <div className="p-7" style={{
              background: "#0A0E18",
              border: `1px solid ${data.color}25`,
              borderRadius: 16,
              boxShadow: `0 8px 24px rgba(0,0,0,.15)`
            }}>
              <h3 className="text-[14px] font-bold uppercase tracking-wider mb-6 text-[#F0F4F8] flex items-center justify-between">
                <span>Compliance Checklist</span>
                <span className="text-xs" style={{ color: data.textColor }}>Live Checks</span>
              </h3>

              <div className="flex flex-col gap-4">
                {data.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 mt-0.5" style={{
                      borderColor: checkedList[idx] ? data.color : "rgba(255,255,255,.15)",
                      background: checkedList[idx] ? `${data.color}15` : "transparent"
                    }}>
                      {checkedList[idx] && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L4 8L9 1" stroke={data.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] leading-relaxed select-none transition-colors" style={{
                      color: checkedList[idx] ? "#4A5568" : "#8898A8",
                      textDecoration: checkedList[idx] ? "line-through" : "none"
                    }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Back and Direct Command Center CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4.5 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <Link href="/">
            <button className="px-6 py-3 rounded-lg text-xs font-bold bg-[#0A0E18] border border-[rgba(255,255,255,.1)] text-[#8898A8] hover:text-[#F0F4F8] hover:border-[rgba(255,255,255,.25)] transition-all">
              ← Return to Landing Page
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="px-8 py-3 rounded-lg text-xs font-bold bg-[#F5A623] text-[#0F0800] hover:brightness-110 shadow-[0_0_16px_rgba(245,166,35,.15)] transition-all">
              Open Command Center →
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
