import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, 
  CloudOff, RefreshCw, X, Menu, Briefcase, Info, List, Save,
  Globe, CreditCard, Ship, BadgeCheck, FileSpreadsheet, Send
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

/**
 * ACOfusion Enterprise CRM - Flagship v6.5 (Restored & Stabilized)
 */

const CONFIG = {
  VERSION: '6.5.1-FLAGSHIP',
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
  if (!url) throw new Error('GAS URL is not configured');
  const body = { action, token: apiToken, ...payload };
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return res.json();
};

// ==========================================
// Sub-Component: EmailModal
// ==========================================
const EmailModal = memo(({ isOpen, onClose, contact, onSend }) => {
  const [emailData, setEmailData] = useState({ subject: `ACOfusion Lighting Quotation`, message: `Dear ${contact?.聯絡人 || ''},\n\nIt was a pleasure meeting you. Please find our latest quotation attached.` });
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-white flex items-center gap-2"><Mail size={24} className="text-sky-400"/> Send Email</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Recipient</label>
            <div className="text-white font-bold">{contact?.Email}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Subject</label>
            <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-sky-500" value={emailData.subject} onChange={e=>setEmailData({...emailData, subject: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Message Body</label>
            <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white outline-none focus:border-sky-500 h-48 resize-none" value={emailData.message} onChange={e=>setEmailData({...emailData, message: e.target.value})} />
          </div>
        </div>
        <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex gap-4">
          <button onClick={() => onSend(emailData)} className="flex-1 bg-sky-500 text-slate-950 py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-sky-400 transition-all"><Send size={18}/> Push to Gmail</button>
        </div>
      </div>
    </div>
  );
});

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
  const pdfRef = useRef(null);

  return (
    <div className="flex-1 flex overflow-hidden animate-in fade-in duration-700">
      <aside className="w-[450px] border-r border-slate-800 bg-slate-900/30 flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
          <div className={`${CONFIG.THEME.card} p-5 rounded-2xl`}>
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14}/> QUOTED TO</h4>
             <p className="text-lg font-black text-white">{client?.公司名稱 || 'Draft Entity'}</p>
             <p className="text-xs text-slate-400">{client?.Email || 'N/A'}</p>
          </div>

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

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Product Matrix</h4>
            {config.products.length === 0 && <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-[10px] text-slate-600 font-bold uppercase">No products in cloud database.<br/>Use settings to seed data.</div>}
            {config.products.map(p => (
              <button key={p.產品編號 || p.id} onClick={() => onAdd(p)} className={`${CONFIG.THEME.card} w-full text-left p-4 rounded-xl hover:border-sky-500 transition-all group flex justify-between items-center`}>
                <div>
                  <div className="text-xs font-black text-white">{p.產品名稱 || p.name}</div>
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

        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase"><span>Subtotal</span><span>{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-2xl font-black text-white pt-2 border-t border-slate-800">
               <span className="text-xs self-center text-slate-500">{formConfig.currency}</span>
               <span>{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onGenerate('pdf', formConfig, pdfRef)} className={`${CONFIG.THEME.primary} text-slate-950 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20`}><Printer size={18}/> PDF</button>
            <button onClick={() => onGenerate('excel', formConfig, null)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 transition-all"><FileSpreadsheet size={18}/> EXCEL</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-slate-950 flex flex-col overflow-y-auto p-12 items-center">
        <div ref={pdfRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl text-slate-900 relative">
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
                <p className="text-[9px] font-mono text-slate-400 mt-2 italic">REF: [ACO-QT]-{client?.公司名稱 || 'CLIENT'}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}-V{formConfig.version}</p>
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
                      <p className="font-black text-sm uppercase">{it.產品名稱 || it.name}</p>
                      <p className="text-[8px] text-slate-400 mt-1 uppercase">{it.瓦數}W | {it.CCT} | IP{it.IP} | {it.光束角}°</p>
                   </div>
                   <div className="text-center font-bold">{it.qty || 1}</div>
                   <div className="text-center text-slate-500 font-mono">${it.單價 || it.price}</div>
                   <div className="text-right font-black font-mono">${((it.qty||1) * (it.單價 || it.price)).toFixed(2)}</div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-2 gap-12 text-[10px]">
              <div className="space-y-3">
                 <h5 className="font-black border-b-2 border-slate-950 pb-1 flex items-center gap-2"><Globe size={12}/> COMMERCIAL TERMS</h5>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-bold text-slate-600 text-[10px]">
                    <span>Incoterms:</span><span className="text-slate-950">{formConfig.incoterm}</span>
                    <span>Payment:</span><span className="text-slate-950">{formConfig.paymentTerm}</span>
                    <span>Warranty:</span><span className="text-slate-950">{formConfig.warranty}</span>
                 </div>
              </div>
              <div className="flex flex-col justify-end text-right space-y-2">
                 <div className="flex justify-between text-2xl font-black text-slate-950 border-t-4 border-slate-950 pt-4 uppercase">
                    <span>Total {formConfig.currency}</span>
                    <span>{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</span>
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
  const [emailModal, setEmailModal] = useState({ open: false });
  
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v65');
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

  const refreshData = useCallback(async () => {
    if (!sysConfig.gasUrl) return;
    setCloudStatus({ loading: true, msg: 'Syncing Data Hub...' });
    try {
      const resP = await apiFetch(sysConfig.gasUrl, 'getProducts', {}, sysConfig.apiToken);
      const resC = await apiFetch(sysConfig.gasUrl, 'getContacts', {}, sysConfig.apiToken);
      setSysConfig(prev => ({ ...prev, products: resP.data || [], contacts: resC.data || [] }));
      setCloudStatus({ loading: false, msg: 'Synchronized' });
    } catch (e) {
      setCloudStatus({ loading: false, msg: 'Connect failed. Check Gas URL.' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  }, [sysConfig.gasUrl, sysConfig.apiToken]);

  useEffect(() => { refreshData(); }, []);

  const handleGenerateQuotation = async (format, params, ref) => {
    if (!selectedContact) return alert('Select a client first');
    
    setCloudStatus({ loading: true, msg: `Generating ${format.toUpperCase()}...` });
    try {
      if (format === 'pdf') {
        const opt = { margin: 0, filename: `[ACO-QT]-${selectedContact.公司名稱}-${Date.now()}.pdf`, image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        await html2pdf().set(opt).from(ref.current).save();
        setCloudStatus({ loading: false, msg: 'PDF Ready' });
      } else {
        const res = await apiFetch(sysConfig.gasUrl, 'export_excel', { quotation: { company: selectedContact.公司名稱, items: quoteItems, total: quoteItems.reduce((s,i)=>s+(i.單價||i.price),0), currency: params.currency } }, sysConfig.apiToken);
        if (res.success) window.open(res.downloadUrl);
        setCloudStatus({ loading: false, msg: 'Excel Generating...' });
      }
    } catch (e) { setCloudStatus({ loading: false, msg: 'Error generating file' }); }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  const handleSendEmail = async (data) => {
    setCloudStatus({ loading: true, msg: 'Handshaking with Gmail...' });
    try {
      await apiFetch(sysConfig.gasUrl, 'send_email', { emailData: { ...data, to: selectedContact.Email, clientName: selectedContact.聯絡人 } }, sysConfig.apiToken);
      setEmailModal({ open: false });
      setCloudStatus({ loading: false, msg: 'Email Sent via James@ACO' });
    } catch (e) { setCloudStatus({ loading: false, msg: 'Failed to send' }); }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  const seedData = async () => {
    setCloudStatus({ loading: true, msg: 'Seeding Foundation Data...' });
    try {
      await apiFetch(sysConfig.gasUrl, 'seed_data', {}, sysConfig.apiToken);
      refreshData();
    } catch (e) { setCloudStatus({ loading: false, msg: 'Failed to seed' }); }
  };

  return (
    <div className={`h-screen ${CONFIG.THEME.bg} text-slate-200 flex flex-col overflow-hidden`}>
      <nav className={`h-16 ${CONFIG.THEME.nav} flex items-center justify-between px-6 z-40`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center font-black text-slate-950 italic text-xl">A</div>
          <div>
            <h1 className="text-base font-black tracking-tighter text-white uppercase italic leading-none">ACOfusion</h1>
            <p className="text-[9px] font-black text-sky-500 tracking-[0.3em] uppercase mt-1">CRM v6.5 • Flagship Edition</p>
          </div>
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
             <aside className="w-80 border-r border-slate-800 bg-slate-950/50 flex flex-col">
               <div className="p-4 space-y-4">
                  <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-600" size={14} /><input className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-2 text-xs text-white outline-none" placeholder="Search accounts..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
                  <button className="w-full bg-blue-600 text-slate-950 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Camera size={18}/> Scan Card</button>
               </div>
               <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                 {sysConfig.contacts.filter(c => c.公司名稱?.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                   <div key={c.id} onClick={() => setSelectedContact(c)} className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedContact?.id === c.id ? 'bg-sky-500/10 border-sky-500 shadow-xl shadow-sky-500/5' : 'bg-slate-900/30 border-slate-800'}`}>
                      <p className="font-black text-white text-sm truncate">{c.公司名稱}</p>
                      <div className="flex justify-between items-center mt-2"><span className="text-[10px] font-bold text-slate-500 uppercase">{c.聯絡人}</span>{c.googleContactId && <BadgeCheck size={14} className="text-sky-400" />}</div>
                   </div>
                 ))}
               </div>
             </aside>
             <section className="flex-1 p-12 overflow-y-auto">
                {selectedContact ? (
                   <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                           <h2 className="text-6xl font-black text-white tracking-tighter leading-none">{selectedContact.公司名稱}</h2>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={()=>setActiveTab('quote')} className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm uppercase flex items-center gap-3 hover:bg-sky-400 transition-all">Start Quoting <ArrowRight size={20}/></button>
                           <button onClick={()=>setEmailModal({open:true})} className="bg-slate-800 text-white p-4 rounded-2xl hover:bg-slate-700 transition-all"><Mail size={24}/></button>
                        </div>
                      </div>
                      <div className={`${CONFIG.THEME.card} p-8 rounded-[2rem] space-y-6`}>
                         <div className="border-b border-slate-800 pb-4"><label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Contact</label><p className="text-2xl font-bold text-white">{selectedContact.聯絡人}</p></div>
                         <div className="border-b border-slate-800 pb-4"><label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Email</label><p className="text-xl font-mono text-sky-400 italic">{selectedContact.Email}</p></div>
                      </div>
                   </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <img src="https://www.acofusion.com/wp-content/uploads/2021/04/ACOfusion-Logo-White.png" alt="Logo" className="w-64 mb-8" />
                    <p className="mt-4 font-bold tracking-[0.2em] text-slate-500">SELECT ACCOUNT TO INITIATE</p>
                  </div>
                )}
             </section>
          </div>
        )}

        {/* Quoting Tab */}
        {activeTab === 'quote' && (
          <ProQuotationForm 
            client={selectedContact}
            items={quoteItems}
            onAdd={(p) => setQuoteItems([...quoteItems, { ...p, qty: 1 }])}
            onRemove={() => setQuoteItems([])}
            totals={{ subtotal: quoteItems.reduce((s,i)=>s+((i.qty||1)*(i.單價||i.price)),0) }}
            config={sysConfig}
            onGenerate={handleGenerateQuotation}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
           <div className="flex-1 p-12 overflow-y-auto bg-slate-950/50">
             <div className="max-w-xl mx-auto space-y-8">
               <div className={`${CONFIG.THEME.card} p-10 rounded-[2.5rem] space-y-6`}>
                  <h2 className="text-2xl font-black text-white uppercase italic">System Setup</h2>
                  <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500">GAS WEB APP URL (ENDS IN /EXEC)</label>
                       <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-sky-400" value={sysConfig.gasUrl} onChange={e=>setSysConfig({...sysConfig, gasUrl: e.target.value})} placeholder="https://script.google.com/.../exec" />
                    </div>
                    <button onClick={refreshData} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase"><RefreshCw className="inline mr-2" size={16}/> Test Connection</button>
                    <button onClick={seedData} className="w-full bg-sky-500/10 text-sky-400 border border-sky-500/30 py-4 rounded-xl font-black text-xs uppercase"><Database className="inline mr-2" size={16}/> Seed Foundation Data (Fix Empty APP)</button>
                  </div>
               </div>
             </div>
           </div>
        )}
      </main>

      <EmailModal isOpen={emailModal.open} onClose={()=>setEmailModal({open:false})} contact={selectedContact} onSend={handleSendEmail} />

      {cloudStatus.msg && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10"><div className={`flex items-center gap-4 ${CONFIG.THEME.card} px-8 py-4 rounded-full border border-sky-500/30 shadow-2xl`}>{cloudStatus.loading ? <Loader2 size={18} className="animate-spin text-sky-400" /> : <CheckCircle2 size={18} className="text-emerald-400" />}<span className="text-[10px] font-black uppercase tracking-widest text-white">{cloudStatus.msg}</span></div></div>
      )}
    </div>
  );
}