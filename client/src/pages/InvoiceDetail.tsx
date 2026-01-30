import { useParams, Link } from "wouter";
import { useInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { useCustomer } from "@/hooks/use-customers";
import { useSettings } from "@/hooks/use-settings";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { PrintableInvoice } from "@/components/PrintableInvoice";
import { ArrowLeft, Printer, Download, Pencil, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function InvoiceDetail() {
  const { id } = useParams();
  const invoiceId = parseInt(id || "0");
  const { data: invoice, isLoading: loadingInvoice } = useInvoice(invoiceId);
  const { data: customer, isLoading: loadingCustomer } = useCustomer(invoice?.customerId || 0);
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const updateMutation = useUpdateInvoice();
  const { toast } = useToast();

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoice?.invoiceNumber}`,
  });

  const handleStatusChange = (status: string) => {
    if (!invoice) return;
    updateMutation.mutate({ id: invoiceId, status });
  };

  const isLoading = loadingInvoice || loadingCustomer || loadingSettings;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="bg-white p-8 rounded-xl h-[600px] animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!invoice || !customer || !settings) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold">Invoice not found</h2>
          <Link href="/invoices">
            <Button variant="link">Back to Invoices</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Invoice #{invoice.invoiceNumber}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground text-sm">Status:</span>
                <Select value={invoice.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={`/invoices/${invoiceId}/edit`}>
              <Button variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print / PDF
            </Button>
            <Button onClick={() => toast({ title: "Email Sent", description: `Invoice sent to ${customer.email}` })}>
              <Send className="h-4 w-4 mr-2" />
              Send to Client
            </Button>
          </div>
        </div>

        <div className="shadow-2xl shadow-slate-200/50 rounded-lg overflow-hidden border">
          <PrintableInvoice 
            ref={printRef}
            invoice={invoice} 
            customer={customer} 
            settings={settings} 
          />
        </div>
      </div>
    </Layout>
  );
}
