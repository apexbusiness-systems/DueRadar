import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { RadarMark, BtnAmber, BtnGhost } from "@/components/risk-radar/Chrome";

/* ── Orbiting category labels (DOM elements, not canvas) ── */
interface OrbitalNode {
  label: string;
  count: string;
  color: string;
  rx: number;        // horizontal orbit radius (fraction of container)
  ry: number;        // vertical orbit radius (fraction of container)
  speed: number;    // radians per ms
  phase: number;     // starting angle (radians)
  direction: 1 | -1; // clockwise or counter-clockwise
  size: "lg" | "sm"; // visual size variant
}

const ORBITAL_NODES: OrbitalNode[] = [
  { label: "CONTRACTS",    count: "12 Expiring", color: "#FF6B35", rx: 0.18, ry: 0.14, speed: 0.00028, phase: 0.0,           direction: 1,  size: "lg" },
  { label: "PERMITS",      count: "5 Expiring",   color: "#F5A623", rx: 0.22, ry: 0.18, speed: 0.00022, phase: Math.PI * 0.33, direction: -1, size: "lg" },
  { label: "INSURANCE",    count: "3 Renewals",   color: "#00C8F0", rx: 0.26, ry: 0.22, speed: 0.00018, phase: Math.PI * 0.67, direction: 1,  size: "lg" },
  { label: "COMPLIANCE",   count: "2 Overdue",    color: "#00E676", rx: 0.30, ry: 0.25, speed: 0.00015, phase: Math.PI * 1.0,  direction: -1, size: "lg" },
  { label: "DEADLINES",    count: "9 Due Soon",   color: "#F5A623", rx: 0.15, ry: 0.11, speed: 0.00032, phase: Math.PI * 1.33, direction: 1,  size: "sm" },
  { label: "EXPOSURE",     count: "7 High Risk",  color: "#FF4040", rx: 0.34, ry: 0.28, speed: 0.00012, phase: Math.PI * 1.67, direction: -1, size: "sm" },
];

