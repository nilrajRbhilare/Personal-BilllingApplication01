import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "./use-toast";
import type { InsertInvoice, Invoice } from "@shared/schema";

export function useInvoices(filters?: { customerId?: string; status?: string }) {
  return useQuery({
    queryKey: [api.invoices.list.path, filters],
    queryFn: async () => {
      let url = api.invoices.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.customerId) params.append("customerId", filters.customerId);
        if (filters.status && filters.status !== "all") params.append("status", filters.status);
        url += `?${params.toString()}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return api.invoices.list.responses[200].parse(await res.json());
    },
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: [api.invoices.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.invoices.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return api.invoices.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const validated = api.invoices.create.input.parse(data);
      const res = await fetch(api.invoices.create.path, {
        method: api.invoices.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create invoice");
      }
      return api.invoices.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      toast({ title: "Success", description: "Invoice created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertInvoice>) => {
      const url = buildUrl(api.invoices.update.path, { id });
      const res = await fetch(url, {
        method: api.invoices.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update invoice");
      }
      return api.invoices.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.invoices.get.path, data.id] });
      toast({ title: "Success", description: "Invoice updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.invoices.delete.path, { id });
      const res = await fetch(url, { method: api.invoices.delete.method });
      if (!res.ok) throw new Error("Failed to delete invoice");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      toast({ title: "Success", description: "Invoice deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
