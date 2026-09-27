import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { ArrowRight, Check, ChevronRight, Clock3, Image, LockKeyhole, MapPin, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";

const steps = [
  { number: "01", label: "Report lost", detail: "Tell us what you remember", icon: "↗" },
  { number: "02", label: "AI compares", detail: "Details, time, place, image", icon: "✦" },
  { number: "03", label: "See why", detail: "A transparent match score", icon: "◎" },
  { number: "04", label: "Connect safely", detail: "Message without exposing contact", icon: "↘" },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="public-page">
      <header className="public-nav container">
        <Link href="/" className="brand-lockup"><span className="brand-icon"><span className="brand-dot" /></span><span>FindBack <em>AI</em></span></Link>
        <nav className="public-links" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#privacy">Privacy first</a><a href="#use-cases">For campuses</a></nav>
        <div className="nav-actions">{user ? <Link href="/dashboard" className="button button-dark button-small">Open dashboard <ArrowRight size={15} /></Link> : <button className="button button-ghost button-small" onClick={() => startLogin()}>Sign in <ArrowRight size={15} /></button>}</div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <p className="eyebrow accent-eyebrow"><span className="live-dot" /> Built for the places you belong</p>
            <h1>Lost something?<br /><span>Let AI help you</span> FindBack.</h1>
            <p className="hero-subtitle">A smarter lost & found for campuses, offices, and communities. Report once. Get clarity on what might be yours. Reach out privately.</p>
            <div className="hero-actions"><Link href="/report/lost" className="button button-primary">Report lost item <ArrowRight size={17} /></Link><Link href="/report/found" className="button button-secondary">Report found item</Link></div>
            <div className="hero-trust"><ShieldCheck size={16} /><span>Private contact · explainable matches · community-first</span></div>
          </div>
          <div className="hero-visual" aria-label="FindBack AI matching process demonstration">
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="match-panel">
              <div className="panel-topline"><span className="status-pill"><span className="status-dot" /> Matching engine</span><span className="mono">LIVE / READY</span></div>
              <div className="match-header"><div><span className="eyebrow">Possible match</span><h2>What could be yours?</h2></div><Sparkles size={22} className="spark-icon" /></div>
              <div className="item-compare"><div className="item-card lost-card"><div className="mini-image laptop-image"><span className="image-tag">LOST</span><div className="laptop-screen" /></div><div className="item-card-copy"><strong>Black laptop</strong><span><MapPin size={12} /> Block B</span></div></div><div className="compare-line"><span>AI</span><div /></div><div className="item-card found-card"><div className="mini-image found-image"><span className="image-tag found">FOUND</span><div className="laptop-screen" /></div><div className="item-card-copy"><strong>Black laptop</strong><span><Clock3 size={12} /> 18 hrs apart</span></div></div></div>
              <div className="analysis-preview"><div className="analysis-top"><span>Analysis signals</span><span className="mono muted-mono">SCORE AFTER REPORTS</span></div><div className="signal-row"><span><Check size={14} /> Category</span><strong>Exact</strong></div><div className="signal-row"><span><Check size={14} /> Location</span><strong>Nearby</strong></div><div className="signal-row"><span><Check size={14} /> Description</span><strong>Similar terms</strong></div></div>
              <div className="panel-foot"><span><LockKeyhole size={13} /> No personal contact details shown</span><span className="arrow-chip">↗</span></div>
            </div>
            <div className="floating-label label-one"><span className="label-icon"><ScanSearch size={14} /></span><div><strong>Explainable by design</strong><small>Every signal is visible</small></div></div>
            <div className="floating-label label-two"><span className="label-icon orange"><Image size={14} /></span><div><strong>Image-aware</strong><small>Plug in visual matching later</small></div></div>
          </div>
        </section>

        <section className="steps-section container" id="how-it-works"><div className="section-kicker"><span>01 — The simple loop</span><span>FindBack AI / 2026</span></div><div className="steps-grid">{steps.map(step => <div className="step" key={step.number}><div className="step-number">{step.number}</div><div className="step-icon">{step.icon}</div><h3>{step.label}</h3><p>{step.detail}</p></div>)}</div></section>

        <section className="why-section container"><div className="why-intro"><p className="eyebrow">Why FindBack AI</p><h2>The fastest path from<br /><em>“I hope it’s mine”</em> to certainty.</h2><p>Most lost & found systems stop at a form. FindBack goes further: it turns scattered memories into a clear, explainable next step.</p></div><div className="why-grid"><div className="why-card orange-card"><Sparkles size={20} /><h3>Matching that shows its work.</h3><p>Scores come from the details people actually share: category, brand, color, time, place, and description.</p><span className="card-index">A / 01</span></div><div className="why-card dark-card"><LockKeyhole size={20} /><h3>Contact without the awkwardness.</h3><p>Ask about a sticker, case, or detail in-app. Email and phone stay off the item card.</p><span className="card-index">B / 02</span></div><div className="why-card pale-card"><MapPin size={20} /><h3>Designed for real communities.</h3><p>Start with one campus or office. Keep the signal local, relevant, and useful.</p><span className="card-index">C / 03</span></div></div></section>

        <section className="privacy-section" id="privacy"><div className="container privacy-inner"><div><p className="eyebrow">Trust is a feature</p><h2>Useful to the finder.<br /><span>Safe for the owner.</span></h2></div><div className="privacy-points"><div><ShieldCheck size={19} /><p><strong>Private by default</strong><br />Your contact preference stays yours.</p></div><div><ScanSearch size={19} /><p><strong>Transparent analysis</strong><br />No black-box “guaranteed probability.”</p></div><div><Clock3 size={19} /><p><strong>Less noise</strong><br />Focus on the reports that matter.</p></div></div></div></section>

        <section className="use-cases container" id="use-cases"><div className="section-kicker"><span>02 — One idea, many places</span><span>Campus · office · airport · community</span></div><div className="use-cases-content"><h2>Good things get<br /><em>found</em> faster together.</h2><div className="use-case-list"><div><span className="mono">01</span><p><strong>Campus life</strong> / IDs, laptops, keys, and that water bottle from the studio.</p><ChevronRight size={17} /></div><div><span className="mono">02</span><p><strong>Workplace</strong> / Keep shared spaces moving without a public contact list.</p><ChevronRight size={17} /></div><div><span className="mono">03</span><p><strong>Controlled communities</strong> / Start small, keep the network relevant.</p><ChevronRight size={17} /></div></div></div></section>

        <section className="cta-band container"><div><p className="eyebrow">Ready when you are</p><h2>Make the next report<br />the one that works.</h2></div><Link href="/report/lost" className="button button-primary button-large">Start a lost report <ArrowRight size={18} /></Link></section>
      </main>
      <footer className="public-footer container"><span className="brand-lockup"><span className="brand-icon"><span className="brand-dot" /></span><span>FindBack <em>AI</em></span></span><span>Lost something? Let AI help you FindBack.</span><span className="mono">BUILT FOR BELONGING / 2026</span></footer>
    </div>
  );
}
