import { z } from "zod";

// === TYPES ===

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

// === SCHEMAS ===

export const insertCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
});

export const insertInvoiceSchema = z.object({
  customerId: z.coerce.number(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.string().min(1, "Status is required"),
  subtotal: z.coerce.number(),
  tax: z.coerce.number(),
  total: z.coerce.number(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export const insertSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  companyPhone: z.string().min(1, "Company phone is required"),
  companyEmail: z.string().email("Invalid company email"),
  logoUrl: z.string().optional(),
  taxPercentage: z.coerce.number().min(0).max(100),
});

// === DOMAIN MODELS ===

export const insertItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  hsnCode: z.string().min(1, "HSN/SAC code is required"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be positive"),
  costPrice: z.coerce.number().min(0, "Cost price must be positive"),
  taxRate: z.coerce.number().min(0).max(100),
  description: z.string().optional(),
});

export type Item = z.infer<typeof insertItemSchema> & { id: number };
export type InsertItem = z.infer<typeof insertItemSchema>;

export const customers = { $inferSelect: {} as Customer };
export const invoices = { $inferSelect: {} as Invoice };
export const settings = { $inferSelect: {} as Settings };
export const items = { $inferSelect: {} as Item };

export type Customer = z.infer<typeof insertCustomerSchema> & { id: number };
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Invoice = z.infer<typeof insertInvoiceSchema> & { id: number };
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Settings = z.infer<typeof insertSettingsSchema> & { id: number };
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
