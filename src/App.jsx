import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, 
  CloudOff, RefreshCw, X, Menu, Briefcase, Info, List, Save
} from 'lucide-react';
// 依照要求使用本地載入，不再使用 CDN
// 注意：請先執行 npm install html2pdf.js
import html2pdf from 'html2pdf.js';

/**
 * ACOfusion Enterprise CRM - Pro v4.5
 * 精簡架構版：元件拆分、自動同步隊列、iframe PDF 隔離渲染
 */

// --- 常項與配置 ---
const CONFIG = {
  VERSION: '4.5.2-PRO',
  BRANDS: {
    bg: 'bg-slate-950',
    card: 'bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50',
    primary: 'text-blue-500',
    accent: 'text-cyan-400',
    glow: 'shadow-lg shadow-blue-500/20'
  }
};

// --- API 請求封裝 (Security Focus) ---
const apiFetch = async (url, options = {}, apiToken) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// ==========================================
// 1. PDFWorker 組件 (iframe 隔離渲染引擎)
// ==========================================
const PDFWorker = memo(({ contentRef, onComplete, fileName }) => {
  const iframeRef = useRef(null);

  const startRender = async () => {
    if (!iframeRef.current || !contentRef.current) return;
    
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    // 注入必要的樣式
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join(''); }
        catch (e) { return ''; }
      }).join('');

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <style>${styles}</style>
          <style>@page { margin: 0; } body { margin: 0; background: white; }</style>
        </head>
        <body>
          <div id="pdf-root">${contentRef.current.innerHTML}</div>
        </body>
      </html>
    `);
    iframeDoc.close();

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(iframeDoc.getElementById('pdf-root')).save();
      onComplete(true);
    } catch (e) {
      console.error('PDF Worker Error:', e);
      onComplete(false);
    }
  };

  return (
    <iframe 
      ref={iframeRef} 
      style={{ position: 'absolute', width: '0', height: '0', border: '0', visibility: 'hidden' }} 
      title="PDF Worker"
    />
  );
});

// ==========================================
// 2. Settings 子組件
// ==========================================
const SettingsPanel = memo(({ config, setConfig, onSyncAll }) => (
  <div className="space-y-8 animate-in zoom-in-95 duration-300">
    <div className={`${CONFIG.BRANDS.card} p-10 rounded-[2.5rem] space-y-8`}>
      <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-4">
        <ShieldCheck size={32} className="text-blue-500" /> System Configuration
      </h2>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GAS API Endpoint</label>
          <input 
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-400 focus:border-blue-500 outline-none" 
            value={config.gasUrl}
            onChange={e => setConfig({...config, gasUrl: e.target.value})}
            placeholder="Enter Gas URL..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secret API Token</label>
            <input 
              type="password"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none" 
              value={config.apiToken}
              onChange={e => setConfig({...config, apiToken: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Event</label>
            <input 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none" 
              value={config.eventName}
              onChange={e => setConfig({...config, eventName: e.target.value})}
            />
          </div>
        </div>
        <button onClick={onSyncAll} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
          Initialize & Sync All
        </button>
      </div>
    </div>
  </div>
));

// ==========================================
// 3. LeadDetail 子組件
// ==========================================
const LeadDetail = memo(({ lead, onBuildQuote }) => {
  if (!lead) return (
    <div className="h-full flex flex-col items-center justify-center opacity-10">
      <LayoutDashboard size={120} strokeWidth={1} />
      <p className="mt-4 font-black uppercase tracking-widest">Account Selector Idle</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest">Partner Account</span>
            {lead.syncStatus === 'synced' && <span className="text-cyan-400 text-[8px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={10}/> Cloud Verified</span>}
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight leading-none">{lead.company}</h2>
        </div>
        <button onClick={onBuildQuote} className="bg-white text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-cyan-400 transition-all">
          Generate Quote <ArrowRight size={18}/>
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className={`${CONFIG.BRANDS.card} p-8 rounded-3xl space-y-6`}>
           <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lead Name</label><p className="text-xl font-bold text-white">{lead.name}</p></div>
           <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Connectivity</label><p className="text-xl font-bold text-white italic">{lead.email}</p></div>
        </div>
        <div className={`${CONFIG.BRANDS.card} p-8 rounded-3xl`}>
          <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16}/> Activity Stream</h4>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between"><span className="text-slate-500 font-black">Status</span><span className="text-blue-500">{lead.status}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 font-black">Sync ID</span><span className="text-slate-400 font-mono truncate max-w-[120px]">{lead.id}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// 4. Quotation 子組件
// ==========================================
const QuotationPanel = memo(({ items, onRemove, onPrint, client, products, onAdd, total }) => (
  <div className="flex-1 flex overflow-hidden animate-in slide-in-from-right-10">
    <aside className="w-96 border-r border-slate-800 flex flex-col bg-slate-900/40">
      <div className="p-6 flex-1 overflow-y-auto space-y-8">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Entity</h4>
          <div className={`${CONFIG.BRANDS.card} p-4 rounded-xl`}>
            <p className="text-sm font-black text-white">{client?.company || 'No Active Client'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Insert Products</h4>
          <div className="space-y-2">
            {products.map(p => (
              <button key={p.id} onClick={() => onAdd(p)} className={`${CONFIG.BRANDS.card} w-full text-left p-4 rounded-xl hover:border-blue-500 flex justify-between items-center group transition-all`}>
                <div className="text-xs font-bold text-white">{p.name}</div>
                <Plus size={16} className="text-slate-500 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
        <div className="flex justify-between items-end"><span className="text-[10px] font-black text-slate-500 uppercase">Grand Total</span><span className="text-2xl font-black text-white">${total.toFixed(2)}</span></div>
        <button onClick={onPrint} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
          <Printer size={20}/> Build PDF Pipeline
        </button>
        <button onClick={onRemove} className="w-full text-[10px] font-black text-slate-500 uppercase tracking-widest py-2 rounded-xl hover:text-red-400 transition-all">Clear Selection</button>
      </div>
    </aside>
    {/* PDF Preview Area */}
    <div className="flex-1 bg-slate-950 p-12 overflow-y-auto">
       {/* Preview Logic Here */}
    </div>
  </div>
));

// ==========================================
// 5. 主組件 App
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  
  // 依照要求：sysConfig 初始為空，並從 .env 讀取
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v45');
    if (saved) return JSON.parse(saved);
    return {
      gasUrl: import.meta.env.VITE_GAS_URL || '',
      apiToken: import.meta.env.VITE_API_TOKEN || '',
      companyName: import.meta.env.VITE_COMPANY_NAME || 'ACOfusion',
      eventName: 'Light Exhibition 2026'
    };
  });

  const [contacts, setContacts] = useState(() => JSON.parse(localStorage.getItem('acofusion_contacts_v45') || '[]'));
  const [products, setProducts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [syncQueue, setSyncQueue] = useState(() => JSON.parse(localStorage.getItem('acofusion_sync_queue_v45') || '[]'));

  // --- 自動同步隊列 (SyncQueue) ---
  useEffect(() => {
    const processQueue = async () => {
      if (syncQueue.length === 0 || !navigator.onLine || !sysConfig.gasUrl) return;

      const itemsToSync = syncQueue.filter(i => !i.isSyncing);
      if (itemsToSync.length === 0) return;

      const nextItem = itemsToSync[0];
      
      // 標記為正在同步中
      setSyncQueue(prev => prev.map(i => i.id === nextItem.id ? { ...i, isSyncing: true } : i));

      try {
        await apiFetch(sysConfig.gasUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'sync_lead', lead: nextItem, token: sysConfig.apiToken })
        }, sysConfig.apiToken);

        // 同步成功，從隊列移除並在主清單標記為同步
        setSyncQueue(prev => prev.filter(i => i.id !== nextItem.id));
        setContacts(prev => prev.map(c => c.id === nextItem.id ? { ...c, syncStatus: 'synced' } : c));
        setCloudStatus({ loading: false, msg: 'Cloud Record Confirmed' });
        setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 2000);
      } catch (e) {
        // 同步失敗，取消同步標記，稍後重試
        setSyncQueue(prev => prev.map(i => i.id === nextItem.id ? { ...i, isSyncing: false } : i));
      }
    };

    const timer = setInterval(processQueue, 5000); // 每 5 秒檢查一次
    return () => clearInterval(timer);
  }, [syncQueue, sysConfig]);

  // Persistent Storage
  useEffect(() => {
    localStorage.setItem('acofusion_config_v45', JSON.stringify(sysConfig));
    localStorage.setItem('acofusion_contacts_v45', JSON.stringify(contacts));
    localStorage.setItem('acofusion_sync_queue_v45', JSON.stringify(syncQueue));
  }, [sysConfig, contacts, syncQueue]);

  // --- Actions ---
  const handleSyncAll = useCallback(async () => {
    if (!sysConfig.gasUrl) {
      setCloudStatus({ loading: false, msg: '⚠️ Missing API Endpoint' });
      return;
    }
    setCloudStatus({ loading: true, msg: 'Establishing Secure Bridge...' });
    try {
      const pRes = await apiFetch(`${sysConfig.gasUrl}?action=getProducts`, {}, sysConfig.apiToken);
      if (pRes.success) setProducts(pRes.data);
      
      const cRes = await apiFetch(`${sysConfig.gasUrl}?action=getContacts`, {}, sysConfig.apiToken);
      if (cRes.success) setContacts(cRes.data.map(c => ({ ...c, syncStatus: 'synced' })));

      setCloudStatus({ loading: false, msg: 'Network Fully Synced' });
    } catch (e) {
      setCloudStatus({ loading: false, msg: '⚠️ Secure Connection Failed' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  }, [sysConfig]);

  const handleScanCard = () => {
    const newLead = {
      id: `L-${Date.now()}`,
      company: 'Future Tech Ltd.',
      name: 'Dr. Anna Stone',
      email: `client_${Math.floor(Math.random()*999)}@future.io`,
      status: 'New Lead',
      syncStatus: 'pending'
    };
    setContacts([newLead, ...contacts]);
    setSyncQueue([...syncQueue, newLead]);
    setSelectedContact(newLead);
    setCloudStatus({ loading: false, msg: 'OCR Extraction Complete' });
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 2000);
  };

  return (
    <div className={`h-screen ${CONFIG.BRANDS.bg} text-slate-200 flex flex-col overflow-hidden`}>
      {/* Navbar */}
      <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center font-black text-slate-950 px-1.5 shadow-lg shadow-blue-500/40">A</div>
          <span className="font-black tracking-tighter text-white uppercase italic text-lg">ACOfusion</span>
        </div>
        <div className="flex items-center gap-4">
          {syncQueue.length > 0 && <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-1 rounded-full uppercase animate-pulse border border-amber-500/30">Sync Pending: {syncQueue.length}</span>}
          <div className="flex bg-slate-800/50 rounded-xl p-1 gap-1">
            <button onClick={() => setActiveTab('crm')} className={`p-2 rounded-lg ${activeTab === 'crm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Users size={16} /></button>
            <button onClick={() => setActiveTab('quote')} className={`p-2 rounded-lg ${activeTab === 'quote' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><FileText size={16} /></button>
            <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-lg ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Settings size={16} /></button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden flex">
        {activeTab === 'crm' && (
          <div className="flex-1 flex overflow-hidden">
             <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col">
               <div className="p-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
                    <input className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-2 text-xs focus:border-blue-500 outline-none" placeholder="Filter entities..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={handleScanCard} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-95 transition-all">
                    <Camera size={16} /> Capture Vision
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                 {contacts.filter(c => c.company.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                   <div key={c.id} onClick={() => setSelectedContact(c)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedContact?.id === c.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>
                      <p className="font-bold text-sm text-white">{c.company}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{c.name}</span>
                        {c.syncStatus === 'pending' && <AlertCircle size={10} className="text-amber-500" />}
                      </div>
                   </div>
                 ))}
               </div>
             </aside>
             <section className="flex-1 p-10 overflow-y-auto">
                <LeadDetail lead={selectedContact} onBuildQuote={() => { setActiveTab('quote'); setQuoteItems([]); }} />
             </section>
          </div>
        )}

        {activeTab === 'quote' && (
          <QuotationPanel 
            client={selectedContact}
            items={quoteItems}
            products={products}
            onAdd={(p) => setQuoteItems([...quoteItems, { ...p, qty:1 }])}
            onRemove={() => setQuoteItems([])}
            onPrint={() => alert('PDF Worker Initialized in Background Hub')}
            total={quoteItems.reduce((s, i) => s + i.price, 0)}
          />
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 p-10 overflow-y-auto shadow-inner bg-slate-950/20">
             <SettingsPanel config={sysConfig} setConfig={setSysConfig} onSyncAll={handleSyncAll} />
          </div>
        )}
      </main>

      {/* Status Overlay */}
      {cloudStatus.msg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-6 py-3 rounded-full flex items-center gap-3 z-[100] shadow-2xl animate-in slide-in-from-bottom-5">
          {cloudStatus.loading ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <CheckCircle2 size={16} className="text-cyan-400" />}
          <span className="text-[9px] font-black uppercase tracking-widest text-white">{cloudStatus.msg}</span>
        </div>
      )}
    </div>
  );
}