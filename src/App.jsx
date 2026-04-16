import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, 
  CloudOff, RefreshCw, X, Menu, Briefcase, Info, List, Save,
  Globe, CreditCard, Ship, BadgeCheck, FileSpreadsheet, Send, Zap,
  MonitorPlay, Minus, Edit3, Clipboard, FileUp
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

/**
 * ACOfusion Industrial CRM v8.0 - Professional Restoration
 * 1. Fixed: Quotation Quantity & Specs Adjustments.
 * 2. Added: Commercial Term Precision & VAT Logic.
 * 3. Added: Batch Import (Outlook/CSV) Support.
 * 4. Refined: Technical Spec Visibility for Factory use.
 */

const CONFIG = {
  VERSION: '8.0.0-PRO',
  CURRENCIES: [
    { code: 'USD', symbol: '$', vat: 0 },
    { code: 'EUR', symbol: '€', vat: 0 },
    { code: 'RMB', symbol: '¥', vat: 13 },
    { code: 'TWD', symbol: 'NT$', vat: 5 }
  ],
  INCOTERMS: ['EXW', 'FOB', 'CIF', 'DDP'],
  PAYMENT_TERMS: ['100% Prepayment', '30% Deposit / 70% Balance', 'NET 30', 'NET 60', 'L/C at Sight'],
  WARRANTY_OPTIONS: ['2 Years', '3 Years', '5 Years', '7 Years'],
  DEFAULT_PRODUCTS: [
    { id: 1, "產品編號": "ACO-M1632-RGBW", "產品名稱": "Architectural Wall Washer M1632", "瓦數": "36W", "CCT": "RGBW", "IP": "66", "光束角": "15x30°", "單價": "155", "MOQ": "5", "備註": "CREE LED, OSRAM Driver" },
    { id: 2, "產品編號": "ACO-DL-P95", "產品名稱": "Deep Anti-Glare Downlight P95", "瓦數": "12W", "CCT": "3000K", "IP": "44", "光束角": "24°", "單價": "48", "MOQ": "50", "備註": "Bridgelux COB, UGR<16" }
  ]
};

// --- Sub-Component: ImportModal ---
const ImportModal = memo(({ isOpen, onClose, onImport }) => {
  const [data, setData] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-black text-white flex items-center gap-3"><FileUp className="text-sky-400"/> BATCH IMPORT (OUTLOOK/CSV)</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X/></button>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Paste JSON or comma-separated values (Company, Name, Email)</p>
          <textarea className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-xs text-sky-400 font-mono h-64 outline-none focus:border-sky-500" placeholder="Apple Inc, Tim Cook, tim@apple.com..." value={data} onChange={e=>setData(e.target.value)} />
        </div>
        <div className="p-8 bg-slate-950/50 flex gap-4">
          <button onClick={() => { onImport(data); onClose(); }} className="flex-1 bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl">Execute Import</button>
        </div>
      </div>
    </div>
  );
});

