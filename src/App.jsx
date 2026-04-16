import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Download, FileText, Settings, Database, Users, Camera, 
  Loader2, Search, CheckCircle2, Building, ShieldCheck, 
  ArrowRight, Activity, ChevronUp, ChevronDown, FileCheck2,
  Trash2, Plus, Mail, Printer, LayoutDashboard
} from 'lucide-react';

/**
 * ACOfusion Lighting CRM - 使用者介面 (React)
 * 版本：v28.0 正式上線整合版
 */

// --- 輔助函式：載入外部 PDF 工具 ---
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

// --- 產品資料庫 (ACOfusion 專用) ---
const PRODUCT_DATABASE = [
  { id: 'ACO-M1632', name: 'ACO 16x32 LED Matrix Panel', specs: 'P4, 173x70mm, 5V10W', price: 4.5, weight: 0.15 },
  { id: 'ACO-M3264', name: 'ACO 32x64 LED Matrix Panel', specs: 'P4.5, 330x200mm, 5V15W', price: 24.0, weight: 0.38 },
  { id: 'ACO-P32128', name: 'ACO 32x128 PLUS LED Matrix', specs: 'P7, 980x280mm, High Brightness', price: 71.5, weight: 1.35 },
];

const TRANSLATIONS = {
  EN: { quote: 'QUOTATION', quotedTo: 'QUOTED TO:', no: 'No.', desc: 'Product & Description', qty: 'Qty', price: 'Unit Price', total: 'Total', grand: 'Grand Total', date: 'Date:', validity: 'Validity:', currency: 'Currency:', sign: 'Authorized Signature' },
  TW: { quote: '正式報價單', quotedTo: '客戶資訊:', no: '項次', desc: '產品與規格說明', qty: '數量', price: '單價', total: '總計', grand: '總計金額', date: '報價日期:', validity: '有效期限:', currency: '報價幣別:', sign: '公司授權簽章' }
};

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2 font-bold text-gray-800 text-sm"><Icon size={16} className="text-blue-600"/> {title}</div>
        {isOpen ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
      </button>
      {isOpen && <div className="p-4 border-t border-gray-100">{children}</div>}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  
  // 系統配置
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('acofusion_config_v28');
    return saved ? JSON.parse(saved) : {
      gasUrl: 'https://script.google.com/macros/s/AKfycbw6DubVZzZTsldD2vrD42y89AqcOlXncU_hN3-RGLn2/exec',
      companyName: 'ACOfusion Lighting Tech',
      senderName: 'Sales Manager',
      eventName: 'Exhibition 2026'
    };
  });

  useEffect(() => {
    localStorage.setItem('acofusion_config_v28', JSON.stringify(sysConfig));
  }, [sysConfig]);

  const [crmLeads, setCrmLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 報價單編輯狀態
  const [client, setClient] = useState({ company: '', contact: '', email: '', phone: '' });
  const [quoteInfo, setQuoteInfo] = useState({ number: `ACO-${Date.now()}`, date: new Date().toISOString().split('T')[0], validity: '30 Days' });
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({ quoteLang: 'EN', quoteCurrency: 'USD', taxRate: 0, discount: 0, shipping: 0 });

  const pdfRef = useRef(null);
  const t = TRANSLATIONS[settings.quoteLang] || TRANSLATIONS['EN'];

  // 計算金額
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + (i.qty * i.price), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const finalTotal = subtotal - settings.discount + settings.shipping + tax;
    return { subtotal, tax, finalTotal };
  }, [items, settings]);

  // 從雲端讀取資料
  const fetchCloudData = async () => {
    if (!sysConfig.gasUrl) return;
    setCloudStatus({ loading: true, msg: '同步雲端資料中...' });
    try {
      const res = await fetch(`${sysConfig.gasUrl}?action=getContacts`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCrmLeads(data.map(d => ({
          id: d["系統ID(勿動)"] || d["ID"],
          company: d["公司名稱"] || d["Company"],
          contact: d["聯絡人"] || d["Name"],
          email: d["電子郵件"] || d["Email"],
          phone: d["聯絡電話"] || d["Phone"],
          status: d["追蹤狀態"] || d["Status"],
          lastUpdate: d["最後更新時間"] || d["Date"]
        })));
        setCloudStatus({ loading: false, msg: '✅ 同步成功' });
      }
    } catch (e) {
      setCloudStatus({ loading: false, msg: '❌ 連線失敗' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  useEffect(() => { fetchCloudData(); }, []);

  // 生成 PDF 並下載
  const handleDownloadPDF = async () => {
    const html2pdf = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', 'html2pdf');
    const opt = {
      margin: 10,
      filename: `ACOfusion_Quote_${quoteInfo.number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(pdfRef.current).save();
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-900">
      {/* 頂部導覽列 */}
      <nav className="bg-slate-900 text-white p-3 flex justify-between items-center shadow-xl z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">A</div>
          <div className="font-black text-xl text-blue-400 tracking-tighter">ACOfusion <span className="text-xs font-normal text-slate-400">Lighting CRM</span></div>
        </div>
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          <button onClick={() => setActiveTab('crm')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'crm' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-700'}`}><Users size={16}/> 名片管理</button>
          <button onClick={() => setActiveTab('quote')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'quote' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-700'}`}><FileText size={16}/> 報價系統</button>
          <button onClick={() => setActiveTab('settings')} className={`px-3 py-2 rounded-lg transition ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}><Settings size={18}/></button>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden flex">
        {/* 設定分頁 */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-10 overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-3xl font-black mb-8 flex items-center gap-3"><ShieldCheck size={32} className="text-blue-600"/> 系統連線設定</h2>
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Google Apps Script Web App URL</label>
                  <input className="w-full border rounded-xl p-3 text-sm font-mono bg-white shadow-inner" value={sysConfig.gasUrl} onChange={e=>setSysConfig({...sysConfig, gasUrl: e.target.value})} placeholder="https://script.google.com/..." />
                  <p className="mt-2 text-[10px] text-slate-500">這是系統與 Google Sheets 資料庫對接的核心接孔。</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">預設業務員</label>
                      <input className="w-full border rounded-xl p-3" value={sysConfig.senderName} onChange={e=>setSysConfig({...sysConfig, senderName: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">目前展會名稱</label>
                      <input className="w-full border rounded-xl p-3" value={sysConfig.eventName} onChange={e=>setSysConfig({...sysConfig, eventName: e.target.value})} />
                   </div>
                </div>
                <button onClick={fetchCloudData} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 hover:bg-black transition-all shadow-xl"><Database size={20}/> 測試連線並同步雲端</button>
              </div>
            </div>
          </div>
        )}

        {/* 名片管理分頁 */}
        {activeTab === 'crm' && (
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-80 bg-white border-r flex flex-col shadow-sm z-10">
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                   <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
                   <input className="w-full bg-slate-100 rounded-xl pl-10 p-2.5 text-sm" placeholder="搜尋客戶或公司..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                </div>
                <button className="w-full bg-blue-600 text-white p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-all"><Camera size={18}/> 掃描新名片</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {crmLeads.filter(l => l.company?.toLowerCase().includes(searchTerm.toLowerCase())).map(l => (
                  <div key={l.id} onClick={()=>setSelectedLead(l)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedLead?.id === l.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'}`}>
                    <div className="font-black text-slate-800 truncate">{l.company || '未知公司'}</div>
                    <div className="text-xs text-slate-500 mt-1 flex justify-between items-center">
                      <span>{l.contact}</span>
                      <span className="bg-white px-2 py-0.5 rounded-full border text-[10px] font-bold">{l.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
            <section className="flex-1 bg-slate-100 p-8 overflow-y-auto">
              {selectedLead ? (
                <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm p-10 border border-slate-200">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                       <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter mb-2 inline-block">Client Profile</span>
                       <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedLead.company}</h2>
                    </div>
                    <button onClick={()=>{setActiveTab('quote'); setClient(selectedLead)}} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-transform">轉報價單 <ArrowRight size={20}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">主要聯絡人</label><p className="text-xl font-bold border-b-2 border-slate-100 pb-2">{selectedLead.contact}</p></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label><p className="text-xl font-bold border-b-2 border-slate-100 pb-2">{selectedLead.email}</p></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">聯絡電話</label><p className="text-xl font-bold border-b-2 border-slate-100 pb-2">{selectedLead.phone}</p></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">最後更新時間</label><p className="text-sm text-slate-500 py-2">{selectedLead.lastUpdate}</p></div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Activity size={20}/> 互動狀態追蹤</h3>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-sm font-bold text-slate-600">已同步至雲端試算表 (Contacts 分頁)</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <LayoutDashboard size={100} className="mb-6 opacity-10"/>
                  <p className="text-xl font-black tracking-widest uppercase">Select a contact to view</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 報價系統分頁 */}
        {activeTab === 'quote' && (
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-96 bg-white border-r overflow-y-auto p-6 space-y-6 shadow-sm z-10">
              <CollapsibleSection title="報價對象" icon={Building}>
                <div className="space-y-3">
                   <input className="w-full border rounded-xl p-3 font-bold bg-slate-50" placeholder="客戶公司名稱" value={client.company} onChange={e=>setClient({...client, company: e.target.value})} />
                   <input className="w-full border rounded-xl p-3 text-sm" placeholder="客戶 Email" value={client.email} onChange={e=>setClient({...client, email: e.target.value})} />
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection title="產品項目" icon={Plus}>
                <div className="space-y-2 mb-4">
                  {PRODUCT_DATABASE.map(p => (
                    <button key={p.id} onClick={()=>{setItems([...items, {...p, qty: 1}])}} className="w-full text-left p-3 rounded-xl border hover:bg-blue-50 hover:border-blue-200 transition-all group flex justify-between items-center">
                      <div><div className="font-bold text-xs">{p.name}</div><div className="text-[10px] text-slate-400">${p.price} / unit</div></div>
                      <Plus size={14} className="text-slate-300 group-hover:text-blue-600"/>
                    </button>
                  ))}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border-t pt-4">
                   {items.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <div className="flex-1 text-xs font-bold truncate">{item.name}</div>
                        <input type="number" className="w-12 border rounded p-1 text-center text-xs" value={item.qty} onChange={e=>{
                           const newItems = [...items]; newItems[idx].qty = parseInt(e.target.value) || 0; setItems(newItems);
                        }} />
                        <button onClick={()=>{setItems(items.filter((_, i) => i !== idx))}} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                     </div>
                   ))}
                </div>
              </CollapsibleSection>

              <div className="pt-6">
                <button onClick={handleDownloadPDF} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"><Download size={22}/> 生成 ACOfusion PDF</button>
              </div>
            </aside>

            {/* A4 預覽區 */}
            <main className="flex-1 bg-slate-200 overflow-y-auto p-10 flex justify-center">
              <div ref={pdfRef} className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl flex flex-col text-slate-800 relative">
                <div className="flex justify-between items-end border-b-4 border-slate-900 pb-8 mb-10">
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">ACOfusion Lighting</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sysConfig.companyName}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black text-slate-300 uppercase tracking-[0.2em]">{t.quote}</h2>
                    <p className="text-[10px] font-mono text-slate-400">{quoteInfo.number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                   <div className="space-y-2">
                      <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t.quotedTo}</h3>
                      <p className="text-2xl font-black leading-tight">{client.company || 'Customer Name'}</p>
                      <p className="text-sm text-slate-500">{client.contact}</p>
                      <p className="text-sm text-slate-500">{client.email}</p>
                   </div>
                   <div className="text-right space-y-1 text-xs">
                      <p><span className="font-bold text-slate-400 uppercase mr-2">{t.date}</span> {quoteInfo.date}</p>
                      <p><span className="font-bold text-slate-400 uppercase mr-2">{t.validity}</span> {quoteInfo.validity}</p>
                      <p><span className="font-bold text-slate-400 uppercase mr-2">{t.currency}</span> {settings.quoteCurrency}</p>
                   </div>
                </div>

                <table className="w-full text-left mb-12 border-collapse">
                   <thead>
                      <tr className="border-b-2 border-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="py-3 px-2">{t.desc}</th>
                         <th className="py-3 px-2 text-center">{t.qty}</th>
                         <th className="py-3 px-2 text-right">{t.price}</th>
                         <th className="py-3 px-2 text-right">{t.total}</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm">
                      {items.map((item, idx) => (
                         <tr key={idx} className="border-b border-slate-100 group">
                            <td className="py-5 px-2">
                               <div className="font-black text-slate-800">{item.name}</div>
                               <div className="text-[10px] text-slate-400 mt-1 italic">{item.specs}</div>
                            </td>
                            <td className="py-5 px-2 text-center font-bold">{item.qty}</td>
                            <td className="py-5 px-2 text-right text-slate-500">{item.price.toFixed(2)}</td>
                            <td className="py-5 px-2 text-right font-black">{(item.qty * item.price).toFixed(2)}</td>
                         </tr>
                      ))}
                      {items.length === 0 && (
                        <tr><td colSpan="4" className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest opacity-30">No items added to quotation</td></tr>
                      )}
                   </tbody>
                </table>

                <div className="mt-auto pt-10 border-t-2 border-slate-100 flex justify-between items-end">
                   <div className="space-y-4">
                      <div className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest">
                         <p className="font-black text-slate-600">{sysConfig.companyName}</p>
                         <p>Tel: +886-XXX-XXXXX | Web: acofusion.com</p>
                      </div>
                      <div className="w-48 h-12 border-b-2 border-slate-200 relative">
                         <span className="absolute bottom-1 left-0 text-[8px] font-black text-slate-300 uppercase">{t.sign}</span>
                      </div>
                   </div>
                   <div className="w-64 space-y-2">
                      <div className="flex justify-between text-xs text-slate-500 uppercase font-bold tracking-widest"><span>{t.subtotal}</span><span>{settings.quoteCurrency} {totals.subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xl font-black text-slate-900 border-t-4 border-slate-900 pt-3 uppercase tracking-tighter"><span>{t.grand}</span><span>{settings.quoteCurrency} {totals.finalTotal.toFixed(2)}</span></div>
                   </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </main>

      {/* 雲端狀態浮動標籤 */}
      {cloudStatus.msg && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 z-[100] border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
           {cloudStatus.loading ? <Loader2 size={20} className="animate-spin text-blue-400"/> : <CheckCircle2 size={20} className="text-green-400"/>}
           <span className="text-sm font-black tracking-widest uppercase">{cloudStatus.msg}</span>
        </div>
      )}
    </div>
  );
}