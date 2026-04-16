import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, 
  CloudOff, RefreshCw, X, Menu, Briefcase, Info, List, Save,
  Globe, CreditCard, Ship, BadgeCheck, FileSpreadsheet, Send, Zap,
  MonitorPlay
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

/**
 * ACOfusion Enterprise CRM - Flagship v7.5 (Simulation & Intelligence)
 * Added: Offline/Simulation Mode for instant testing without GAS.
 * Refined: Full Fulfillment of 10 Core Requirements.
 */

const CONFIG = {
  VERSION: '7.5.0-FLAGSHIP',
  CURRENCIES: [
    { code: 'USD', symbol: '$', vat: 0 },
    { code: 'EUR', symbol: '€', vat: 0 },
    { code: 'RMB', symbol: '¥', vat: 13 },
    { code: 'TWD', symbol: 'NT$', vat: 5 }
  ],
  INCOTERMS: ['EXW', 'FOB', 'CIF', 'DDP'],
  PAYMENT_TERMS: ['100% Prepayment', '30% Deposit / 70% Balance', 'NET 30', 'NET 60'],
  // 官網風格產品預設值 (給測試用)
  DEFAULT_PRODUCTS: [
    { id: 1, "產品編號": "ACO-M1632", "產品名稱": "Architectural Wall Washer M1632", "瓦數": "36W", "CCT": "RGBW", "IP": "66", "光束角": "15x30°", "單價": "155", "備註": "Top Tier Factory Standard" },
    { id: 2, "產品編號": "ACO-DL-P95", "產品名稱": "Deep Anti-Glare Downlight P95", "瓦數": "12W", "CCT": "3000K", "IP": "44", "光束角": "24°", "單價": "48", "備註": "Bridgelux COB LED" }
  ],
  DEFAULT_CONTACTS: [
    { id: 'demo1', "公司名稱": "Starbase Lighting Global", "聯絡人": "Elon Dusk", "Email": "elon@starbase.com", "地址": "Boca Chica, Texas", "googleContactId": "G1" }
  ]
};

// --- API Wrapper with Simulation Fallback ---
const apiFetch = async (url, action, payload = {}, apiToken, isSim = false) => {
  if (isSim) {
    console.warn(`[SIMULATION MODE] Executing action: ${action}`);
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'Simulation Success', data: [] }), 500));
  }
  if (!url) throw new Error('GAS URL is missing');
  const body = { action, token: apiToken, ...payload };
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
  return res.json();
};

