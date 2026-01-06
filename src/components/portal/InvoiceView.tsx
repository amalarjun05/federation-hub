import { useState, useRef, useEffect } from "react";
import { Download, Plus, X, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface InvoiceItem {
  desc: string;
  qty: number;
  rate: number;
  details: string;
}

interface InvoiceData {
  type: 'INVOICE' | 'QUOTATION';
  docId: string;
  date: string;
  dueDate: string;
  from: {
    name: string;
    address: string;
    gst: string;
    pan: string;
  };
  client: {
    info: string;
  };
  items: InvoiceItem[];
  taxRate: number;
  notes: string;
  bank: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    branch: string;
  };
  design: {
    color: string;
    font: string;
  };
  logo: {
    src: string;
    size: number;
  };
  sig: {
    src: string;
    size: number;
  };
}

const THEME_COLORS = [
  { color: '#64748b', name: 'Slate' },
  { color: '#f97316', name: 'Orange' },
  { color: '#2563eb', name: 'Blue' },
  { color: '#10b981', name: 'Emerald' },
  { color: '#e11d48', name: 'Rose' },
  { color: '#7c3aed', name: 'Violet' },
];

const FONTS = [
  { id: 'font-modern', name: 'Modern', class: 'font-sans' },
  { id: 'font-classic', name: 'Classic', class: 'font-serif' },
  { id: 'font-tech', name: 'Tech', class: 'font-mono' },
];

