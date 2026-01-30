import { useInvoices, useDeleteInvoice } from "@/hooks/use-invoices";
import { useCustomers } from "@/hooks/use-customers";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Invoices() {
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  
  const { data: invoices, isLoading: isLoadingInvoices } = useInvoices({ 
    status: filterStatus === "all" ? undefined : filterStatus 
  });
  
  const { data: customers } = useCustomers();
  const deleteMutation = useDeleteInvoice();

  const getCustomerName = (id: number) => {
    return customers?.find(c => c.id === id)?.name || "Unknown Customer";
  };

  const filteredInvoices = invoices?.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      getCustomerName(inv.customerId).toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Invoices</h1>
            <p className="text-muted-foreground mt-1">Create and manage your invoices.</p>
          </div>
          <Link href="/invoices/new">
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingInvoices ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading invoices...</TableCell>
                </TableRow>
              ) : filteredInvoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices?.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={(e) => {
                      // Don't navigate if clicking the dropdown menu
                      const target = e.target as HTMLElement;
                      if (target.closest('[role="menuitem"]') || target.closest('button')) {
                        return;
                      }
                      setLocation(`/invoices/${invoice.id}`);
                    }}
                  >
                    <TableCell className="font-medium">#{invoice.invoiceNumber}</TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {getCustomerName(invoice.customerId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(invoice.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      ₹{Number(invoice.total).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setLocation(`/invoices/${invoice.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/invoices/${invoice.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this invoice?')) {
                                deleteMutation.mutate(invoice.id);
                              }
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
