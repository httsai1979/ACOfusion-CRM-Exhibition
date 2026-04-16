import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, 
  CloudOff, RefreshCw, X, Menu, Briefcase, Info, List, Save,
  Globe, CreditCard, Ship, BadgeCheck, FileSpreadsheet, Send, Zap,
  MonitorPlay, Minus, Edit3, Clipboard, FileUp, Percent, Clock, Smartphone
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

/**
 * ACOfusion Enterprise CRM v9.5 - Global Standard
 * Optimized for English Schema & Production Reliability.
 */

const CONFIG = {
  VERSION: '9.5.0-GLOBAL',
  LOGO: 'https://www.acofusion.com/wp-content/uploads/2021/04/ACOfusion-Logo-White.png',
  CURRENCIES: [
    { code: 'USD', symbol: '$', vat: 0, label: 'USD (Foreign)' },
    { code: 'EUR', symbol: '€', vat: 0, label: 'EUR (Europe)' },
    { code: 'RMB', symbol: '¥', vat: 13, label: 'RMB (CN VAT)' },
    { code: 'TWD', symbol: 'NT$', vat: 5, label: 'TWD (TW VAT)' }
  ],
  DEFAULT_PRODUCTS: [
    { id: 'DP-1', name: "Architectural Wall Washer M1632", wattage: "36W", cct: "RGBW", ip: "66", beamAngle: "15x30°", price: "155", moq: "5" }
  ]
};

// --- API Helper ---
const apiFetch = async (url, action, payload = {}, apiToken) => {
  if (!url) throw new Error('GAS URL MISSING');
  const body = { action, token: apiToken, ...payload };
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
  return res.json();
};