function generateId(type: string, date: string, serial?: string): string {
  const prefix = type === 'INVOICE' ? 'INV' : 'QUO';
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const s = serial || String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${yy}${mm}-${s}`;
}

function calcDue(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 15);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numToWords(n: number): string {
  if (n === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  };
  
  return convert(Math.round(n)) + ' Rupees Only';
}

function initData(): InvoiceData {
  const today = new Date().toISOString().split('T')[0];
  return {
    type: 'INVOICE',
    docId: generateId('INVOICE', today),
    date: today,
    dueDate: calcDue(today),
    from: { name: '', address: '', gst: '', pan: '' },
    client: { info: '' },
    items: [{ desc: '', qty: 1, rate: 0, details: '' }],
    taxRate: 18,
    notes: 'Payment due within 15 days.\nThank you for your business!',
    bank: { bankName: '', accountNo: '', ifsc: '', branch: '' },
    design: { color: '#2563eb', font: 'font-modern' },
    logo: { src: '', size: 100 },
    sig: { src: '', size: 100 },
  };
}

export function InvoiceView() {
  const [data, setData] = useState<InvoiceData>(initData);
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  const updateField = (path: string, value: string | number) => {
    setData(prev => {
      const newData = { ...prev };
      const parts = path.split('.');
      let current: any = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;

      if (path === 'date') {
        newData.dueDate = calcDue(value as string);
        const serial = newData.docId.split('-').pop();
        newData.docId = generateId(newData.type, value as string, serial);
      }
      return newData;
    });
  };

  const setDocType = (type: 'INVOICE' | 'QUOTATION') => {
    setData(prev => {
      const serial = prev.docId.split('-').pop();
      return {
        ...prev,
        type,
        docId: generateId(type, prev.date, serial),
      };
    });
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { desc: '', qty: 1, rate: 0, details: '' }],
    }));
  };

  const deleteItem = (index: number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: field === 'qty' || field === 'rate' ? Number(value) || 0 : value } : item
      ),
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData(prev => ({ ...prev, logo: { ...prev.logo, src: event.target?.result as string } }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData(prev => ({ ...prev, sig: { ...prev.sig, src: event.target?.result as string } }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = previewRef.current;
    if (!element) return;

    toast({ title: 'Generating PDF...', description: 'Please wait while your document is being prepared.' });

    html2pdf()
      .set({
        margin: 0,
        filename: `${data.docId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4' },
      })
      .from(element)
      .save()
      .then(() => {
        toast({ title: 'PDF Downloaded', description: `${data.docId}.pdf has been saved.` });
      });
  };

  const resetDocument = () => {
    if (confirm('Reset all details?')) {
      setData(initData());
      toast({ title: 'Document Reset', description: 'All fields have been cleared.' });
    }
  };

  const subtotal = data.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = Math.round(subtotal + taxAmount);

  const fontClass = FONTS.find(f => f.id === data.design.font)?.class || 'font-sans';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Invoice & Quotation</h2>
          <p className="text-muted-foreground">Create professional invoices and quotations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetDocument}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={downloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6 bg-card border border-border rounded-xl p-6">
          {/* Design & Appearance */}
          <section className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Design & Appearance</label>
            <div className="space-y-3">
              <span className="text-xs text-muted-foreground">Theme Color</span>
              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map(({ color }) => (
                  <button
                    key={color}
                    onClick={() => setData(prev => ({ ...prev, design: { ...prev.design, color } }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${data.design.color === color ? 'ring-2 ring-offset-2 ring-primary' : 'border-border'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground block mt-2">Typography</span>
              <div className="grid grid-cols-3 gap-2">
                {FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => setData(prev => ({ ...prev, design: { ...prev.design, font: font.id } }))}
                    className={`py-1.5 px-2 border rounded text-xs transition-all ${font.class} ${data.design.font === font.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Document Settings */}
          <section className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Document Settings</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
              <button
                onClick={() => setDocType('INVOICE')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${data.type === 'INVOICE' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                Invoice
              </button>
              <button
                onClick={() => setDocType('QUOTATION')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${data.type === 'QUOTATION' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                Quotation
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Document No.</span>
                <Input value={data.docId} onChange={e => updateField('docId', e.target.value)} />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Date</span>
                <Input type="date" value={data.date} onChange={e => updateField('date', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Bill From */}
          <section className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bill From (Your Details)</label>
            <div className="space-y-3">
              <Input
                value={data.from.name}
                onChange={e => updateField('from.name', e.target.value)}
                placeholder="Your Business Name"
                className="font-bold"
              />
              <Textarea
                value={data.from.address}
                onChange={e => updateField('from.address', e.target.value)}
                placeholder="Address / Contact Details"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={data.from.gst}
                  onChange={e => updateField('from.gst', e.target.value)}
                  placeholder="GSTIN"
                  className="text-xs"
                />
                <Input
                  value={data.from.pan}
                  onChange={e => updateField('from.pan', e.target.value)}
                  placeholder="PAN"
                  className="text-xs"
                />
              </div>
            </div>
          </section>

          {/* Bill To */}
          <section className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bill To (Client Details)</label>
            <Textarea
              value={data.client.info}
              onChange={e => updateField('client.info', e.target.value)}
              placeholder="Client Name, Company, Address..."
              rows={3}
            />
          </section>

          {/* Line Items */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Line Items</label>
              <Button size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-4">
              {data.items.map((item, i) => (
                <div key={i} className="bg-secondary p-4 rounded-xl border border-border space-y-3 relative group">
                  <button
                    onClick={() => deleteItem(i)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <Input
                    value={item.desc}
                    onChange={e => updateItem(i, 'desc', e.target.value)}
                    placeholder="Item Name"
                    className="font-bold"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={e => updateItem(i, 'qty', e.target.value)}
                      placeholder="Qty"
                    />
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={e => updateItem(i, 'rate', e.target.value)}
                      placeholder="Rate"
                    />
                  </div>
                  <Textarea
                    value={item.details}
                    onChange={e => updateItem(i, 'details', e.target.value)}
                    placeholder="Additional details (optional)"
                    rows={2}
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Tax */}
          <section className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tax Settings</label>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Tax Rate (%)</span>
              <Input
                type="number"
                value={data.taxRate}
                onChange={e => updateField('taxRate', Number(e.target.value) || 0)}
                placeholder="Tax Rate"
              />
            </div>
          </section>

          {/* Bank Details */}
          <section className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bank Details</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={data.bank.bankName}
                onChange={e => updateField('bank.bankName', e.target.value)}
                placeholder="Bank Name"
              />
              <Input
                value={data.bank.accountNo}
                onChange={e => updateField('bank.accountNo', e.target.value)}
                placeholder="Account No"
              />
              <Input
                value={data.bank.ifsc}
                onChange={e => updateField('bank.ifsc', e.target.value)}
                placeholder="IFSC Code"
              />
              <Input
                value={data.bank.branch}
                onChange={e => updateField('bank.branch', e.target.value)}
                placeholder="Branch"
              />
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Terms & Notes</label>
            <Textarea
              value={data.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Terms & Conditions, Notes..."
              rows={3}
            />
          </section>

          {/* Logo & Signature */}
          <section className="space-y-4 bg-secondary p-4 rounded-xl border border-border">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Logo & Signature</label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Company Logo</span>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-3 h-3 mr-1" /> Upload</span>
                </Button>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            {data.logo.src && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex justify-between">
                  Size <span>{data.logo.size}%</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={data.logo.size}
                  onChange={e => setData(prev => ({ ...prev, logo: { ...prev.logo, size: Number(e.target.value) } }))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Signature</span>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-3 h-3 mr-1" /> Upload</span>
                </Button>
                <input type="file" className="hidden" accept="image/*" onChange={handleSigUpload} />
              </label>
            </div>
            {data.sig.src && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex justify-between">
                  Size <span>{data.sig.size}%</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={data.sig.size}
                  onChange={e => setData(prev => ({ ...prev, sig: { ...prev.sig, size: Number(e.target.value) } }))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </section>
        </div>

        {/* Preview Panel */}
        <div className="bg-muted/50 rounded-xl p-6 overflow-auto">
          <div
            ref={previewRef}
            className={`bg-white shadow-2xl mx-auto ${fontClass}`}
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            {/* Header */}
            <div className="relative border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
              <div
                className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
                style={{ backgroundColor: data.design.color }}
              />
              <div className="p-12 pb-8 relative z-20">
                <div className="flex justify-between items-start">
                  <div className="w-1/2 flex items-start gap-5">
                    <div
                      className="rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-100"
                      style={{ width: `${5 * (data.logo.size / 100)}rem`, height: `${5 * (data.logo.size / 100)}rem` }}
                    >
                      {data.logo.src ? (
                        <img src={data.logo.src} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-2xl font-bold text-slate-300">Logo</span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2 uppercase">
                        {data.from.name || 'Your Company'}
                      </h1>
                      <div className="text-[11px] text-slate-500 space-y-0.5 font-medium leading-relaxed">
                        <div className="whitespace-pre-wrap">{data.from.address}</div>
                        {data.from.gst && <p>GSTIN: <span className="text-slate-700 font-bold">{data.from.gst}</span></p>}
                        {data.from.pan && <p>PAN: <span className="text-slate-700 font-bold">{data.from.pan}</span></p>}
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2 text-right">
                    <h2
                      className="text-5xl font-black tracking-tighter mb-6 uppercase"
                      style={{ color: data.design.color }}
                    >
                      {data.type}
                    </h2>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-end gap-4">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Number</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{data.docId}</span>
                      </div>
                      <div className="flex justify-end gap-4">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Date</span>
                        <span className="font-semibold text-slate-800 text-sm">{formatDate(data.date)}</span>
                      </div>
                      <div className="flex justify-end gap-4">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Due Date</span>
                        <span className="font-medium text-slate-500 text-sm">{formatDate(data.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="p-12 py-8 relative">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: data.design.color }}>
                Bill To
              </p>
              <div className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap max-w-sm">
                {data.client.info || 'Client details...'}
              </div>
            </div>

            {/* Items Table */}
            <div className="px-12 flex-grow">
              <table className="w-full border-collapse">
                <thead>
                  <tr
                    className="text-white text-[10px] font-bold uppercase tracking-widest text-left"
                    style={{ backgroundColor: data.design.color }}
                  >
                    <th className="py-3 px-4 rounded-l-lg w-1/2">Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Rate</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-sm border-b border-slate-100">
                  {data.items.map((item, i) => {
                    const itemTotal = item.qty * item.rate;
                    return (
                      <tr key={i} className="border-b border-slate-50 align-top">
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800">{item.desc || 'Item'}</div>
                          {item.details && <div className="text-[10px] text-slate-500">{item.details}</div>}
                        </td>
                        <td className="py-4 px-4 text-center">{item.qty}</td>
                        <td className="py-4 px-4 text-right">{formatMoney(item.rate)}</td>
                        <td className="py-4 px-4 text-right font-bold text-slate-900">{formatMoney(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-12 mt-auto">
              <div className="flex justify-between items-start gap-12">
                <div className="w-1/2 space-y-6 text-[11px] text-slate-500">
                  {/* Bank Details */}
                  {(data.bank.bankName || data.bank.accountNo) && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="font-bold text-slate-800 uppercase mb-2 flex items-center gap-2">
                        <span className="w-1 h-3.5 rounded-full" style={{ backgroundColor: data.design.color }} />
                        Bank Details
                      </p>
                      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
                        {data.bank.bankName && (
                          <>
                            <span>Bank:</span>
                            <span className="font-semibold text-slate-700 uppercase">{data.bank.bankName}</span>
                          </>
                        )}
                        {data.bank.accountNo && (
                          <>
                            <span>Account:</span>
                            <span className="font-semibold text-slate-700">{data.bank.accountNo}</span>
                          </>
                        )}
                        {data.bank.ifsc && (
                          <>
                            <span>IFSC:</span>
                            <span className="font-semibold text-slate-700 uppercase">{data.bank.ifsc}</span>
                          </>
                        )}
                        {data.bank.branch && (
                          <>
                            <span>Branch:</span>
                            <span className="font-semibold text-slate-700 uppercase">{data.bank.branch}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amount in Words */}
                  <div>
                    <p className="font-bold text-slate-400 uppercase mb-1 tracking-wider">Amount in Words</p>
                    <p className="font-medium text-slate-700 italic">{numToWords(total)}</p>
                  </div>

                  {/* Terms */}
                  {data.notes && (
                    <div>
                      <p className="font-bold text-slate-400 uppercase mb-1 tracking-wider">Terms & Conditions</p>
                      <div className="whitespace-pre-wrap leading-relaxed text-[10px]">{data.notes}</div>
                    </div>
                  )}
                </div>

                <div className="w-1/2">
                  {/* Totals */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800">{formatMoney(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Tax ({data.taxRate}%)</span>
                      <span className="font-semibold text-slate-800">{formatMoney(taxAmount)}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2" />
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{formatMoney(total)}</span>
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="mt-8 text-center">
                    <div className="inline-block">
                      {data.sig.src && (
                        <img
                          src={data.sig.src}
                          alt="Signature"
                          style={{ height: `${4 * (data.sig.size / 100)}rem` }}
                          className="mx-auto mb-2"
                        />
                      )}
                      <div className="border-t border-slate-300 pt-2 min-w-[150px]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Authorized Signature</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
