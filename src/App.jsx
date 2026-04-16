import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, 
  CloudOff, RefreshCw, X, Menu, Briefcase, Info, List, Save,
  Globe, CreditCard, Ship, BadgeCheck, FileSpreadsheet, Send, Zap
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

/**
 * ACOfusion Enterprise CRM - Flagship v7.0 (Intelligence & Precision)
 * Refined for lighting manufacturing factory workflows.
 */

const CONFIG = {
  VERSION: '7.0.0-FLAGSHIP',
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
  const [emailData, setEmailData] = useState({ subject: `ACOfusion Lighting Quotation for ${contact?.公司名稱 || ''}`, message: `Dear ${contact?.聯絡人 || ''},\n\nIt was a pleasure meeting you. Please find our latest quotation attached below for your review.\n\nShould you have any technical questions regarding the CCT, Beam Angle, or IP rating, feel free to contact me.\n\nBest Regards,\nJames Tsai` });
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-white flex items-center gap-2"><Mail size={24} className="text-sky-400"/> Send Email Protocol</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Recipient</label>
              <div className="text-white font-bold">{contact?.Email}</div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Company</label>
              <div className="text-white font-bold">{contact?.公司名稱}</div>
            </div>
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
          <button onClick={() => onSend(emailData)} className="flex-1 bg-sky-500 text-slate-950 py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-sky-400 transition-all font-mono"><Send size={18}/> EXECUTE GMAIL SEND</button>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// Sub-Component: ProQuotationForm
// ==========================================
const ProQuotationForm = memo(({ items, onAdd, onRemove, onUpdateItem, totals, client, onGenerate, config, autoVersion }) => {
  const [formConfig, setFormConfig] = useState({
    currency: 'USD',
    incoterm: 'FOB',
    paymentTerm: '30% Deposit / 70% Balance',
    warranty: '5 Years',
    taxEnabled: false,
    version: autoVersion || '1'
  });

  useEffect(() => {
    if (autoVersion) setFormConfig(prev => ({ ...prev, version: autoVersion }));
  }, [autoVersion]);

  const currentCurrency = CONFIG.CURRENCIES.find(c => c.code === formConfig.currency);
  const pdfRef = useRef(null);

  return (
    <div className="flex-1 flex overflow-hidden animate-in fade-in duration-700">
      <aside className="w-[450px] border-r border-slate-800 bg-slate-900/30 flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
          <div className={`${CONFIG.THEME.card} p-5 rounded-2xl border-l-4 border-sky-500`}>
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14}/> QUOTED TO</h4>
             <p className="text-lg font-black text-white">{client?.公司名稱 || 'Draft Entity'}</p>
             <div className="flex justify-between items-center mt-1">
               <p className="text-xs text-slate-400">{client?.Email || 'N/A'}</p>
               <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black text-sky-400">Ver: {formConfig.version}</span>
             </div>
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
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Warranty</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" value={formConfig.warranty} onChange={e=>setFormConfig({...formConfig, warranty: e.target.value})}>
                    <option value="2 Years">2 Years</option>
                    <option value="3 Years">3 Years</option>
                    <option value="5 Years">5 Years</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Doc Version</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" type="number" value={formConfig.version} onChange={e=>setFormConfig({...formConfig, version: e.target.value})} />
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
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Factory Catalog</h4>
            {config.products.length === 0 && <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-[10px] text-slate-600 font-bold uppercase">No products in cloud database.</div>}
            {config.products.map(p => (
              <button key={p.產品編號 || p.id} onClick={() => onAdd(p)} className={`${CONFIG.THEME.card} w-full text-left p-4 rounded-xl hover:border-sky-500 transition-all group flex justify-between items-start`}>
                <div className="flex-1">
                  <div className="text-xs font-black text-white">{p.產品名稱 || p.name}</div>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">{p.產品編號}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded-[4px] text-[8px] text-slate-400">{p.瓦數}</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded-[4px] text-[8px] text-slate-400">IP{p.IP}</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded-[4px] text-[8px] text-slate-400">{p.光束角}</span>
                  </div>
                </div>
                <div className="text-sky-500 font-black text-xs">${p.單價 || p.price}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase"><span>Subtotal</span><span>{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-2xl font-black text-white pt-2 border-t border-slate-800">
               <span className="text-xs self-center text-slate-500 tracking-widest">{formConfig.currency}</span>
               <span>{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onGenerate('pdf', formConfig, pdfRef)} className={`${CONFIG.THEME.primary} text-slate-950 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20 active:scale-95 transition-all outline-none`}><Printer size={18}/> PDF</button>
            <button onClick={() => onGenerate('excel', formConfig, null)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all outline-none"><FileSpreadsheet size={18}/> EXCEL</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-slate-950 flex flex-col overflow-y-auto p-12 items-center">
        <div ref={pdfRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl text-slate-900 relative">
           <header className="flex justify-between items-start border-b-[10px] border-slate-950 pb-8 mb-12">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center font-black text-4xl text-sky-400 italic">A</div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">ACOfusion</h1>
                  <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.5em] mt-1">Lighting Technologies</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-3xl font-black uppercase tracking-widest text-slate-300">Quotation</h2>
                <p className="text-[10px] font-mono text-slate-400 mt-2 italic">SERIAL: [ACO-QT]-{client?.公司名稱 || 'CLIENT'}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}-V{formConfig.version}</p>
             </div>
           </header>
           
           <div className="grid grid-cols-5 gap-4 bg-slate-950 text-white p-4 text-[10px] font-black uppercase tracking-widest rounded-t-lg">
              <div className="col-span-2">Description / Technical Specs</div>
              <div className="text-center">QTY</div>
              <div className="text-center">Unit Price</div>
              <div className="text-right">Total Amount</div>
           </div>
           <div className="mb-12 border-x border-b border-slate-100 min-h-[400px]">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-4 p-5 border-b border-slate-50 items-start">
                   <div className="col-span-2">
                      <p className="font-black text-base uppercase leading-tight">{it.產品名稱 || it.name}</p>
                      <p className="text-[9px] text-slate-600 font-mono mt-1 pr-4">{it.產品編號}</p>
                      <div className="mt-2 text-[9px] text-slate-500 uppercase flex gap-x-4">
                         <span><strong>Watt:</strong> {it.瓦數}</span>
                         <span><strong>CCT:</strong> {it.CCT}</span>
                         <span><strong>IP:</strong> {it.IP}</span>
                      </div>
                      <p className="mt-1 text-[8px] text-slate-400 italic">{it.備註}</p>
                   </div>
                   <div className="text-center font-bold text-sm pt-1">{it.qty || 1}</div>
                   <div className="text-center text-slate-500 font-mono pt-1 text-sm">${it.單價 || it.price}</div>
                   <div className="text-right font-black font-mono pt-1 text-sm">${((it.qty||1) * (it.單價 || it.price)).toFixed(2)}</div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-2 gap-12 text-[11px]">
              <div className="space-y-4">
                 <h5 className="font-black border-b-2 border-slate-950 pb-1 flex items-center gap-2 italic uppercase">Terms & Conditions</h5>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-bold text-slate-600 text-[10px]">
                    <span className="uppercase tracking-tight">Delivery Terms:</span><span className="text-slate-950">{formConfig.incoterm}</span>
                    <span className="uppercase tracking-tight">Payment Terms:</span><span className="text-slate-950">{formConfig.paymentTerm}</span>
                    <span className="uppercase tracking-tight">Warranty Scope:</span><span className="text-slate-950">{formConfig.warranty}</span>
                    <span className="uppercase tracking-tight">Lead Time:</span><span className="text-slate-950">14-25 Working Days</span>
                 </div>
              </div>
              <div className="flex flex-col justify-end text-right space-y-2">
                 <div className="flex justify-between text-slate-400 font-black uppercase text-xs"><span>Sub-Total Gross</span><span>${totals.subtotal.toFixed(2)}</span></div>
                 <div className="flex justify-between text-3xl font-black text-slate-950 border-t-[6px] border-slate-950 pt-4 uppercase italic">
                    <span className="text-xs self-center not-italic text-slate-400">{formConfig.currency} TOTAL</span>
                    <span>{currentCurrency.symbol} {totals.subtotal.toFixed(2)}</span>
                 </div>
              </div>
           </div>
           
           <footer className="mt-24 pt-12 border-t border-slate-100 flex justify-between items-end">
              <div className="text-[9px] text-slate-400 space-y-1">
                 <p className="font-black text-slate-950 uppercase">ACOfusion Lighting Tech CO., LTD</p>
                 <p>Factory Address: Industrial Park Road, Guzhen, Zhongshan, GD</p>
                 <p>www.acofusion.com | james@acofusion.com</p>
              </div>
              <div className="w-32 h-1 bg-slate-950"></div>
           </footer>
        </div>
      </main>
    </div>
  );
});

export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  const [emailModal, setEmailModal] = useState({ open: false });
  const [autoVersion, setAutoVersion] = useState('1');
  
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v7');
    if (saved) return JSON.parse(saved);
    return {
      gasUrl: import.meta.env.VITE_GAS_URL || '',
      apiToken: import.meta.env.VITE_API_TOKEN || '',
      products: [],
      contacts: [],
      deals: []
    };
  });

  const fileInputRef = useRef(null);

  const handleScanCard = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCloudStatus({ loading: true, msg: 'Gemini OCR Analyzing Card...' });
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await apiFetch(sysConfig.gasUrl, 'scan_business_card', { imageBase64: reader.result }, sysConfig.apiToken);
        if (res.success) {
          const syncRes = await apiFetch(sysConfig.gasUrl, 'sync_lead', { lead: res.contact }, sysConfig.apiToken);
          setCloudStatus({ loading: false, msg: 'Contact Synced to Contacts & Sheet' });
          refreshData();
        }
      } catch (err) { setCloudStatus({ loading: false, msg: 'OCR Failed' }); }
    };
    reader.readAsDataURL(file);
  };

  const [selectedContact, setSelectedContact] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = useCallback(async () => {
    if (!sysConfig.gasUrl) return;
    setCloudStatus({ loading: true, msg: 'Initializing Intelligent Hub...' });
    try {
      const resP = await apiFetch(sysConfig.gasUrl, 'getProducts', {}, sysConfig.apiToken);
      const resC = await apiFetch(sysConfig.gasUrl, 'getContacts', {}, sysConfig.apiToken);
      const resD = await apiFetch(sysConfig.gasUrl, 'getDeals', {}, sysConfig.apiToken);
      setSysConfig(prev => ({ ...prev, products: resP.data || [], contacts: resC.data || [], deals: resD.data || [] }));
      setCloudStatus({ loading: false, msg: 'Flagship Synchronized' });
    } catch (e) { setCloudStatus({ loading: false, msg: 'Connect failed.' }); }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  }, [sysConfig.gasUrl, sysConfig.apiToken]);

  useEffect(() => { refreshData(); }, []);

  // Sync Versioning
  useEffect(() => {
    if (activeTab === 'quote' && selectedContact) {
      apiFetch(sysConfig.gasUrl, 'get_next_version', { company: selectedContact.公司名稱 }, sysConfig.apiToken)
        .then(res => { if (res.success) setAutoVersion(res.version.toString()); });
    }
  }, [activeTab, selectedContact]);

  const handleGenerateQuotation = async (format, params, ref) => {
    if (!selectedContact) return alert('Select client first');
    setCloudStatus({ loading: true, msg: `Rasterizing ${format.toUpperCase()}...` });
    try {
      if (format === 'pdf') {
        const opt = { margin: 0, filename: `[ACO-QT]-${selectedContact.公司名稱}-${Date.now()}-V${params.version}.pdf`, image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        await html2pdf().set(opt).from(ref.current).save();
        setCloudStatus({ loading: false, msg: 'PDF Exported' });
      } else {
        const res = await apiFetch(sysConfig.gasUrl, 'export_excel', { quotation: { company: selectedContact.公司名稱, items: quoteItems, total: quoteItems.reduce((s,i)=>s+((i.qty||1)*(i.單價||i.price)),0), currency: params.currency, version: params.version } }, sysConfig.apiToken);
        if (res.success) window.open(res.downloadUrl);
        setCloudStatus({ loading: false, msg: 'Excel Syncing...' });
      }
    } catch (e) { setCloudStatus({ loading: false, msg: 'Generation Error' }); }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  const currentDeal = useMemo(() => {
    if (!selectedContact) return null;
    return sysConfig.deals.slice().reverse().find(d => d.company === selectedContact.公司名稱);
  }, [selectedContact, sysConfig.deals]);

  const handleSendEmail = async (data) => {
    setCloudStatus({ loading: true, msg: 'Connecting to James@acofusion...' });
    try {
      await apiFetch(sysConfig.gasUrl, 'send_email', { emailData: { ...data, to: selectedContact.Email, clientName: selectedContact.聯絡人 } }, sysConfig.apiToken);
      setEmailModal({ open: false });
      setCloudStatus({ loading: false, msg: 'Email Dispatched via Gmail' });
    } catch (e) { setCloudStatus({ loading: false, msg: 'Failed to send' }); }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  return (
    <div className={`h-screen ${CONFIG.THEME.bg} text-slate-200 flex flex-col overflow-hidden`}>
      <nav className={`h-16 ${CONFIG.THEME.nav} flex items-center justify-between px-6 z-40`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center font-black text-slate-950 italic text-xl shadow-lg shadow-sky-500/10">A</div>
          <div>
            <h1 className="text-base font-black tracking-tighter text-white uppercase italic leading-none">ACOfusion</h1>
            <p className="text-[9px] font-black text-sky-500 tracking-[0.3em] uppercase mt-1 italic">Intelligent Factory Hub v7.0</p>
          </div>
        </div>
        <div className="flex bg-slate-800/40 rounded-2xl p-1 gap-1 border border-slate-800 backdrop-blur-3xl">
           <button onClick={() => setActiveTab('crm')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'crm' ? 'bg-sky-500 text-slate-950 shadow-xl' : 'text-slate-400 hover:text-white'}`}><Users size={16}/> Leads</button>
           <button onClick={() => setActiveTab('quote')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'quote' ? 'bg-sky-500 text-slate-950 shadow-xl' : 'text-slate-400 hover:text-white'}`}><FileText size={16}/> Quoting</button>
           <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}><Settings size={18}/></button>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'crm' && (
          <div className="flex-1 flex overflow-hidden">
             <aside className="w-80 border-r border-slate-800 bg-slate-950/50 flex flex-col">
               <div className="p-4 space-y-4">
                  <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-600" size={14} /><input className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-2 text-xs text-white outline-none" placeholder="Search accounts..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
                  <input type="file" ref={fileInputRef} onChange={handleScanCard} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current.click()} className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-slate-950 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-sky-500/10 active:scale-95 transition-all"><Camera size={18}/> Scan Business Card</button>
               </div>
               <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                 {sysConfig.contacts.filter(c => c.公司名稱?.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                   <div key={c.id} onClick={() => setSelectedContact(c)} className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedContact?.id === c.id ? 'bg-sky-500/10 border-sky-500 shadow-xl shadow-sky-500/5 scale-[0.98]' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}>
                      <p className="font-black text-white text-sm truncate">{c.公司名稱}</p>
                      <div className="flex justify-between items-center mt-2 font-mono"><span className="text-[10px] font-bold text-slate-500 uppercase">{c.聯絡人}</span>{c.googleContactId && <BadgeCheck size={14} className="text-sky-400" />}</div>
                   </div>
                 ))}
               </div>
             </aside>
             <section className="flex-1 p-12 overflow-y-auto bg-slate-950">
                {selectedContact ? (
                   <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-5 duration-700">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                           <div className="flex gap-2"><span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">Enterprise Prospect</span></div>
                           <h2 className="text-6xl font-black text-white tracking-tighter leading-none">{selectedContact.公司名稱}</h2>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={()=>setActiveTab('quote')} className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm uppercase flex items-center gap-3 hover:bg-sky-400 transition-all shadow-2xl">Start Quoting <ArrowRight size={20}/></button>
                           <button onClick={()=>setEmailModal({open:true})} className="bg-slate-800 text-white p-4 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700"><Mail size={24}/></button>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <div className={`${CONFIG.THEME.card} p-8 rounded-[2rem] space-y-6 border-slate-800/80`}>
                            <div className="border-b border-slate-800/60 pb-4"><label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Main Contact</label><p className="text-2xl font-bold text-white">{selectedContact.聯絡人}</p></div>
                            <div className="border-b border-slate-800/60 pb-4"><label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Email Pipeline</label><p className="text-xl font-mono text-sky-400 italic underline truncate selection:bg-sky-500/40">{selectedContact.Email}</p></div>
                         </div>
                         <div className="space-y-6">
                            <div className={`${CONFIG.THEME.card} p-8 rounded-[2rem] border-sky-500/20`}>
                               <h4 className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Zap size={18}/> AI Opportunity Tracker</h4>
                               <div className="space-y-5">
                                  <div className="flex justify-between items-center text-sm font-bold"><span className="text-slate-500 uppercase">Stage</span><span className="bg-sky-500 text-slate-950 px-3 py-1 rounded-lg font-black text-[10px]">{currentDeal?.status || 'New Inquiry'}</span></div>
                                  <div className="pt-4 p-5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
                                     <label className="text-[9px] font-black text-slate-600 uppercase block mb-2 tracking-widest">Next-Action Guidance</label>
                                     <p className="text-xs text-slate-200 italic font-mono leading-relaxed">"{currentDeal?.aiStrategy || 'Processing previous interactions... Waiting for first quote to activate analysis.'}"</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <img src="https://www.acofusion.com/wp-content/uploads/2021/04/ACOfusion-Logo-White.png" alt="Logo" className="w-[32rem] grayscale contrast-[150%] mb-8" />
                    <p className="font-black tracking-[0.4em] text-slate-400 text-xl border-t border-slate-800 pt-8 italic">COMMAND CENTER IDLE</p>
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
            autoVersion={autoVersion}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
           <div className="flex-1 p-12 overflow-y-auto bg-slate-950/50">
             <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-1000">
               <div className={`${CONFIG.THEME.card} p-10 rounded-[2.5rem] space-y-6 border-slate-700/50 shadow-[0_0_100px_rgba(56,189,248,0.05)]`}>
                  <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                    <Settings className="text-sky-500" size={32}/>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Factory Protocol Setup</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Endpoint: GAS WEB APP</label>
                       <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-sky-400 selection:bg-sky-500/40" value={sysConfig.gasUrl} onChange={e=>setSysConfig({...sysConfig, gasUrl: e.target.value})} placeholder="https://script.google.com/.../exec" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={refreshData} className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"><RefreshCw className="inline mr-2" size={16}/> Refresh</button>
                      <button onClick={async () => { await apiFetch(sysConfig.gasUrl, 'seed_data', {}, sysConfig.apiToken); refreshData(); }} className="bg-sky-500/10 text-sky-400 border border-sky-500/30 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-500 hover:text-slate-950 transition-all"><Database className="inline mr-2" size={16}/> Sync Catalog</button>
                    </div>
                  </div>
               </div>
             </div>
           </div>
        )}
      </main>

      <EmailModal isOpen={emailModal.open} onClose={()=>setEmailModal({open:false})} contact={selectedContact} onSend={handleSendEmail} />

      {cloudStatus.msg && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10">
          <div className={`flex items-center gap-4 ${CONFIG.THEME.card} px-8 py-4 rounded-full border border-sky-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-slate-900/90`}>
            {cloudStatus.loading ? <Loader2 size={24} className="animate-spin text-sky-400" /> : <CheckCircle2 size={24} className="text-emerald-400" />}
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white italic font-mono">{cloudStatus.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}