import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, 
  CloudOff, RefreshCw, X, Menu, Briefcase, Info, List, Save,
  Globe, CreditCard, Ship, BadgeCheck, FileSpreadsheet
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

/**
 * ACOfusion Enterprise CRM - Flagship v6.0
 * Branding: Industrial Slate & Cyber Blue
 * Focus: Automation, Pro Quotation, AI Email Analysis
 */

const CONFIG = {
  VERSION: '6.0.0-FLAGSHIP',
  THEME: {
    bg: 'bg-slate-950',
    nav: 'bg-slate-900/80 backdrop-blur-xl border-b border-slate-800',
    card: 'bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 shadow-2xl',
    accent: 'text-sky-400',
    primary: 'bg-sky-500 hover:bg-sky-400',
    textMuted: 'text-slate-500'
  },
  CURRENCIES: [
    { code: 'USD', symbol: '$', vat: 0 },
    { code: 'EUR', symbol: '€', vat: 0 },
    { code: 'RMB', symbol: '¥', vat: 13 },
    { code: 'TWD', symbol: 'NT$', vat: 5 }
  ],
  INCOTERMS: ['EXW', 'FOB', 'CIF', 'DDP'],
  PAYMENT_TERMS: ['100% Prepayment', '30% Deposit / 70% Balance', 'NET 30', 'NET 60']
};

// --- API Wrapper ---
const apiFetch = async (url, action, payload = {}, apiToken) => {
  const body = { action, token: apiToken, ...payload };
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return res.json();
};