function OrbitingLabels() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const anglesRef = useRef<number[]>(ORBITAL_NODES.map((n) => n.phase));
  const rafRef = useRef<number>(0);

  const setNodeRef = useCallback((idx: number, el: HTMLDivElement | null) => {
    nodeRefs.current[idx] = el;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let last = 0;
    const tick = (t: number) => {
      if (!last) last = t;
      const dt = t - last;
      last = t;

      const W = container.offsetWidth;
      const H = container.offsetHeight;
      const cx = W * 0.64;  // orbit center matches radar center
      const cy = H * 0.5;

      ORBITAL_NODES.forEach((node, i) => {
        anglesRef.current[i] += node.speed * node.direction * dt;
        const angle = anglesRef.current[i];
        const x = cx + Math.cos(angle) * node.rx * W;
        const y = cy + Math.sin(angle) * node.ry * H;

        const el = nodeRefs.current[i];
        if (el) {
          el.style.transform = `translate(${x}px, ${y}px)`;
        }
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    >
      {ORBITAL_NODES.map((node, i) => (
        <div
          key={node.label}
          ref={(el) => setNodeRef(i, el)}
          className="absolute top-0 left-0 pointer-events-auto"
          style={{
            willChange: "transform",
            translate: "-50% -50%",
          }}
        >
          <div
            style={{
              background: "rgba(10,14,24,.88)",
              border: `1px solid ${node.color}44`,
              borderRadius: node.size === "lg" ? 10 : 7,
              padding: node.size === "lg" ? "8px 14px" : "6px 10px",
              boxShadow: `0 0 20px ${node.color}15, 0 4px 12px rgba(0,0,0,.5)`,
              backdropFilter: "blur(8px)",
              animation: `stagger-in .5s ease both`,
              animationDelay: `${i * 0.08}s`,
            }}
          >
            {/* Live dot */}
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="w-[5px] h-[5px] rounded-full inline-block"
                style={{
                  background: node.color,
                  boxShadow: `0 0 8px ${node.color}55`,
                  animation: "pulse-led 2s ease-in-out infinite",
                }}
              />
              <span
                className="font-bold uppercase tracking-[0.12em]"
                style={{
                  color: node.color,
                  fontSize: node.size === "lg" ? "10.5px" : "9px",
                }}
              >
                {node.label}
              </span>
            </div>
            {node.size === "lg" && (
              <div
                className="text-[12px] font-semibold pl-[13px]"
                style={{ color: "#8898A8" }}
              >
                {node.count}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Hero canvas overlay with particles + sweep ── */
function HeroOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweep = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    const N = 80;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.00012,
      vy: (Math.random() - 0.5) * 0.00012,
      alpha: Math.random() * 0.7 + 0.15,
      color:
        Math.random() > 0.6 ? "#F5A623" : Math.random() > 0.5 ? "#00C8F0" : "#FFFFFF",
    }));

    let last = 0;
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Radar sweep
      sweep.current = (sweep.current + dt * 0.018) % 360;
      const sweepRad = (sweep.current - 90) * (Math.PI / 180);
      const cx = W * 0.64;
      const cy = H * 0.5;
      const R = H * 0.52;
      const coneWidth = (55 * Math.PI) / 180;

      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grad.addColorStop(0, "rgba(245,166,35,.18)");
      grad.addColorStop(0.6, "rgba(245,166,35,.06)");
      grad.addColorStop(1, "rgba(245,166,35,0)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, sweepRad, sweepRad + coneWidth);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepRad) * R, cy + Math.sin(sweepRad) * R);
      ctx.strokeStyle = "rgba(245,166,35,.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Concentric ring ghosts (matches orbital orbits)
      [0.18, 0.22, 0.26, 0.30, 0.15, 0.34].forEach((rx, i) => {
        const ry = [0.14, 0.18, 0.22, 0.25, 0.11, 0.28][i];
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * W, ry * H, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,.025)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Particles
      particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        const px = p.x * W;
        const py = p.y * H;
        const flicker = 0.7 + 0.3 * Math.sin(t * 0.003 + px);
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * flicker;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

/* ── Category definitions ── */
const CATEGORIES = [
  { label: "CONTRACTS", count: "12 Expiring", color: "#FF6B35", desc: "Auto-renew windows, notice periods, term expiry." },
  { label: "PERMITS", count: "5 Expiring", color: "#F5A623", desc: "Operating permits, building, health, fire inspections." },
  { label: "INSURANCE", count: "3 Renewals", color: "#00C8F0", desc: "Policy renewals, coverage gaps, binding deadlines." },
  { label: "COMPLIANCE", count: "2 Overdue", color: "#00E676", desc: "Regulatory filings, certifications, audits." },
  { label: "DEADLINES", count: "9 Due Soon", color: "#F5A623", desc: "License renewals, vendor SLAs, payment obligations." },
  { label: "EXPOSURE", count: "7 High Risk", color: "#FF4040", desc: "Unowned risks, missing reminders, notice windows." },
];

const STEPS = [
  { n: "01", label: "Detect", desc: "DueRadar surfaces what's approaching before it's an emergency.", color: "#F5A623" },
  { n: "02", label: "Assign", desc: "Every risk gets an owner. Every owner gets a reminder schedule.", color: "#00C8F0" },
  { n: "03", label: "Act", desc: "One-click resolution paths. Upload proof, assign backup, set escalation.", color: "#00E676" },
  { n: "04", label: "Protect", desc: "Cleared risks become Protected. Coverage rises. Stress falls.", color: "#00E676" },
];

export default function LandingPage({ onEnter }: { onEnter?: () => void }) {
  const [emailInput, setEmailInput] = useState("");

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: "#050709" }}>
      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-50 bg-[#050709]/80 backdrop-blur-md border-b border-[rgba(255,255,255,.06)] transition-all duration-300">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RadarMark size={28} />
            <span className="text-[15px] font-bold tracking-tight text-[#F0F4F8]">
              Due<span className="text-[#F5A623]">Radar</span>
            </span>
          </div>
          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#tracks" className="text-xs font-bold text-[#8898A8] hover:text-[#F5A623] tracking-wider uppercase transition-colors">Deadlines</a>
            <a href="#workflow" className="text-xs font-bold text-[#8898A8] hover:text-[#F5A623] tracking-wider uppercase transition-colors">Workflow</a>
            <a href="#coverage" className="text-xs font-bold text-[#8898A8] hover:text-[#F5A623] tracking-wider uppercase transition-colors">Coverage</a>
          </nav>
          {/* CTAs */}
          <div className="flex items-center gap-4.5">
            <Link href="/sign-in">
              <span className="text-xs font-bold text-[#8898A8] hover:text-[#F5A623] cursor-pointer tracking-wider uppercase transition-colors">Sign In</span>
            </Link>
            <Link href="/sign-up">
              <span className="cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold bg-[#F5A623] text-[#0F0800] hover:brightness-110 shadow-[0_0_12px_rgba(245,166,35,.15)] transition-all">Start Free</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 opacity-92"
          style={{
            backgroundImage: "url('/hero.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(5,7,9,.96) 36%, rgba(5,7,9,.5) 58%, rgba(5,7,9,.2) 100%)",
          }}
        />
        <HeroOverlay />
        <OrbitingLabels />

        <div className="relative z-[2] px-20 py-20 max-w-[640px]">
          <div className="flex items-center gap-3.5 mb-8">
            <RadarMark size={48} />
          </div>
          <h1 className="text-[68px] font-bold tracking-[-0.04em] leading-none mb-0 text-white">
            Due<span className="text-[#F5A623]">Radar</span>
          </h1>
          <p className="text-[22px] font-medium text-[#8898A8] mt-4 mb-3 tracking-[-0.01em]">
            Your business deadline warning system.
          </p>
          <p className="text-[15px] text-[#4A5568] mb-9 leading-relaxed max-w-[500px]">
            Track contracts, permits, insurance, compliance dates, renewals, and operational
            exposure before they become expensive problems.
          </p>
          <div className="flex gap-3 flex-wrap">
            <BtnAmber onClick={onEnter}>Open Command Center →</BtnAmber>
            <BtnGhost>View Due Register</BtnGhost>
          </div>
        </div>
      </div>

      {/* What DueRadar Tracks — Bento Grid */}
      <section id="tracks" className="py-24 px-6 sm:px-12 md:px-20" style={{ background: "#0A0E18", borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <div className="max-w-[1040px] mx-auto">
          <div className="text-[11px] font-bold text-[#F5A623] uppercase tracking-[0.22em] mb-4">
            What DueRadar Tracks
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[42px] font-bold tracking-[-0.03em] mb-14 max-w-[560px] leading-[1.08] text-[#F0F4F8]">
            Every business deadline.<br />One warning system.
          </h2>

          {/* Bento grid: hero card (CONTRACTS) + 5 supporting */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Hero card — CONTRACTS */}
            <div
              className="lg:col-span-5 lg:row-span-2 flex flex-col justify-between p-8 group cursor-default transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "linear-gradient(145deg, #131a2e 0%, #0e1625 100%)",
                border: "1px solid rgba(255,107,53,.22)",
                borderLeft: "4px solid #FF6B35",
                borderRadius: 18,
                boxShadow: "0 8px 32px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.04)",
                minHeight: 280,
              }}
            >
              <div>
                <div
                  className="w-12 h-12 rounded-xl grid place-items-center mb-6"
                  style={{ background: "rgba(255,107,53,.14)", border: "1.5px solid rgba(255,107,53,.35)" }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: "#FF6B35", boxShadow: "0 0 10px rgba(255,107,53,.5)" }} />
                </div>
                <div className="text-[13px] font-bold text-[#F0F4F8] uppercase tracking-widest mb-1">{CATEGORIES[0].label}</div>
                <div className="text-[28px] font-black tracking-tight mb-3" style={{ color: "#FF6B35" }}>{CATEGORIES[0].count}</div>
                <div className="text-[14px] text-[#8898A8] leading-relaxed max-w-[260px]">{CATEGORIES[0].desc}</div>
              </div>
              <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,107,53,.14)" }}>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF6B35] opacity-70">Highest Risk Category</span>
              </div>
            </div>

            {/* Row 1: PERMITS + INSURANCE */}
            {CATEGORIES.slice(1, 3).map((c, i) => (
              <div
                key={c.label}
                className="lg:col-span-4 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{
                  background: "#0F1624",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderTop: `3px solid ${c.color}`,
                  borderRadius: 14,
                  boxShadow: "0 4px 16px rgba(0,0,0,.2)",
                  animationDelay: `${(i + 1) * 0.07}s`,
                }}
              >
                <div>
                  <div
                    className="w-9 h-9 rounded-lg grid place-items-center mb-4"
                    style={{ background: `${c.color}16`, border: `1px solid ${c.color}40` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  </div>
                  <div className="text-[13px] font-bold text-[#F0F4F8] uppercase tracking-widest mb-1">{c.label}</div>
                  <div className="text-[18px] font-black mb-2" style={{ color: c.color }}>{c.count}</div>
                </div>
                <div className="text-[13px] text-[#6A7A8A] leading-relaxed">{c.desc}</div>
              </div>
            ))}

            {/* Row 2: COMPLIANCE + DEADLINES + EXPOSURE (3 slim cards) */}
            {CATEGORIES.slice(3, 6).map((c, i) => (
              <div
                key={c.label}
                className={`${i < 2 ? "lg:col-span-4" : "lg:col-span-3"} p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-default`}
                style={{
                  background: "#0F1624",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderTop: `3px solid ${c.color}`,
                  borderRadius: 14,
                  boxShadow: "0 4px 16px rgba(0,0,0,.2)",
                  animationDelay: `${(i + 3) * 0.07}s`,
                }}
              >
                <div>
                  <div
                    className="w-8 h-8 rounded-lg grid place-items-center mb-3"
                    style={{ background: `${c.color}16`, border: `1px solid ${c.color}40` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  </div>
                  <div className="text-[12px] font-bold text-[#F0F4F8] uppercase tracking-widest mb-1">{c.label}</div>
                  <div className="text-[16px] font-black mb-2" style={{ color: c.color }}>{c.count}</div>
                </div>
                <div className="text-[12px] text-[#6A7A8A] leading-relaxed">{c.desc}</div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* Social Proof Trust Bar */}
      <div style={{ background: "#060A12", borderTop: "1px solid rgba(255,255,255,.05)", borderBottom: "1px solid rgba(255,255,255,.05)" }}
        className="py-10 px-6 sm:px-12 md:px-20">
        <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left">
            <div className="text-[11px] font-bold text-[#4A5568] uppercase tracking-widest mb-1">Businesses Protected</div>
            <div className="text-[32px] font-black tracking-tight text-[#F0F4F8]">
              127<span className="text-[#F5A623]">+</span>
            </div>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,.07)] hidden sm:block" />
          <div className="text-center">
            <div className="text-[11px] font-bold text-[#4A5568] uppercase tracking-widest mb-1">Deadlines Tracked</div>
            <div className="text-[32px] font-black tracking-tight text-[#F0F4F8]">
              4,800<span className="text-[#00C8F0]">+</span>
            </div>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,.07)] hidden sm:block" />
          <div className="text-center">
            <div className="text-[11px] font-bold text-[#4A5568] uppercase tracking-widest mb-1">Avg Setup Time</div>
            <div className="text-[32px] font-black tracking-tight text-[#F0F4F8]">
              &lt; 2<span className="text-[#00E676] text-xl font-bold ml-1">min</span>
            </div>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,.07)] hidden sm:block" />
          <div className="text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-end gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#F5A623"><path d="M7 1l1.5 3.5L12 5l-2.5 2.5.6 3.5L7 9.3 3.9 11 4.5 7.5 2 5l3.5-.5z"/></svg>
              ))}
            </div>
            <div className="text-[13px] font-semibold text-[#F0F4F8]">4.9 / 5</div>
            <div className="text-[11px] text-[#4A5568]">avg customer rating</div>
          </div>
        </div>
      </div>

      {/* Daily Command Loop */}
      <section id="workflow" className="py-24 px-6 sm:px-12 md:px-20" style={{ background: "#050709" }}>
        <div className="max-w-[960px] mx-auto">
          <div className="text-[11px] font-bold text-[#00C8F0] uppercase tracking-[0.22em] mb-4">
            Daily Command Loop
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[42px] font-bold tracking-[-0.03em] mb-14 max-w-[520px] leading-[1.08] text-[#F0F4F8]">
            Four steps to a<br />protected business.
          </h2>

          {/* Steps with connector line on desktop */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Connector line — desktop only */}
            <div
              className="absolute hidden lg:block top-[44px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px"
              style={{ background: "linear-gradient(90deg, rgba(245,166,35,.3) 0%, rgba(0,200,240,.3) 50%, rgba(0,230,118,.3) 100%)" }}
            />

            {STEPS.map((s, i) => (
              <div
                key={i}
                className="relative py-7 px-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: "#0A0E18",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 14,
                  borderTop: `3px solid ${s.color}`,
                  boxShadow: "0 4px 20px rgba(0,0,0,.2)",
                }}
              >
                {/* Step number circle */}
                <div
                  className="w-11 h-11 rounded-full grid place-items-center mb-5 text-[13px] font-black"
                  style={{
                    background: `${s.color}18`,
                    border: `2px solid ${s.color}45`,
                    color: s.color,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.n}
                </div>
                <div className="text-[15px] font-bold mb-2 text-[#F0F4F8]">{s.label}</div>
                <div className="text-[13px] text-[#8898A8] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="coverage"
        className="py-28 px-6 sm:px-12 md:px-20 text-center"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(245,166,35,.06) 0%, transparent 65%), linear-gradient(180deg, #0A0E18 0%, #060A12 100%)",
          borderTop: "1px solid rgba(245,166,35,.18)",
        }}
      >
        <div className="max-w-[600px] mx-auto">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{ background: "rgba(245,166,35,.08)", border: "1px solid rgba(245,166,35,.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
            <span className="text-[10px] font-bold text-[#FFB84D] uppercase tracking-widest">Zero Setup Cost</span>
          </div>

          <div className="flex justify-center mb-6">
            <RadarMark size={64} />
          </div>

          <h2 className="text-[40px] sm:text-[52px] font-black tracking-[-0.04em] mb-4 text-[#F0F4F8] leading-[1.0]">
            Your deadlines won't<br /><span className="text-[#F5A623]">wait for you.</span>
          </h2>
          <p className="text-[16px] sm:text-[18px] text-[#8898A8] mb-10 leading-relaxed">
            Every missed deadline costs money, compliance, or leverage.<br />
            DueRadar shows the most dangerous one first — always.
          </p>

          <Link href="/sign-up">
            <button
              className="px-10 py-4 rounded-xl text-[16px] font-black tracking-tight transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
              style={{
                background: "#F5A623",
                color: "#0F0800",
                boxShadow: "0 0 40px rgba(245,166,35,.25), 0 8px 24px rgba(0,0,0,.3)",
              }}
            >
              Start Your Free Warning System →
            </button>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-[12px] text-[#4A5568]">
            <span>✓ No credit card required</span>
            <span>✓ Live in under 2 minutes</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>
    </div>
  );
}
