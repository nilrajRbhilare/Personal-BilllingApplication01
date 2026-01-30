import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams, Link } from "wouter";
import { format } from "date-fns";
import { useCustomers } from "@/hooks/use-customers";
import { useSettings } from "@/hooks/use-settings";
import { useCreateInvoice, useUpdateInvoice, useInvoice, useInvoices } from "@/hooks/use-invoices";
import { useQuery } from "@tanstack/react-query";
import { insertInvoiceSchema, type InsertInvoice, type InvoiceItem, type Item } from "@shared/schema";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function InvoiceForm() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const isEditing = !!id;
  
  const { data: customers } = useCustomers();
  const { data: settings } = useSettings();
  const { data: invoices } = useInvoices();
  const { data: existingInvoice } = useInvoice(parseInt(id || "0"));
  
  const { data: availableItems } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });
  
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      customerId: 0,
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      date: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      status: "draft",
      items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
      notes: "Thank you for your business!",
      subtotal: 0,
      tax: 0,
      total: 0,
    }
  });

  // Reset form when editing data loads or setting default invoice number for new invoice
  useEffect(() => {
    if (existingInvoice && isEditing) {
      // Need to cast items because JSON types coming from DB
      const items = (Array.isArray(existingInvoice.items) 
        ? existingInvoice.items 
        : JSON.parse(JSON.stringify(existingInvoice.items))) as InvoiceItem[];

      form.reset({
        ...existingInvoice,
        items,
        customerId: existingInvoice.customerId,
      });
    } else if (!isEditing && invoices && invoices.length > 0) {
      // For new invoices, find the highest invoice number and increment it
      const lastInvoice = [...invoices].sort((a, b) => {
        const numA = parseInt(a.invoiceNumber.replace(/\D/g, '') || '0');
        const numB = parseInt(b.invoiceNumber.replace(/\D/g, '') || '0');
        return numB - numA;
      })[0];
      
      const lastNum = parseInt(lastInvoice.invoiceNumber.replace(/\D/g, '') || '0');
      const prefix = lastInvoice.invoiceNumber.replace(/\d/g, '') || 'INV-';
      form.setValue("invoiceNumber", `${prefix}${lastNum + 1}`);
    }
  }, [existingInvoice, isEditing, form, invoices]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch items to calculate totals
  const items = useWatch({ control: form.control, name: "items" });
  
  const { subtotal, tax, total } = useMemo(() => {
    const totals = (items || []).reduce((acc, item) => {
      const p = Number(item.unitPrice) || 0;
      const t = Number(item.taxRate) || 0;
      const lineSubtotal = p;
      const lineTax = lineSubtotal * (t / 100);
      return {
        subtotal: acc.subtotal + lineSubtotal,
        tax: acc.tax + lineTax
      };
    }, { subtotal: 0, tax: 0 });

    return {
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.subtotal + totals.tax
    };
  }, [items]);
  
  useEffect(() => {
    form.setValue("subtotal", subtotal);
    form.setValue("tax", tax);
    form.setValue("total", total);
  }, [subtotal, tax, total, form]);

  const onSubmit = (data: InsertInvoice) => {
    if (isEditing) {
      updateMutation.mutate({ id: parseInt(id!), ...data }, {
        onSuccess: () => setLocation("/invoices"),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setLocation("/invoices"),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")} type="button">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {isEditing ? "Edit Invoice" : "New Invoice"}
                </h1>
                <p className="text-muted-foreground mt-1">Fill in the details below.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLocation("/invoices")} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Saving..." : "Save Invoice"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0 })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : ""}>Item</FormLabel>
                                <FormControl>
                                  <Select 
                                    onValueChange={(val) => {
                                      const selectedItem = availableItems?.find(i => i.name === val);
                                      if (selectedItem) {
                                        const qty = Number(form.getValues(`items.${index}.quantity`)) || 1;
                                        form.setValue(`items.${index}.description`, selectedItem.name);
                                        form.setValue(`items.${index}.unitPrice`, selectedItem.sellingPrice * qty);
                                        form.setValue(`items.${index}.taxRate`, selectedItem.taxRate);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableItems?.map((item) => (
                                        <SelectItem key={item.id} value={item.name}>
                                          {item.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : ""}>Qty</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Qty" 
                                    min="1" 
                                    {...field} 
                                    onChange={(e) => {
                                      const newQty = Number(e.target.value);
                                      field.onChange(newQty);
                                      const selectedItemName = form.getValues(`items.${index}.description`);
                                      const selectedItem = availableItems?.find(i => i.name === selectedItemName);
                                      if (selectedItem) {
                                        form.setValue(`items.${index}.unitPrice`, selectedItem.sellingPrice * newQty);
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : ""}>Price</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">₹</span>
                                    <Input type="number" className="pl-5" placeholder="Price" min="0" step="0.01" {...field} />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.taxRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : ""}>Tax %</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input type="number" className="pr-5" placeholder="Tax" min="0" max="100" step="0.01" {...field} />
                                    <span className="absolute right-2 top-2.5 text-muted-foreground text-xs">%</span>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormItem>
                            <FormLabel className={index > 0 ? "sr-only" : ""}>Amount (Inc. Tax)</FormLabel>
                            <div className="h-9 flex items-center px-3 border rounded-md bg-muted/30 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
                              ₹{(() => {
                                const p = Number(items[index]?.unitPrice) || 0;
                                const t = Number(items[index]?.taxRate) || 0;
                                return (p * (1 + t/100)).toFixed(2);
                              })()}
                            </div>
                          </FormItem>
                        </div>
                        <div className="col-span-1 flex justify-end pb-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive h-8 w-8"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              remove(index);
                            }}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <div className="flex gap-2">
                            <Select 
                              onValueChange={(val) => field.onChange(Number(val))} 
                              value={field.value ? String(field.value) : undefined}
                            >
                              <FormControl>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {customers?.map((customer) => (
                                  <SelectItem key={customer.id} value={String(customer.id)}>
                                    {customer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Link href="/customers">
                              <Button variant="outline" type="button" size="icon" title="Add new customer">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Add any notes or payment details..." className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Card className="bg-slate-50 border-slate-200 shadow-sm h-fit self-end">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>₹{tax.toFixed(2)}</span>
                      </div>
                      <Separator className="bg-slate-200" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </Layout>
  );
}