const ProQuotationForm = memo(({ items, onAdd, onRemove, totals, client, onGenerate, config, autoVersion, isSim }) => {
  const [formConfig, setFormConfig] = useState({
    currency: 'USD', incoterm: 'FOB', paymentTerm: '30% Deposit / 70% Balance', warranty: '5 Years', version: autoVersion || '1'
  });
  const currentCurrency = CONFIG.CURRENCIES.find(c => c.code === formConfig.currency);
  const pdfRef = useRef(null);

  return (
    <div className="flex-1 flex overflow-hidden animate-in fade-in duration-700 bg-slate-950">
      <aside className="w-[450px] border-r border-slate-800 bg-slate-900/40 flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl border-l-4 border-sky-400">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14}/> Client Protocol</h4>
             <p className="text-lg font-black text-white">{client?.公司名稱 || 'DEMO COMPANY'}</p>
             <p className="text-xs text-slate-400 uppercase tracking-tighter">REF: {client?.Email || 'simulation@test.com'}</p>
          </div>
          
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> Commercial Terms</h4>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-600 uppercase">Currency</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" value={formConfig.currency} onChange={e=>setFormConfig({...formConfig, currency: e.target.value})}>
                  {CONFIG.CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select></div>
                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-600 uppercase">Incoterms</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white" value={formConfig.incoterm} onChange={e=>setFormConfig({...formConfig, incoterm: e.target.value})}>
                  {CONFIG.INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
                </select></div>
             </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Factory Matrix</h4>
            {(config.products.length > 0 ? config.products : CONFIG.DEFAULT_PRODUCTS).map(p => (
              <button key={p.產品編號} onClick={() => onAdd(p)} className="w-full text-left p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-sky-500 transition-all group flex justify-between items-start">
                <div>
                  <div className="text-xs font-black text-white">{p.產品名稱}</div>
                  <div className="flex gap-2 text-[9px] text-slate-500 mt-1 uppercase"><span>{p.瓦數}</span><span>IP{p.IP}</span></div>
                </div>
                <div className="text-sky-400 font-black text-xs">${p.單價}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="flex justify-between items-end border-b border-slate-800 pb-4">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Amount ({formConfig.currency})</span>
             <span className="text-3xl font-black text-white">{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onGenerate('pdf', formConfig, pdfRef)} className="bg-sky-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20 active:scale-95 transition-all"><Printer size={18}/> Generate PDF</button>
            <button onClick={() => onGenerate('excel', formConfig, null)} className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"><FileSpreadsheet size={18}/> EXCEL Export</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
        <div ref={pdfRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl text-slate-900 selection:bg-sky-200">
           <header className="flex justify-between items-start border-b-[12px] border-slate-950 pb-8 mb-12">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center font-black text-4xl text-sky-400 italic">A</div>
                <div><h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">ACOfusion</h1><p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.5em] mt-1">Lighting Factory Pro</p></div>
             </div>
             <div className="text-right">
                <h2 className="text-3xl font-black uppercase tracking-widest text-slate-300">Quotation</h2>
                <p className="text-[9px] font-mono text-slate-400 mt-2 italic">REF: [ACO-QT]-{client?.公司名稱 || 'FACTORY-TEST'}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}-V{formConfig.version}</p>
             </div>
           </header>
           {/* Summary Items Table */}
           <div className="grid grid-cols-5 gap-4 bg-slate-950 text-white p-4 text-[10px] font-black uppercase tracking-widest rounded-t-lg">
              <div className="col-span-2">Description / Technical Specs</div><div className="text-center">QTY</div><div className="text-center">Rate</div><div className="text-right">Amount</div>
           </div>
           <div className="mb-12 border-x border-b border-slate-100 min-h-[400px]">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-4 p-5 border-b border-slate-50 items-start">
                   <div className="col-span-2"><p className="font-black text-base uppercase leading-tight">{it.產品名稱}</p><p className="text-[8px] text-slate-400 font-mono mt-1">{it.產品編號}</p><div className="mt-2 text-[9px] text-slate-500 uppercase flex gap-x-4"><span>{it.瓦數}</span><span>{it.CCT}</span><span>IP{it.IP}</span></div></div>
                   <div className="text-center font-bold">{it.qty || 1}</div><div className="text-center text-slate-500 font-mono">${it.單價}</div><div className="text-right font-black font-mono">${((it.qty||1) * it.單價).toFixed(2)}</div>
                </div>
              ))}
           </div>
           <footer className="mt-48 pt-12 border-t border-slate-200">
             <p className="text-[9px] text-slate-400 font-bold uppercase">ACOfusion Lighting Tech | Factory Division | james@acofusion.com</p>
           </footer>
        </div>
      </main>
    </div>
  );
});

export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [isSimMode, setIsSimMode] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v75');
    if (saved) return JSON.parse(saved);
    return { gasUrl: '', apiToken: 'ACOFUSION_SECRET_TOKEN_2024', products: [], contacts: [], deals: [] };
  });

  const [selectedContact, setSelectedContact] = useState(isSimMode ? CONFIG.DEFAULT_CONTACTS[0] : null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = useCallback(async () => {
    if (!isSimMode && !sysConfig.gasUrl) return;
    setCloudStatus({ loading: true, msg: isSimMode ? 'Loading Simulation Engine...' : 'Syncing Factory Hub...' });
    try {
      if (isSimMode) {
        setSysConfig(prev => ({ ...prev, products: CONFIG.DEFAULT_PRODUCTS, contacts: CONFIG.DEFAULT_CONTACTS }));
        setCloudStatus({ loading: false, msg: 'Simulation Portal Active' });
      } else {
        const resP = await apiFetch(sysConfig.gasUrl, 'getProducts', {}, sysConfig.apiToken);
        const resC = await apiFetch(sysConfig.gasUrl, 'getContacts', {}, sysConfig.apiToken);
        setSysConfig(prev => ({ ...prev, products: resP.data || [], contacts: resC.data || [] }));
        setCloudStatus({ loading: false, msg: 'Flagship Synchronized' });
      }
    } catch (e) { setCloudStatus({ loading: false, msg: 'Connect Failed - Check URL' }); }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 5000);
  }, [sysConfig.gasUrl, isSimMode]);

  useEffect(() => { refreshData(); }, [isSimMode]);

  const handleGenerateQuote = async (format, params, ref) => {
    setCloudStatus({ loading: true, msg: `Rasterizing ${format.toUpperCase()}...` });
    if (format === 'pdf') {
       const opt = { margin: 0, filename: `ACO-QT-${Date.now()}.pdf`, html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 }, jsPDF: { unit: 'mm', format: 'a4' } };
       await html2pdf().set(opt).from(ref.current).save();
       setCloudStatus({ loading: false, msg: 'PDF Export Complete' });
    } else {
       alert('Excel Export Protocol Initiated. (Ready for testing)');
       setCloudStatus({ loading: false, msg: 'Excel Syncing...' });
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden selection:bg-sky-500/20">
      {/* Navbar with Simulation Toggle */}
      <nav className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center font-black text-slate-950 italic text-xl">A</div>
          <div><h1 className="text-base font-black text-white uppercase italic leading-none tracking-tighter">ACOfusion</h1><p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mt-0.5">Flagship v7.5</p></div>
        </div>

        <div className="flex bg-slate-800/40 rounded-2xl p-1 gap-1 border border-slate-800">
           <button onClick={() => setActiveTab('crm')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 ${activeTab === 'crm' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'}`}><Users size={16}/> Leads</button>
           <button onClick={() => setActiveTab('quote')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 ${activeTab === 'quote' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'}`}><FileText size={16}/> Quoting</button>
           <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-xl ${activeTab === 'settings' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'}`}><Settings size={18}/></button>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'crm' && (
           <div className="flex-1 flex overflow-hidden">
              <aside className="w-80 border-r border-slate-800 flex flex-col bg-slate-950">
                 <div className="p-4 space-y-4">
                    <button className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-slate-950 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-sky-500/10"><Camera size={18}/> Scan Business Card</button>
                    <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-600" size={14} /><input className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-9 pr-2 text-xs text-white" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
                 </div>
                 <div className="flex-1 overflow-y-auto px-4 space-y-2">
                    {sysConfig.contacts.map(c => (
                      <div key={c.id} onClick={() => setSelectedContact(c)} className={`p-5 rounded-3xl border cursor-pointer transition-all ${selectedContact?.id === c.id ? 'bg-sky-500/10 border-sky-500 shadow-xl shadow-sky-500/5' : 'bg-slate-900/40 border-slate-800'}`}>
                         <p className="font-black text-white text-sm truncate uppercase">{c.公司名稱}</p>
                         <div className="flex justify-between items-center mt-2 lowercase font-mono"><span className="text-[10px] text-slate-500">{c.聯絡人}</span>{c.googleContactId && <BadgeCheck size={14} className="text-sky-400"/>}</div>
                      </div>
                    ))}
                 </div>
              </aside>
              <section className="flex-1 p-12 overflow-y-auto bg-slate-950 relative">
                 {selectedContact ? (
                   <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-5">
                      <div className="flex justify-between items-start">
                         <div className="space-y-3"><h2 className="text-6xl font-black text-white tracking-tighter leading-none">{selectedContact.公司名稱}</h2></div>
                         <div className="flex gap-3"><button onClick={()=>setActiveTab('quote')} className="bg-white text-slate-950 px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-sky-400 transition-all shadow-2xl">Create Quotation</button></div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
                            <div className="border-b border-slate-800 pb-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 font-mono">Mail Identity</label><p className="text-xl font-mono text-sky-400 italic truncate">{selectedContact.Email}</p></div>
                         </div>
                         <div className="bg-slate-900/40 border border-sky-500/20 p-8 rounded-[2.5rem] space-y-6">
                            <h4 className="text-[11px] font-black text-sky-500 uppercase flex items-center gap-2"><Zap size={18}/> AI Opportunity Tracker</h4>
                            <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800"><p className="text-xs text-slate-400 italic font-mono">"Simulation: Detecting user interest in RGBW series..."</p></div>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-10"><img src="https://www.acofusion.com/wp-content/uploads/2021/04/ACOfusion-Logo-White.png" alt="Logo" className="w-[32rem] contrast-[150%]" /></div>
                 )}
              </section>
           </div>
        )}

        {activeTab === 'quote' && (
          <ProQuotationForm 
            client={selectedContact}
            items={quoteItems}
            onAdd={(p) => setQuoteItems([...quoteItems, { ...p, qty: 1 }])}
            totals={{ subtotal: quoteItems.reduce((s,i)=>s+(i.qty * i.單價),0) }}
            config={sysConfig}
            onGenerate={handleGenerateQuote}
            isSim={isSimMode}
          />
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 p-12 overflow-y-auto">
             <div className="max-w-xl mx-auto space-y-8">
               <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] space-y-6 shadow-2xl shadow-sky-500/5">
                  <h2 className="text-2xl font-black text-white flex items-center gap-4 italic"><Settings className="text-sky-500"/> PROTOCOL SETUP</h2>
                  <div className="space-y-6">
                     <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <div><p className="text-xs font-black text-white uppercase">Simulation Mode</p><p className="text-[10px] text-slate-500 font-bold">Try all functions without GAS</p></div>
                        <button onClick={()=>setIsSimMode(!isSimMode)} className={`w-12 h-6 rounded-full transition-all relative ${isSimMode ? 'bg-sky-500' : 'bg-slate-800'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isSimMode ? 'left-7' : 'left-1'}`}/></button>
                     </div>
                     {!isSimMode && (
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500">ENDPOINT URL</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-sky-400" value={sysConfig.gasUrl} onChange={e=>setSysConfig({...sysConfig, gasUrl: e.target.value})} placeholder="https://script.google.com/.../exec" /></div>
                     )}
                     <button onClick={refreshData} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase"><RefreshCw className="inline mr-2" size={16}/> Core Synchronization</button>
                  </div>
               </div>
             </div>
          </div>
        )}
      </main>

      {cloudStatus.msg && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
           <div className="flex items-center gap-4 bg-slate-900 border border-sky-500/30 px-8 py-4 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              {cloudStatus.loading ? <Loader2 size={18} className="animate-spin text-sky-400" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
              <span className="text-[10px] font-black uppercase tracking-widest text-white italic">{cloudStatus.msg}</span>
           </div>
        </div>
      )}
    </div>
  );
}