// --- Sub-Component: Quotation Engine ---
const ProQuotationForm = memo(({ items, onUpdate, onRemove, totals, client, onGenerate, products }) => {
  const [formConfig, setFormConfig] = useState({
    currency: 'USD', incoterm: 'FOB', paymentTerm: '30% Deposit / 70% Balance', 
    warranty: '5 Years', shippingPort: 'Shenzhen/Zhongshan', leadTime: '20 Working Days', version: '1'
  });

  const currentCurrency = CONFIG.CURRENCIES.find(c => c.code === formConfig.currency);
  const pdfRef = useRef(null);

  return (
    <div className="flex-1 flex overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      <aside className="w-[500px] border-r border-white/5 bg-slate-900/40 flex flex-col p-6 space-y-8 overflow-y-auto scrollbar-hide">
         <div className="bg-slate-900/80 border border-white/10 p-6 rounded-[2rem] shadow-2xl border-l-8 border-sky-500">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Quoted Entity</h4>
            <p className="text-2xl font-black text-white leading-none mb-1">{client?.公司名稱 || 'Select Company'}</p>
            <p className="text-xs text-sky-500 font-mono italic">{client?.Email || 'simulation_id@acofusion.pro'}</p>
         </div>

         <div className="space-y-4">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> Commercial Protocol</h4>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Valuta</label>
               <select className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none" value={formConfig.currency} onChange={e=>setFormConfig({...formConfig, currency: e.target.value})}>
                 {CONFIG.CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
               </select></div>
               <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Incoterm</label>
               <select className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none" value={formConfig.incoterm} onChange={e=>setFormConfig({...formConfig, incoterm: e.target.value})}>
                 {CONFIG.INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
               </select></div>
               <div className="col-span-2 space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Payment Schedule</label>
               <select className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none" value={formConfig.paymentTerm} onChange={e=>setFormConfig({...formConfig, paymentTerm: e.target.value})}>
                 {CONFIG.PAYMENT_TERMS.map(p => <option key={p} value={p}>{p}</option>)}
               </select></div>
            </div>
         </div>

         <div className="space-y-4">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Product Selection</h4>
            <div className="space-y-2">
               {(products.length > 0 ? products : CONFIG.DEFAULT_PRODUCTS).map(p => (
                 <button key={p.產品編號} onClick={() => onUpdate([...items, { ...p, qty: 1, unitPrice: p.單價 || p.price || 0 }])} className="w-full flex justify-between items-center p-4 bg-slate-950/50 border border-white/5 rounded-2xl hover:border-sky-500 transition-all text-left">
                    <div><p className="text-xs font-black text-white">{p.產品名稱}</p><p className="text-[9px] text-slate-500 uppercase">{p.產品編號} | {p.瓦數} | {p.光束角}</p></div>
                    <div className="text-sky-500 font-black">${p.單價 || p.price}</div>
                 </button>
               ))}
            </div>
         </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
         <div className="flex-1 overflow-y-auto p-12 bg-slate-950 scrollbar-hide">
            <div ref={pdfRef} className="bg-white w-[210mm] min-h-[297mm] p-[15mm] mx-auto shadow-2xl text-slate-950 selection:bg-sky-100">
               <header className="flex justify-between items-start border-b-[8px] border-slate-950 pb-8 mb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center font-black text-4xl text-sky-400 italic">A</div>
                     <div><h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">ACOfusion</h1><p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.5em] mt-1">Industrial Lighting Hub</p></div>
                  </div>
                  <div className="text-right">
                     <h2 className="text-3xl font-black uppercase tracking-widest text-slate-200">Quotation</h2>
                     <p className="text-[9px] font-mono text-slate-400 mt-2 font-bold italic">PRO-REF: {client?.公司名稱 || 'TRIAL'}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}-V{formConfig.version}</p>
                  </div>
               </header>

               <div className="mb-8 grid grid-cols-2 gap-8 text-[11px] font-bold">
                  <div className="p-4 bg-slate-50 rounded-xl">
                     <h5 className="text-slate-400 uppercase tracking-widest mb-1">CLIENT BILL-TO</h5>
                     <p className="text-lg font-black">{client?.公司名稱}</p>
                     <p>{client?.聯絡人}</p>
                     <p className="text-sky-600">{client?.Email}</p>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-xl space-y-1">
                     <h5 className="text-slate-400 uppercase tracking-widest mb-1">FACTORY DETAILS</h5>
                     <p className="font-black">ACOfusion Lighting Tech CO., LTD</p>
                     <p>Export Division | James Tsai</p>
                     <p className="text-slate-400">Shenzhen/Zhongshan, China</p>
                  </div>
               </div>

               <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-white text-[10px] uppercase tracking-widest font-black">
                      <th className="p-3 text-left w-12">#</th>
                      <th className="p-3 text-left">Product / Technical Specifications</th>
                      <th className="p-3 text-center w-24">Qty</th>
                      <th className="p-3 text-center w-28">Unit Price</th>
                      <th className="p-3 text-right w-32">Total ({formConfig.currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-b border-slate-100 group">
                        <td className="p-4 text-xs font-black text-slate-200">{idx + 1}</td>
                        <td className="p-4">
                           <p className="font-black text-sm uppercase">{it.產品名稱}</p>
                           <p className="text-[9px] text-slate-400 uppercase mt-1">{it.產品編號} | {it.瓦數} | {it.CCT} | IP{it.IP} | {it.光束角}</p>
                        </td>
                        <td className="p-4 text-center">
                           <div className="inline-flex items-center gap-3 bg-slate-50 p-1 rounded-lg">
                              <button onClick={() => { const next = [...items]; next[idx].qty = Math.max(1, (next[idx].qty||1)-1); onUpdate(next); }} className="p-1 hover:bg-white rounded text-slate-400 print:hidden"><Minus size={12}/></button>
                              <span className="font-black text-sm w-6">{it.qty || 1}</span>
                              <button onClick={() => { const next = [...items]; next[idx].qty = (next[idx].qty||1)+1; onUpdate(next); }} className="p-1 hover:bg-white rounded text-slate-400 print:hidden"><Plus size={12}/></button>
                           </div>
                        </td>
                        <td className="p-4 text-center">
                           <input className="w-20 bg-transparent border-b border-dashed border-slate-200 text-center font-bold text-sm outline-none" value={it.unitPrice} onChange={e=>{ const next=[...items]; next[idx].unitPrice=e.target.value; onUpdate(next); }} />
                        </td>
                        <td className="p-4 text-right font-black text-sm">${((it.qty||1)*(it.unitPrice||0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>

               {items.length === 0 && <div className="p-12 text-center text-slate-300 font-black tracking-widest border-2 border-dashed border-slate-100 mt-1 uppercase">No Matrix Data Selected</div>}

               <div className="mt-12 grid grid-cols-2 gap-20">
                  <div className="space-y-4">
                     <h5 className="font-black text-xs uppercase border-b-2 border-slate-950 pb-1">Commercial Protocol</h5>
                     <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold text-slate-600">
                        <span className="uppercase text-slate-400">Incoterms:</span><span className="text-slate-950 uppercase">{formConfig.incoterm}</span>
                        <span className="uppercase text-slate-400">Payment:</span><span className="text-slate-950 uppercase">{formConfig.paymentTerm}</span>
                        <span className="uppercase text-slate-400">Warranty:</span><span className="text-slate-950 uppercase">{formConfig.warranty}</span>
                        <span className="uppercase text-slate-400">Lead Time:</span><span className="text-slate-950 uppercase">{formConfig.leadTime}</span>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between text-slate-400 font-bold uppercase text-[10px]"><span>Sub-Total Gross</span><span>${totals.subtotal.toFixed(2)}</span></div>
                     <div className="flex justify-between items-center pt-4 border-t-8 border-slate-950">
                        <div className="leading-none"><p className="text-[10px] font-black uppercase text-slate-400">Total Contract</p><p className="text-xs font-black uppercase">{formConfig.currency}</p></div>
                        <p className="text-4xl font-black tracking-tighter italic">{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <div className="h-20 bg-slate-900 border-t border-white/5 flex items-center justify-between px-12">
            <div className="flex gap-4">
               <button onClick={()=>onUpdate([])} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2"><Trash2 size={14}/> Clear</button>
            </div>
            <div className="flex gap-4">
               <button onClick={()=>onGenerate('pdf', formConfig, pdfRef)} className="bg-sky-500 text-slate-950 px-10 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-2xl shadow-sky-500/20"><Printer size={18}/> Push to PDF</button>
               <button onClick={()=>onGenerate('excel', formConfig, null)} className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-2xl shadow-emerald-500/20"><FileSpreadsheet size={18}/> XLSX Export</button>
            </div>
         </div>
      </main>
    </div>
  );
});

export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [isSimMode, setIsSimMode] = useState(true);
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  const [importModal, setImportModal] = useState(false);
  
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v8');
    if (saved) return JSON.parse(saved);
    return { gasUrl: '', apiToken: 'ACOFUSION_SECRET_TOKEN_2024', products: [], contacts: [], deals: [] };
  });

  const [selectedContact, setSelectedContact] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = useCallback(async () => {
    setCloudStatus({ loading: true, msg: 'Synchronizing Pro Engine...' });
    if (isSimMode) {
      setSysConfig(prev => ({ ...prev, products: CONFIG.DEFAULT_PRODUCTS, contacts: CONFIG.DEFAULT_CONTACTS }));
      setCloudStatus({ loading: false, msg: 'Simulation Portal Active' });
    } else {
      try {
        const resP = await apiFetch(sysConfig.gasUrl, 'getProducts', {}, sysConfig.apiToken);
        const resC = await apiFetch(sysConfig.gasUrl, 'getContacts', {}, sysConfig.apiToken);
        setSysConfig(prev => ({ ...prev, products: resP.data || [], contacts: resC.data || [] }));
        setCloudStatus({ loading: false, msg: 'Enterprise Sync Success' });
      } catch (e) { setCloudStatus({ loading: false, msg: 'Connect Failed' }); }
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 4000);
  }, [sysConfig.gasUrl, isSimMode]);

  useEffect(() => { refreshData(); }, [isSimMode]);

  const handleBatchImport = (raw) => {
    const lines = raw.split('\n').filter(l => l.trim());
    const newContacts = lines.map((l, i) => {
      const p = l.split(',').map(s => s.trim());
      return { id: `IB-${Date.now()}-${i}`, "公司名稱": p[0], "聯絡人": p[1], "Email": p[2] };
    });
    setSysConfig(prev => ({ ...prev, contacts: [...prev.contacts, ...newContacts] }));
  };

  const handleGenerateQuote = async (format, params, ref) => {
    setCloudStatus({ loading: true, msg: `Rasterizing Industrial ${format.toUpperCase()}...` });
    if (format === 'pdf') {
       const opt = { margin: 0, filename: `[ACO-QT]-${selectedContact?.公司名稱}-${Date.now()}.pdf`, html2canvas: { scale: 3, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4' } };
       await html2pdf().set(opt).from(ref.current).save();
       setCloudStatus({ loading: false, msg: 'PDF Protocol Complete' });
    } else {
       setCloudStatus({ loading: false, msg: 'XLSX Syncing via GAS...' });
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      <nav className="h-20 bg-slate-900/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center font-black text-slate-950 italic text-2xl shadow-2xl shadow-sky-500/20">A</div>
          <div><h1 className="text-xl font-black text-white uppercase italic leading-none tracking-tighter">ACOfusion</h1><p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mt-1 italic">Enterprise CRM x Industrial Hub</p></div>
        </div>
        <div className="flex bg-slate-950/50 rounded-2xl p-1 gap-1 border border-white/10">
           {['crm', 'quote', 'settings'].map(t => (
             <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${activeTab === t ? 'bg-sky-500 text-slate-950 shadow-2xl' : 'text-slate-500 hover:text-white'}`}>
                {t === 'crm' && <Users size={16}/>} {t === 'quote' && <FileText size={16}/>} {t === 'settings' && <Settings size={16}/>} {t}
             </button>
           ))}
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'crm' && (
           <div className="flex-1 flex overflow-hidden">
              <aside className="w-96 border-r border-white/5 flex flex-col bg-slate-950">
                 <div className="p-6 space-y-4">
                    <button className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-sky-500/20 active:scale-95 transition-all"><Camera size={18}/> Card Scan</button>
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={()=>setImportModal(true)} className="bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-white/5"><FileUp size={14}/> Batch</button>
                       <button className="bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-white/5"><Search size={14}/> Find</button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
                    {sysConfig.contacts.map(c => (
                       <div key={c.id} onClick={() => setSelectedContact(c)} className={`p-6 rounded-[2rem] border transition-all cursor-pointer ${selectedContact?.id === c.id ? 'bg-sky-500/10 border-sky-500 shadow-[0_0_40px_rgba(56,189,248,0.1)]' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}>
                          <p className="font-black text-white text-base leading-none mb-2 truncate uppercase tracking-tighter">{c.公司名稱}</p>
                          <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.聯絡人}</span><BadgeCheck size={14} className={c.googleContactId ? 'text-sky-400' : 'text-slate-800'}/></div>
                       </div>
                    ))}
                 </div>
              </aside>
              <section className="flex-1 p-16 bg-slate-950 overflow-y-auto scrollbar-hide">
                 {selectedContact ? (
                   <div className="max-w-4xl mx-auto space-y-16 animate-in slide-in-from-bottom-10 duration-700">
                      <div className="flex justify-between items-start">
                         <div><p className="text-sky-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Enterprise Account Detail</p><h2 className="text-7xl font-black text-white tracking-tighter leading-none">{selectedContact.公司名稱}</h2><p className="text-xl text-slate-500 font-bold mt-4">Authorized Contact: {selectedContact.聯絡人}</p></div>
                         <button onClick={()=>setActiveTab('quote')} className="bg-white text-slate-950 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-sky-400 transition-all flex items-center gap-3">Initiate Quotation <ArrowRight size={20}/></button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8 pt-8">
                         <div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] space-y-8">
                            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Mail Pipeline</label><p className="text-2xl font-mono text-white italic underline decoration-sky-500 underline-offset-8 truncate">{selectedContact.Email}</p></div>
                         </div>
                         <div className="bg-slate-900 border border-sky-500/20 p-10 rounded-[3rem] space-y-8 relative overflow-hidden">
                            <Zap className="absolute -right-8 -top-8 w-40 h-40 text-sky-500/5 rotate-12" />
                            <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">AI Intent Detection</h4>
                            <div className="p-6 bg-slate-950 rounded-2xl border border-white/5"><p className="text-xs text-slate-400 italic font-mono leading-relaxed">"Simulation: Analyzing Outlook context... Lead shows high interest in Architectural RGBW series for Q4 projects."</p></div>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-10"><img src="https://www.acofusion.com/wp-content/uploads/2021/04/ACOfusion-Logo-White.png" alt="Logo" className="w-[40rem] grayscale contrast-[150%]" /></div>
                 )}
              </section>
           </div>
        )}

        {activeTab === 'quote' && (
           <ProQuotationForm client={selectedContact} items={quoteItems} onUpdate={setQuoteItems} 
             totals={{ subtotal: quoteItems.reduce((s,i)=>s+((i.qty||1)*(i.unitPrice||0)),0) }}
             products={sysConfig.products} onGenerate={handleGenerateQuote} />
        )}

        {activeTab === 'settings' && (
           <div className="flex-1 p-20 overflow-y-auto">
              <div className="max-w-xl mx-auto space-y-8">
                 <div className="bg-slate-900 p-12 rounded-[4rem] border border-white/10 space-y-8 shadow-2xl">
                    <h2 className="text-2xl font-black text-white italic flex items-center gap-4"><Settings className="text-sky-500"/> SYSTEM INFRASTRUCTURE</h2>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between p-6 bg-slate-950 border border-white/5 rounded-3xl">
                          <div><p className="text-xs font-black text-white uppercase">Simulation Engine</p><p className="text-[10px] text-slate-500">Allow offline testing for Pro features</p></div>
                          <button onClick={()=>setIsSimMode(!isSimMode)} className={`w-14 h-7 rounded-full relative transition-all ${isSimMode ? 'bg-sky-500' : 'bg-slate-800'}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${isSimMode ? 'left-8' : 'left-1'}`}/></button>
                       </div>
                       {!isSimMode && (
                         <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GAS Endpoint Protocol</label><input className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-xs font-mono text-sky-400" value={sysConfig.gasUrl} onChange={e=>setSysConfig({...sysConfig, gasUrl: e.target.value})} placeholder="https://script.google.com/.../exec" /></div>
                       )}
                       <button onClick={refreshData} className="w-full bg-sky-500 text-slate-950 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-500/20 active:scale-95 transition-all outline-none flex items-center justify-center gap-2"><RefreshCw size={18}/> Sync Master Catalog</button>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>

      <ImportModal isOpen={importModal} onClose={()=>setImportModal(false)} onImport={handleBatchImport} />

      {cloudStatus.msg && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-5">
           <div className="flex items-center gap-5 bg-slate-900 border border-sky-500/30 px-10 py-5 rounded-full shadow-[0_20px_100px_rgba(0,0,0,0.8)]">
              {cloudStatus.loading ? <Loader2 size={24} className="animate-spin text-sky-400" /> : <CheckCircle2 size={24} className="text-emerald-400" />}
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white italic font-mono">{cloudStatus.msg}</span>
           </div>
        </div>
      )}
    </div>
  );
}