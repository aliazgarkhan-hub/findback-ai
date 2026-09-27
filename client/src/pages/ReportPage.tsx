import AppShell from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Info, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

const categories = ["Phone", "Laptop", "Wallet", "ID Card", "Bag", "Keys", "Documents", "Electronics", "Accessories", "Other"];

type FormState = { itemName: string; category: string; description: string; location: string; eventAt: string; brand: string; model: string; color: string; features: string; identifier: string; contactPreference: "in_app" | "email" };

function initialForm(): FormState { return { itemName: "", category: "Laptop", description: "", location: "", eventAt: new Date(Date.now() - 86400000).toISOString().slice(0, 16), brand: "", model: "", color: "", features: "", identifier: "", contactPreference: "in_app" }; }

export default function ReportPage() {
  const [, params] = useRoute("/report/:type");
  const [, navigate] = useLocation();
  const { loading } = useAuth();
  const type = params?.type === "found" ? "found" : "lost";
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const upload = trpc.media.upload.useMutation();
  const create = trpc.reports.create.useMutation();

  const update = (key: keyof FormState, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) { setError("Please choose a JPG, PNG, or WEBP image."); return; }
    if (next.size > 5 * 1024 * 1024) { setError("That image is over 5 MB. Choose a smaller file."); return; }
    setError(""); setFile(next);
    const reader = new FileReader(); reader.onload = () => setPreview(String(reader.result ?? "")); reader.readAsDataURL(next);
  };
  const removeFile = () => { setFile(null); setPreview(""); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (!file || !preview) { setError("An item photo is required. Add a clear image so the report can be compared later."); return; }
    if (!form.itemName || !form.description || !form.location || !form.eventAt) { setError("Complete the required fields before submitting."); return; }
    try {
      const stored = await upload.mutateAsync({ dataUrl: preview, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" });
      await create.mutateAsync({ ...form, type, eventAt: new Date(form.eventAt).toISOString(), imageUrl: stored.url, imageKey: stored.key });
      setSuccess(true);
      window.setTimeout(() => navigate("/matches"), 950);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "We couldn’t save that report. Please try again."); }
  };
  const pending = upload.isPending || create.isPending || loading;

  return <AppShell><div className="report-page"><div className="page-header"><div><Link href="/dashboard" className="text-link"><ArrowLeft size={13} /> Back to overview</Link><p className="eyebrow" style={{ marginTop: 20 }}>{type === "lost" ? "01 / Lost item" : "02 / Found item"}</p><h1>{type === "lost" ? "Tell us what went missing." : "Help someone get it back."}</h1><p>{type === "lost" ? "The more you remember, the more useful the comparison becomes." : "A few clear details can turn a found item into a possible match."}</p></div></div>
    {success && <div className="success-banner"><CheckCircle2 size={18} /> Your {type} item has been reported. We’re checking existing reports now.</div>}
    <form onSubmit={submit} className="report-form-layout" noValidate><div className="form-panel"><h2>Report details</h2><div className="form-grid">
      <div className="form-field full"><label htmlFor="itemName">Item name <span>*</span></label><input id="itemName" value={form.itemName} onChange={e => update("itemName", e.target.value)} placeholder={type === "lost" ? "e.g. Black Lenovo laptop" : "e.g. Silver water bottle"} required /></div>
      <div className="form-field"><label htmlFor="category">Category <span>*</span></label><select id="category" value={form.category} onChange={e => update("category", e.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></div>
      <div className="form-field"><label htmlFor="eventAt">Date & time {type === "lost" ? "lost" : "found"} <span>*</span></label><input id="eventAt" type="datetime-local" value={form.eventAt} onChange={e => update("eventAt", e.target.value)} required /></div>
      <div className="form-field full"><label htmlFor="description">Description <span>*</span></label><textarea id="description" value={form.description} onChange={e => update("description", e.target.value)} placeholder="What does it look like? Include the details you would use to recognize it." required /><span className="form-help">Avoid posting sensitive serial numbers publicly; you can keep those for a private conversation.</span></div>
      <div className="form-field full"><label htmlFor="location">{type === "lost" ? "Location last seen" : "Location found"} <span>*</span></label><input id="location" value={form.location} onChange={e => update("location", e.target.value)} placeholder="e.g. Block B · Library entrance" required /></div>
      <div className="form-field"><label htmlFor="brand">Brand</label><input id="brand" value={form.brand} onChange={e => update("brand", e.target.value)} placeholder="e.g. Lenovo" /></div><div className="form-field"><label htmlFor="model">Model</label><input id="model" value={form.model} onChange={e => update("model", e.target.value)} placeholder="e.g. ThinkPad" /></div><div className="form-field"><label htmlFor="color">Color</label><input id="color" value={form.color} onChange={e => update("color", e.target.value)} placeholder="e.g. Black" /></div><div className="form-field"><label htmlFor="identifier">Private identifier</label><input id="identifier" value={form.identifier} onChange={e => update("identifier", e.target.value)} placeholder="Optional — not shown publicly" /></div>
      <div className="form-field full"><label htmlFor="features">Distinguishing features</label><textarea id="features" value={form.features} onChange={e => update("features", e.target.value)} placeholder="Stickers, scratches, case, engraving, accessories…" /></div>
      <div className="form-field full"><span className="field-label">How should people reach you?</span><select aria-label="Contact preference" value={form.contactPreference} onChange={e => update("contactPreference", e.target.value as FormState["contactPreference"])}><option value="in_app">In-app messages only (recommended)</option><option value="email">Email notifications, with conversation in-app</option></select></div>
    </div><div className="form-actions"><Link href="/dashboard" className="button button-secondary">Cancel</Link><button className="button button-primary" disabled={pending}>{pending ? <><LoaderCircle size={15} className="spin" /> {upload.isPending ? "Uploading image…" : "Analyzing reports…"}</> : <>Submit report <ArrowRight size={15} /></>}</button></div>{error && <div className="error-banner" role="alert">{error}</div>}</div>
    <aside><div className="form-panel"><h2>Item photo <span style={{ color: "var(--orange)" }}>*</span></h2><div className="upload-zone">{preview ? <><img className="preview-image" src={preview} alt="Preview of the item you are reporting" /><button type="button" className="remove-image" aria-label="Remove selected image" onClick={removeFile}><X size={15} /></button></> : <><input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} aria-label="Upload item photo" /><div className="upload-content"><span className="upload-icon"><ImagePlus size={20} /></span><strong>Choose a clear photo</strong><span>JPG, PNG, or WEBP · max 5 MB</span></div></>}</div><div className="form-help" style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10 }}><Info size={12} /> A photo makes future comparisons more useful.</div></div><div className="side-explainer" style={{ marginTop: 16 }}><ShieldCheck size={19} color="var(--green)" /><h3>Private by default.</h3><p>Your personal contact details never appear on the item card.</p><div className="explainer-list"><div><span>01</span><p><strong>Saved securely</strong><br />Your report is visible to your campus network.</p></div><div><span>02</span><p><strong>Compared honestly</strong><br />Scores use the details available on both reports.</p></div><div><span>03</span><p><strong>Contact in-app</strong><br />Ask for a private detail before sharing anything else.</p></div></div></div></aside></form>
  </div></AppShell>;
}