const ProQuotationForm = memo(({ items, onUpdate, client, products, onPush }) => {
  const [formConfig, setFormConfig] = useState({
    currency: 'USD', incoterms: 'FOB', paymentTerms: '30% Deposit / 70% Balance', 
    warranty: '5 Years', shippingPort: 'Shenzhen, China', version: '1'
  });

  const currentCurrency = CONFIG.CURRENCIES.find(c => c.code === formConfig.currency);
  const pdfRef = useRef(null);
  const subtotal = items.reduce((s, i) => s + ((i.qty || 1) * (i.price || 0)), 0);
  const taxAmount = (subtotal * (currentCurrency.vat / 100));
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
      <aside className="w-full md:w-[420px] border-b md:border-b-0 md:border-r border-white/5 bg-slate-900/40 p-6 space-y-6 overflow-y-auto scrollbar-hide">
         <div className="bg-slate-900 border border-white/10 p-6 rounded-[2.5rem] border-l-[12px] border-sky-400">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lead Protocol</h4>
            <p className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">{client?.company || 'No Account Selected'}</p>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-[9px] font-black text-slate-500 uppercase ml-2">Commercial Strategy</label>
            <select className="col-span-2 bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-white" value={formConfig.currency} onChange={e=>setFormConfig({...formConfig, currency: e.target.value})}>{CONFIG.CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
            <select className="bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-white" value={formConfig.incoterms} onChange={e=>setFormConfig({...formConfig, incoterms: e.target.value})}>{['EXW', 'FOB', 'CIF', 'DDP'].map(i => <option key={i} value={i}>{i}</option>)}</select>
            <input className="bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-white" value={formConfig.version} onChange={e=>setFormConfig({...formConfig, version: e.target.value})} placeholder="Vn" />
            <select className="col-span-2 bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-white" value={formConfig.warranty} onChange={e=>setFormConfig({...formConfig, warranty: e.target.value})}>{['2 Years', '3 Years', '5 Years'].map(w => <option key={w} value={w}>{w} Warranty</option>)}</select>
         </div>
         <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Product Catalog</h4>
            {products.map(p => (
              <button key={p.id} onClick={() => onUpdate([...items, { ...p, qty: 1, price: p.price || 0, notes: '' }])} className="w-full flex justify-between items-start p-5 bg-slate-950 border border-white/5 rounded-[2rem] hover:border-sky-500 transition-all text-left">
                 <div><p className="text-xs font-black text-white uppercase">{p.name}</p><p className="text-[8px] text-slate-500 mt-1 uppercase">{p.id} | {p.wattage} | {p.ip}</p></div>
                 <div className="text-sky-500 font-black text-xs">${p.price}</div>
              </button>
            ))}
         </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
         <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-hide">
            <div ref={pdfRef} className="bg-white w-full md:w-[210mm] min-h-[297mm] p-[15mm] md:p-[20mm] mx-auto shadow-2xl text-slate-950 text-[10px] rounded-sm">
               <header className="flex justify-between items-start border-b-[8px] border-slate-950 pb-8 mb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center font-black text-4xl text-sky-400 italic">A</div>
                     <div><h1 className="text-3xl font-black uppercase italic leading-none">ACOfusion</h1><p className="text-[9px] font-black text-sky-600 uppercase tracking-[0.5em] mt-1 italic">Industrial Lighting</p></div>
                  </div>
                  <div className="text-right">
                     <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-slate-100">QUOTATION</h2>
                     <p className="font-mono text-slate-400 mt-3 font-bold italic border-b border-slate-100 pb-1">[ACO-QT]-{client?.company || 'Draft'}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}-V{formConfig.version}</p>
                  </div>
               </header>
               <table className="w-full">
                  <thead><tr className="bg-slate-950 text-white text-[9px] uppercase tracking-widest font-black"><th className="p-4 text-left">Spec Configuration</th><th className="p-4 text-center">Qty</th><th className="p-4 text-center">Rate</th><th className="p-4 text-right">Amount</th></tr></thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-b border-slate-50">
                        <td className="p-5">
                           <p className="font-black text-sm uppercase">{it.name}</p>
                           <p className="text-[8px] text-slate-400 font-mono mt-1 uppercase">{it.id} | {it.wattage} | {it.cct} | {it.ip}</p>
                           <input className="text-[8px] mt-2 text-sky-600 border-none outline-none w-full italic" placeholder="Add custom notes..." value={it.notes} onChange={e=>{const n=[...items]; n[idx].notes=e.target.value; onUpdate(n)}} />
                        </td>
                        <td className="p-5 text-center">
                           <div className="inline-flex items-center gap-2">
                              <button onClick={()=>{const n=[...items]; n[idx].qty=Math.max(1,(n[idx].qty||1)-1); onUpdate(n)}} className="text-slate-300 print:hidden font-black">-</button>
                              <span className="font-black w-6 text-sm italic">{it.qty || 1}</span>
                              <button onClick={()=>{const n=[...items]; n[idx].qty=(n[idx].qty||1)+1; onUpdate(n)}} className="text-slate-300 print:hidden font-black">+</button>
                           </div>
                        </td>
                        <td className="p-5 text-center font-bold text-sm italic">{it.price}</td>
                        <td className="p-5 text-right font-black text-base italic">${((it.qty||1)*(it.price||0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
               <div className="mt-20 flex flex-col md:flex-row justify-between gap-12 pt-10 border-t-8 border-slate-900">
                  <div className="flex-1 space-y-2 text-[9px] font-bold text-slate-600 uppercase">
                     <p><span className="text-slate-300">Incoterms:</span> {formConfig.incoterms} / {formConfig.shippingPort}</p>
                     <p><span className="text-slate-300">Payment Terms:</span> {formConfig.paymentTerms}</p>
                     <p><span className="text-slate-300">Warranty:</span> {formConfig.warranty}</p>
                  </div>
                  <div className="w-72 space-y-2 text-right">
                     <div className="flex justify-between text-slate-400 font-black uppercase text-[9px] tracking-widest"><span>Contract Total</span><span>${subtotal.toFixed(2)}</span></div>
                     <div className="flex justify-between text-slate-400 font-black uppercase text-[9px] tracking-widest"><span>Industrial VAT ({currentCurrency.vat}%)</span><span>${taxAmount.toFixed(2)}</span></div>
                     <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl mt-4">
                        <span className="text-[10px] font-black uppercase text-slate-400">GRAND TOTAL</span>
                        <span className="text-4xl font-black italic">{currentCurrency.symbol} {grandTotal.toFixed(2)}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <footer className="h-24 bg-slate-900 border-t border-white/5 flex items-center justify-end px-12 gap-4">
            <button onClick={async () => {
               const opt = { margin: 0, html2canvas: { scale: 3 }, jsPDF: { unit: 'mm', format: 'a4' } };
               const pdfBlob = await html2pdf().set(opt).from(pdfRef.current).outputPdf('blob');
               const reader = new FileReader();
               reader.readAsDataURL(pdfBlob);
               reader.onloadend = () => onPush({ ...formConfig, total: grandTotal, company: client.company }, reader.result);
            }} className="bg-sky-500 text-slate-950 px-12 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-2"><CloudOff size={18}/> Push to Cloud</button>
            <button onClick={()=>html2pdf().from(pdfRef.current).save(`[ACO-QT]-${client.company}.pdf`)} className="bg-white/5 text-white px-12 py-4 rounded-3xl font-black text-xs uppercase tracking-widest border border-white/5"><Printer size={18}/> Print Local</button>
         </footer>
      </main>
    </div>
  );
});

export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [isSimMode, setIsSimMode] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v95');
    if (saved) return JSON.parse(saved);
    return { gasUrl: '', apiToken: 'ACOFUSION_SECRET_TOKEN_2024', products: [], contacts: [], deals: [], activities: [] };
  });

  const [selectedContact, setSelectedContact] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const refreshData = useCallback(async () => {
    if (!sysConfig.gasUrl && !isSimMode) return;
    setCloudStatus({ loading: true, msg: 'Syncing Industrial Backbone...' });
    try {
      if (isSimMode) {
        setSysConfig(prev=>({...prev, products: CONFIG.DEFAULT_PRODUCTS, contacts: [{id:'D-1', company:'Demo Corp', name:'John Doe', email:'john@demo.com'}], activities: []}));
        setCloudStatus({ loading: false, msg: 'Simulated Environment Ready' });
      } else {
        const p = await apiFetch(sysConfig.gasUrl, 'getProducts', {}, sysConfig.apiToken);
        const c = await apiFetch(sysConfig.gasUrl, 'getContacts', {}, sysConfig.apiToken);
        const a = await apiFetch(sysConfig.gasUrl, 'getActivities', {}, sysConfig.apiToken);
        setSysConfig(prev=>({...prev, products: p.data||[], contacts: c.data||[], activities: a.data||[]}));
        setCloudStatus({ loading: false, msg: 'Flagship Synchronized' });
      }
    } catch (e) { setCloudStatus({ loading: false, msg: 'Connect Failed' }); }
  }, [sysConfig.gasUrl, isSimMode]);

  useEffect(() => { refreshData(); }, [isSimMode]);

  const runInitialization = async () => {
    setCloudStatus({ loading: true, msg: 'PROVISIONING CRM INFRASTRUCTURE...' });
    try {
      const res = await apiFetch(sysConfig.gasUrl, 'initialize_sheets', {}, sysConfig.apiToken);
      setCloudStatus({ loading: false, msg: res.message || 'Infrastructure Ready' });
      refreshData();
    } catch (e) { setCloudStatus({ loading: false, msg: 'Initialization Failed' }); }
  };

  const [scanPreview, setScanPreview] = useState(null);

  const handleScanCard = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCloudStatus({ loading: true, msg: 'GEMINI 2.0 ANALYZING...' });
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await apiFetch(sysConfig.gasUrl, 'scan_business_card', { imageBase64: reader.result }, sysConfig.apiToken);
        if (res.success) {
          setScanPreview(res.contact);
          setCloudStatus({ loading: false, msg: 'SCAN COMPLETE' });
        } else { setCloudStatus({ loading: false, msg: `OCR Error: ${res.message}` }); }
      } catch (err) { setCloudStatus({ loading: false, msg: 'SCAN FAILED' }); }
    };
    reader.readAsDataURL(file);
  };

  const confirmScanSync = async () => {
    setCloudStatus({ loading: true, msg: 'SYNCING TO CLOUD & PHONE...' });
    try {
      await apiFetch(sysConfig.gasUrl, 'sync_lead', { lead: scanPreview }, sysConfig.apiToken);
      setScanPreview(null);
      setCloudStatus({ loading: false, msg: 'CONTACT SECURED' });
      refreshData();
    } catch (e) { setCloudStatus({ loading: false, msg: 'SYNC FAILED' }); }
  };

  const handlePushQuote = async (quote, pdfBase64) => {
    setCloudStatus({ loading: true, msg: 'ARCHIVING TO GOOGLE DRIVE...' });
    try {
      const res = await apiFetch(sysConfig.gasUrl, 'save_quotation', { quotation: quote, pdfBase64 }, sysConfig.apiToken);
      if (res.success) {
        setCloudStatus({ loading: false, msg: 'QUOTE SECURED & SYNCED' });
        // Auto prep for email
        if(window.confirm("Quotation archived. Dispatch via James@acofusion.com now?")) {
           setCloudStatus({ loading: true, msg: 'SENDING OFFICIAL MAIL...' });
           await apiFetch(sysConfig.gasUrl, 'send_email', { 
             emailData: { to: selectedContact.email, subject: `[ACO-QT] Quotation for ${quote.company}`, message: 'Please see attached.', pdfLink: res.pdfLink }
           }, sysConfig.apiToken);
           setCloudStatus({ loading: false, msg: 'MAIL DISPATCHED' });
        }
        refreshData();
      }
    } catch (e) { setCloudStatus({ loading: false, msg: 'ARCHIVE FAILED' }); }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      <nav className="h-20 bg-slate-900 border-b border-white/5 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center font-black text-slate-950 italic text-2xl shadow-2xl">A</div>
          <div><h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">ACOfusion</h1><p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mt-1">Global CRM v9.5</p></div>
        </div>
        <div className="flex bg-slate-950 rounded-2xl p-1 gap-1 border border-white/10">
           {['crm', 'quote', 'settings'].map(t => (
             <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${activeTab === t ? 'bg-sky-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}>
                {t}
             </button>
           ))}
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'crm' && (
           <div className="flex-1 flex overflow-hidden">
              <aside className="w-96 border-r border-white/5 flex flex-col bg-slate-950">
                 <div className="p-6 space-y-4">
                    <input type="file" ref={fileInputRef} onChange={handleScanCard} accept="image/*" className="hidden" />
                    <button onClick={()=>fileInputRef.current.click()} className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"><Camera size={20}/> AI Card Scanner</button>
                    <button onClick={()=>{const i=document.createElement('input');i.type='file';i.accept='.csv';i.onchange=handleCsvUpload;i.click();}} className="w-full bg-slate-900 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">Local CSV Import</button>
                 </div>
                 <div className="flex-1 overflow-y-auto px-6 space-y-3">
                    {sysConfig.contacts.map(c => (
                       <div key={c.id} onClick={() => setSelectedContact(c)} className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer ${selectedContact?.id === c.id ? 'bg-sky-500/10 border-sky-500' : 'bg-slate-900/40 border-white/5'}`}>
                          <p className="font-black text-white text-base leading-none mb-2 truncate uppercase italic">{c.company}</p>
                          <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.name}</span><BadgeCheck size={16} className="text-sky-500"/></div>
                       </div>
                    ))}
                 </div>
              </aside>
              <section className="flex-1 bg-slate-950 p-16 overflow-y-auto relative">
                 {selectedContact ? (
                   <div className="max-w-4xl mx-auto space-y-16 animate-in slide-in-from-bottom-10">
                      <div className="flex justify-between items-start">
                         <div><p className="text-sky-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4 italic">Manufacturing Lead Profile</p><h2 className="text-7xl font-black text-white tracking-tighter leading-none italic">{selectedContact.company}</h2></div>
                         <button onClick={()=>setActiveTab('quote')} className="bg-white text-slate-950 px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-sky-400 transition-all shadow-2xl">Start Protocol</button>
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-10"><img src={CONFIG.LOGO} alt="Logo" className="w-[40rem] grayscale contrast-[150%]" /></div>
                 )}
              </section>
           </div>
        )}

        {activeTab === 'quote' && (
           <ProQuotationForm client={selectedContact} items={quoteItems} onUpdate={setQuoteItems} 
             products={sysConfig.products} onPush={handlePushQuote} />
        )}

        {activeTab === 'settings' && (
           <div className="flex-1 p-24 overflow-y-auto">
              <div className="max-w-xl mx-auto space-y-8">
                 <div className="bg-slate-900 p-12 rounded-[4rem] border border-white/10 space-y-10 shadow-2xl">
                    <h2 className="text-2xl font-black text-white italic flex items-center gap-4"><Settings className="text-sky-500"/> INFRASTRUCTURE</h2>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between p-6 bg-slate-950 border border-white/5 rounded-3xl">
                          <div><p className="text-xs font-black text-white uppercase italic">Simulation Protocol</p><p className="text-[10px] text-slate-500 uppercase mt-1">Enable Offline Development</p></div>
                          <button onClick={()=>setIsSimMode(!isSimMode)} className={`w-14 h-7 rounded-full relative transition-all ${isSimMode ? 'bg-sky-500' : 'bg-slate-800'}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${isSimMode ? 'left-8' : 'left-1'}`}/></button>
                       </div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-4">GAS Endpoint Protocol</label><input className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-xs font-mono text-sky-400" value={sysConfig.gasUrl} onChange={e=>setSysConfig({...sysConfig, gasUrl: e.target.value})} placeholder="https://script.google.com/.../exec" /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <button onClick={runInitialization} className="bg-slate-800 text-white py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">Initialize Structure</button>
                          <button onClick={async () => {
                             setCloudStatus({ loading: true, msg: 'RUNNING AI GMAIL AUDIT...' });
                             await apiFetch(sysConfig.gasUrl, 'trigger_email_process', {}, sysConfig.apiToken);
                             setCloudStatus({ loading: false, msg: 'AUDIT COMPLETE' });
                             refreshData();
                          }} className="bg-sky-500 text-slate-950 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-sky-500/20 active:scale-95 transition-all">Run AI Audit</button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>

      {scanPreview && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
           <div className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[4rem] overflow-hidden p-12 space-y-8 shadow-2xl">
              <h3 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-4"><Zap className="text-sky-500"/> AI EXTRACTION</h3>
              <div className="space-y-6">
                 {['company', 'name', 'email', 'phone', 'jobTitle'].map(field => (
                   <div key={field} className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">{field}</label>
                      <input className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-sm text-white focus:border-sky-500 transition-all outline-none" value={scanPreview[field] || ''} onChange={e=>setScanPreview({...scanPreview, [field]: e.target.value})} />
                   </div>
                 ))}
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={()=>setScanPreview(null)} className="flex-1 bg-white/5 text-white py-6 rounded-3xl font-black uppercase text-xs">Discard</button>
                 <button onClick={confirmScanSync} className="flex-2 bg-sky-500 text-slate-950 py-6 px-12 rounded-[2.5rem] font-black uppercase text-xs shadow-2xl shadow-sky-500/20">Secure & Sync</button>
              </div>
           </div>
        </div>
      )}
      {cloudStatus.msg && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-5">
           <div className="flex items-center gap-5 bg-slate-900 border border-sky-500/30 px-10 py-5 rounded-full shadow-2xl">
              {cloudStatus.loading ? <Loader2 size={18} className="animate-spin text-sky-400" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
              <span className="text-[10px] font-black uppercase tracking-widest text-white italic font-mono">{cloudStatus.msg}</span>
           </div>
        </div>
      )}
    </div>
  );
}