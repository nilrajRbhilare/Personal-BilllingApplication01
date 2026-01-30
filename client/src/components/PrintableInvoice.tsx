import { forwardRef } from "react";
import { format } from "date-fns";
import type { Invoice, InvoiceItem, Customer, Settings } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PrintableInvoiceProps {
  invoice: Invoice;
  customer: Customer;
  settings: Settings;
  className?: string;
}

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice, customer, settings, className }, ref) => {
    // Ensure invoice items are parsed properly
    const items = (Array.isArray(invoice.items) 
      ? invoice.items 
      : JSON.parse(JSON.stringify(invoice.items))) as InvoiceItem[];

    return (
      <div 
        ref={ref} 
        className={cn(
          "bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] relative text-sm text-slate-900 font-sans print-only",
          className
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-4" />
            )}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">INVOICE</h1>
            <p className="text-slate-500 mt-1">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right text-slate-600">
            <h3 className="font-semibold text-slate-900 text-lg mb-1">{settings.companyName}</h3>
            <div className="whitespace-pre-line leading-relaxed">
              {settings.companyAddress}
            </div>
            <div className="mt-2">
              <p>{settings.companyPhone}</p>
              <p>{settings.companyEmail}</p>
            </div>
          </div>
        </div>

        {/* Client & Dates */}
        <div className="flex justify-between mb-12 border-t border-b border-slate-100 py-8">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Bill To</span>
            <h3 className="font-bold text-slate-900 text-lg mt-1">{customer.name}</h3>
            <p className="text-slate-600 mt-1">{customer.email}</p>
            <p className="text-slate-600">{customer.phone}</p>
            <div className="text-slate-600 mt-2 whitespace-pre-line max-w-xs">{customer.address}</div>
          </div>
          <div className="text-right space-y-2">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Invoice Date</span>
              <span className="font-medium text-slate-900">{format(new Date(invoice.date), "PPP")}</span>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Due Date</span>
              <span className="font-medium text-slate-900">{format(new Date(invoice.dueDate), "PPP")}</span>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Status</span>
              <span className="capitalize font-medium text-slate-900">{invoice.status}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="text-left py-3 text-xs uppercase font-bold text-slate-400 tracking-wider">Description</th>
                <th className="text-right py-3 text-xs uppercase font-bold text-slate-400 tracking-wider w-20">Qty</th>
                <th className="text-right py-3 text-xs uppercase font-bold text-slate-400 tracking-wider w-24">Price</th>
                <th className="text-right py-3 text-xs uppercase font-bold text-slate-400 tracking-wider w-20">Tax %</th>
                <th className="text-right py-3 text-xs uppercase font-bold text-slate-400 tracking-wider w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 text-slate-700 font-medium">{item.description}</td>
                  <td className="py-4 text-right text-slate-600 font-mono">{item.quantity}</td>
                  <td className="py-4 text-right text-slate-600 font-mono">₹{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-4 text-right text-slate-600 font-mono">{item.taxRate}%</td>
                  <td className="py-4 text-right text-slate-900 font-mono font-medium">
                    ₹{(Number(item.quantity) * Number(item.unitPrice) * (1 + (Number(item.taxRate) || 0) / 100)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-medium">₹{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span className="font-mono font-medium">₹{Number(invoice.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 mt-3">
              <span className="text-lg font-bold text-slate-900">Total</span>
              <span className="text-lg font-bold text-primary font-mono">₹{Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        {invoice.notes && (
          <div className="border-t border-slate-100 pt-8 mt-auto">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Notes</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{invoice.notes}</p>
          </div>
        )}
      </div>
    );
  }
);

PrintableInvoice.displayName = "PrintableInvoice";
