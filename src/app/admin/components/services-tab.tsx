"use client";

import { Loader2, Pencil, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase";

interface Service {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  amount: number;
  currency: string;
  payment_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

type ServiceFormData = Omit<Service, "id" | "created_at">;

const EMPTY_FORM: ServiceFormData = {
  title: "",
  description: "",
  category: "",
  image_url: "",
  amount: 0,
  currency: "₹",
  payment_link: "",
  display_order: 0,
  is_active: true,
};

const CATEGORY_SUGGESTIONS = [
  "FREE INTRODUCTION CALL",
  "CONSULTATION CALL",
];

export function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      if (res.ok) {
        const json = await res.json();
        if (json.services) {
          setServices(json.services as Service[]);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Fallback to client Supabase
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to load services");
      console.error(error);
    } else {
      setServices(data as Service[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAdd = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_service",
          serviceId: deleteTarget.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete service");

      toast.success("Service deleted");
      fetchServices();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service");
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Move service sequence up or down via Server Admin API
  const handleMove = async (currentIndex: number, direction: -1 | 1) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    setReordering(true);

    // Create a reordered copy
    const updatedServices = [...services];
    const temp = updatedServices[currentIndex];
    updatedServices[currentIndex] = updatedServices[targetIndex];
    updatedServices[targetIndex] = temp;

    // Assign sequential display_order: 1, 2, 3...
    const reorderedItems = updatedServices.map((item, index) => ({
      id: item.id,
      display_order: index + 1,
    }));

    // Optimistic UI update
    const optimisticServices = updatedServices.map((item, index) => ({
      ...item,
      display_order: index + 1,
    }));
    setServices(optimisticServices);

    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          reorderedItems,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save sequence");

      toast.success("Service sequence saved! Reflects live on homepage.");
      fetchServices();
    } catch (err: any) {
      console.error("Error swapping sequence:", err);
      toast.error(err.message || "Failed to update sequence");
      fetchServices();
    } finally {
      setReordering(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingService(null);
  };

  const handleSaved = () => {
    handleDialogClose();
    fetchServices();
  };

  const formatPrice = (amount: number, currency: string) =>
    `${currency}${amount.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Services</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use ▲ and ▼ arrows in the Sequence column to reorder services displayed on the homepage
          </p>
        </div>
        <Button onClick={handleAdd} size="default">
          <Plus className="size-4" />
          Add Service
        </Button>
      </div>

      <Separator />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-muted-foreground">No services found</p>
          <Button variant="outline" onClick={handleAdd}>
            <Plus className="size-4" />
            Add your first service
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Sequence</TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service, index) => (
              <TableRow key={service.id}>
                {/* SEQUENCE REORDERING COLUMN */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-xs text-muted-foreground w-6 text-center">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={index === 0 || reordering}
                        onClick={() => handleMove(index, -1)}
                        className="size-5 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move Service Up"
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={index === services.length - 1 || reordering}
                        onClick={() => handleMove(index, 1)}
                        className="size-5 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move Service Down"
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {service.image_url ? (
                    <div className="relative size-10 overflow-hidden rounded-md border border-border">
                      <Image
                        src={service.image_url}
                        alt={service.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {service.title}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {service.category || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatPrice(service.amount, service.currency)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={service.is_active ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      service.is_active
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {service.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(service)}
                      aria-label={`Edit ${service.title}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(service)}
                      aria-label={`Delete ${service.title}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ServiceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        service={editingService}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.title}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceDialog({
  open,
  onClose,
  onSaved,
  service,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  service: Service | null;
}) {
  const isEditing = !!service;
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setForm({
        title: service.title,
        description: service.description ?? "",
        category: service.category ?? "",
        image_url: service.image_url ?? "",
        amount: service.amount,
        currency: service.currency,
        payment_link: service.payment_link ?? "",
        display_order: service.display_order,
        is_active: service.is_active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [service, open]);

  const updateField = <K extends keyof ServiceFormData>(
    key: K,
    value: ServiceFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (form.amount < 0) {
      toast.error("Amount must be a positive number");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      category: form.category?.trim() || null,
      image_url: form.image_url?.trim() || null,
      amount: form.amount,
      currency: form.currency || "₹",
      payment_link: form.payment_link?.trim() || null,
      display_order: form.display_order,
      is_active: form.is_active,
    };

    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_service",
          serviceId: service?.id,
          payload,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save service");

      toast.success(isEditing ? "Service updated" : "Service added");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed to save service");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the service details below."
              : "Fill in the details to create a new service."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="svc-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="svc-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. 1-on-1 Consultation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-desc">Description</Label>
            <Input
              id="svc-desc"
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description of the service"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-category">Category</Label>
            <Input
              id="svc-category"
              value={form.category ?? ""}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="e.g. CONSULTATION CALL"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-image">Image URL</Label>
            <Input
              id="svc-image"
              type="url"
              value={form.image_url ?? ""}
              onChange={(e) => updateField("image_url", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="svc-amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="svc-amount"
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) =>
                  updateField("amount", parseFloat(e.target.value) || 0)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-currency">Currency</Label>
              <Input
                id="svc-currency"
                value={form.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                placeholder="₹"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-link">Payment Link</Label>
            <Input
              id="svc-link"
              type="url"
              value={form.payment_link ?? ""}
              onChange={(e) => updateField("payment_link", e.target.value)}
              placeholder="https://pay.example.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-order">Display Order (Sequence)</Label>
            <Input
              id="svc-order"
              type="number"
              value={form.display_order}
              onChange={(e) =>
                updateField("display_order", parseInt(e.target.value, 10) || 0)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="svc-active" className="cursor-pointer">
                Active
              </Label>
              <p className="text-xs text-muted-foreground">
                Show this service on the public site
              </p>
            </div>
            <Switch
              id="svc-active"
              checked={form.is_active}
              onCheckedChange={(checked) => updateField("is_active", checked)}
            />
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Service"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
