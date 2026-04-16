import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, FileText, FileSpreadsheet, Plus, Trash2, Settings, User, Building, Calculator, FileCheck2, AlertCircle, ChevronDown, ChevronUp, Camera, Loader2, Users, ImagePlus, ArrowRight, ArrowLeft, Database, Mail, Copy, UploadCloud, ShieldCheck, Send, PenTool, Phone, Globe, MapPin, MessageCircle, CalendarPlus, Save, CheckCircle2, CloudFog, FilePlus, Truck, Wand2, Search, FileDown, Layers, ArrowUp, ArrowDown, Activity, Flame, Sun, Snowflake, CheckSquare } from 'lucide-react';

// === 動態載入外部免費函式庫 ===
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

const compressImage = (file, maxWidth = 800) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      }; img.src = e.target.result;
    }; reader.readAsDataURL(file);
  });
};

const DEFAULT_LED_IMG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMxMTE4MjciLz48cmVjdCB4PSI1MCIgeT0iMTAwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgcng9IjEwIiBmaWxsPSIjMUYyOTM3IiBzdHJva2U9IiMzNzQxNTEiIHN0cm9rZS13aWR0aD0iNCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjE1MCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPjxjaXJjbGUgY3g9IjEzMCIgY3k9IjE1MCIgcj0iOCIgZmlsbD0iIzNiODJmNiIvPjxjaXJjbGUgY3g9IjE2MCIgY3k9IjE1MCIgcj0iOCIgZmlsbD0iIzEwYjk4MSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjE4MCIgcj0iOCIgZmlsbD0iI2Y1OWUwYiIvPjxjaXJjbGUgY3g9IjEzMCIgY3k9IjE4MCIgcj0iOCIgZmlsbD0iIzhiNWNmNiIvPjxjaXJjbGUgY3g9IjE2MCIgY3k9IjE4MCIgcj0iOCIgZmlsbD0iI2VjNDg5OSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjIxMCIgcj0iOCIgZmlsbD0iIzNiODJmNiIvPjxjaXJjbGUgY3g9IjEzMCIgY3k9IjIxMCIgcj0iOCIgZmlsbD0iIzEwYjk4MSIvPjxjaXJjbGUgY3g9IjE2MCIgY3k9IjIxMCIgcj0iOCIgZmlsbD0iI2VjNDg5OSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjI0MCIgcj0iOCIgZmlsbD0iIzEwYjk4MSIvPjxjaXJjbGUgY3g9IjEzMCIgY3k9IjI0MCIgcj0iOCIgZmlsbD0iI2VmNDQ0NCIvPjxjaXJjbGUgY3g9IjE2MCIgY3k9IjI0MCIgcj0iOCIgZmlsbD0iI2Y1OWUwYiIvPjx0ZXh0IHg9IjIwMCIgeT0iMjg1IiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPklNQUdFPC90ZXh0Pjwvc3ZnPg==';

