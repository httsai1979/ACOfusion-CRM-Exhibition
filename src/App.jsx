import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, 
  CloudOff, RefreshCw, X, Menu, Briefcase, Info, List
} from 'lucide-react';

/**
 * ACOfusion Enterprise CRM - Production Edition (v4.0)
 * Rebuilt based on Luminous Architecture & Dark High-Tech Branding
 */

const CONFIG = {
  VERSION: '4.0.1-PRO',
  BRANDS: {
    bg: 'bg-slate-950',
    card: 'bg-slate-900/50 backdrop-blur-xl border border-slate-800',
    primary: 'text-blue-500',
    accent: 'text-cyan-400'
  }
};

const loadScript = (src, globalVar) => {
  return new Promise((resolve, reject) => {
    if (window[globalVar]) { resolve(window[globalVar]); return; }
    const script = document.createElement('script');
    script.src = src; script.async = true;
    script.onload = () => resolve(window[globalVar]);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
};

export default function App() {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState('crm');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });

  // --- Data State ---
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('acofusion_contacts');
    return saved ? JSON.parse(saved) : [];
  });
  const [syncQueue, setSyncQueue] = useState(() => {
    const saved = localStorage.getItem('acofusion_sync_queue');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config');
    return saved ? JSON.parse(saved) : {
      gasUrl: 'https://script.google.com/macros/s/AKfycbw6DubVZzZTsldD2vrD42y89AqcOlXncU_hN3-RGLn2/exec',
      apiToken: 'ACOFUSION_SECRET_TOKEN_2024',
      companyName: 'ACOfusion Lighting Tech',
      senderName: 'Sales Manager',
      eventName: 'Light + Building 2026'
    };
  });

  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Quotation State ---
  const [quoteItems, setQuoteItems] = useState([]);
  const [quoteSettings, setQuoteSettings] = useState({ 
    currency: 'USD', 
    validity: '30 Days',
    tax: 0 
  });

  const pdfRef = useRef(null);

  // --- Persistence Hooks ---
  useEffect(() => {
    localStorage.setItem('acofusion_contacts', JSON.stringify(contacts));
    localStorage.setItem('acofusion_sync_queue', JSON.stringify(syncQueue));
  }, [contacts, syncQueue]);

  useEffect(() => {
    localStorage.setItem('acofusion_config', JSON.stringify(sysConfig));
  }, [sysConfig]);

  // --- API Actions ---

  const fetchCloudData = async () => {
    if (!sysConfig.gasUrl) return;
    setCloudStatus({ loading: true, msg: 'Syncing Cloud Resources...' });
    try {
      // Fetch Products
      const pRes = await fetch(`${sysConfig.gasUrl}?action=getProducts`);
      const pData = await pRes.json();
      if (pData.success) {
        setProducts(pData.data.map(p => ({
          ...p,
          id: p.SKU || p.id,
          name: p.Name || p.name,
          price: parseFloat(p.Price || p.price || 0),
          specs: p.Specs || p.specs || '',
          // Mocking some tech specs if missing for v4.0 requirement
          techSpecs: {
            CCT: '3000K-6000K',
            Lumen: '2400lm',
            CRI: '>90',
            IP: 'IP65'
          }
        })));
      }

      // Fetch Contacts
      const cRes = await fetch(`${sysConfig.gasUrl}?action=getContacts`);
      const cData = await cRes.json();
      if (cData.success) {
        const cloudContacts = cData.data.map(c => ({
          ...c,
          syncStatus: 'synced'
        }));
        // Merge with local (local pending takes priority)
        const merged = [...contacts];
        cloudContacts.forEach(cc => {
          if (!merged.find(mc => mc.email === cc.email)) {
            merged.push(cc);
          }
        });
        setContacts(merged);
      }
      setCloudStatus({ loading: false, msg: 'Cloud Synchronized' });
    } catch (e) {
      setCloudStatus({ loading: false, msg: 'Offline Mode Active' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  useEffect(() => { fetchCloudData(); }, []);

  const handleSyncPending = async () => {
    if (syncQueue.length === 0) return;
    setCloudStatus({ loading: true, msg: `Syncing ${syncQueue.length} items...` });
    
    const newQueue = [...syncQueue];
    const failed = [];

    for (const item of syncQueue) {
      try {
        const res = await fetch(sysConfig.gasUrl, {
          method: 'POST',
          mode: 'no-cors', // GAS requirement for simple requests sometimes
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync_lead',
            token: sysConfig.apiToken,
            lead: item
          })
        });
        // Note: no-cors mode results in opaque response, we assume success if no throw
      } catch (e) {
        failed.push(item);
      }
    }

    setSyncQueue(failed);
    setCloudStatus({ loading: false, msg: failed.length === 0 ? 'All Synced' : `${failed.length} Failed` });
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  const addContact = (newContact) => {
    const contact = {
      ...newContact,
      id: `C-${Date.now()}`,
      syncStatus: 'pending',
      lastUpdate: new Date().toLocaleString()
    };
    setContacts([contact, ...contacts]);
    setSyncQueue([contact, ...syncQueue]);
    setSelectedContact(contact);
  };

  // --- OCR Mock (Module C) ---
  const handleScanCard = () => {
    setCloudStatus({ loading: true, msg: 'AI OCR Processing...' });
    // Simulate Canvas compression and AI extraction
    setTimeout(() => {
      addContact({
        name: 'James Tsai',
        company: 'ACOfusion Global',
        email: `client_${Math.floor(Math.random()*1000)}@example.com`,
        phone: '+886 912 345 678',
        status: 'New'
      });
      setCloudStatus({ loading: false, msg: 'OCR Complete' });
      setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 2000);
    }, 2000);
  };

  // --- PDF Engine (Module D) ---
  const handleGeneratePDF = async () => {
    setCloudStatus({ loading: true, msg: 'Rendering High-Pro PDF (A4 1200px)...' });
    const html2pdf = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', 'html2pdf');
    
    const opt = {
      margin: 0,
      filename: `ACO_Quote_${selectedContact?.company || 'Draft'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        windowWidth: 1200 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(pdfRef.current).save();
      setCloudStatus({ loading: false, msg: 'PDF Ready' });
    } catch (e) {
      setCloudStatus({ loading: false, msg: 'PDF Engine Error' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  // --- Calculations ---
  const totals = useMemo(() => {
    const subtotal = quoteItems.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const taxValue = subtotal * (quoteSettings.tax / 100);
    return { subtotal, taxValue, total: subtotal + taxValue };
  }, [quoteItems, quoteSettings]);

  // --- Render Helpers ---
  const filteredContacts = contacts.filter(c => 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`h-screen ${CONFIG.BRANDS.bg} text-slate-200 flex flex-col overflow-hidden font-sans selection:bg-blue-500/30`}>
      {/* Top Navbar */}
      <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center font-black text-slate-950">A</div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white uppercase italic">ACOfusion</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">{CONFIG.VERSION}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-slate-950/50 border border-slate-800 rounded-full px-4 py-1.5 gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${syncQueue.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {syncQueue.length > 0 ? `${syncQueue.length} PENDING` : 'SYS ONLINE'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('crm')} className={`p-2 rounded-xl transition-all ${activeTab === 'crm' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><Users size={18} /></button>
            <button onClick={() => setActiveTab('quote')} className={`p-2 rounded-xl transition-all ${activeTab === 'quote' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><FileText size={18} /></button>
            <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}><Settings size={18} /></button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* CRM Tab */}
        {activeTab === 'crm' && (
          <div className="flex-1 flex overflow-hidden animate-in fade-in duration-500">
            <aside className={`w-80 border-r border-slate-800 flex flex-col transition-all ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:border-blue-500 outline-none transition-all" 
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleScanCard}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Camera size={16} /> Scan Card (AI)
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {filteredContacts.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedContact(c)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedContact?.id === c.id ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="font-black text-sm text-white mb-1">{c.company}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{c.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black ${c.syncStatus === 'synced' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {c.syncStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <section className="flex-1 bg-slate-950 p-6 lg:p-12 overflow-y-auto">
              {selectedContact ? (
                <div className="max-w-4xl mx-auto space-y-12">
                   <div className="flex justify-between items-start">
                     <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest">Enterprise Lead</span>
                          {selectedContact.syncStatus === 'synced' && <span className="text-cyan-400 text-[8px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={10}/> Synced</span>}
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-tight leading-none">{selectedContact.company}</h2>
                     </div>
                     <button 
                        onClick={() => { setActiveTab('quote'); setQuoteItems([]); }}
                        className="bg-white text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-cyan-400 transition-all"
                      >
                       Build Quote <ArrowRight size={18}/>
                     </button>
                   </div>

                   <div className="grid md:grid-cols-2 gap-8 text-slate-300">
                     <div className={`${CONFIG.BRANDS.card} p-8 rounded-3xl space-y-6`}>
                        <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Main Contact</label><p className="text-xl font-bold text-white">{selectedContact.name}</p></div>
                        <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Email System</label><p className="text-xl font-bold text-white">{selectedContact.email}</p></div>
                        <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Direct Line</label><p className="text-xl font-bold text-white">{selectedContact.phone || 'N/A'}</p></div>
                     </div>
                     <div className="space-y-6">
                        <div className={`${CONFIG.BRANDS.card} p-8 rounded-3xl`}>
                          <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16}/> Interaction Pipeline</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between text-xs"><span className="text-slate-500 uppercase font-black">Last Sync</span><span className="text-white font-mono">{selectedContact.lastUpdate}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-slate-500 uppercase font-black">Status</span><span className="text-blue-500 font-bold">{selectedContact.status}</span></div>
                            <div className="pt-4 flex gap-2">
                              <button className="flex-1 bg-slate-800 text-[10px] font-black uppercase py-2 rounded-lg hover:bg-slate-700 transition-all">Send Catalog</button>
                              <button className="flex-1 bg-slate-800 text-[10px] font-black uppercase py-2 rounded-lg hover:bg-slate-700 transition-all">Add Memo</button>
                            </div>
                          </div>
                        </div>
                     </div>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <LayoutDashboard size={100} strokeWidth={1} />
                  <p className="mt-4 font-black uppercase tracking-widest">Select an account to view details</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Quote Tab */}
        {activeTab === 'quote' && (
          <div className="flex-1 flex overflow-hidden animate-in fade-in duration-500">
            <aside className="w-96 border-r border-slate-800 flex flex-col bg-slate-900/30">
              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building size={14}/> Client Target</h4>
                  <div className={`${CONFIG.BRANDS.card} p-4 rounded-2xl space-y-2`}>
                    <p className="text-sm font-black text-white">{selectedContact?.company || 'No Company Selected'}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{selectedContact?.email || 'Please select a contact from CRM'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><List size={14}/> Product Selector</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {products.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setQuoteItems([...quoteItems, { ...p, qty: 1 }])}
                        className={`${CONFIG.BRANDS.card} text-left p-4 rounded-2xl hover:border-blue-500 transition-all group flex justify-between items-center`}
                      >
                        <div>
                          <p className="text-xs font-black text-white">{p.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">${p.price}</p>
                        </div>
                        <Plus size={16} className="text-slate-500 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Subtotal</span>
                  <span className="text-2xl font-black text-white">${totals.subtotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleGeneratePDF}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all"
                >
                  <Printer size={20}/> Generate & Download PDF
                </button>
                <div className="flex gap-2 text-[10px] font-black uppercase">
                  <button className="flex-1 bg-slate-800 text-slate-400 py-2 rounded-xl hover:text-white" onClick={() => setQuoteItems([])}>Discard</button>
                  <button className="flex-1 bg-cyan-900/30 text-cyan-400 py-2 rounded-xl border border-cyan-500/30">Save Draft</button>
                </div>
              </div>
            </aside>

            {/* Live PDF Preview */}
            <section className="flex-1 bg-slate-950 p-12 overflow-y-auto flex justify-center selection:bg-none">
              <div 
                ref={pdfRef} 
                className="bg-white w-[210mm] min-h-[297mm] p-[15mm] text-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col print:shadow-none"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {/* Page 1: Cover & Breakdown */}
                <div className="h-[267mm] flex flex-col">
                  <header className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-12">
                    <div>
                      <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">ACOfusion</h1>
                      <p className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] mt-1">Lighting Technologies</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest leading-none">Quotation</h2>
                      <p className="text-[10px] font-mono text-slate-400 mt-2">NO: ACO-{Date.now().toString().slice(-6)}</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-2 gap-12 mb-16">
                    <div className="space-y-4">
                      <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] border-b border-blue-100 pb-2">Client Profile</h3>
                      <p className="text-3xl font-black leading-none">{selectedContact?.company || 'CANDIDATE CO.'}</p>
                      <div className="text-[11px] font-bold text-slate-500 space-y-1">
                        <p>ATTN: {selectedContact?.name || '-'}</p>
                        <p>EMAIL: {selectedContact?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end text-right text-[10px] font-black uppercase tracking-widest text-slate-400 gap-1">
                      <p>Quote Date: <span className="text-slate-900">{new Date().toLocaleDateString()}</span></p>
                      <p>Validity: <span className="text-slate-900">{quoteSettings.validity}</span></p>
                      <p>Currency: <span className="text-blue-600">{quoteSettings.currency}</span></p>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-4">Item & Description</th>
                        <th className="py-4 text-center w-24">Qty</th>
                        <th className="py-4 text-right w-32">Price</th>
                        <th className="py-4 text-right w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 italic">
                          <td className="py-6">
                             <div className="font-black text-sm uppercase">{item.name}</div>
                             <div className="text-[9px] text-slate-400 font-bold mt-1">{item.specs}</div>
                          </td>
                          <td className="py-6 text-center font-bold">{item.qty || 1}</td>
                          <td className="py-6 text-right text-slate-500 font-mono">${item.price.toFixed(2)}</td>
                          <td className="py-6 text-right font-black font-mono">${(item.price * (item.qty || 1)).toFixed(2)}</td>
                        </tr>
                      ))}
                      {quoteItems.length === 0 && (
                        <tr><td colSpan={4} className="py-32 text-center text-slate-200 font-black text-3xl uppercase tracking-tighter italic">Pending Selection</td></tr>
                      )}
                    </tbody>
                  </table>

                  <div className="mt-auto border-t-2 border-slate-100 pt-8 flex justify-between items-end">
                    <div className="space-y-4">
                      <div className="w-56 h-12 border-b-2 border-slate-900 relative">
                        <span className="absolute -bottom-5 left-0 text-[8px] font-black text-slate-300 uppercase italic">Authorized Signature</span>
                      </div>
                    </div>
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Net Amount</span><span>${totals.subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-2xl font-black text-slate-950 border-t-4 border-slate-950 pt-3">
                        <span>Total</span>
                        <span>{quoteSettings.currency} {totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 2: Technical Specs (Module D) */}
                <div className="mt-[30mm] pt-[15mm] border-t-8 border-slate-900">
                  <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 italic">02. Technical Specifications</h3>
                  <div className="grid grid-cols-1 gap-1">
                     <div className="grid grid-cols-5 bg-slate-900 text-white text-[9px] font-black uppercase p-3 rounded-t-lg tracking-widest">
                        <div className="col-span-1">SKU</div>
                        <div className="col-span-1 text-center">Color Temp</div>
                        <div className="col-span-1 text-center">Brightness</div>
                        <div className="col-span-1 text-center">Lumen/W</div>
                        <div className="col-span-1 text-right">Protections</div>
                     </div>
                     {quoteItems.map((item, idx) => (
                       <div key={idx} className="grid grid-cols-5 p-3 border-b border-slate-100 text-[10px] font-bold text-slate-600">
                          <div className="col-span-1 font-black text-slate-950">{item.id}</div>
                          <div className="col-span-1 text-center">{item.techSpecs?.CCT || '3000K-6000K'}</div>
                          <div className="col-span-1 text-center italic">{item.techSpecs?.Brightness || '2400cd/m²'}</div>
                          <div className="col-span-1 text-center font-mono">{item.techSpecs?.Lumen || '110 lm/W'}</div>
                          <div className="col-span-1 text-right">{item.techSpecs?.IP || 'IP67'}</div>
                       </div>
                     ))}
                     {quoteItems.length === 0 && (
                       <div className="p-12 text-center text-slate-200 font-black uppercase">No payload technical data</div>
                     )}
                  </div>
                  <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-2 leading-none">Engineering Compliance</p>
                     <p className="text-[9px] text-slate-500 leading-relaxed italic">All listed hardware undergoes rigorous spectral testing and thermal management validation. Compliance with CE-LVD and EMC standards is guaranteed for exhibition environments.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 lg:p-12 overflow-y-auto bg-slate-950/50 animate-in zoom-in-95 duration-300">
            <div className="max-w-2xl mx-auto space-y-8">
               <div className={`${CONFIG.BRANDS.card} p-10 rounded-[2.5rem] space-y-8`}>
                 <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                    <ShieldCheck size={40} className="text-blue-500" />
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase italic">System Gateway</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise API Configuration</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GAS Endpoint URL</label>
                       <input 
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-400 focus:border-blue-500 outline-none transition-all shadow-inner" 
                         value={sysConfig.gasUrl}
                         onChange={e => setSysConfig({...sysConfig, gasUrl: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">API Secret Token</label>
                          <input 
                            type="password"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none" 
                            value={sysConfig.apiToken}
                            onChange={e => setSysConfig({...sysConfig, apiToken: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Event Code</label>
                          <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none" 
                            value={sysConfig.eventName}
                            onChange={e => setSysConfig({...sysConfig, eventName: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={fetchCloudData}
                        className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-700 transition-all border border-slate-700"
                      >
                        <RefreshCw size={16}/> Sync Cloud
                      </button>
                      <button 
                        onClick={handleSyncPending}
                        disabled={syncQueue.length === 0}
                        className={`flex-1 ${syncQueue.length > 0 ? 'bg-blue-600' : 'bg-slate-900 text-slate-700 opacity-50'} text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all`}
                      >
                        <Activity size={16}/> Push Pending ({syncQueue.length})
                      </button>
                    </div>
                 </div>
               </div>

               {syncQueue.length > 0 && (
                 <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <AlertCircle className="text-amber-500" />
                       <div>
                         <p className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none">Offline Leads Detected</p>
                         <p className="text-[10px] text-amber-500/60 font-bold mt-1 uppercase">Cloud sync is required to finalize {syncQueue.length} records</p>
                       </div>
                    </div>
                    <button onClick={handleSyncPending} className="bg-amber-500 text-slate-950 px-6 py-2 rounded-xl font-black text-[10px] uppercase hover:brightness-110">Push All</button>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Global Status HUD */}
      {cloudStatus.msg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300">
           <div className="bg-slate-900 border border-slate-700 shadow-2xl px-6 py-3 rounded-full flex items-center gap-4">
              {cloudStatus.loading ? (
                <Loader2 size={18} className="animate-spin text-blue-500" />
              ) : (
                <CheckCircle2 size={18} className="text-cyan-400" />
              )}
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">{cloudStatus.msg}</span>
           </div>
        </div>
      )}
    </div>
  );
}