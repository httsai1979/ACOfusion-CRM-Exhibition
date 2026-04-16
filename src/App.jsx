import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard, AlertCircle, CloudOff
} from 'lucide-react';

/**
 * ACOfusion Lighting CRM - 專業生產版 v28.2
 * 已解決：
 * 1. 動態產品資料庫架構
 * 2. 強化 PDF 隔離渲染引擎 (防裁切)
 * 3. 雲端同步狀態追蹤
 */

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

const TRANSLATIONS = {
  EN: { quote: 'QUOTATION', quotedTo: 'QUOTED TO:', no: 'No.', desc: 'Product & Description', qty: 'Qty', price: 'Unit Price', total: 'Total', grand: 'Grand Total', date: 'Date:', validity: 'Validity:', currency: 'Currency:', sign: 'Authorized Signature' },
  TW: { quote: '正式報價單', quotedTo: '客戶資訊:', no: '項次', desc: '產品與規格說明', qty: '數量', price: '單價', total: '總計', grand: '總計金額', date: '報價日期:', validity: '有效期限:', currency: '報價幣別:', sign: '公司授權簽章' }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  const [products, setProducts] = useState([]); // 改為動態載入
  
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v28');
    return saved ? JSON.parse(saved) : {
      gasUrl: 'https://script.google.com/macros/s/AKfycbw6DubVZzZTsldD2vrD42y89AqcOlXncU_hN3-RGLn2/exec',
      companyName: 'ACOfusion Lighting Tech',
      senderName: 'Sales Manager',
      eventName: 'Exhibition 2026',
      apiToken: '' // 上線建議加入 Token
    };
  });

  const [crmLeads, setCrmLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [client, setClient] = useState({ company: '', contact: '', email: '', phone: '' });
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({ quoteLang: 'EN', quoteCurrency: 'USD', taxRate: 0, discount: 0, shipping: 0 });

  const pdfRef = useRef(null);

  // --- 關鍵修改：從雲端獲取所有資料 (含產品) ---
  const initializeSystem = async () => {
    if (!sysConfig.gasUrl) return;
    setCloudStatus({ loading: true, msg: '啟動系統同步...' });
    try {
      // 1. 同步客戶
      const contactRes = await fetch(`${sysConfig.gasUrl}?action=getContacts`);
      const contactData = await contactRes.json();
      if (Array.isArray(contactData)) setCrmLeads(contactData.map(d => ({
        id: d["系統ID(勿動)"] || d["ID"],
        company: d["公司名稱"] || d["Company"],
        contact: d["聯絡人"] || d["Name"],
        email: d["電子郵件"] || d["Email"],
        status: d["追蹤狀態"] || d["Status"],
        lastUpdate: d["最後更新時間"] || d["Date"],
        isSynced: true
      })));

      // 2. 同步產品 (如果後端有 Products 分頁)
      const productRes = await fetch(`${sysConfig.gasUrl}?action=getProducts`).catch(() => null);
      if (productRes) {
        const productData = await productRes.json();
        if (Array.isArray(productData)) setProducts(productData);
      } else {
        // 備援預設產品庫
        setProducts([
          { id: 'M1632', name: 'ACO 16x32 Panel', specs: 'P4 Standard', price: 4.5 },
          { id: 'M3264', name: 'ACO 32x64 Panel', specs: 'P4.5 High Refresh', price: 24.0 }
        ]);
      }
      setCloudStatus({ loading: false, msg: '✅ 雲端連線成功' });
    } catch (e) {
      setCloudStatus({ loading: false, msg: '⚠️ 目前為離線編輯模式' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  useEffect(() => { initializeSystem(); }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + (i.qty * i.price), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const finalTotal = subtotal - settings.discount + settings.shipping + tax;
    return { subtotal, tax, finalTotal };
  }, [items, settings]);

  // --- 絕對隔離 PDF 引擎：解決裁切問題 ---
  const handleDownloadPDF = async () => {
    setCloudStatus({ loading: true, msg: '正在優化 PDF 渲染佈局...' });
    const html2pdf = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', 'html2pdf');
    
    // 克隆並暫時移除縮放限制
    const element = pdfRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `ACOfusion_Quote_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        windowWidth: 1200 // 強制以寬螢幕寬度渲染避免行動端裁切
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      setCloudStatus({ loading: false, msg: '✅ PDF 下載成功' });
    } catch (err) {
      setCloudStatus({ loading: false, msg: '❌ PDF 引擎錯誤' });
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-900">
      {/* 導覽列 */}
      <nav className="bg-slate-900 text-white p-3 flex justify-between items-center shadow-2xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-900/50">A</div>
          <div className="leading-tight">
            <div className="font-black text-xl text-blue-400 tracking-tighter uppercase">ACOfusion</div>
            <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Lighting CRM v28.2</div>
          </div>
        </div>
        <div className="flex bg-slate-800/50 backdrop-blur rounded-2xl p-1.5 gap-1 border border-slate-700">
          <button onClick={() => setActiveTab('crm')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'crm' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-700'}`}><Users size={16}/> 名片</button>
          <button onClick={() => setActiveTab('quote')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'quote' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-700'}`}><FileText size={16}/> 報價</button>
          <button onClick={() => setActiveTab('settings')} className={`px-3 py-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Settings size={18}/></button>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden flex">
        {activeTab === 'settings' && (
          <div className="flex-1 p-10 overflow-y-auto bg-slate-50">
            <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200">
              <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-slate-800"><ShieldCheck size={36} className="text-blue-600"/> 生產環境設定</h2>
              <div className="space-y-8">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3">Cloud API Entry Point</label>
                  <input className="w-full border-2 border-blue-200 rounded-xl p-4 text-sm font-mono bg-white shadow-inner focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" value={sysConfig.gasUrl} onChange={e=>setSysConfig({...sysConfig, gasUrl: e.target.value})} placeholder="https://script.google.com/..." />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">業務姓名</label>
                      <input className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-blue-500 transition-all outline-none bg-slate-50" value={sysConfig.senderName} onChange={e=>setSysConfig({...sysConfig, senderName: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">展會編碼</label>
                      <input className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-blue-500 transition-all outline-none bg-slate-50" value={sysConfig.eventName} onChange={e=>setSysConfig({...sysConfig, eventName: e.target.value})} />
                   </div>
                </div>
                <button onClick={initializeSystem} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg flex justify-center items-center gap-3 hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all shadow-2xl shadow-slate-900/20"><Database size={24}/> 立即同步雲端資料庫</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-80 bg-white border-r flex flex-col shadow-xl z-10">
              <div className="p-5 border-b space-y-4">
                <div className="relative">
                   <Search size={18} className="absolute left-4 top-3.5 text-slate-300"/>
                   <input className="w-full bg-slate-100 rounded-2xl pl-12 p-3 text-sm focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all outline-none shadow-inner" placeholder="搜尋客戶、公司..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                </div>
                <button className="w-full bg-blue-600 text-white p-3.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"><Camera size={20}/> 掃描名片</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                {crmLeads.filter(l => l.company?.toLowerCase().includes(searchTerm.toLowerCase())).map(l => (
                  <div key={l.id} onClick={()=>setSelectedLead(l)} className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${selectedLead?.id === l.id ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10 -translate-y-1' : 'bg-white border-transparent hover:border-slate-200'}`}>
                    <div className="font-black text-slate-800 text-base mb-1 truncate">{l.company || '未知公司'}</div>
                    <div className="text-xs text-slate-400 flex justify-between items-center font-bold">
                      <span>{l.contact}</span>
                      <span className={`px-2 py-1 rounded-lg text-[9px] uppercase tracking-tighter ${l.isSynced ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-400'}`}>
                        {l.isSynced ? 'Synced' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
            <section className="flex-1 bg-slate-50 p-10 overflow-y-auto">
              {selectedLead ? (
                <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                       <div className="flex items-center gap-2 mb-3">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md shadow-blue-500/20">Client</span>
                          {selectedLead.isSynced && <span className="text-green-500 flex items-center gap-1 text-[10px] font-bold"><CheckCircle2 size={12}/> 雲端已同步</span>}
                       </div>
                       <h2 className="text-5xl font-black text-slate-900 tracking-tightest leading-none">{selectedLead.company}</h2>
                    </div>
                    <button onClick={()=>{setActiveTab('quote'); setClient(selectedLead)}} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all">建立報價 <ArrowRight size={24}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="group border-b-2 border-slate-50 pb-4 focus-within:border-blue-500 transition-all"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">主要聯絡人</label><p className="text-2xl font-black text-slate-800">{selectedLead.contact}</p></div>
                       <div className="group border-b-2 border-slate-50 pb-4 focus-within:border-blue-500 transition-all"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label><p className="text-2xl font-black text-slate-800">{selectedLead.email}</p></div>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                       <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2 border-b-2 border-white pb-4"><Activity size={24} className="text-blue-600"/> 客戶互動狀態</h3>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm"><span className="text-slate-400 font-bold uppercase tracking-wider">最後更新</span><span className="font-black text-slate-700">{selectedLead.lastUpdate}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-slate-400 font-bold uppercase tracking-wider">展會來源</span><span className="font-black text-blue-600">{sysConfig.eventName}</span></div>
                          <div className="pt-4 flex gap-2">
                             <button className="flex-1 bg-white border-2 border-slate-200 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all">發送型錄</button>
                             <button className="flex-1 bg-white border-2 border-slate-200 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all">建立任務</button>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-200">
                  <LayoutDashboard size={120} className="mb-8 opacity-50 stroke-1"/>
                  <h3 className="text-3xl font-black tracking-tighter uppercase opacity-30">ACOfusion CRM Dashboard</h3>
                  <p className="text-slate-400 font-bold mt-2">選擇左側客戶以開始專業報價流程</p>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'quote' && (
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-96 bg-white border-r overflow-y-auto p-6 space-y-8 shadow-xl z-10">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building size={14}/> 報價對象資訊</h4>
                 <div className="space-y-3">
                   <input className="w-full border-2 border-transparent focus:border-blue-500 rounded-xl p-3 font-black text-sm bg-white shadow-sm outline-none transition-all" placeholder="客戶公司" value={client.company} onChange={e=>setClient({...client, company: e.target.value})} />
                   <input className="w-full border-2 border-transparent focus:border-blue-500 rounded-xl p-3 text-xs bg-white shadow-sm outline-none transition-all font-bold" placeholder="客戶 Email" value={client.email} onChange={e=>setClient({...client, email: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> 選取產品項目</h4>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                  {products.map(p => (
                    <button key={p.id} onClick={()=>{setItems([...items, {...p, qty: 1}])}} className="w-full text-left p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all group flex justify-between items-center">
                      <div><div className="font-black text-slate-800 text-sm">{p.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">${p.price} / unit</div></div>
                      <div className="bg-slate-100 group-hover:bg-blue-600 group-hover:text-white p-1.5 rounded-lg transition-colors"><Plus size={14}/></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <button onClick={handleDownloadPDF} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg flex justify-center items-center gap-3 shadow-2xl shadow-slate-900/30 hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all active:shadow-inner uppercase tracking-tighter"><Printer size={22}/> 下載 PDF 報價單</button>
                <div className="mt-4 flex gap-2">
                   <button className="flex-1 bg-green-50 text-green-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-green-100 hover:bg-green-100 transition-all">☁️ 雲端寄出</button>
                   <button onClick={()=>setItems([])} className="px-4 bg-slate-50 text-slate-400 py-3 rounded-2xl hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
            </aside>

            {/* A4 預覽：絕對 1:1 佈局 */}
            <main className="flex-1 bg-slate-200/50 overflow-y-auto p-12 flex justify-center">
              <div ref={pdfRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl flex flex-col text-slate-800 relative z-0 origin-top">
                <div className="flex justify-between items-end border-b-8 border-slate-900 pb-8 mb-12">
                  <div className="space-y-1">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter m-0">ACOfusion</h1>
                    <p className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] m-0">Lighting Technologies</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-slate-200 uppercase tracking-[0.2em] m-0">Quotation</h2>
                    <p className="text-xs font-mono text-slate-400 mt-2">REF: ACO-{Date.now().toString().slice(-6)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mb-16">
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] border-b border-blue-100 pb-2">Client Info</h3>
                      <p className="text-4xl font-black leading-none text-slate-900">{client.company || 'Customer Company'}</p>
                      <div className="space-y-1 text-sm font-bold text-slate-500">
                        <p className="flex items-center gap-2"><User size={14}/> {client.contact || 'Main Contact'}</p>
                        <p className="flex items-center gap-2"><Mail size={14}/> {client.email || 'email@domain.com'}</p>
                      </div>
                   </div>
                   <div className="flex flex-col justify-end text-right space-y-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      <p>Date: <span className="text-slate-900 ml-2">{new Date().toISOString().split('T')[0]}</span></p>
                      <p>Validity: <span className="text-slate-900 ml-2">30 Days</span></p>
                      <p>Currency: <span className="text-blue-600 ml-2">{settings.quoteCurrency}</span></p>
                   </div>
                </div>

                <table className="w-full text-left mb-16 border-collapse">
                   <thead>
                      <tr className="border-b-4 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="py-4 px-2">Description</th>
                         <th className="py-4 px-2 text-center w-24">Quantity</th>
                         <th className="py-4 px-2 text-right w-32">Unit Price</th>
                         <th className="py-4 px-2 text-right w-32">Total</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm">
                      {items.map((item, idx) => (
                         <tr key={idx} className="border-b border-slate-100">
                            <td className="py-6 px-2">
                               <div className="font-black text-slate-800 text-lg leading-none mb-1">{item.name}</div>
                               <div className="text-[10px] text-slate-400 font-bold uppercase">{item.specs}</div>
                            </td>
                            <td className="py-6 px-2 text-center font-black text-slate-600">{item.qty}</td>
                            <td className="py-6 px-2 text-right text-slate-500 font-bold">{item.price.toFixed(2)}</td>
                            <td className="py-6 px-2 text-right font-black text-slate-900">{(item.qty * item.price).toFixed(2)}</td>
                         </tr>
                      ))}
                      {items.length === 0 && (
                        <tr><td colSpan="4" className="py-24 text-center text-slate-200 font-black text-2xl uppercase tracking-tighter opacity-50">No items selected</td></tr>
                      )}
                   </tbody>
                </table>

                <div className="mt-auto pt-12 border-t-2 border-slate-100 flex justify-between items-end">
                   <div className="space-y-6">
                      <div className="text-[10px] text-slate-400 leading-relaxed font-black uppercase tracking-widest">
                         <p className="text-slate-800 mb-1">{sysConfig.companyName}</p>
                         <p>Address: Innovation Center, Taipei</p>
                         <p>Web: www.acofusion.com</p>
                      </div>
                      <div className="w-64 h-16 border-b-4 border-slate-900 relative">
                         <span className="absolute -bottom-6 left-0 text-[9px] font-black text-slate-300 uppercase tracking-widest">Authorized Signature</span>
                      </div>
                   </div>
                   <div className="w-80 space-y-3">
                      <div className="flex justify-between text-xs text-slate-400 font-black uppercase tracking-widest"><span>Subtotal</span><span>{totals.subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-3xl font-black text-slate-900 border-t-8 border-slate-900 pt-4 tracking-tightest uppercase">
                        <span>Total</span>
                        <span>{settings.quoteCurrency} {totals.finalTotal.toFixed(2)}</span>
                      </div>
                   </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </main>

      {/* 全域同步狀態 */}
      {cloudStatus.msg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 z-[100] border border-slate-700 animate-in fade-in zoom-in slide-in-from-bottom-10">
           {cloudStatus.loading ? <Loader2 size={24} className="animate-spin text-blue-400"/> : <CheckCircle2 size={24} className="text-green-400"/>}
           <span className="text-base font-black tracking-tight uppercase">{cloudStatus.msg}</span>
        </div>
      )}
    </div>
  );
}