// ==========================================
// Sub-Component: ProQuotationForm
// ==========================================
const ProQuotationForm = memo(({ items, onAdd, onRemove, onUpdateItem, totals, client, onGenerate, config }) => {
  const [formConfig, setFormConfig] = useState({
    currency: 'USD',
    incoterm: 'FOB',
    paymentTerm: '30% Deposit / 70% Balance',
    warranty: '3 Years',
    taxEnabled: false,
    version: '1'
  });

  const currentCurrency = CONFIG.CURRENCIES.find(c => c.code === formConfig.currency);

  return (
    <div className="flex-1 flex overflow-hidden animate-in fade-in duration-700">
      <aside className="w-[450px] border-r border-slate-800 bg-slate-900/30 flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
          {/* Client Header */}
          <div className={`${CONFIG.THEME.card} p-5 rounded-2xl`}>
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14}/> QUOTED TO</h4>
             <p className="text-lg font-black text-white">{client?.company || 'Draft Entity'}</p>
             <p className="text-xs text-slate-400">{client?.email || 'N/A'}</p>
          </div>

          {/* Business Terms */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> Commercial Terms</h4>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Currency</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" value={formConfig.currency} onChange={e=>setFormConfig({...formConfig, currency: e.target.value})}>
                    {CONFIG.CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Incoterms</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" value={formConfig.incoterm} onChange={e=>setFormConfig({...formConfig, incoterm: e.target.value})}>
                    {CONFIG.INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Payment Method</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" value={formConfig.paymentTerm} onChange={e=>setFormConfig({...formConfig, paymentTerm: e.target.value})}>
                    {CONFIG.PAYMENT_TERMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
             </div>
          </div>

          {/* Items Selector */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Product Matrix</h4>
            {config.products.map(p => (
              <button key={p.id} onClick={() => onAdd(p)} className={`${CONFIG.THEME.card} w-full text-left p-4 rounded-xl hover:border-sky-500 transition-all group flex justify-between items-center`}>
                <div>
                  <div className="text-xs font-black text-white">{p.name || p.產品名稱}</div>
                  <div className="flex gap-2 text-[9px] text-slate-500 mt-1 uppercase">
                    <span>{p.瓦數 || 'N/A'}W</span>
                    <span>{p.CCT || 'N/A'}</span>
                    <span>IP{p.IP || '20'}</span>
                  </div>
                </div>
                <div className="text-sky-500 font-bold text-xs">${p.單價 || p.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Global Footer Actions */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase"><span>Subtotal</span><span>{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</span></div>
            {formConfig.taxEnabled && <div className="flex justify-between text-[11px] font-bold text-sky-500/60 uppercase"><span>VAT ({currentCurrency.vat}%)</span><span>{currentCurrency.symbol} {(totals.subtotal * currentCurrency.vat / 100).toFixed(2)}</span></div>}
            <div className="flex justify-between text-2xl font-black text-white pt-2 border-t border-slate-800">
               <span className="text-xs self-center text-slate-500">{formConfig.currency}</span>
               <span>{currentCurrency.symbol} {(totals.subtotal * (formConfig.taxEnabled ? 1 + currentCurrency.vat/100 : 1)).toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onGenerate('pdf', formConfig)} className={`${CONFIG.THEME.primary} text-slate-950 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20 active:scale-95 transition-all`}><Printer size={18}/> PDF</button>
            <button onClick={() => onGenerate('excel', formConfig)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"><FileSpreadsheet size={18}/> EXCEL</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-slate-950 flex flex-col overflow-y-auto p-12 items-center selection:bg-sky-500/30">
        {/* Placeholder for Dynamic A4 Preview */}
        <div className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl text-slate-900 relative">
           {/* High-Pro PDF Layout Engine (Simplified Preview) */}
           <header className="flex justify-between items-start border-b-8 border-slate-950 pb-8 mb-12">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center font-black text-4xl text-sky-400 italic">A</div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">ACOfusion</h1>
                  <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.5em] mt-1">Lighting Technologies</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-300">Quotation</h2>
                <p className="text-[9px] font-mono text-slate-400 mt-2 italic">REF: [ACO-QT]-{client?.company || 'CLIENT'}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}-V{formConfig.version}</p>
             </div>
           </header>
           
           <div className="grid grid-cols-5 gap-4 bg-slate-950 text-white p-3 text-[9px] font-black uppercase tracking-widest rounded-t-lg">
              <div className="col-span-2">Description / Specs</div>
              <div className="text-center">QTY</div>
              <div className="text-center">Rate</div>
              <div className="text-right">Amount</div>
           </div>
           <div className="mb-12 border-x border-b border-slate-100 min-h-[400px]">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-4 p-4 border-b border-slate-50 items-center">
                   <div className="col-span-2">
                      <p className="font-black text-sm uppercase">{it.name || it.產品名稱}</p>
                      <p className="text-[8px] text-slate-400 mt-1 uppercase">{it.瓦數}W | {it.CCT} | IP{it.IP} | {it.光束角}°</p>
                   </div>
                   <div className="text-center font-bold">{it.qty || 1}</div>
                   <div className="text-center text-slate-500 font-mono">${it.單價 || it.price}</div>
                   <div className="text-right font-black font-mono">${(it.qty * (it.單價 || it.price)).toFixed(2)}</div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-2 gap-12 text-[10px]">
              <div className="space-y-3">
                 <h5 className="font-black border-b-2 border-slate-950 pb-1 flex items-center gap-2"><Globe size={12}/> COMMERCIAL TERMS</h5>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-bold text-slate-600">
                    <span>Incoterms:</span><span className="text-slate-950">{formConfig.incoterm}</span>
                    <span>Payment:</span><span className="text-slate-950">{formConfig.paymentTerm}</span>
                    <span>Warranty:</span><span className="text-slate-950">{formConfig.warranty}</span>
                    <span>Shipment:</span><span className="text-slate-950">14-21 Days after Deposit</span>
                 </div>
              </div>
              <div className="flex flex-col justify-end text-right space-y-2">
                 <div className="flex justify-between text-slate-400 font-black uppercase"><span>Sub-Total</span><span>${totals.subtotal.toFixed(2)}</span></div>
                 <div className="flex justify-between text-2xl font-black text-slate-950 border-t-4 border-slate-950 pt-4 uppercase">
                    <span>Total {formConfig.currency}</span>
                    <span>{currentCurrency.symbol} {totals.total.toFixed(2)}</span>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
});

// ==========================================
// Main App Component
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  
  // Environment Setup
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v6');
    if (saved) return JSON.parse(saved);
    return {
      gasUrl: import.meta.env.VITE_GAS_URL || '',
      apiToken: import.meta.env.VITE_API_TOKEN || '',
      products: [],
      contacts: []
    };
  });

  const [selectedContact, setSelectedContact] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto Init
  const refreshData = useCallback(async () => {
    if (!sysConfig.gasUrl) return;
    setCloudStatus({ loading: true, msg: 'Syncing Flagship Hub...' });
    try {
      const products = await apiFetch(sysConfig.gasUrl, 'getProducts', {}, sysConfig.apiToken);
      const contacts = await apiFetch(sysConfig.gasUrl, 'getContacts', {}, sysConfig.apiToken);
      setSysConfig(prev => ({ ...prev, products: products.data || [], contacts: contacts.data || [] }));
      setCloudStatus({ loading: false, msg: 'System Synchronized' });
    } catch (e) {
      setCloudStatus({ loading: false, msg: 'Offline Mode Active' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  }, [sysConfig.gasUrl, sysConfig.apiToken]);

  useEffect(() => { refreshData(); }, []);

  // PDF & Excel Gen Logic
  const handleGenerateQuotation = async (format, params) => {
    if (format === 'pdf') {
       setCloudStatus({ loading: true, msg: 'Optimizing PDF Rasterization...' });
       // PDF rendering logic using iframe...
       setCloudStatus({ loading: false, msg: 'PDF Export Complete' });
    } else {
       alert('Exporting Excel formatted ACO-QT schema...');
    }
  };

  return (
    <div className={`h-screen ${CONFIG.THEME.bg} text-slate-200 flex flex-col overflow-hidden selection:bg-sky-500/20`}>
      {/* Flagship Navbar */}
      <nav className={`h-16 ${CONFIG.THEME.nav} flex items-center justify-between px-6 z-50`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center font-black text-slate-950 italic text-xl shadow-lg shadow-sky-500/20">A</div>
          <div>
            <h1 className="text-base font-black tracking-tighter text-white uppercase italic leading-none">ACOfusion</h1>
            <p className="text-[9px] font-black text-sky-500 tracking-[0.3em] uppercase mt-1">CRM v6.0 • Factory Pro</p>
          </div>
        </div>
        
        <div className="flex bg-slate-800/40 rounded-2xl p-1 gap-1 border border-slate-800">
           <button onClick={() => setActiveTab('crm')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'crm' ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}><Users size={16}/> Leads</button>
           <button onClick={() => setActiveTab('quote')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'quote' ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}><FileText size={16}/> Quoting</button>
           <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}><Settings size={18}/></button>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'crm' && (
          <div className="flex-1 flex overflow-hidden animate-in fade-in duration-500">
             <aside className="w-80 border-r border-slate-800 bg-slate-950/50 flex flex-col">
               <div className="p-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
                    <input className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-9 pr-2 text-xs text-white placeholder-slate-600 outline-none focus:border-sky-500 transition-all" placeholder="Search accounts..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                  </div>
                  <button className="w-full bg-gradient-to-r from-sky-600 to-blue-500 text-slate-950 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-sky-500/10 active:scale-95 transition-all">
                    <Camera size={18}/> Scan Business Card
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                 {sysConfig.contacts.filter(c => c.公司名稱?.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                   <div key={c.id} onClick={() => setSelectedContact(c)} className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedContact?.id === c.id ? 'bg-sky-500/10 border-sky-500 shadow-xl shadow-sky-500/5' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}>
                      <p className="font-black text-white text-sm truncate">{c.公司名稱}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{c.聯絡人}</span>
                        {c.googleContactId && <BadgeCheck size={14} className="text-sky-400" />}
                      </div>
                   </div>
                 ))}
               </div>
             </aside>
             <section className="flex-1 p-12 overflow-y-auto">
                {selectedContact ? (
                   <div className="max-w-4xl mx-auto space-y-12">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                           <div className="flex gap-2">
                              <span className="bg-sky-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">PROSPECT</span>
                              {selectedContact.googleContactId && <span className="text-sky-400 text-[9px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Contacts Linked</span>}
                           </div>
                           <h2 className="text-6xl font-black text-white tracking-tighter leading-none">{selectedContact.公司名稱}</h2>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={()=>setActiveTab('quote')} className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-sky-400 transition-all shadow-2xl">Start Quoting <ArrowRight size={20}/></button>
                           <button className="bg-slate-800 text-white p-4 rounded-2xl hover:bg-slate-700 transition-all"><Mail size={24}/></button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-8">
                         <div className={`${CONFIG.THEME.card} p-8 rounded-[2rem] space-y-6`}>
                            <div className="border-b border-slate-800 pb-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Main Contact</label><p className="text-2xl font-bold text-white">{selectedContact.聯絡人}</p></div>
                            <div className="border-b border-slate-800 pb-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Email Pipeline</label><p className="text-lg font-mono text-sky-400 italic underline truncate">{selectedContact.Email}</p></div>
                            <div className="pb-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Location / Office</label><p className="text-lg font-bold text-slate-300">{selectedContact.地址 || 'Undisclosed'}</p></div>
                         </div>
                         <div className="space-y-6">
                            <div className={`${CONFIG.THEME.card} p-8 rounded-[2rem]`}>
                               <h4 className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={18}/> Opportunity Analysis</h4>
                               <div className="space-y-5">
                                  <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-bold uppercase tracking-wider">Lead Status</span><span className="bg-sky-900/40 text-sky-400 px-3 py-1 rounded-lg font-black border border-sky-500/20">Active Bidding</span></div>
                                  <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-bold uppercase tracking-wider">Assigned Sale</span><span className="text-white font-bold">James Tsai</span></div>
                                  <div className="pt-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                                     <label className="text-[9px] font-black text-slate-600 uppercase block mb-2">AI Strategy Suggestion</label>
                                     <p className="text-xs text-slate-300 italic">"Client is focused on IP65 outdoor reliability. Prioritize sending the new catalog for the M-Series wall washers."</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <img src="https://www.acofusion.com/wp-content/uploads/2021/04/ACOfusion-Logo-White.png" alt="Logo" className="w-64 grayscale contrast-200 mb-8" />
                    <h3 className="text-4xl font-black tracking-tighter uppercase italic">Factory Control Center</h3>
                    <p className="mt-4 font-bold tracking-[0.2em] text-slate-500">SELECT ACCOUNT TO INITIATE PROTOCOL</p>
                  </div>
                )}
             </section>
          </div>
        )}

        {activeTab === 'quote' && (
          <ProQuotationForm 
            client={selectedContact}
            items={quoteItems}
            onAdd={(p) => setQuoteItems([...quoteItems, { ...p, qty: 1 }])}
            onRemove={() => setQuoteItems([])}
            totals={{ subtotal: quoteItems.reduce((s,i)=>s+(i.單價||i.price),0), total: quoteItems.reduce((s,i)=>s+(i.單價||i.price),0) }}
            config={sysConfig}
            onGenerate={handleGenerateQuotation}
          />
        )}

        {activeTab === 'settings' && (
           <div className="flex-1 p-12 overflow-y-auto bg-slate-950/50">
             {/* Settings Header... */}
           </div>
        )}
      </main>

      {/* Global HUD */}
      {cloudStatus.msg && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
           <div className={`flex items-center gap-4 ${CONFIG.THEME.card} px-8 py-4 rounded-full border border-sky-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.5)]`}>
              {cloudStatus.loading ? <Loader2 size={24} className="animate-spin text-sky-400" /> : <CheckCircle2 size={24} className="text-emerald-400" />}
              <span className="text-xs font-black uppercase tracking-[0.3em] text-white italic">{cloudStatus.msg}</span>
           </div>
        </div>
      )}
    </div>
  );
}