// === 產品資料庫 ===
const PRODUCT_DATABASE = [
  { id: '1632', name: '16*32 LED Matrix Panel', specs: 'Pixel Pitch P4, 173x70mm, 5V2A 10W', weight: 0.147, priceUSD: 4.43, priceEUR: 3.82, imgUrl: '/images/1_16x32 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1200 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '1664', name: '16*64 LED Matrix Panel', specs: 'Pitch: P5, 374x92mm, 5V2A 10W', weight: 0.212, priceUSD: 7.29, priceEUR: 6.28, imgUrl: '/images/2_16x64 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1200 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '2064', name: '20*64 LED Matrix Panel', specs: 'Pixel Pitch: P4.5, 348x102mm, 5V2A 10W', weight: 0.214, priceUSD: 7.57, priceEUR: 6.53, imgUrl: '/images/3_20x64 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '1696', name: '16*96 LED Matrix Panel', specs: 'Pixel Pitch P6, 595x120mm, 5V2A 10W', weight: 0.315, priceUSD: 9.86, priceEUR: 8.50, imgUrl: '/images/4_16x96 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '1696P', name: '16*96PLUS LED Matrix Panel', specs: 'Pixel Pitch: P9, 898x192mm, 5V2A 10W', weight: 0.767, priceUSD: 24.29, priceEUR: 20.94, imgUrl: '/images/5_16x96 PLUS LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '4500 cd/m²', ip: 'IP67', life: '100,000 hrs' } },
  { id: '16144', name: '16*144 LED Matrix Panel (Adapter)', specs: 'Pixel Pitch P9, 1330x192mm, 5V/2A', weight: 1.05, priceUSD: 40.00, priceEUR: 34.48, imgUrl: '/images/6_16x144 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '16192', name: '16*192 LED Matrix Panel (Adapter)', specs: 'Pixel Pitch: P9, 1762x192mm, 5V/2A', weight: 1.44, priceUSD: 52.86, priceEUR: 45.57, imgUrl: '/images/7_16x192 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '16144U', name: '16*144 LED Matrix Panel USB', specs: 'Pixel Pitch P9, 1330x192mm, 5V/4A', weight: 1.19, priceUSD: 38.57, priceEUR: 33.25, imgUrl: '/images/8_16x144 LED Matrix Panel USB.jpg', tech: { refresh: '1920Hz', bright: '1200 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '16192U', name: '16*192 LED Matrix Panel USB', specs: 'Pixel Pitch: P9, 1762x192mm, 5V/4A', weight: 1.44, priceUSD: 51.43, priceEUR: 44.34, imgUrl: '/images/9_16x192 LED Matrix Panel USB.jpg', tech: { refresh: '1920Hz', bright: '1200 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '2448H', name: '24*48 LED Matrix Panel hard', specs: 'Pixel Pitch P4, 280x120mm, 5V2A 10W', weight: 0.287, priceUSD: 13.57, priceEUR: 11.70, imgUrl: '/images/10_24x48 LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '2000 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '3264H', name: '32*64 LED Matrix Panel hard', specs: 'Pixel Pitch P4.5, 347x200mm, 5V2A 10W', weight: 0.462, priceUSD: 22.86, priceEUR: 19.71, imgUrl: '/images/11_32x64 LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '2000 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '2448', name: '24*48 LED Matrix Panel', specs: 'Pixel Pitch P4, 270x120mm, 5V2A 10W', weight: 0.214, priceUSD: 14.00, priceEUR: 12.07, imgUrl: '/images/10_24x48 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '3264', name: '32*64 LED Matrix Panel', specs: 'Pixel Pitch P4.5, 330x200mm, 5V2A 10W', weight: 0.382, priceUSD: 24.00, priceEUR: 20.69, imgUrl: '/images/11_32x64 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '3296', name: '32*96 LED Matrix Panel', specs: 'Pixel Pitch: P4.5, 480x200mm, 5V2A 10W', weight: 0.512, priceUSD: 31.14, priceEUR: 26.84, imgUrl: '/images/12_32x96 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '32128U', name: '32*128 LED Matrix Panel USB', specs: 'Pixel Pitch P4.5, 630x200mm, 5V2A 10W', weight: 0.633, priceUSD: 38.29, priceEUR: 33.01, imgUrl: '/images/13_32x128 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '32160U', name: '32*160 LED Matrix Panel USB', specs: 'Pixel Pitch P4.5, 780x200mm, 5V2A 10W', weight: 0.807, priceUSD: 48.29, priceEUR: 41.63, imgUrl: '/images/14_32x160 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '32192U', name: '32*192 LED Matrix Panel USB', specs: 'Pixel Pitch P4.5, 930x200mm, 5V2A', weight: 1.08, priceUSD: 59.71, priceEUR: 51.47, imgUrl: '/images/15_32x192 LED Matrix Panel.jpg', tech: { refresh: '1920Hz', bright: '1500 cd/m²', ip: 'IP65', life: '100,000 hrs' } },
  { id: '32128P', name: '32*128PLUS LED Matrix Panel', specs: 'Pixel Pitch P7, 980x280mm, 5V4A', weight: 1.33, priceUSD: 71.43, priceEUR: 61.58, imgUrl: '/images/18 32 x 128 LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '4500 cd/m²', ip: 'IP67', life: '100,000 hrs' } },
  { id: '32192P', name: '32*192PLUS LED Matrix Panel', specs: 'Pixel Pitch P7, 1450x280mm, 5V4A', weight: 1.86, priceUSD: 100.00, priceEUR: 86.21, imgUrl: '/images/19 32 x 192PLUS LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '4500 cd/m²', ip: 'IP67', life: '100,000 hrs' } },
  { id: '32256P', name: '32*256PLUS LED Matrix Panel', specs: 'Pixel Pitch P7, 1920x280mm, 5V8A', weight: 2.49, priceUSD: 128.57, priceEUR: 110.84, imgUrl: '/images/20 32 x 256PLUS LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '4500 cd/m²', ip: 'IP67', life: '100,000 hrs' } },
  { id: '32320P', name: '32*320PLUS LED Matrix Panel', specs: 'Pixel Pitch P7, 2400x294mm, 5V8A', weight: 3.18, priceUSD: 157.14, priceEUR: 135.47, imgUrl: '/images/21 32 x 320PLUS LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '4500 cd/m²', ip: 'IP67', life: '100,000 hrs' } },
  { id: '32384P', name: '32*384PLUS LED Matrix Panel', specs: 'Pixel Pitch P7, 2870x294mm, 5V8A', weight: 3.65, priceUSD: 214.29, priceEUR: 184.73, imgUrl: '/images/22 32 x 384PLUS LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '4500 cd/m²', ip: 'IP67', life: '100,000 hrs' } },
  { id: '32448P', name: '32*448PLUS LED Matrix Panel', specs: 'Pixel Pitch P7, 3340x294mm, 5V8A', weight: 4.32, priceUSD: 271.43, priceEUR: 233.99, imgUrl: '/images/23 32 x 448PLUS LED Matrix Panel.jpg', tech: { refresh: '3840Hz', bright: '4500 cd/m²', ip: 'IP67', life: '100,000 hrs' } },
];

const STANDARD_TERMS = {
  incoterms: ['EXW (Ex Works) - Factory', 'FCA (Free Carrier)', 'FOB (Free On Board)', 'CIF (Cost, Insurance & Freight)', 'DAP (Delivered at Place)', 'DDP (Delivered Duty Paid)'],
  payment: ['100% T/T in advance', '30% T/T deposit, 70% T/T before shipment', '50% T/T deposit, 50% T/T before shipment', 'Irrevocable L/C at sight'],
  leadTime: ['In stock (3-5 working days)', 'Sample run (7-10 working days)', 'Standard production (15-20 working days)'],
  warranty: ['12 Months Standard Warranty', '12 Months (Parts Replacement Only)', 'Out of Box Failure (OBF) only'],
  validity: ['14 Days', '30 Days', 'Subject to final confirmation']
};

const TRANSLATIONS = {
  EN: { quote: 'QUOTATION', quotedTo: 'QUOTED TO:', no: 'No.', desc: 'Product & Description', qty: 'Qty', price: 'Unit Price', total: 'Total', terms: 'TERMS & CONDITIONS', incoterms: 'Incoterms:', payment: 'Payment:', leadTime: 'Lead Time:', warranty: 'Warranty:', subtotal: 'Subtotal', discount: 'Discount', shipping: 'Shipping', grand: 'Total', date: 'Date:', validity: 'Validity:', currency: 'Currency:', sign: 'Authorized Signature', techSpecs: 'TECHNICAL SPECIFICATIONS', refresh: 'Refresh Rate', bright: 'Brightness', ip: 'IP Rating', life: 'Lifespan' },
  TW: { quote: '正式報價單', quotedTo: '客戶資訊:', no: '項次', desc: '產品與規格說明', qty: '數量', price: '單價', total: '總計', terms: '交易條件與備註', incoterms: '交貨條件:', payment: '付款條件:', leadTime: '交貨時間:', warranty: '產品保固:', subtotal: '小計', discount: '專案折扣', shipping: '預估運費', grand: '總計金額', date: '報價日期:', validity: '有效期限:', currency: '報價幣別:', sign: '公司授權簽章', techSpecs: '產品技術規格表', refresh: '刷新率', bright: '亮度', ip: '防護等級', life: '使用壽命' },
  JP: { quote: '御 見 積 書', quotedTo: '貴社名:', no: '番号', desc: '製品名および仕様', qty: '数量', price: '単価', total: '金額', terms: '取引条件', incoterms: '引渡条件:', payment: '支払条件:', leadTime: '納期:', warranty: '保証期間:', subtotal: '小計', discount: '特別割引', shipping: '送料', grand: '合計金額', date: '発行日:', validity: '有効期限:', currency: '通貨:', sign: '担当者署名', techSpecs: '技術仕様書', refresh: 'リフレッシュレート', bright: '輝度', ip: '防水防塵規格', life: '寿命' },
  ES: { quote: 'COTIZACIÓN', quotedTo: 'COTIZADO A:', no: 'No.', desc: 'Producto y Descripción', qty: 'Cant', price: 'Precio', total: 'Total', terms: 'TÉRMINOS Y CONDICIONES', incoterms: 'Incoterms:', payment: 'Pago:', leadTime: 'Tiempo Entrega:', warranty: 'Garantía:', subtotal: 'Subtotal', discount: 'Descuento', shipping: 'Envío', grand: 'Total General', date: 'Fecha:', validity: 'Validez:', currency: 'Moneda:', sign: 'Firma Autorizada', techSpecs: 'ESPECIFICACIONES TÉCNICAS', refresh: 'Tasa de Refresco', bright: 'Brillo', ip: 'Grado IP', life: 'Vida Útil' }
};

const getCompanyDomain = (email) => {
  if (!email) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1].toLowerCase();
  const freeMailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'msn.com'];
  if (freeMailProviders.includes(domain)) return null;
  return domain;
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

const EditableDropdown = ({ value, options, onChange, placeholder }) => (
  <div className="relative flex items-center w-full group">
    <input type="text" className="w-full border border-gray-300 rounded p-2 pr-10 focus:ring-2 focus:ring-blue-500 bg-white text-sm transition-shadow" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center border-l border-gray-200 hover:bg-gray-100 cursor-pointer overflow-hidden rounded-r">
      <select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" value={options.includes(value) ? value : ""} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>請選擇...</option>
        {options.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={16} className="text-gray-500 pointer-events-none" />
    </div>
  </div>
);

const getFirstName = (fullName) => {
  if (!fullName) return 'there';
  const parts = fullName.trim().split(' ');
  return parts[0] || 'there';
};

export default function App() {
  const [activeTab, setActiveTab] = useState('quote'); 
  
  const [sysConfig, setSysConfig] = useState(() => {
    try { 
      const saved = localStorage.getItem('lediamond_sys_config_v27'); 
      return saved ? JSON.parse(saved) : { 
        gasUrl: 'https://script.google.com/macros/s/AKfycbxTVhBJ5VmSyPEBnY9pJXL6i31vXeUilPUrhU-T2oO0TfgzayH6O5l0k9yMfApqcW8W2g/exec', 
        companyStampUrl: '', signatureUrl: '', companyLogo: '', eventName: 'Matelec 2026', senderName: 'Sales Team', companyName: 'LeDiamond Opto Corporation', companyAddress: '8F, No.80, Sec.2, Guangfu Rd., Sanchong Dist., New Taipei City 24158, Taiwan', companyPhone: '+886 2 2995 8557', companyWebsite: 'www.lediamond.com.tw', companyEmail: 'sales@lediamond-opto.com.tw',
        baseFreightRate: 12 
      }; 
    } 
    catch(e) { 
      return { 
        gasUrl: 'https://script.google.com/macros/s/AKfycbxTVhBJ5VmSyPEBnY9pJXL6i31vXeUilPUrhU-T2oO0TfgzayH6O5l0k9yMfApqcW8W2g/exec', 
        companyStampUrl: '', signatureUrl: '', companyLogo: '', eventName: 'Matelec 2026', senderName: 'Sales Team', companyName: 'LeDiamond Opto Corporation', companyAddress: '8F, No.80, Sec.2, Guangfu Rd., Sanchong Dist., New Taipei City 24158, Taiwan', companyPhone: '+886 2 2995 8557', companyWebsite: 'www.lediamond.com.tw', companyEmail: 'sales@lediamond-opto.com.tw',
        baseFreightRate: 12
      }; 
    }
  });
  useEffect(() => { localStorage.setItem('lediamond_sys_config_v27', JSON.stringify(sysConfig)); }, [sysConfig]);

  const [crmLeads, setCrmLeads] = useState(() => {
    try { const saved = localStorage.getItem('lediamond_crm_leads'); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
  });
  useEffect(() => { try { localStorage.setItem('lediamond_crm_leads', JSON.stringify(crmLeads)); } catch (e) { } }, [crmLeads]);

  const [selectedLead, setSelectedLead] = useState(null);
  const [ocrStatus, setOcrStatus] = useState({ loading: false, msg: '' });
  const [crmSearchTerm, setCrmSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const fileInputRef = useRef(null);
  const pdfRef = useRef(null); 

  const [quoteInfo, setQuoteInfo] = useState(() => {
    try { const saved = localStorage.getItem('ld_quoteInfo_draft'); return saved ? JSON.parse(saved) : { number: `LD-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-01`, date: new Date().toISOString().split('T')[0], validity: '30 Days' }; } catch(e){ return { number: `LD-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-01`, date: new Date().toISOString().split('T')[0], validity: '30 Days' }; }
  });
  const [settings, setSettings] = useState(() => {
    try { 
      const saved = localStorage.getItem('ld_settings_draft'); 
      const parsed = saved ? JSON.parse(saved) : {};
      return { baseCurrency: 'USD', quoteCurrency: 'USD', exchangeRate: 1.0, taxRate: 0, quoteLang: 'EN', discount: 0, shipping: 0, includeTechSpecs: true, autoShipping: false, ...parsed }; 
    } catch(e){ return { baseCurrency: 'USD', quoteCurrency: 'USD', exchangeRate: 1.0, taxRate: 0, quoteLang: 'EN', discount: 0, shipping: 0, includeTechSpecs: true, autoShipping: false }; }
  });
  const [items, setItems] = useState(() => {
    try { const saved = localStorage.getItem('ld_items_draft'); return saved ? JSON.parse(saved) : []; } catch(e){ return []; }
  });
  const [terms, setTerms] = useState(() => {
    try { const saved = localStorage.getItem('ld_terms_draft'); return saved ? JSON.parse(saved) : { incoterms: 'FOB Taiwan', payment: '30% T/T deposit, 70% T/T before shipment', leadTime: 'Standard production (15-20 working days)', warranty: '2 Years Warranty' }; } catch(e){ return { incoterms: 'FOB Taiwan', payment: '30% T/T deposit, 70% T/T before shipment', leadTime: 'Standard production (15-20 working days)', warranty: '2 Years Warranty' }; }
  });

  const [client, setClient] = useState(() => {
    try { const saved = localStorage.getItem('ld_client_draft'); return saved ? JSON.parse(saved) : { company: '', contact: '', email: '', phone: '' }; } catch(e){ return { company: '', contact: '', email: '', phone: '' }; }
  });

  const [crmEmailDraft, setCrmEmailDraft] = useState({ subject: '', body: '', isGenerated: false, scenario: 'intro', emailLang: 'EN' });
  const [quoteEmailDraft, setQuoteEmailDraft] = useState({ subject: '', body: '', isGenerated: false, tone: 'formal', emailLang: 'EN' });
  const [cloudStatus, setCloudStatus] = useState({ loading: false, msg: '' });
  
  // 終極防呆：強制彈出錯誤視窗狀態
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    if (selectedLead && items.length === 0) {
      handleParseNoteAndPopulateQuote(selectedLead);
    }
  }, [selectedLead?.id]);

  useEffect(() => {
    localStorage.setItem('ld_client_draft', JSON.stringify(client));
  }, [client]);

  useEffect(() => {
    if(selectedLead) {
       localStorage.setItem('ld_client_draft', JSON.stringify({ company: selectedLead.company, contact: selectedLead.contact, email: selectedLead.email, phone: selectedLead.phone }));
    }
  }, [selectedLead]);

  useEffect(() => { localStorage.setItem('ld_quoteInfo_draft', JSON.stringify(quoteInfo)); }, [quoteInfo]);
  useEffect(() => { localStorage.setItem('ld_settings_draft', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('ld_items_draft', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('ld_terms_draft', JSON.stringify(terms)); }, [terms]);

  const t = TRANSLATIONS[settings.quoteLang] || TRANSLATIONS['EN']; 

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const totalWeight = items.reduce((sum, item) => {
      const p = PRODUCT_DATABASE.find(db => db.id === item.productId);
      return sum + (p ? p.weight * item.qty : 0);
    }, 0);
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    
    const tax = subtotal * (settings.taxRate / 100); 
    const finalTotal = subtotal - (settings.discount || 0) + (settings.shipping || 0) + tax;
    return { subtotal, tax, finalTotal, totalWeight, totalQty };
  }, [items, settings.taxRate, settings.discount, settings.shipping]);

  const handleExchangeRateChange = (newRate) => {
    setSettings(prev => ({...prev, exchangeRate: newRate}));
    setItems(prevItems => prevItems.map(item => {
      const product = PRODUCT_DATABASE.find(p => p.id === item.productId);
      if (product) {
        const basePrice = settings.baseCurrency === 'USD' ? product.priceUSD : product.priceEUR;
        return { ...item, unitPrice: Number((basePrice * newRate).toFixed(2)) };
      }
      return item; 
    }));
  };

  const handleBaseCurrencyChange = (newBase) => {
    setSettings(prev => ({...prev, baseCurrency: newBase}));
    setItems(prevItems => prevItems.map(item => {
      const product = PRODUCT_DATABASE.find(p => p.id === item.productId);
      if (product) {
        const basePrice = newBase === 'USD' ? product.priceUSD : product.priceEUR;
        return { ...item, unitPrice: Number((basePrice * settings.exchangeRate).toFixed(2)) };
      }
      return item;
    }));
  };

  // 💡 終極自動化：報價幣別變更時，自動上網抓取並套用新匯率
  const handleQuoteCurrencyChange = async (newCurrency) => {
    setSettings(prev => ({...prev, quoteCurrency: newCurrency}));
    setCloudStatus({ loading: true, msg: `正在自動為您抓取 ${newCurrency} 最新匯率...` });
    try {
      // 永遠以 USD 為基準向 API 查詢，避免匯率交叉污染
      const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
      const data = await res.json();
      if(data && data.rates && data.rates[newCurrency]) {
        const newRate = data.rates[newCurrency];
        setSettings(prev => ({...prev, baseCurrency: 'USD', exchangeRate: newRate, quoteCurrency: newCurrency}));
        setItems(prevItems => prevItems.map(item => {
          const product = PRODUCT_DATABASE.find(p => p.id === item.productId);
          if (product) return { ...item, unitPrice: Number((product.priceUSD * newRate).toFixed(2)) };
          return item; 
        }));
        setCloudStatus({ loading: false, msg: `✅ 已自動套用 ${newCurrency} 匯率: ${newRate}` });
      } else { 
        setCloudStatus({ loading: false, msg: `❌ 找不到 ${newCurrency} 匯率` }); 
      }
    } catch(err) { 
      setCloudStatus({ loading: false, msg: '❌ 網路錯誤' }); 
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  useEffect(() => {
    if (settings.autoShipping) {
      const baseRatePerKg = sysConfig.baseFreightRate || 12;
      const estimatedCost = parseFloat((totals.totalWeight * baseRatePerKg * settings.exchangeRate).toFixed(2));
      setSettings(prev => {
        if (prev.shipping !== estimatedCost) {
          return { ...prev, shipping: estimatedCost };
        }
        return prev;
      });
    }
  }, [totals.totalWeight, sysConfig.baseFreightRate, settings.exchangeRate, settings.autoShipping]);

  const grossMargin = useMemo(() => {
    if (totals.finalTotal <= 0) return 0;
    const baseCostTotal = items.reduce((sum, item) => {
      const p = PRODUCT_DATABASE.find(db => db.id === item.productId);
      const bp = p ? (settings.baseCurrency === 'USD' ? p.priceUSD : p.priceEUR) * settings.exchangeRate : 0;
      return sum + (bp * item.qty);
    }, 0);
    const profit = totals.finalTotal - baseCostTotal - (settings.shipping > 0 ? settings.shipping : 0);
    return ((profit / totals.finalTotal) * 100).toFixed(1);
  }, [items, settings, totals]);

  const filteredLeads = useMemo(() => {
    let sortedLeads = [...crmLeads].sort((a, b) => {
      const ratingWeight = { 'hot': 3, 'warm': 2, 'cold': 1, undefined: 0 };
      return (ratingWeight[b.rating] || 0) - (ratingWeight[a.rating] || 0);
    });

    return sortedLeads.filter(l => {
      const term = crmSearchTerm.toLowerCase();
      const matchSearch = (l.company || '').toLowerCase().includes(term) || 
                          (l.contact || '').toLowerCase().includes(term) ||
                          (l.phone || '').toLowerCase().includes(term) ||
                          (l.note || '').toLowerCase().includes(term);
      if (statusFilter === 'all') return matchSearch;
      if (statusFilter === 'unquoted') return matchSearch && l.status !== 'quoted';
      if (statusFilter === 'unsynced') return matchSearch && !l.isSynced;
      if (statusFilter === 'hot') return matchSearch && l.rating === 'hot';
      if (statusFilter === 'followup') return matchSearch && l.nextStep;
      return matchSearch;
    });
  }, [crmLeads, crmSearchTerm, statusFilter]);
  
  const unsyncedCount = useMemo(() => crmLeads.filter(l => !l.isSynced).length, [crmLeads]);

  const audits = useMemo(() => {
    const errors = []; const warnings = [];
    
    if (!client?.company?.trim()) errors.push('尚未填寫客戶公司名稱');
    if (items.length === 0 || (items.length === 1 && !items[0].productId)) errors.push('報價單尚未選擇產品');
    if (settings.exchangeRate <= 0) errors.push('匯率數值異常');
    
    let hasBelowCostItem = false;
    items.forEach((item, index) => {
      if (item.qty <= 0) errors.push(`項目 ${index + 1} 數量異常`);
      const product = PRODUCT_DATABASE.find(p => p.id === item.productId);
      if (product) {
        const standardMinPrice = Number((product.priceUSD * settings.exchangeRate).toFixed(2));
        if (item.unitPrice < standardMinPrice) hasBelowCostItem = true;
      }
    });
    if (hasBelowCostItem) warnings.push('部分單價低於系統底價，請確認利潤。');

    if (terms.incoterms.includes('EXW') && settings.shipping > 0 && !settings.autoShipping) warnings.push('EXW 條件通常不含運費。');
    if ((terms.incoterms.includes('CIF') || terms.incoterms.includes('DDP') || terms.incoterms.includes('DAP')) && settings.shipping === 0) warnings.push(`${terms.incoterms} 條件需負擔運費，建議開啟「自動估算」。`);

    return { errors, warnings, isValid: errors.length === 0 };
  }, [items, client.company, settings.exchangeRate, settings.shipping, settings.autoShipping, terms.incoterms]); 

  const handleParseNoteAndPopulateQuote = (targetLead) => {
      let suggestedItems = [];
      const noteLower = (targetLead.note || '').toLowerCase();
      const qtyMatch = noteLower.match(/(\d+)\s*(pcs|pieces|個|片|套)/);
      const parsedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 100; 

      PRODUCT_DATABASE.forEach(p => {
        const pIdLower = p.id.toLowerCase();
        if (noteLower.includes(pIdLower) || (p.specs.toLowerCase().includes('p4') && noteLower.includes('p4'))) {
             if(!suggestedItems.find(si => si.productId === p.id)) {
                const bp = settings.baseCurrency === 'USD' ? p.priceUSD : p.priceEUR;
                suggestedItems.push({ id: Date.now() + Math.random(), productId: p.id, name: p.name, specs: p.specs, qty: parsedQty, unitPrice: Number((bp*settings.exchangeRate).toFixed(2)), imgUrl: p.imgUrl, tech: p.tech });
             }
        }
      });
      if(suggestedItems.length > 0) setItems(suggestedItems);
      else setItems([{ id: Date.now(), productId: '', name: '', specs: '', qty: 1, unitPrice: 0, imgUrl: DEFAULT_LED_IMG }]);
  };

  const handleConvertToQuote = (targetLead) => {
    if(!targetLead || !targetLead.company) { alert('請先選擇並辨識名片資訊。'); return; }
    setActiveTab('quote');
    setClient({ company: targetLead.company, contact: targetLead.contact, email: targetLead.email, phone: targetLead.phone });
    handleParseNoteAndPopulateQuote(targetLead);
  };

  const handleIncotermsChange = (v) => {
    setTerms({...terms, incoterms: v});
    if (['CIF', 'DAP', 'DDP'].some(t => v.includes(t))) {
      setSettings(s => ({ ...s, autoShipping: true }));
    } else if (['EXW', 'FOB', 'FCA'].some(t => v.includes(t))) {
      setSettings(s => ({ ...s, autoShipping: false, shipping: 0 }));
    }
  };

  const resetQuote = () => {
    if(window.confirm("確定要清空目前的報價單資料，開啟新單嗎？\n(這不會影響 CRM 名單中的資料)")) {
      setQuoteInfo({ number: `LD-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-01`, date: new Date().toISOString().split('T')[0], validity: '30 Days' });
      setItems([{ id: Date.now(), productId: '', name: '', specs: '', qty: 1, unitPrice: 0, imgUrl: DEFAULT_LED_IMG }]);
      setSettings(prev => ({...prev, discount: 0, shipping: 0, taxRate: 0, autoShipping: false}));
      setQuoteEmailDraft({ subject: '', body: '', isGenerated: false, tone: 'formal', emailLang: 'EN' });
      setClient({ company: '', contact: '', email: '', phone: '' }); 
    }
  };

  const applyDiscountPercent = (pct) => {
    if (totals.subtotal > 0) {
      setSettings(prev => ({ ...prev, discount: parseFloat((totals.subtotal * pct).toFixed(2)) }));
    }
  };

  const handleCopyText = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCloudStatus({ loading: false, msg: '✅ 內文已成功複製到剪貼簿！' });
    } catch(e) {
      setCloudStatus({ loading: false, msg: '❌ 複製失敗，請手手動圈選複製。' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  const updateSelectedLeadField = (field, value) => {
    if(!selectedLead) return;
    const updated = { ...selectedLead, [field]: value };
    setSelectedLead(updated);
    updateLeadInList(updated);
  };

  const markAsContacted = (method, specificLeadId = null, note = '') => {
    let targetId = specificLeadId || (selectedLead ? selectedLead.id : null);
    let targetLead = crmLeads.find(l => l.id === targetId);

    if (!targetLead && client.company) {
        const newLead = {
            id: Date.now() + Math.random(),
            dateAdded: new Date().toISOString().split('T')[0],
            company: client.company,
            contact: client.contact,
            email: client.email,
            phone: client.phone,
            status: 'new',
            history: [],
            isSynced: false
        };
        targetId = newLead.id;
        targetLead = newLead;
        setCrmLeads(prev => [newLead, ...prev]);
        setTimeout(() => setSelectedLead(newLead), 0); 
    }

    if (!targetId) return;

    const now = new Date().toLocaleString('zh-TW', { hour12: false });
    
    setCrmLeads(prev => {
      const exists = prev.some(l => l.id === targetId);
      const listToMap = exists ? prev : [targetLead, ...prev];

      return listToMap.map(l => {
        if(l.id === targetId) {
           const newStatus = (method.includes('報價') || method.includes('GAS')) ? 'quoted' : (l.status === 'quoted' ? 'quoted' : 'contacted');
           const historyEntry = { date: now, action: method, note: note, id: Date.now() };
           const updatedHistory = l.history ? [historyEntry, ...l.history] : [historyEntry];
           
           const updated = { ...l, status: newStatus, lastContacted: now, contactMethod: method, history: updatedHistory };
           if(selectedLead && selectedLead.id === targetId) { setTimeout(() => setSelectedLead(updated), 0); }
           return updated;
        }
        return l;
      });
    });
  };

  const markLeadAsRead = (leadId) => {
    markAsContacted('👀 客戶已讀/回覆', leadId, '已確認客戶收到資訊，準備下一步行動。');
  };

  const syncLeadToCloud = async () => {
    if (!sysConfig.gasUrl) { alert("請先在「系統設定」中貼上您的 Google Apps Script 網址！"); return; }
    if (!selectedLead || !selectedLead.company) { alert("「公司名稱」為必填欄位，請填寫後再同步。"); return; }
    
    setCloudStatus({ loading: true, msg: '正在同步至雲端資料庫...' });
    
    const payload = {
      event: 'sync_lead', 
      timestamp: new Date().toISOString(),
      repName: sysConfig.senderName, 
      eventName: sysConfig.eventName, 
      lead: selectedLead
    };

    try {
      const response = await fetch(sysConfig.gasUrl, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
      const result = await response.json();
      if(result.status === 'success') {
        setCloudStatus({ loading: false, msg: '✅ 已成功同步至 Google Sheets！' });
        const updated = { ...selectedLead, isSynced: true };
        setSelectedLead(updated);
        updateLeadInList(updated);
      } else { throw new Error(result.error); }
    } catch(e) {
      console.error(e); setCloudStatus({ loading: false, msg: `❌ 同步失敗: 請檢查網路或 GAS 設定` });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 4000);
  };

  const generateEmailTemplate = (type, targetLead, tone = 'formal', lang = 'EN') => {
    if(!targetLead) return { subject: '', body: '' };
    const fName = getFirstName(targetLead.contact);
    const company = targetLead.company ? targetLead.company : (lang==='TW'?'貴公司':(lang==='JP'?'貴社':'your business'));
    const event = sysConfig.eventName;
    const sender = sysConfig.senderName;
    const link = sysConfig.companyWebsite;
    const note = targetLead.note || '';

    let smartInjection = '';
    if (note.toLowerCase().includes('p4') || note.toLowerCase().includes('p5')) {
      if(lang==='EN') smartInjection = `\n\nI specifically recall our chat about the P4/P5 pixel pitch panels. I've attached some relevant specs for that range.`;
      if(lang==='TW') smartInjection = `\n\n我特別記得我們討論過 P4/P5 的面板。我已經為您準備了相關的規格資訊。`;
      if(lang==='JP') smartInjection = `\n\n特にP4/P5パネルについてお話ししたことを覚えています。関連する仕様書を添付いたしました。`;
      if(lang==='ES') smartInjection = `\n\nRecuerdo específicamente nuestra charla sobre los paneles P4/P5. He adjuntado algunas especificaciones relevantes.`;
    }

    let subject = ''; let body = '';
    const baseIncoterm = terms.incoterms.split(' ')[0] || terms.incoterms;

    if (type === 'quote') {
      if (lang === 'EN') {
        subject = `Quotation for ${targetLead.company || 'You'} - LeDiamond Optoelectronics`;
        body = tone === 'formal' ? `Dear ${fName},\n\nThank you for your interest in LeDiamond products at ${event}. As discussed, please find the summary of your requested quotation below:\n\n` : `Hi ${fName},\n\nFollowing up on our conversation at ${event}. Here is the quick quotation summary:\n\n`;
        body += `--- Quotation Summary ---\n`;
        items.forEach((item) => { if(item.name) body += `• ${item.name} | Qty: ${item.qty} | Total: ${settings.quoteCurrency} ${(item.qty * item.unitPrice).toFixed(2)}\n`; });
        body += `\n** Total Value: ${settings.quoteCurrency} ${totals.finalTotal.toFixed(2)} (Based on ${baseIncoterm}) **\nLead Time: ${terms.leadTime}\n\n`;
        body += `[ IMPORTANT: Please find the detailed official quotation PDF attached to this email. ]\n\nLet me know if you need any adjustments.\n\nBest regards,\n\n${sender}`;
      } 
      else if (lang === 'TW') {
        subject = `${targetLead.company || '貴公司'} 產品報價單 - LeDiamond`;
        body = `${fName} 您好,\n\n感謝您在 ${event} 展會中對 LeDiamond 產品的興趣。依照您的需求，為您整理報價摘要如下：\n\n--- 報價摘要 ---\n`;
        items.forEach((item) => { if(item.name) body += `• ${item.name} | 數量: ${item.qty} | 總計: ${settings.quoteCurrency} ${(item.qty * item.unitPrice).toFixed(2)}\n`; });
        body += `\n** 總金額: ${settings.quoteCurrency} ${totals.finalTotal.toFixed(2)} (${baseIncoterm}) **\n交貨時間: ${terms.leadTime}\n\n[ 重要：詳細的正式報價單 PDF 已作為附件夾帶於此信件中。 ]\n\n若有任何需要調整之處，歡迎隨時聯繫。\n\n順頌 商祺,\n\n${sender}`;
      }
      else if (lang === 'JP') {
        subject = `${targetLead.company || '貴社'} 御見積書 - LeDiamond Optoelectronics`;
        body = `${fName} 様,\n\n${event} では弊社ブースにお立ち寄りいただき、誠にありがとうございました。ご要望のお見積り概要を下記の通り記載いたします：\n\n--- お見積り概要 ---\n`;
        items.forEach((item) => { if(item.name) body += `• ${item.name} | 数量: ${item.qty} | 金額: ${settings.quoteCurrency} ${(item.qty * item.unitPrice).toFixed(2)}\n`; });
        body += `\n** 合計金額: ${settings.quoteCurrency} ${totals.finalTotal.toFixed(2)} (${baseIncoterm}) **\n納期: ${terms.leadTime}\n\n[ 重要：詳細な公式見積書（PDF）は本メールに添付しております。必ずご確認ください。 ]\n\nご不明な点や修正のご要望がございましたら、お知らせください。\n\nよろしくお願いいたします。\n\n${sender}`;
      }
      else if (lang === 'ES') {
        subject = `Cotización para ${targetLead.company || 'Usted'} - LeDiamond Optoelectronics`;
        body = `Estimado/a ${fName},\n\nGracias por su interés en los productos de LeDiamond durante ${event}. Según lo conversado, a continuación encontrará el resumen de su cotización:\n\n--- Resumen de Cotización ---\n`;
        items.forEach((item) => { if(item.name) body += `• ${item.name} | Cantidad: ${item.qty} | Total: ${settings.quoteCurrency} ${(item.qty * item.unitPrice).toFixed(2)}\n`; });
        body += `\n** Valor Total: ${settings.quoteCurrency} ${totals.finalTotal.toFixed(2)} (Basado en ${baseIncoterm}) **\nTiempo de entrega: ${terms.leadTime}\n\n[ IMPORTANTE: Por favor, encuentre la cotización oficial detallada en PDF adjunta a este correo. ]\n\nHágamelo saber si necesita algún ajuste.\n\nSaludos cordiales,\n\n${sender}`;
      }
    } else {
       if(lang === 'EN') {
         switch(type) {
          case 'intro': subject = `Connecting from ${event} - LeDiamond Optoelectronics`; body = `Hi ${fName},\n\nIt was great speaking with you at ${event}!\n\nI’m following up to share a bit more about LeDiamond Optoelectronics. We specialize in manufacturing high-quality LED Matrix Panels.${smartInjection}\n\nCatalog: https://${link}\n\nPlease let me know if you are looking for any specific specifications.\n\nBest regards,\n\n${sender}`; break;
          case 'partner': subject = `Partnership Discussion: LeDiamond & ${company}`; body = `Hi ${fName},\n\nThanks for stopping by our booth at ${event}.\n\nWe are currently expanding our global distributor network. I believe our LED solutions could be a highly profitable addition to your portfolio.${smartInjection}\n\nWould you be open to a brief call next week to discuss potential collaboration?\n\nBest,\n\n${sender}`; break;
          case 'greeting': subject = `Great meeting you today at ${event}`; body = `Hi ${fName},\n\nJust a quick note to say it was a pleasure meeting you today.\n\nIf you ever need any support regarding LED displays, feel free to reach out. Keep in touch!\n\nCheers,\n\n${sender}`; break;
          default: break;
         }
       } else if (lang === 'TW') {
         switch(type) {
          case 'intro': subject = `來自 ${event} 的問候 - 台灣雷盟光電`; body = `${fName} 您好,\n\n很高興在 ${event} 與您交流！\n\n為您附上我們 LeDiamond 台灣雷盟光電的最新公司簡介與產品型錄：https://${link}${smartInjection}\n\n若您有任何特定的產品需求，歡迎隨時讓我知道。\n\n順頌 商祺,\n\n${sender}`; break;
          case 'partner': subject = `合作機會探討：LeDiamond & ${company}`; body = `${fName} 您好,\n\n感謝您蒞臨我們在 ${event} 的攤位。\n\n我們目前正在積極拓展全球經銷網路。我相信我們的 LED 解決方案將能為您的產品線帶來極佳的利潤空間。${smartInjection}\n\n不知下週您是否方便安排個短暫的通話，討論潛在的合作機會？\n\n順頌 商祺,\n\n${sender}`; break;
          case 'greeting': subject = `很高興在 ${event} 認識您`; body = `${fName} 您好,\n\n只是一封簡單的信，想說今天很高興能認識您。\n\n未來若有任何需求，歡迎隨時與我聯繫。保持聯絡！\n\n祝好,\n\n${sender}`; break;
          default: break;
         }
       } else if (lang === 'JP') {
         switch(type) {
          case 'intro': subject = `${event} での御礼 - LeDiamond Optoelectronics`; body = `${fName} 様,\n\n${event} ではお話しできて大変光栄でした！\n\n弊社 LeDiamond の最新の会社概要および製品カタログのリンクをお送りいたします：https://${link}${smartInjection}\n\n特定の仕様やご要望がございましたら、いつでもお知らせください。\n\nよろしくお願いいたします。\n\n${sender}`; break;
          case 'partner': subject = `パートナーシップに関するご相談：LeDiamond & ${company}`; body = `${fName} 様,\n\n${event} では弊社ブースにお立ち寄りいただき、誠にありがとうございました。\n\n現在、弊社はグローバルな販売代理店ネットワークを拡大しております。貴社の専門性を拝見し、弊社のLEDソリューションが貴社のポートフォリオに高い利益をもたらすものと確信しております。${smartInjection}\n\n来週、協業の可能性について簡単な電話会議のお時間をいただけないでしょうか？\n\nよろしくお願いいたします。\n\n${sender}`; break;
          case 'greeting': subject = `${event} での出会いに感謝いたします`; body = `${fName} 様,\n\n本日はお会いできて大変嬉しく存じます。\n\nLEDディスプレイに関するサポートが必要な際や、アイデアを交換したい際などは、いつでもお気軽にご連絡ください。今後ともよろしくお願いいたします！\n\n${sender}`; break;
          default: break;
         }
       } else if (lang === 'ES') {
         switch(type) {
          case 'intro': subject = `Saludos desde ${event} - LeDiamond Optoelectronics`; body = `Estimado/a ${fName},\n\n¡Fue un placer hablar con usted en ${event}!\n\nMe pongo en contacto para compartir un poco más sobre LeDiamond. Nos especializamos in la fabricación de paneles LED de alta calidad.${smartInjection}\n\nPuede ver nuestro último perfil de empresa y catálogo de productos aquí: https://${link}\n\nPor favor, avíseme si busca alguna especificación in particular.\n\nSaludos cordiales,\n\n${sender}`; break;
          case 'partner': subject = `Oportunidad de Asociación: LeDiamond & ${company}`; body = `Estimado/a ${fName},\n\nGracias por visitar nuestro stand en ${event}.\n\nActualmente estamos expandiendo nuestra red global de distribuidores. Dada su experiencia, creo que nuestras soluciones LED podrían ser una adición altamente rentable a su cartera.${smartInjection}\n\n¿Estaría abierto/a a una breve llamada la próxima semana para discutir una posible colaboración?\n\nSaludos cordiales,\n\n${sender}`; break;
          case 'greeting': subject = `Un placer conocerle en ${event}`; body = `Estimado/a ${fName},\n\nSolo una breve nota para decir que fue un placer conocerle hoy.\n\nSi alguna vez necesita apoyo con pantallas LED, no dude en comunicarse. ¡Mantengámonos in contacto!\n\nSaludos,\n\n${sender}`; break;
          default: break;
         }
       }
    }
    return { subject, body };
  };

  const generateFileName = () => {
    const safeCompany = client.company ? client.company.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') : 'Client';
    const safeDate = quoteInfo.date ? quoteInfo.date.replace(/-/g, '') : '';
    return `LeDiamond_Quotation_${quoteInfo.number}_${safeCompany}_${safeDate}`;
  };

  const fetchLiveRates = async () => {
    setCloudStatus({ loading: true, msg: '抓取即時匯率...' });
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
      const data = await res.json();
      if(data && data.rates && data.rates[settings.quoteCurrency]) {
        const newRate = data.rates[settings.quoteCurrency];
        handleExchangeRateChange(newRate); 
        setSettings(prev => ({...prev, baseCurrency: 'USD'})); 
        setCloudStatus({ loading: false, msg: `✅ 已更新 ${settings.quoteCurrency} 匯率！` });
      } else { setCloudStatus({ loading: false, msg: `❌ 找不到 ${settings.quoteCurrency} 匯率` }); }
    } catch(err) { setCloudStatus({ loading: false, msg: '❌ 網路錯誤' }); }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  const estimateShipping = () => {
    if(totals.totalWeight === 0) { alert("請先選擇產品。"); return; }
    const baseRatePerKg = sysConfig.baseFreightRate || 12;
    const estimatedCost = (totals.totalWeight * baseRatePerKg * settings.exchangeRate).toFixed(2);
    setSettings(prev => ({ ...prev, shipping: parseFloat(estimatedCost) }));
    setCloudStatus({ loading: false, msg: `✅ 已依重量 (${totals.totalWeight.toFixed(2)}kg) 估算運費` });
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  const amortizeShipping = () => {
    if (settings.shipping <= 0 || totals.subtotal <= 0) return;
    if (window.confirm("將運費攤提至產品單價中？")) {
      const ratio = settings.shipping / totals.subtotal;
      setItems(items.map(item => ({ ...item, unitPrice: Number((item.unitPrice * (1 + ratio)).toFixed(2)) })));
      setSettings(prev => ({ ...prev, shipping: 0, autoShipping: false }));
      setCloudStatus({ loading: false, msg: `🪄 運費已攤提！` });
      setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
    }
  };

  // 💡 終極防呆攔截器
  const handleExportAction = (actionFn) => {
    if (!audits.isValid) {
      setShowErrorModal(true);
      return;
    }
    actionFn();
  };

  // 💡 終極絕對隔離技術 (De-scale Engine)：確保 html2canvas 抓到絕對完美的 1:1 A4 比例
  const exportPdfLogic = async () => {
      const html2pdf = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', 'html2pdf');
      const element = pdfRef.current;
      
      // 1. 強制解除父層的縮放 (這是導致裁切的元兇！)
      const scaleWrapper = document.getElementById('pdf-scale-wrapper');
      const originalTransform = scaleWrapper ? scaleWrapper.style.transform : '';
      if (scaleWrapper) scaleWrapper.style.transform = 'none';

      // 2. 強制捲動軸歸零
      const originalScrollX = window.scrollX; 
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);
      
      const scrollContainer = element.closest('.overflow-x-auto');
      let origScrollLeft = 0; let origScrollTop = 0;
      if (scrollContainer) {
          origScrollLeft = scrollContainer.scrollLeft;
          origScrollTop = scrollContainer.scrollTop;
          scrollContainer.scrollLeft = 0;
          scrollContainer.scrollTop = 0;
      }

      // 3. 套用列印專屬 CSS 確保高度能自動延展
      element.classList.add('exporting-pdf');
      const originalHeight = element.style.height;
      element.style.height = 'max-content';

      // 等待 DOM 重繪 (給瀏覽器一點時間計算解開縮放後的絕對座標)
      await new Promise(resolve => setTimeout(resolve, 300));

      const opt = {
        margin: 0, 
        filename: `${generateFileName()}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          scrollX: 0, 
          scrollY: 0,
          windowWidth: document.documentElement.scrollWidth // 讓引擎讀取真實畫布寬度
        }, 
        pagebreak: { mode: 'css', avoid: ['tr', '.avoid-break', 'h2', 'h3'] },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const restore = () => {
          element.classList.remove('exporting-pdf');
          element.style.height = originalHeight;
          if (scaleWrapper) scaleWrapper.style.transform = originalTransform;
          if (scrollContainer) {
              scrollContainer.scrollLeft = origScrollLeft;
              scrollContainer.scrollTop = origScrollTop;
          }
          window.scrollTo(originalScrollX, originalScrollY);
      };

      return { html2pdf, element, opt, restore };
  };

  const handleLocalPDF = async () => {
    setCloudStatus({ loading: true, msg: '生成高畫質 PDF (啟動絕對隔離引擎)...' });
    try {
      const { html2pdf, element, opt, restore } = await exportPdfLogic();
      await html2pdf().set(opt).from(element).save();
      restore();
      
      setCloudStatus({ loading: false, msg: '✅ PDF 下載完成！' });
      markAsContacted('下載 PDF', selectedLead?.id);
    } catch(e) {
      setCloudStatus({ loading: false, msg: '❌ PDF 生成失敗' });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 3000);
  };

  const executeGoogleCloudWorkflow = async () => {
    if (!sysConfig.gasUrl || !client.email || !quoteEmailDraft.isGenerated) { 
      alert("請確認 GAS網址、Email 與 草稿已生成！"); 
      return; 
    }
    setCloudStatus({ loading: true, msg: '背景生成 PDF 並上傳...' });
    try {
      const { html2pdf, element, opt, restore } = await exportPdfLogic();
      const pdfBase64 = await html2pdf().set(opt).from(element).outputPdf('datauristring');
      restore();
      
      const payload = {
        event: 'new_quotation', repName: sysConfig.senderName, eventName: sysConfig.eventName, 
        client: client, quoteInfo: quoteInfo, totals: totals, 
        currency: settings.quoteCurrency, // 舊版 GAS 兼容
        quoteCurrency: settings.quoteCurrency, // 強制防呆標記
        settings: { ...settings, currency: settings.quoteCurrency, quoteCurrency: settings.quoteCurrency }, // V27+ 終極相容，確保後端絕對抓得到正確幣別
        items: items.map(i => ({ name: i.name, qty: i.qty, total: (i.qty * i.unitPrice).toFixed(2) })),
        pdfBase64: pdfBase64, emailSubject: quoteEmailDraft.subject, emailBody: quoteEmailDraft.body
      };

      const response = await fetch(sysConfig.gasUrl, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
      const result = await response.json();
      if(result.status === 'success') {
        setCloudStatus({ loading: false, msg: '✅ 已存檔並發送！' });
        markAsContacted('☁️ 雲端發送報價單', selectedLead?.id, `總額: ${settings.quoteCurrency} ${totals.finalTotal.toFixed(2)}`);
      } else { throw new Error(result.error); }
    } catch(e) {
      setCloudStatus({ loading: false, msg: `❌ 失敗: ${e.message}` });
    }
    setTimeout(() => setCloudStatus({ loading: false, msg: '' }), 5000);
  };

  const exportQuoteExcel = () => {
    let csvContent = "\uFEFFLeDiamond Quotation\n\n";
    csvContent += `Quote No:,${quoteInfo.number}\nDate:,${quoteInfo.date}\nClient:,${client.company}\nContact:,${client.contact}\n\n`;
    csvContent += "Item,Description,Specs,Qty,Unit Price,Total\n";
    items.forEach((item, index) => { csvContent += `${index + 1},"${item.name}","${item.specs}",${item.qty},${item.unitPrice},${(item.qty * item.unitPrice).toFixed(2)}\n`; });
    csvContent += `\n,,,,,Subtotal:,${totals.subtotal.toFixed(2)}\n`;
    if(settings.discount > 0) csvContent += `,,,,,Discount:,-${settings.discount.toFixed(2)}\n`;
    if(settings.shipping > 0) csvContent += `,,,,,Shipping:,${settings.shipping.toFixed(2)}\n`;
    csvContent += `,,,,,Total (${settings.quoteCurrency}):,${totals.finalTotal.toFixed(2)}\n\n`;
    csvContent += `Terms & Conditions\nIncoterms:,${terms.incoterms}\nPayment:,${terms.payment}\nLead Time:,${terms.leadTime}\nWarranty:,${terms.warranty}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${generateFileName()}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    markAsContacted('下載 Excel 報價單', selectedLead?.id);
  };

  const handleSocialShare = (platform, draft, isFromQuote = false) => {
    const rawPhone = isFromQuote ? client.phone : (selectedLead ? selectedLead.phone : '');
    if(!rawPhone) { alert('請先輸入電話號碼 (含國碼)'); return; }
    const cleanPhone = rawPhone.replace(/[^\d]/g, ''); 
    const message = encodeURIComponent(`${draft.subject}\n\n${draft.body}`);
    const methodStr = isFromQuote ? `透過 ${platform === 'whatsapp' ? 'WA' : 'Line'} 發送報價` : `透過 ${platform === 'whatsapp' ? 'WA' : 'Line'} 發送問候`;
    
    if (platform === 'whatsapp') { window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank'); markAsContacted(methodStr, isFromQuote ? null : undefined); }
    else if (platform === 'line') { window.open(`https://line.me/R/msg/text/?${message}`, '_blank'); markAsContacted(methodStr, isFromQuote ? null : undefined); }
  };

  const handleEmailShare = (draft, isFromQuote = false) => {
    const email = isFromQuote ? client.email : (selectedLead ? selectedLead.email : '');
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`, '_blank');
    const methodStr = isFromQuote ? '透過 Gmail 發送報價' : '透過 Gmail 發送問候';
    markAsContacted(methodStr, isFromQuote ? null : undefined);
  };

  const generateFollowUpCalendar = (draft) => {
    const targetCompany = selectedLead?.company || client.company || 'Client';
    const today = new Date(); today.setDate(today.getDate() + 3); 
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    const rawPhone = selectedLead?.phone || client.phone || '';
    const cleanPhone = rawPhone.replace(/[^\d]/g, '');
    let desc = `Follow up with ${targetCompany}.\\nContact: ${selectedLead?.contact || client.contact || ''} / ${selectedLead?.email || client.email || ''} / ${rawPhone}\\n\\n`;
    if(cleanPhone && draft?.body) {
      desc += `[WhatsApp 連結]:\\nhttps://wa.me/${cleanPhone}?text=${encodeURIComponent(draft.subject + '\n\n' + draft.body)}\\n\\n`;
    }
    if (activeTab === 'quote' && totals.finalTotal > 0) {
      desc += `Deal Size: ${settings.quoteCurrency} ${totals.finalTotal.toFixed(2)}\n\n`;
    }
    const event = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${formatDate(today)}`, `DTEND:${formatDate(new Date(today.getTime() + 30*60000))}`, `SUMMARY:Follow-up: ${targetCompany}`, `DESCRIPTION:${desc}`, 'END:VEVENT', 'END:VCALENDAR'].join('\n');
    const blob = new Blob([event], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Followup_${targetCompany.replace(/\s+/g, '_')}.ics`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    markAsContacted('建立追蹤行事曆', selectedLead?.id);
  };

  const handleBatchUpload = async (e) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    const newLeads = await Promise.all(files.map(async (file) => {
      const base64Image = await compressImage(file);
      return { id: Date.now() + Math.random(), dateAdded: new Date().toISOString().split('T')[0], imgUrl: base64Image, company: '', contact: '', email: '', phone: '', website: '', note: '', rawText: '', status: 'new', isSynced: false, history: [] };
    }));
    setCrmLeads(prev => [...newLeads, ...prev]); setSelectedLead(newLeads[0]);
    if(fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('crm');
  };

  const runFreeOCR = async (lead) => {
    setOcrStatus({ loading: true, msg: '辨識中...' });
    try {
      const Tesseract = await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', 'Tesseract');
      const { data: { text } } = await Tesseract.recognize(lead.imgUrl, 'eng+chi_tra');
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
      const webMatch = text.match(/(?:https?:\/\/|www\.)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?/i);
      let autoCompany = lead.company; 
      if (!autoCompany && emailMatch && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailMatch[0].split('@')[1].toLowerCase())) {
         autoCompany = emailMatch[0].split('@')[1].split('.')[0];
         autoCompany = autoCompany.charAt(0).toUpperCase() + autoCompany.slice(1);
      }
      const updatedLead = { ...lead, company: autoCompany, email: emailMatch ? emailMatch[0] : lead.email, phone: phoneMatch ? phoneMatch[0] : lead.phone, website: webMatch ? webMatch[0] : lead.website, rawText: text, status: 'edited' };
      setSelectedLead(updatedLead); updateLeadInList(updatedLead);
      setOcrStatus({ loading: false, msg: '完成！' });
    } catch (e) { setOcrStatus({ loading: false, msg: '失敗' }); }
  };

  const updateLeadInList = (ul) => setCrmLeads(prev => prev.map(l => l.id === ul.id ? ul : l));
  const deleteLead = (id) => { 
    if(window.confirm("確定刪除名片？")) {
      setCrmLeads(prev => prev.filter(l => l.id !== id)); 
      if (selectedLead?.id === id) setSelectedLead(null); 
    }
  };

  const handleProductImageUpload = async (id, e) => {
    const file = e.target.files[0]; if (!file) return;
    const base64 = await compressImage(file, 400); 
    setItems(items.map(item => item.id === id ? { ...item, imgUrl: base64 } : item));
    e.target.value = ''; 
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'productId') {
          const product = PRODUCT_DATABASE.find(p => p.id === value);
          if (product) {
            updatedItem.name = product.name; updatedItem.specs = product.specs;
            updatedItem.imgUrl = product.imgUrl; updatedItem.tech = product.tech;
            updatedItem.unitPrice = Number(((settings.baseCurrency === 'USD' ? product.priceUSD : product.priceEUR) * settings.exchangeRate).toFixed(2));
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const moveItem = (index, dir) => {
    if (index + dir < 0 || index + dir >= items.length) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + dir];
    newItems[index + dir] = temp;
    setItems(newItems);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const base64 = await compressImage(file, 600); 
    setSysConfig({...sysConfig, companyLogo: base64}); e.target.value = ''; 
  };

  const handleExportData = () => {
    const data = { config: sysConfig, leads: crmLeads };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `LeDiamond_Backup_${new Date().toISOString().split('T')[0]}.json`; link.click();
  };

  const handleImportData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.config) setSysConfig(data.config);
        if (data.leads) setCrmLeads(data.leads);
        alert('還原成功！');
      } catch (err) { alert('檔案錯誤'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const exportCrmCsv = () => {
    if(crmLeads.length === 0) return;
    let csvContent = "\uFEFF系統ID,建立日期,公司名稱,聯絡人,電子郵件,電話,備註,狀態,最後聯絡時間,客戶溫度\n";
    crmLeads.forEach(lead => { csvContent += `"${lead.id}","${lead.dateAdded}","${lead.company}","${lead.contact}","${lead.email}","${lead.phone}","${(lead.note||'').replace(/\n/g, ' ')}","${lead.status}","${lead.lastContacted||''}","${lead.rating||''}"\n`; });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Leads.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const renderStatusBadge = (lead) => {
    if (lead.status === 'quoted') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">🟢 已報價</span>;
    if (lead.status === 'contacted') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700">💬 已聯絡</span>;
    if (lead.status === 'edited') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">✏️ 已編輯</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600">🆕 新掃描</span>;
  };

  const renderRatingBadge = (rating) => {
    if (rating === 'hot') return <span className="text-red-500" title="Hot Lead"><Flame size={14}/></span>;
    if (rating === 'warm') return <span className="text-amber-500" title="Warm Lead"><Sun size={14}/></span>;
    if (rating === 'cold') return <span className="text-blue-300" title="Cold Lead"><Snowflake size={14}/></span>;
    return null;
  };

  const uniqueTechItems = useMemo(() => {
    const unique = [];
    items.forEach(item => { if (item.tech && item.name && !unique.find(u => u.name === item.name)) unique.push(item); });
    return unique;
  }, [items]);

  return (
    <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      <style>{`
        @media print { body { background: white; margin: 0; padding: 0; height: auto; overflow: visible; } .no-print { display: none !important; } @page { margin: 0; size: A4; } }
        
        /* 🚀 終極畫布隔離引擎：徹底杜絕 html2canvas X/Y 軸偏移裁切 */
        .exporting-pdf { 
          width: 210mm !important; 
          max-width: 210mm !important;
          height: max-content !important; 
          margin: 0 auto !important;
          padding: 15mm !important;
          box-sizing: border-box !important;
          background-color: white !important;
          color: black !important;
        }
        .exporting-pdf .no-pdf-export { display: none !important; }
        .exporting-pdf .pdf-hide-on-export { display: none !important; }
        .pdf-render-only { display: none !important; }
        .exporting-pdf .pdf-render-only { display: block !important; white-space: pre-wrap; word-break: break-word; }
        .exporting-pdf span.pdf-render-only { display: inline-block !important; }
        .exporting-pdf tr { page-break-inside: avoid !important; break-inside: avoid-page !important; }
        .exporting-pdf h2, .exporting-pdf h3 { page-break-after: avoid !important; }
        .exporting-pdf td { height: auto !important; padding-top: 12px !important; padding-bottom: 12px !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: #f1f5f9; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* 🚨 主動式防呆攔截網 */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">系統防呆攔截！</h2>
              <p className="text-sm text-gray-500 mb-4">為了保護您的報價專業度，請先修正以下錯誤：</p>
              <div className="bg-red-50 rounded-xl p-4 mb-6 text-left space-y-2">
                 {audits.errors.map((err, i) => <div key={i} className="text-sm font-bold text-red-600 flex items-start gap-2"><span className="mt-0.5">❌</span> {err}</div>)}
                 {audits.warnings.map((warn, i) => <div key={`w-${i}`} className="text-sm font-bold text-amber-600 flex items-start gap-2"><span className="mt-0.5">⚠️</span> {warn}</div>)}
              </div>
              <button onClick={() => setShowErrorModal(false)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all shadow-md">我知道了，立刻去修改</button>
           </div>
        </div>
      )}

      <div className="bg-gray-900 text-white p-3 flex justify-between items-center shadow-md no-print z-20 shrink-0">
        <div className="font-black text-lg md:text-xl tracking-wider text-blue-400">LeDiamond <span className="text-xs font-normal text-gray-400 ml-1 hidden md:inline">OS v27.0 Absolute Engine</span></div>
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button onClick={() => setActiveTab('crm')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 relative ${activeTab === 'crm' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
             <Users size={16}/> <span className="hidden sm:inline">名片追蹤</span>
             {unsyncedCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unsyncedCount}</span>}
          </button>
          <button onClick={() => setActiveTab('quote')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${activeTab === 'quote' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}><FileText size={16}/> <span className="hidden sm:inline">正式報價</span></button>
          <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}><Settings size={16}/></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ========================================== */}
        {/* 分頁 1: 系統設定頁 */}
        {/* ========================================== */}
        {activeTab === 'settings' && (
          <div className="absolute inset-0 bg-gray-50 overflow-y-auto p-6 md:p-10 no-print pb-32">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Settings className="text-blue-600"/> 系統進階設定</h2>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Building size={20}/> 公司品牌與報價單視覺</h3>
                <div className="mb-6 border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 text-center relative overflow-hidden group">
                  {sysConfig.companyLogo ? (
                    <div className="relative">
                      <img src={sysConfig.companyLogo} className="h-16 mx-auto object-contain" alt="Company Logo" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer">
                        <span className="text-white text-xs font-bold flex items-center gap-1"><Camera size={14}/> 更換 Logo</span>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} />
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                       <ImagePlus size={24} className="text-blue-500 mb-2"/>
                       <span className="text-sm font-bold text-gray-600">上傳企業 Logo (選填)</span>
                       <span className="text-xs text-gray-400 mt-1">建議使用透明背景 PNG，將取代報價單表頭文字</span>
                       <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  )}
                </div>
                <div className="space-y-4 text-sm">
                  <div><label className="block text-gray-500 mb-1 font-bold">公司名稱</label><input type="text" className="w-full border rounded p-2 focus:ring-2" value={sysConfig.companyName} onChange={e => setSysConfig({...sysConfig, companyName: e.target.value})} /></div>
                  <div><label className="block text-gray-500 mb-1 font-bold">公司地址</label><input type="text" className="w-full border rounded p-2 focus:ring-2" value={sysConfig.companyAddress} onChange={e => setSysConfig({...sysConfig, companyAddress: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-gray-500 mb-1 font-bold">聯絡電話</label><input type="text" className="w-full border rounded p-2 focus:ring-2" value={sysConfig.companyPhone} onChange={e => setSysConfig({...sysConfig, companyPhone: e.target.value})} /></div>
                    <div><label className="block text-gray-500 mb-1 font-bold">官方 Email</label><input type="text" className="w-full border rounded p-2 focus:ring-2" value={sysConfig.companyEmail} onChange={e => setSysConfig({...sysConfig, companyEmail: e.target.value})} /></div>
                  </div>
                  <div><label className="block text-gray-500 mb-1 font-bold">公司網址</label><input type="text" className="w-full border rounded p-2 focus:ring-2" value={sysConfig.companyWebsite} onChange={e => setSysConfig({...sysConfig, companyWebsite: e.target.value})} /></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={20}/> 展會與業務設定</h3>
                <div className="space-y-4 text-sm">
                  <div><label className="block text-gray-500 mb-1 font-bold">展會名稱 (如: Matelec 2026)</label><input type="text" className="w-full border rounded p-2 focus:ring-2" value={sysConfig.eventName} onChange={e => setSysConfig({...sysConfig, eventName: e.target.value})} /></div>
                  <div><label className="block text-gray-500 mb-1 font-bold">您的姓名 (業績歸屬使用)</label><input type="text" className="w-full border rounded p-2 focus:ring-2" value={sysConfig.senderName} onChange={e => setSysConfig({...sysConfig, senderName: e.target.value})} /></div>
                  <div><label className="block text-gray-500 mb-1 font-bold flex items-center justify-between">預設空運費率 (USD/kg) <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">影響智慧運費估算</span></label><input type="number" step="0.1" className="w-full border rounded p-2 focus:ring-2" value={sysConfig.baseFreightRate || 12} onChange={e => setSysConfig({...sysConfig, baseFreightRate: parseFloat(e.target.value)||12})} /></div>
                </div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2"><UploadCloud size={20}/> GAS 雲端對接</h3>
                <input type="url" className="w-full border border-green-300 rounded p-3 focus:ring-2 focus:ring-green-500" value={sysConfig.gasUrl} onChange={e => setSysConfig({...sysConfig, gasUrl: e.target.value})} placeholder="https://script.google.com/..." />
              </div>
              <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2"><Save size={20}/> 系統資料備份與還原</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleExportData} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold shadow hover:bg-blue-700">下載 JSON 備份</button>
                  <label className="w-full bg-white text-blue-600 border border-blue-300 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-100 cursor-pointer flex justify-center items-center">
                    上傳 JSON 還原<input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 分頁 2: CRM 專屬模塊 (列表 + 詳細追蹤) */}
        {/* ========================================== */}
        {activeTab === 'crm' && (
          <div className="absolute inset-0 flex flex-col md:flex-row bg-gray-50 no-print">
            <div className={`w-full md:w-1/3 md:min-w-[340px] bg-white border-r flex-col z-10 shadow-sm shrink-0 ${selectedLead ? 'hidden md:flex' : 'flex'} h-full`}>
              <div className="p-4 border-b bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2"><Users size={18}/> 名單 ({filteredLeads.length})</h2>
                  <div className="flex gap-1.5">
                    <button onClick={exportCrmCsv} className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition" title="匯出 CSV"><FileDown size={18}/></button>
                    <label className="p-2 bg-blue-600 text-white rounded-full cursor-pointer shadow-sm hover:bg-blue-700 transition" title="掃描名片"><Camera size={18}/><input type="file" accept="image/*" multiple capture="environment" className="hidden" ref={fileInputRef} onChange={handleBatchUpload} /></label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                    <input type="text" className="w-full border border-gray-300 rounded pl-7 p-1.5 text-xs focus:ring-2 focus:ring-blue-500 bg-white" placeholder="搜尋..." value={crmSearchTerm} onChange={e => setCrmSearchTerm(e.target.value)} />
                  </div>
                  <select className="border border-gray-300 rounded text-xs p-1.5 bg-white text-gray-600" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">全部</option><option value="hot">🔥 熱門</option><option value="followup">📌 需追蹤</option><option value="unquoted">未報價</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-100 pb-20">
                {filteredLeads.map(lead => {
                  const leadDomain = getCompanyDomain(lead.email);
                  return (
                    <div key={lead.id} onClick={() => setSelectedLead(lead)} className={`p-2.5 rounded-lg border cursor-pointer flex gap-3 transition-all ${selectedLead?.id === lead.id ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200' : 'bg-white shadow-sm hover:border-blue-200'}`}>
                      {leadDomain ? (
                        <div className="w-10 h-10 bg-white rounded border flex items-center justify-center p-1 shrink-0">
                          <img src={`https://logo.clearbit.com/${leadDomain}`} onError={(e) => { e.target.onerror = null; e.target.src = lead.imgUrl || DEFAULT_LED_IMG; }} className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        lead.imgUrl ? <img src={lead.imgUrl} className="w-10 h-10 object-cover rounded bg-gray-200 shrink-0" /> : <div className="w-10 h-10 bg-gray-200 rounded shrink-0"></div>
                      )}
                      <div className="flex-1 truncate flex flex-col justify-center">
                        <div className="font-bold text-gray-800 text-sm flex items-center gap-1">
                           <span className="truncate">{lead.company || '(未填公司)'}</span>
                           {renderRatingBadge(lead.rating)}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-500 truncate w-16">{lead.contact || '-'}</span>
                          <div className="flex gap-0.5">{renderStatusBadge(lead)} {lead.isSynced && <span className="text-green-500"><CloudFog size={12}/></span>}</div>
                        </div>
                        {lead.nextStep && (
                           <div className="mt-1 text-[9px] text-blue-600 bg-blue-50 rounded px-1 truncate border border-blue-100 flex items-center gap-0.5">
                             <CheckSquare size={8}/> {lead.nextStep}
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className={`flex-1 bg-gray-50 p-4 md:p-6 overflow-y-auto ${!selectedLead ? 'hidden md:block' : 'block'} pb-32`}>
              {selectedLead ? (
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200 sticky top-0 z-20">
                     <button onClick={() => setSelectedLead(null)} className="md:hidden flex items-center text-gray-500 font-bold bg-gray-100 px-3 py-1.5 rounded-lg"><ArrowLeft size={16} className="mr-1"/> 返回</button>
                     <div className="flex gap-2 ml-auto">
                        <button onClick={() => deleteLead(selectedLead.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition" title="刪除名片"><Trash2 size={18}/></button>
                        <button disabled={!selectedLead.company || cloudStatus.loading} onClick={syncLeadToCloud} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition shadow-sm ${selectedLead.company ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-400'}`} title="上傳至公司 Google Sheets">
                          {cloudStatus.loading ? <Loader2 size={16} className="animate-spin"/> : <CloudFog size={16}/>} 雲端同步
                        </button>
                        <button onClick={() => handleConvertToQuote(selectedLead)} className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-black shadow-md transition">轉正式報價單 <ArrowRight size={16}/></button>
                     </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <div className="border rounded-xl p-1 bg-gray-50 mb-3 shadow-inner relative">
                          <img src={selectedLead.imgUrl} className="w-full rounded-lg max-h-[250px] object-contain" />
                          {getCompanyDomain(selectedLead.email) && (
                            <img src={`https://logo.clearbit.com/${getCompanyDomain(selectedLead.email)}`} onError={(e) => e.target.style.display='none'} className="absolute top-4 right-4 w-10 h-10 object-contain mix-blend-multiply opacity-50 no-print" />
                          )}
                        </div>
                        <button onClick={() => runFreeOCR(selectedLead)} disabled={ocrStatus.loading} className="w-full bg-blue-50 text-blue-700 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 border border-blue-200 hover:bg-blue-100 transition shadow-sm">
                          {ocrStatus.loading?<Loader2 className="animate-spin inline" size={16}/>:<Camera size={16} className="inline mr-1"/>} AI 掃描辨識
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div><label className="text-xs font-bold text-gray-500 mb-1 flex justify-between"><span>公司名稱 <span className="text-red-500">*</span></span> {selectedLead.isSynced && <span className="text-green-500 flex items-center gap-1 text-[10px]"><CheckCircle2 size={12}/> 已上傳</span>}</label>
                        <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500" value={selectedLead.company} onChange={e => updateSelectedLeadField('company', e.target.value)} /></div>
                        
                        <div><label className="text-xs font-bold text-gray-500 mb-1 block">電子郵件 (支援自動企業 Logo)</label>
                        <input type="email" className={`w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 ${selectedLead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedLead.email) ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'focus:ring-blue-500'}`} value={selectedLead.email} onChange={e => updateSelectedLeadField('email', e.target.value)} /></div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs font-bold text-gray-500 mb-1 block">聯絡人</label><input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500" value={selectedLead.contact} onChange={e => updateSelectedLeadField('contact', e.target.value)} /></div>
                          <div><label className="text-xs font-bold text-gray-500 mb-1 block">電話 (WhatsApp 需國碼)</label><input type="tel" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-300" placeholder="e.g. 886912345" value={selectedLead.phone} onChange={e => updateSelectedLeadField('phone', e.target.value)} /></div>
                        </div>

                        <div><label className="text-xs font-bold text-blue-600 mb-1 block">採購需求 / 備註 (NLP 深度偵測)</label>
                        <textarea className="w-full border border-blue-200 p-2.5 rounded-lg h-20 bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm" placeholder="如: '500pcs 的 P4'，轉正式報價單時將精準擷取『數量與型號』！" value={selectedLead.note} onChange={e => updateSelectedLeadField('note', e.target.value)} /></div>

                        {/* 客戶溫度與下一步 */}
                        <div className="p-3 bg-gray-50 border rounded-lg space-y-2">
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-600">客戶溫度評級</span>
                              <div className="flex bg-white rounded border overflow-hidden">
                                 <button onClick={() => updateSelectedLeadField('rating', 'hot')} className={`px-2 py-1 transition ${selectedLead.rating==='hot'?'bg-red-50 text-red-500':'text-gray-400 hover:bg-gray-50'}`}><Flame size={14}/></button>
                                 <button onClick={() => updateSelectedLeadField('rating', 'warm')} className={`px-2 py-1 transition border-l border-r ${selectedLead.rating==='warm'?'bg-amber-50 text-amber-500':'text-gray-400 hover:bg-gray-50'}`}><Sun size={14}/></button>
                                 <button onClick={() => updateSelectedLeadField('rating', 'cold')} className={`px-2 py-1 transition ${selectedLead.rating==='cold'?'bg-blue-50 text-blue-400':'text-gray-400 hover:bg-gray-50'}`}><Snowflake size={14}/></button>
                              </div>
                           </div>
                           <div>
                              <input type="text" className="w-full border-b border-gray-300 bg-transparent py-1 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500" placeholder="建立下一步行動備忘錄 (例如: 週五回電)" value={selectedLead.nextStep || ''} onChange={e => updateSelectedLeadField('nextStep', e.target.value)} />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Send size={18} className="text-blue-500"/> 無須報價 ➔ 多國語系快速追蹤</h3>
                      <select className="border border-gray-300 rounded text-xs p-1 font-bold text-blue-700 bg-blue-50 focus:ring-2" value={crmEmailDraft.emailLang} onChange={(e) => setCrmEmailDraft({...crmEmailDraft, emailLang: e.target.value, ...generateEmailTemplate(crmEmailDraft.scenario, selectedLead, 'formal', e.target.value)})}>
                         <option value="EN">EN (英文)</option><option value="TW">TW (繁中)</option><option value="JP">JP (日文)</option><option value="ES">ES (西文)</option>
                      </select>
                    </div>
                    
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                      <button onClick={() => setCrmEmailDraft({ ...crmEmailDraft, ...generateEmailTemplate('intro', selectedLead, 'formal', crmEmailDraft.emailLang), isGenerated: true, scenario: 'intro' })} className={`px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition ${crmEmailDraft.scenario === 'intro' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>📄 型錄/簡介</button>
                      <button onClick={() => setCrmEmailDraft({ ...crmEmailDraft, ...generateEmailTemplate('partner', selectedLead, 'formal', crmEmailDraft.emailLang), isGenerated: true, scenario: 'partner' })} className={`px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition ${crmEmailDraft.scenario === 'partner' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>🤝 招募經銷</button>
                      <button onClick={() => setCrmEmailDraft({ ...crmEmailDraft, ...generateEmailTemplate('greeting', selectedLead, 'formal', crmEmailDraft.emailLang), isGenerated: true, scenario: 'greeting' })} className={`px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition ${crmEmailDraft.scenario === 'greeting' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>👋 極簡問候</button>
                    </div>

                    {crmEmailDraft.isGenerated && (
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2 text-blue-800 font-bold"><PenTool size={16}/> 發送前編輯區 (自動記錄狀態)</div>
                           <button onClick={() => handleCopyText(`${crmEmailDraft.subject}\n\n${crmEmailDraft.body}`)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><Copy size={12}/> 複製內容</button>
                        </div>
                        <input type="text" className="w-full border border-blue-100 p-2.5 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 shadow-sm" value={crmEmailDraft.subject} onChange={e => setCrmEmailDraft({...crmEmailDraft, subject: e.target.value})} />
                        <textarea className="w-full border border-blue-100 p-3 rounded-lg h-48 text-sm text-gray-700 leading-relaxed focus:ring-2 focus:ring-blue-500 shadow-sm" value={crmEmailDraft.body} onChange={e => setCrmEmailDraft({...crmEmailDraft, body: e.target.value})}></textarea>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                          <button disabled={!selectedLead.email} onClick={() => handleEmailShare(crmEmailDraft, false)} className="bg-gray-800 text-white py-2.5 rounded-lg font-bold shadow-sm hover:bg-black text-xs flex justify-center items-center disabled:opacity-50 transition"><Mail size={14} className="mr-1"/> Gmail</button>
                          <button disabled={!selectedLead.phone} onClick={() => handleSocialShare('whatsapp', crmEmailDraft, false)} className="bg-[#25D366] text-white py-2.5 rounded-lg font-bold shadow-sm hover:opacity-90 text-xs flex justify-center items-center disabled:opacity-50 transition"><MessageCircle size={14} className="mr-1"/> WhatsApp</button>
                          <button disabled={!selectedLead.phone} onClick={() => handleSocialShare('line', crmEmailDraft, false)} className="bg-[#00B900] text-white py-2.5 rounded-lg font-bold shadow-sm hover:opacity-90 text-xs flex justify-center items-center disabled:opacity-50 transition"><MessageCircle size={14} className="mr-1"/> Line</button>
                          <button onClick={() => generateFollowUpCalendar(crmEmailDraft)} className="bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-50 text-xs flex justify-center items-center transition shadow-sm"><CalendarPlus size={14} className="mr-1"/> 追蹤</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 終極新增：互動時間軸 (History Log) */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity size={18} className="text-blue-500"/> 追蹤與互動時間軸</h3>
                       <button onClick={() => markLeadAsRead(selectedLead.id)} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded font-bold hover:bg-green-100 flex items-center gap-1"><CheckCircle2 size={12}/> 標記客戶已讀/回覆</button>
                    </div>
                    <div className="space-y-3">
                       {(!selectedLead.history || selectedLead.history.length === 0) ? (
                          <div className="text-center text-xs text-gray-400 py-4 border border-dashed rounded-lg">尚無互動紀錄，點擊上方按鈕發送訊息。</div>
                       ) : (
                          selectedLead.history.map((h, i) => (
                             <div key={i} className="flex gap-3 items-start">
                                <div className="mt-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div></div>
                                <div>
                                   <div className="text-xs font-bold text-gray-800">{h.action}</div>
                                   <div className="text-[10px] text-gray-400">{h.date} {h.note ? ` - ${h.note}` : ''}</div>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-6 text-center">
                   <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-sm">
                      <Users size={48} className="mx-auto mb-4 text-blue-100"/>
                      <h3 className="text-xl font-bold text-gray-700 mb-2">展場戰情中心</h3>
                      <p className="text-sm text-gray-400 max-w-xs">點擊左上方相機拍攝名片，或從清單選擇一筆資料開始進行 AI 辨識與後續追蹤。</p>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 分頁 3: 報價單模塊 (左控制 / 右 PDF) */}
        {/* ========================================== */}
        {activeTab === 'quote' && (
          <div className="absolute inset-0 flex flex-col md:flex-row w-full h-full bg-gray-50 pb-24 md:pb-0">
            {/* 左側：控制面板 */}
            <div className="w-full md:w-1/3 md:min-w-[400px] bg-white md:border-r overflow-y-auto no-print z-10 flex flex-col relative h-1/2 md:h-full border-b shadow-sm">
              <div className="p-4 md:p-6 space-y-4 pb-[240px]">
                
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                   <div className="text-xs text-gray-500 font-bold ml-2">報價控制面板 <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-normal ml-1">自動存檔中</span></div>
                   <button onClick={resetQuote} className="text-xs bg-white text-red-500 px-2 py-1.5 rounded font-bold border hover:bg-red-50 flex items-center transition shadow-sm"><FilePlus size={12} className="mr-1"/> 重置新單</button>
                </div>

                {/* 🚨 主動式防呆提示 (面板內) */}
                {!audits.isValid && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-md sticky top-0 z-30 animate-in fade-in slide-in-from-top-2">
                    <h2 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1.5"><AlertCircle size={16}/> 系統防呆稽核 (請先修正)</h2>
                    <ul className="text-xs space-y-1.5 font-bold">
                      {audits.errors.map((err, i) => <li key={`err-${i}`} className="text-red-600 flex items-start gap-1.5">❌ {err}</li>)}
                      {audits.warnings.map((warn, i) => <li key={`warn-${i}`} className="text-amber-600 flex items-start gap-1.5">⚠️ {warn}</li>)}
                    </ul>
                  </div>
                )}

                <CollapsibleSection title="匯率與多國語言 (全域連動引擎)" icon={Calculator}>
                  <div className="flex justify-end mb-2">
                    <button onClick={fetchLiveRates} className="text-xs text-blue-600 font-bold hover:underline bg-blue-50 px-2 py-1 rounded shadow-sm hover:bg-blue-100 transition-colors">更新即時匯率</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1 font-bold">基礎幣別</label>
                      <select className="w-full border-gray-300 rounded p-1.5 bg-white focus:ring-2 focus:ring-blue-500" value={settings.baseCurrency} onChange={e => handleBaseCurrencyChange(e.target.value)}>
                        <option value="USD">USD</option><option value="EUR">EUR</option><option value="TWD">TWD</option><option value="CNY">CNY</option>
                      </select>
                    </div>
                    <div>
                      {/* 💡 終極優化：選單改變自動上網抓匯率 */}
                      <label className="block text-gray-600 mb-1 font-bold">報價幣別 (全自動)</label>
                      <select className="w-full border-gray-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 bg-white" value={settings.quoteCurrency} onChange={e => handleQuoteCurrencyChange(e.target.value)}>
                         <option value="USD">USD (美金)</option>
                         <option value="EUR">EUR (歐元)</option>
                         <option value="TWD">TWD (台幣)</option>
                         <option value="CNY">CNY (人民幣)</option>
                         <option value="JPY">JPY (日幣)</option>
                         <option value="GBP">GBP (英鎊)</option>
                         <option value="AUD">AUD (澳幣)</option>
                         <option value="CAD">CAD (加幣)</option>
                         <option value="SGD">SGD (新幣)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-bold">自訂/即時匯率</label>
                      <input type="number" step="0.001" className="w-full border-gray-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500" value={settings.exchangeRate} onChange={e => handleExchangeRateChange(parseFloat(e.target.value) || 1)} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-purple-600 mb-1 font-bold">PDF 表頭語系</label>
                      <select className="w-full border-purple-300 rounded p-1.5 bg-purple-50 text-purple-800 text-xs font-bold focus:ring-2" value={settings.quoteLang} onChange={e => setSettings({...settings, quoteLang: e.target.value})}>
                        <option value="EN">English</option><option value="TW">繁體中文</option><option value="JP">日本語</option><option value="ES">Español</option>
                      </select>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="客戶與單號設定" icon={Building}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1 font-bold">公司名稱 {!client.company.trim() && <span className="text-red-500 animate-pulse ml-1">(必填！)</span>}</label>
                      <input type="text" placeholder="請輸入客戶公司名稱..." className={`w-full border rounded p-1.5 focus:ring-2 font-bold transition-colors ${!client.company.trim() ? 'border-red-400 bg-red-50 ring-2 ring-red-100 placeholder-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} value={client.company} onChange={e => setClient({...client, company: e.target.value})} />
                    </div>
                    <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1 font-bold">Email {!client.email.trim() && <span className="text-red-500 ml-1">(寄送必填)</span>}</label><input type="email" placeholder="example@domain.com" className={`w-full border rounded p-1.5 focus:ring-2 ${client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email) ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'focus:ring-blue-500 border-gray-300'}`} value={client.email} onChange={e => setClient({...client, email: e.target.value})} /></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-bold">聯絡人</label><input type="text" className="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 border-gray-300" value={client.contact} onChange={e => setClient({...client, contact: e.target.value})} /></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-bold">電話</label><input type="tel" className="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 border-gray-300" value={client.phone} onChange={e => setClient({...client, phone: e.target.value})} /></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-bold">報價單號</label><input type="text" className="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 border-gray-300" value={quoteInfo.number} onChange={e => setQuoteInfo({...quoteInfo, number: e.target.value})} /></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-bold">日期</label><input type="date" className="w-full border rounded p-1.5 focus:ring-2 focus:ring-blue-500 border-gray-300" value={quoteInfo.date} onChange={e => setQuoteInfo({...quoteInfo, date: e.target.value})} /></div>
                    <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1 font-bold">有效期限</label><EditableDropdown value={quoteInfo.validity} options={STANDARD_TERMS.validity} onChange={(v) => setQuoteInfo({...quoteInfo, validity: v})} placeholder="修改期限" /></div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="商務條件與智能稅率" icon={FileCheck2}>
                  <div className="space-y-4 text-sm">
                    <div><label className="block text-xs text-gray-500 mb-1 font-bold">交貨條件 (Incoterms)</label><EditableDropdown value={terms.incoterms} options={STANDARD_TERMS.incoterms} onChange={handleIncotermsChange} placeholder="交貨條件" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-bold">付款條件 (Payment)</label><EditableDropdown value={terms.payment} options={STANDARD_TERMS.payment} onChange={(v) => setTerms({...terms, payment: v})} placeholder="付款條件" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-bold">交期 (Lead Time)</label><EditableDropdown value={terms.leadTime} options={STANDARD_TERMS.leadTime} onChange={(v) => setTerms({...terms, leadTime: v})} placeholder="交期" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1 font-bold">保固 (Warranty)</label><EditableDropdown value={terms.warranty} options={STANDARD_TERMS.warranty} onChange={(v) => setTerms({...terms, warranty: v})} placeholder="保固" /></div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t relative">
                      <div>
                        <label className="text-[11px] text-blue-700 mb-1 flex justify-between items-center font-bold">
                          外加運費 (+) 
                        </label>
                        <div className="flex gap-1">
                          <input type="number" className={`w-full border rounded p-1.5 text-xs focus:ring-2 ${settings.autoShipping ? 'bg-green-50 border-green-300 text-green-700' : 'bg-blue-50 border-blue-200 focus:ring-blue-500'}`} value={settings.shipping} onChange={e => setSettings({...settings, shipping: parseFloat(e.target.value)||0, autoShipping: false})} placeholder="0" />
                          <button onClick={() => setSettings(s => ({...s, autoShipping: !s.autoShipping}))} title={settings.autoShipping ? "解除自動連動" : "啟用重量自動連動"} className={`px-1.5 rounded transition flex items-center justify-center ${settings.autoShipping ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}>
                             {settings.autoShipping ? <CheckCircle2 size={14}/> : <Truck size={14}/>}
                          </button>
                          <button onClick={amortizeShipping} title="攤提至產品單價" className="bg-indigo-100 text-indigo-700 px-1.5 rounded border border-indigo-200 hover:bg-indigo-200 transition flex items-center"><Wand2 size={14}/></button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-red-600 mb-1 flex justify-between items-center font-bold">專案折扣 (-)</label>
                        <input type="number" className="w-full border border-red-200 bg-red-50 rounded p-1.5 text-red-600 text-xs font-bold focus:ring-2 focus:ring-red-500" value={settings.discount} onChange={e => setSettings({...settings, discount: parseFloat(e.target.value)||0})} placeholder="0" />
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => applyDiscountPercent(0.05)} className="flex-1 bg-red-100 text-red-700 text-[9px] py-1 rounded font-bold hover:bg-red-200">5%</button>
                          <button onClick={() => applyDiscountPercent(0.10)} className="flex-1 bg-red-100 text-red-700 text-[9px] py-1 rounded font-bold hover:bg-red-200">10%</button>
                          <button onClick={() => applyDiscountPercent(0.15)} className="flex-1 bg-red-100 text-red-700 text-[9px] py-1 rounded font-bold hover:bg-red-200">15%</button>
                        </div>
                      </div>
                      <div className="col-span-2 pt-2">
                        <label className="text-xs text-gray-500 mb-1 font-bold">稅率設定 (Tax Rate)</label>
                        <div className="flex gap-2">
                          <input type="number" className="w-1/3 border rounded p-1.5 focus:ring-2 focus:ring-blue-500 border-gray-300" value={settings.taxRate} onChange={e => setSettings({...settings, taxRate: parseFloat(e.target.value)||0})} placeholder="0%" />
                          <button onClick={() => setSettings({...settings, taxRate: 0})} className="flex-1 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[10px] font-bold hover:bg-gray-200 transition-colors">外銷 0%</button>
                          <button onClick={() => setSettings({...settings, taxRate: 5})} className="flex-1 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[10px] font-bold hover:bg-gray-200 transition-colors">內銷 5%</button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                         <label className="text-xs font-bold text-gray-700 flex items-center gap-2 cursor-pointer p-1.5 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                           <input type="checkbox" checked={settings.includeTechSpecs} onChange={e => setSettings({...settings, includeTechSpecs: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /> 
                           附加專業技術規格書 (第二頁)
                         </label>
                    </div>
                  </div>
                </CollapsibleSection>
                
                {/* 報價信件草稿區 */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2"><Mail size={16}/> 報價信件草擬</h3>
                    <select className="border border-purple-300 rounded text-[10px] p-1 font-bold text-purple-800 bg-purple-100 focus:ring-2" value={quoteEmailDraft.emailLang} onChange={(e) => setQuoteEmailDraft({...quoteEmailDraft, emailLang: e.target.value, ...generateEmailTemplate('quote', client, quoteEmailDraft.tone, e.target.value)})}>
                       <option value="EN">EN (英)</option><option value="TW">TW (中)</option><option value="JP">JP (日)</option><option value="ES">ES (西)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setQuoteEmailDraft({...quoteEmailDraft, ...generateEmailTemplate('quote', client, 'formal', quoteEmailDraft.emailLang), isGenerated: true, tone: 'formal', scenario: 'quote'})} className={`flex-1 py-1.5 text-xs font-bold rounded border transition ${quoteEmailDraft.tone === 'formal' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 hover:bg-purple-100'}`}>正式</button>
                    <button onClick={() => setQuoteEmailDraft({...quoteEmailDraft, ...generateEmailTemplate('quote', client, 'brief', quoteEmailDraft.emailLang), isGenerated: true, tone: 'brief', scenario: 'quote'})} className={`flex-1 py-1.5 text-xs font-bold rounded border transition ${quoteEmailDraft.tone === 'brief' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 hover:bg-purple-100'}`}>簡潔</button>
                    <button onClick={() => setQuoteEmailDraft({...quoteEmailDraft, ...generateEmailTemplate('quote', client, 'urgent', quoteEmailDraft.emailLang), isGenerated: true, tone: 'urgent', scenario: 'quote'})} className={`flex-1 py-1.5 text-xs font-bold rounded border transition ${quoteEmailDraft.tone === 'urgent' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 hover:bg-purple-100'}`}>促單</button>
                  </div>
                  {quoteEmailDraft.isGenerated && (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <button onClick={() => handleCopyText(`${quoteEmailDraft.subject}\n\n${quoteEmailDraft.body}`)} className="text-xs text-purple-600 flex items-center gap-1 hover:underline"><Copy size={12}/> 複製內容</button>
                      </div>
                      <input type="text" className="w-full border border-purple-200 p-2 rounded text-sm font-bold focus:ring-2 focus:ring-purple-500 shadow-sm bg-white" value={quoteEmailDraft.subject} onChange={e => setQuoteEmailDraft({...quoteEmailDraft, subject: e.target.value})} />
                      <textarea className="w-full border border-purple-200 p-2 rounded text-sm h-32 leading-relaxed focus:ring-2 focus:ring-purple-500 shadow-sm bg-white" value={quoteEmailDraft.body} onChange={e => setQuoteEmailDraft({...quoteEmailDraft, body: e.target.value})}></textarea>
                    </div>
                  )}
                </div>

                {/* 隱形毛利雷達 */}
                <div className="bg-white border rounded-xl p-3 shadow-sm flex items-center justify-between text-xs">
                   <div className="flex items-center gap-1.5 text-gray-500 font-bold"><Activity size={14}/> 預估毛利率</div>
                   <div className={`font-black ${grossMargin < 0 ? 'text-red-500' : grossMargin < 15 ? 'text-amber-500' : 'text-green-600'}`}>
                      {grossMargin}%
                   </div>
                </div>

              </div>
            </div>

            {/* 終極底部懸浮操作列 */}
            <div className="fixed md:absolute bottom-0 left-0 right-0 md:right-auto md:w-1/3 md:min-w-[400px] bg-white/95 backdrop-blur border-t border-gray-200 p-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.15)] z-[60] flex flex-col gap-2">
              {cloudStatus.msg && <div className="text-center text-xs font-bold text-green-700 bg-green-50 p-1.5 rounded animate-pulse">{cloudStatus.msg}</div>}
              
              <div className="flex gap-2">
                <button onClick={() => handleExportAction(handleLocalPDF)} disabled={cloudStatus.loading} className={`flex-1 py-3 rounded-lg flex justify-center items-center gap-1 font-bold text-sm shadow-sm transition ${!audits.isValid ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100' : 'bg-gray-900 text-white hover:bg-black'}`}>
                  {cloudStatus.loading ? <Loader2 size={16} className="animate-spin"/> : !audits.isValid ? <><AlertCircle size={16}/> 修正紅字解鎖</> : <><Download size={16}/> 本機下載 PDF</>}
                </button>
                <button onClick={() => handleExportAction(executeGoogleCloudWorkflow)} disabled={cloudStatus.loading} className={`flex-1 py-3 rounded-lg flex justify-center items-center gap-1 font-bold text-sm transition shadow-sm ${!audits.isValid || !client.email ? 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200' : 'bg-gradient-to-r from-green-600 to-teal-500 text-white hover:opacity-90'}`}>
                  {cloudStatus.loading ? <Loader2 size={16} className="animate-spin"/> : !client.email ? <><Mail size={16}/> 缺少 Email</> : !audits.isValid ? <><AlertCircle size={16}/> 修正紅字解鎖</> : <><UploadCloud size={16}/> 雲端寄出</>}
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                  <button disabled={!client.email || !quoteEmailDraft.isGenerated} onClick={() => handleEmailShare(quoteEmailDraft, true)} className="bg-white border text-gray-700 py-2 rounded-lg font-bold text-xs hover:bg-gray-50 flex justify-center items-center disabled:opacity-50 transition"><Mail size={14} className="mr-1 hidden sm:inline"/> Gmail</button>
                  <button disabled={!client.phone || !quoteEmailDraft.isGenerated} onClick={() => handleSocialShare('whatsapp', quoteEmailDraft, true)} className="bg-[#25D366] text-white py-2 rounded-lg font-bold text-xs hover:opacity-90 flex justify-center items-center disabled:opacity-50 transition"><MessageCircle size={14} className="mr-1 hidden sm:inline"/> WA</button>
                  <button onClick={() => generateFollowUpCalendar(quoteEmailDraft)} className="bg-white border text-gray-700 py-2 rounded-lg font-bold text-xs hover:bg-gray-50 flex justify-center items-center transition"><CalendarPlus size={14}/></button>
                  <button onClick={() => handleExportAction(exportQuoteExcel)} className="bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg font-bold text-xs hover:bg-green-100 flex justify-center items-center disabled:opacity-50 transition"><FileSpreadsheet size={14}/></button>
              </div>
            </div>

            {/* 右側：企業級 A4 預覽區 */}
            <div className="flex-1 overflow-y-auto bg-gray-200 print:bg-white flex justify-center p-2 sm:p-4 md:p-8 relative h-1/2 md:h-full">
              <div className="xl:hidden absolute top-4 bg-white/90 backdrop-blur z-20 p-2 mb-2 rounded shadow-sm text-center text-xs font-bold text-gray-500 border">⬆️ 往上滑動可編輯報價細節</div>
              
              <div className="w-full pb-32 flex justify-center">
                {/* 剝離 scale，讓內層 pdfRef 維持純淨的尺寸與坐標 */}
                <div id="pdf-scale-wrapper" className="transform scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100 origin-top flex justify-center w-full">
                  <div ref={pdfRef} className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-xl text-gray-800 flex flex-col relative z-0 box-border">
                    
                    {/* 表頭與 Logo */}
                    <div className="flex justify-between items-end border-b-4 border-blue-800 pb-6 mb-8">
                      <div>
                        {sysConfig.companyLogo ? ( <img src={sysConfig.companyLogo} className="h-14 object-contain" alt="Logo" /> ) : ( <h1 className="text-5xl font-black tracking-tighter text-blue-700 m-0 leading-none">{sysConfig.companyName.split(' ')[0]}</h1> )}
                        <p className="text-lg font-bold text-gray-400 tracking-wide mt-1 italic">ideas for lighting</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-3xl font-black text-gray-200 uppercase tracking-widest mb-2">{t.quote}</h2>
                        <p className="text-sm font-bold text-gray-800">{sysConfig.companyName}</p>
                      </div>
                    </div>
                    
                    {/* 客戶與單號資訊 */}
                    <div className="mb-8 grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300 relative">
                        <h3 className="text-xs font-bold text-blue-800 uppercase mb-2 tracking-wider">{t.quotedTo}</h3>
                        <p className="font-bold text-xl text-gray-900 mb-1">{client.company || 'Client Company Name'}</p>
                        <p className="text-sm text-gray-700 flex items-center gap-2"><User size={14}/> {client.contact || 'Contact Person'}</p>
                        {client.email && <p className="text-sm text-gray-700 flex items-center gap-2 mt-1"><Mail size={14}/> {client.email}</p>}
                        {client.phone && <p className="text-sm text-gray-700 flex items-center gap-2 mt-1"><Phone size={14}/> {client.phone}</p>}
                        {getCompanyDomain(client.email) && <img src={`https://logo.clearbit.com/${getCompanyDomain(client.email)}`} onError={(e) => e.target.style.display='none'} className="absolute top-4 right-4 w-10 h-10 object-contain mix-blend-multiply opacity-50 no-print" />}
                      </div>
                      <div className="flex flex-col justify-center text-right text-sm space-y-2 p-4">
                        <div className="flex justify-end gap-3"><span className="text-gray-500 w-24">{t.no}</span> <span className="font-bold text-gray-900">{quoteInfo.number}</span></div>
                        <div className="flex justify-end gap-3"><span className="text-gray-500 w-24">{t.date}</span> <span className="font-bold text-gray-900">{quoteInfo.date}</span></div>
                        <div className="flex justify-end gap-3"><span className="text-gray-500 w-24">{t.validity}</span> <span className="font-bold text-gray-900">{quoteInfo.validity}</span></div>
                        <div className="flex justify-end gap-3"><span className="text-gray-500 w-24">{t.currency}</span> <span className="font-bold text-gray-900">{settings.quoteCurrency}</span></div>
                      </div>
                    </div>

                    {/* 報價明細表 */}
                    <div className="flex-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-blue-800 text-sm bg-blue-50/50">
                            <th className="py-3 px-2 w-12 text-center text-blue-900 font-bold">{t.no}</th>
                            <th className="py-3 px-2 text-blue-900 font-bold">{t.desc}</th>
                            <th className="py-3 px-2 text-center w-16 text-blue-900 font-bold">{t.qty}</th>
                            <th className="py-3 px-2 text-right w-28 text-blue-900 font-bold">{t.price}</th>
                            <th className="py-3 px-2 text-right w-28 text-blue-900 font-bold">{t.total}</th>
                            <th className="w-16 no-pdf-export"></th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {items.map((item, index) => {
                             const originalProduct = PRODUCT_DATABASE.find(p => p.id === item.productId);
                             return (
                              <tr key={item.id} className="border-b border-gray-200 group relative page-break avoid-break">
                                <td className="py-4 px-2 text-center align-top text-gray-500 font-medium">{index + 1}</td>
                                <td className="py-4 px-2 align-top">
                                  <div className="flex flex-row gap-3 items-start">
                                    <div className="relative w-20 h-20 shrink-0 border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm flex items-center justify-center">
                                      <img src={item.imgUrl || DEFAULT_LED_IMG} onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_LED_IMG; }} className="w-full h-full object-contain p-0.5" alt="product" />
                                      <label className="absolute inset-0 cursor-pointer group no-pdf-export">
                                        <div className="w-full h-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold text-center px-1 leading-tight">點擊<br/>上傳</div>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(item.id, e)} />
                                      </label>
                                    </div>
                                    <div className="flex-1">
                                      <div className="pdf-hide-on-export">
                                        <select className="w-full border border-blue-200 p-1 rounded text-xs text-blue-700 bg-blue-50 mb-1 focus:ring-1" value={item.productId} onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}>
                                          <option value="">-- 自資料庫選產品 --</option>
                                          {PRODUCT_DATABASE.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <input type="text" className="w-full font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 p-0.5 focus:ring-0 focus:border-blue-500 mb-1 text-base transition-colors" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                                        <textarea className="w-full text-xs text-gray-600 bg-transparent border-b border-dashed border-gray-300 p-0.5 h-12 resize-none leading-normal focus:ring-0 focus:border-blue-500 transition-colors" value={item.specs} onChange={e => handleItemChange(item.id, 'specs', e.target.value)}></textarea>
                                      </div>
                                      <div className="pdf-render-only">
                                        <div className="font-bold text-gray-900 text-base mb-1">{item.name}</div>
                                        <div className="text-xs text-gray-600 leading-normal">{item.specs}</div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-1 align-top text-center">
                                  <input type="number" className="pdf-hide-on-export w-full text-center font-medium bg-transparent border-b border-dashed border-gray-300 p-1 focus:ring-0" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', parseInt(e.target.value)||0)} />
                                  <span className="pdf-render-only inline-render font-medium text-gray-900">{item.qty}</span>
                                </td>
                                <td className="py-4 px-1 align-top text-right">
                                  <div className="flex flex-col items-end">
                                    <input type="number" step="0.01" className="pdf-hide-on-export w-full text-right font-medium bg-transparent border-b border-dashed border-gray-300 p-1 focus:ring-0" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value)||0)} />
                                    <span className="pdf-render-only inline-render font-medium text-gray-900">{item.unitPrice}</span>
                                    {/* 🛡️ 終極修復：美金底價保護傘 (高亮度顯示，不列印在 PDF) */}
                                    {originalProduct && (
                                       <div className="text-[10px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded mt-1.5 shadow-sm inline-flex items-center gap-1 no-pdf-export" title="原廠底價保護傘">
                                         <ShieldCheck size={10}/> USD ${originalProduct.priceUSD}
                                       </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-2 align-top text-right font-bold text-gray-900">{(item.qty * item.unitPrice).toFixed(2)}</td>
                                <td className="py-4 align-top text-center no-pdf-export">
                                   <div className="flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-opacity">
                                      <button onClick={() => moveItem(index, -1)} disabled={index === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><ArrowUp size={14}/></button>
                                      <button onClick={() => setItems(items.filter(x=>x.id!==item.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                                      <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><ArrowDown size={14}/></button>
                                   </div>
                                </td>
                              </tr>
                          )})}
                        </tbody>
                      </table>
                      
                      {items.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm no-pdf-export border-2 border-dashed border-gray-200 mt-4 rounded-lg">尚未加入任何產品。</div>
                      )}
                      <button onClick={() => setItems([...items, {id: Date.now(), productId: '', name: '', specs: '', qty: 1, unitPrice: 0, imgUrl: DEFAULT_LED_IMG}])} className="mt-4 text-blue-600 text-xs font-bold flex items-center gap-1 no-pdf-export bg-blue-50 px-2 py-1.5 rounded hover:bg-blue-100 transition"><Plus size={14}/> 增加項目</button>
                    </div>

                    {/* 總計與商務條款 */}
                    <div className="mt-6 pt-4 flex justify-between items-end border-t-2 border-gray-800 page-break avoid-break">
                      <div className="w-1/2 pr-8">
                        <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">{t.terms}</h3>
                        <ul className="text-[11px] text-gray-700 space-y-1.5">
                          <li><span className="font-bold inline-block w-20 text-gray-900">{t.incoterms}</span> {terms.incoterms}</li>
                          <li><span className="font-bold inline-block w-20 text-gray-900">{t.payment}</span> {terms.payment}</li>
                          <li><span className="font-bold inline-block w-20 text-gray-900">{t.leadTime}</span> {terms.leadTime}</li>
                          <li><span className="font-bold inline-block w-20 text-gray-900">{t.warranty}</span> {terms.warranty}</li>
                        </ul>
                      </div>
                      <div className="w-1/3 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-gray-200"><span className="text-gray-600">{t.subtotal}</span><span className="font-bold text-gray-900">{totals.subtotal.toFixed(2)}</span></div>
                        {settings.discount > 0 && <div className="flex justify-between py-1.5 border-b border-gray-200"><span className="text-red-500 font-bold">{t.discount} (-)</span><span className="font-bold text-red-500">-{settings.discount.toFixed(2)}</span></div>}
                        {settings.shipping > 0 && <div className="flex justify-between py-1.5 border-b border-gray-200"><span className="text-blue-600 font-bold">{t.shipping} (+)</span><span className="font-bold text-blue-600">{settings.shipping.toFixed(2)}</span></div>}
                        {settings.taxRate > 0 && <div className="flex justify-between py-1.5 border-b border-gray-200"><span className="text-gray-600">Tax ({settings.taxRate}%)</span><span className="font-bold text-gray-900">{totals.tax.toFixed(2)}</span></div>}
                        <div className="flex justify-between py-2 text-lg font-black text-blue-800 border-b-4 border-blue-800 mt-1">
                          <span>{t.grand} ({settings.quoteCurrency})</span><span>{totals.finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 頁尾 */}
                    <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between items-end text-[10px] text-gray-500 page-break avoid-break">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800 text-xs mb-1">{sysConfig.companyName}</p>
                        <p className="flex items-center gap-1"><MapPin size={10}/> {sysConfig.companyAddress}</p>
                        <p className="flex items-center gap-1"><Phone size={10}/> {sysConfig.companyPhone} <span className="mx-1">|</span> <Mail size={10}/> {sysConfig.companyEmail}</p>
                        <p className="flex items-center gap-1"><Globe size={10}/> {sysConfig.companyWebsite}</p>
                      </div>
                      <div className="text-center w-40 pt-3 border-t border-gray-400"><p className="font-bold text-gray-800">{t.sign}</p></div>
                    </div>

                    {/* 終極附加：技術規格書 (第二頁) */}
                    {settings.includeTechSpecs && uniqueTechItems.length > 0 && (
                      <div className="mt-20 pt-16 border-t-2 border-dashed border-gray-300 page-break" style={{ pageBreakBefore: 'always' }}>
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest">{t.techSpecs}</h2>
                          <p className="text-sm text-gray-500 mt-1">{sysConfig.companyName} - Detailed Parameter Sheet</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                          {uniqueTechItems.map((item, i) => (
                            <div key={i} className="flex gap-6 p-4 border rounded-xl bg-gray-50/50 avoid-break">
                               <div className="w-32 h-32 shrink-0 bg-white border rounded-lg p-1 flex items-center justify-center">
                                 <img src={item.imgUrl || DEFAULT_LED_IMG} className="max-w-full max-h-full object-contain" />
                               </div>
                               <div className="flex-1">
                                  <h3 className="font-bold text-lg text-blue-900 mb-2 border-b border-blue-200 pb-1">{item.name}</h3>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
                                     <div className="flex items-center"><span className="w-24 text-gray-500 font-bold">{t.refresh}:</span> <span className="font-medium text-gray-800">{item.tech.refresh}</span></div>
                                     <div className="flex items-center"><span className="w-24 text-gray-500 font-bold">{t.bright}:</span> <span className="font-medium text-gray-800">{item.tech.bright}</span></div>
                                     <div className="flex items-center"><span className="w-24 text-gray-500 font-bold">{t.ip}:</span> <span className="font-medium text-gray-800">{item.tech.ip}</span></div>
                                     <div className="flex items-center"><span className="w-24 text-gray-500 font-bold">{t.life}:</span> <span className="font-medium text-gray-800">{item.tech.life}</span></div>
                                     <div className="col-span-2 mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
                                        Description: {item.specs}
                                     </div>
                                  </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}