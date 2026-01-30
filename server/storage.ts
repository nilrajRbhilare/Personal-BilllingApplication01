import { type Customer, type InsertCustomer, type Invoice, type InsertInvoice, type Settings, type InsertSettings } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<void>;

  // Invoices
  getInvoices(filters?: { customerId?: string, startDate?: string, endDate?: string, status?: string }): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<void>;

  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
}

export class FileStorage implements IStorage {
  private dataDir = path.join(process.cwd(), "server/data");
  private customersFile = path.join(this.dataDir, "customers.json");
  private invoicesFile = path.join(this.dataDir, "invoices.json");
  private settingsFile = path.join(this.dataDir, "settings.json");

  constructor() {
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
    
    // Seed Customers
    await this.ensureFile(this.customersFile, [
      {
        id: 1,
        name: "Acme Corp",
        email: "contact@acme.com",
        phone: "555-0100",
        address: "123 Industrial Way, Tech City, TC 90210"
      },
      {
        id: 2,
        name: "Global Services Inc",
        email: "billing@globalservices.com",
        phone: "555-0200",
        address: "456 Corporate Blvd, Metropolis, NY 10001"
      }
    ]);

    // Seed Invoices
    await this.ensureFile(this.invoicesFile, [
      {
        id: 1,
        customerId: 1,
        invoiceNumber: "INV-001",
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "paid",
        subtotal: "1000",
        tax: "100",
        total: "1100",
        notes: "Consulting services for Q1",
        items: [
          { description: "Strategy Session", quantity: 5, unitPrice: 200 }
        ]
      },
      {
        id: 2,
        customerId: 2,
        invoiceNumber: "INV-002",
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "pending",
        subtotal: "500",
        tax: "50",
        total: "550",
        notes: "Web development deposit",
        items: [
          { description: "Frontend Development", quantity: 10, unitPrice: 50 }
        ]
      }
    ]);

    // Default settings
    await this.ensureFile(this.settingsFile, [{
      id: 1,
      companyName: "My Billing Company",
      companyAddress: "789 Freelance Lane, Digital Nomad City",
      companyPhone: "555-9999",
      companyEmail: "hello@mybilling.com",
      taxPercentage: "10"
    }]);
  }

  private async ensureFile(filePath: string, defaultContent: any) {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
    }
  }

  private async readJson<T>(filePath: string): Promise<T> {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  }

  private async writeJson(filePath: string, data: any): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.readJson<Customer[]>(this.customersFile);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const customers = await this.readJson<Customer[]>(this.customersFile);
    return customers.find(c => c.id === id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const customers = await this.readJson<Customer[]>(this.customersFile);
    const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    const customer: Customer = { ...insertCustomer, id: newId };
    customers.push(customer);
    await this.writeJson(this.customersFile, customers);
    return customer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customers = await this.readJson<Customer[]>(this.customersFile);
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return undefined;

    const updatedCustomer = { ...customers[index], ...updates };
    customers[index] = updatedCustomer;
    await this.writeJson(this.customersFile, customers);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    let customers = await this.readJson<Customer[]>(this.customersFile);
    customers = customers.filter(c => c.id !== id);
    await this.writeJson(this.customersFile, customers);
  }

  // Invoices
  async getInvoices(filters?: { customerId?: string, startDate?: string, endDate?: string, status?: string }): Promise<Invoice[]> {
    let invoices = await this.readJson<Invoice[]>(this.invoicesFile);
    
    if (filters) {
      if (filters.customerId) {
        invoices = invoices.filter(i => i.customerId === parseInt(filters.customerId!));
      }
      if (filters.status) {
        invoices = invoices.filter(i => i.status === filters.status);
      }
      if (filters.startDate) {
        invoices = invoices.filter(i => i.date >= filters.startDate!);
      }
      if (filters.endDate) {
        invoices = invoices.filter(i => i.date <= filters.endDate!);
      }
    }
    
    return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const invoices = await this.readJson<Invoice[]>(this.invoicesFile);
    return invoices.find(i => i.id === id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoices = await this.readJson<Invoice[]>(this.invoicesFile);
    const newId = invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1;
    const invoice: Invoice = { ...insertInvoice, id: newId, items: insertInvoice.items };
    invoices.push(invoice);
    await this.writeJson(this.invoicesFile, invoices);
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoices = await this.readJson<Invoice[]>(this.invoicesFile);
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return undefined;

    const updatedInvoice = { ...invoices[index], ...updates };
    invoices[index] = updatedInvoice;
    await this.writeJson(this.invoicesFile, invoices);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    let invoices = await this.readJson<Invoice[]>(this.invoicesFile);
    invoices = invoices.filter(i => i.id !== id);
    await this.writeJson(this.invoicesFile, invoices);
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    const settings = await this.readJson<Settings[]>(this.settingsFile);
    return settings[0];
  }

  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    // Always update the first record
    const settings: Settings = { ...insertSettings, id: 1 };
    await this.writeJson(this.settingsFile, [settings]);
    return settings;
  }
}

export const storage = new FileStorage();
