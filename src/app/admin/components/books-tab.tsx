"use client";

import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  ShoppingBag,
  IndianRupee,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
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
import { Book } from "@/features/books/types";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase";

const EMPTY_FORM = {
  title: "",
  thumbnail_url: "",
  link: "",
  display_order: 0,
  is_active: true,
  price: 0,
  pdf_url: "",
  description: "",
  preview_images: [] as string[],
};

export type BookSalesStats = {
  totalLeads: number;
  paidSales: number;
  revenue: number;
};

export function BooksTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [salesStats, setSalesStats] = useState<Record<string, BookSalesStats>>({});
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBooksAndSales = useCallback(async () => {
    setLoading(true);

    // 1. Fetch books
    const { data: booksData, error: booksError } = await supabase
      .from("books")
      .select("*")
      .order("display_order", { ascending: true });

    if (booksError) {
      toast.error("Failed to load books");
      console.error(booksError);
    } else {
      setBooks((booksData as Book[]) || []);
    }

    // 2. Fetch sales/leads metrics per book
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from("book_leads")
        .select("book_id, payment_status");

      if (!leadsError && leadsData) {
        const statsMap: Record<string, BookSalesStats> = {};

        leadsData.forEach((lead) => {
          const bId = lead.book_id;
          if (!statsMap[bId]) {
            statsMap[bId] = { totalLeads: 0, paidSales: 0, revenue: 0 };
          }
          statsMap[bId].totalLeads += 1;

          // Check paid status
          if (lead.payment_status === "completed") {
            statsMap[bId].paidSales += 1;
          }
        });

        // Calculate revenue for each book
        (booksData as Book[] || []).forEach((b) => {
          if (statsMap[b.id]) {
            statsMap[b.id].revenue = statsMap[b.id].paidSales * (b.price || 0);
          }
        });

        setSalesStats(statsMap);
      }
    } catch (err) {
      console.error("Error fetching book sales stats:", err);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooksAndSales();
  }, [fetchBooksAndSales]);

  const handleAdd = () => {
    setEditingBook(null);
    setDialogOpen(true);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      toast.error("Failed to delete book");
      console.error(error);
    } else {
      toast.success("Book deleted");
      fetchBooksAndSales();
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingBook(null);
  };

  // Overall E-Book sales metrics
  const totalPaidSalesCount = Object.values(salesStats).reduce(
    (sum, s) => sum + s.paidSales,
    0
  );
  const totalRevenueAmount = books.reduce((sum, b) => {
    const paid = salesStats[b.id]?.paidSales || 0;
    return sum + paid * (b.price || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Total Books
            </span>
            <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <BookOpen className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {books.length}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">
              Paid Sales Done
            </span>
            <span className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400">
              <ShoppingBag className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400 flex items-center gap-2">
            {totalPaidSalesCount} <span className="text-xs font-semibold opacity-80">sales</span>
          </p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400">
              Total Book Revenue
            </span>
            <span className="rounded-lg bg-blue-500/20 p-1.5 text-blue-400">
              <IndianRupee className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-400">
            ₹{totalRevenueAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Free &amp; Paid Books</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage e-books, prices, links, and track paid sales performance
          </p>
        </div>
        <Button onClick={handleAdd} size="default">
          <Plus className="size-4" />
          Add Book
        </Button>
      </div>

      <Separator />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-muted-foreground">No books found</p>
          <Button variant="outline" onClick={handleAdd}>
            <Plus className="size-4" />
            Upload your first book
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Thumbnail</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-center">Paid Sales Done</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => {
              const stats = salesStats[book.id] || { totalLeads: 0, paidSales: 0, revenue: 0 };
              const bookRevenue = stats.paidSales * (book.price || 0);

              return (
                <TableRow key={book.id}>
                  <TableCell>
                    {book.thumbnail_url ? (
                      <div className="relative size-10 overflow-hidden rounded-md border border-border">
                        <Image
                          src={book.thumbnail_url}
                          alt={book.title}
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
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {book.price > 0 ? `₹${book.price}` : "Free"}
                  </TableCell>

                  {/* PAID SALES DONE COUNTER */}
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        stats.paidSales > 0
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {stats.paidSales} {stats.paidSales === 1 ? "Sale" : "Sales"}
                    </span>
                  </TableCell>

                  {/* REVENUE */}
                  <TableCell className="text-right font-mono font-bold text-xs">
                    ₹{bookRevenue.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell>
                    <a
                      href={book.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline max-w-[130px] truncate block text-xs"
                    >
                      {book.link}
                    </a>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant={book.is_active ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        book.is_active
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {book.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(book)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(book)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <BookDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={() => {
          handleDialogClose();
          fetchBooksAndSales();
        }}
        book={editingBook}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
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

function BookDialog({
  open,
  onClose,
  onSaved,
  book,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  book: Book | null;
}) {
  const isEditing = !!book;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title,
        thumbnail_url: book.thumbnail_url ?? "",
        link: book.link,
        display_order: book.display_order,
        is_active: book.is_active,
        price: book.price ?? 0,
        pdf_url: book.pdf_url ?? "",
        description: book.description ?? "",
        preview_images: book.preview_images ?? [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [book, open]);

  const updateField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError.message, uploadError);
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("book-covers")
        .getPublicUrl(filePath);

      updateField("thumbnail_url", publicUrlData.publicUrl);
      toast.success("Cover image uploaded successfully!");
    } catch (err: any) {
      console.error("Cover upload error:", err);
      toast.error(`Failed to upload cover image: ${err?.message || "Unknown error"}`);
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.link.trim()) {
      toast.error("Title and Link are required");
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      thumbnail_url: form.thumbnail_url?.trim() || null,
      link: form.link.trim(),
      display_order: form.display_order,
      is_active: form.is_active,
      price: Number(form.price) || 0,
      pdf_url: form.pdf_url?.trim() || null,
      description: form.description?.trim() || null,
      preview_images: form.preview_images.filter(Boolean),
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from("books").update(payload).eq("id", book.id));
    } else {
      ({ error } = await supabase.from("books").insert(payload));
    }

    if (error) {
      toast.error(isEditing ? "Failed to update book" : "Failed to add book");
      console.error(error);
    } else {
      toast.success(isEditing ? "Book updated" : "Book added");
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Book" : "Add Book"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update book details." : "Enter details for the new book."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="bk-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="bk-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Modern Architecture Guide"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bk-desc">Description</Label>
            <textarea
              id="bk-desc"
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Provide a short overview of the book contents..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex gap-4 items-center">
              {form.thumbnail_url ? (
                <div className="relative size-16 overflow-hidden rounded border border-border shrink-0">
                  <img
                    src={form.thumbnail_url}
                    alt="Cover preview"
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex size-16 items-center justify-center rounded border border-border bg-muted shrink-0 text-[10px] text-muted-foreground text-center">
                  No Cover
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <label className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                    {uploadingCover ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                    {uploadingCover ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                    />
                  </label>
                  {form.thumbnail_url && (
                    <Button type="button" variant="ghost" onClick={() => updateField("thumbnail_url", "")}>
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Supported formats: JPG, PNG, WEBP</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bk-thumb">Or Cover Image URL</Label>
            <Input
              id="bk-thumb"
              type="url"
              value={form.thumbnail_url}
              onChange={(e) => updateField("thumbnail_url", e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bk-link">Book Link (PDF/URL) <span className="text-destructive">*</span></Label>
            <Input
              id="bk-link"
              type="url"
              value={form.link}
              onChange={(e) => updateField("link", e.target.value)}
              placeholder="https://example.com/book.pdf"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bk-price">Price (₹)</Label>
              <Input
                id="bk-price"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                placeholder="0 for Free"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-order">Display Order</Label>
              <Input
                id="bk-order"
                type="number"
                value={form.display_order}
                onChange={(e) => updateField("display_order", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bk-pdf">PDF File URL (For post-payment download)</Label>
            <Input
              id="bk-pdf"
              type="url"
              value={form.pdf_url}
              onChange={(e) => updateField("pdf_url", e.target.value)}
              placeholder="https://example.com/downloadable-book.pdf"
            />
          </div>

          <div className="space-y-2">
            <Label>Preview Pages (up to 4 images)</Label>
            <p className="text-[10px] text-muted-foreground">Upload images showing sample pages from the book.</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((idx) => {
                const imgUrl = form.preview_images[idx] || "";
                return (
                  <div key={idx} className="relative aspect-[3/4] rounded-lg border border-border bg-muted overflow-hidden group">
                    {imgUrl ? (
                      <>
                        <img src={imgUrl} alt={`Preview ${idx + 1}`} className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...form.preview_images];
                            updated.splice(idx, 1);
                            updateField("preview_images", updated);
                          }}
                          className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <label className="flex size-full items-center justify-center cursor-pointer hover:bg-accent transition-colors">
                        <span className="text-[10px] text-muted-foreground font-medium">+ Add</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const fileExt = file.name.split(".").pop();
                              const fileName = `${crypto.randomUUID()}.${fileExt}`;
                              const filePath = `previews/${fileName}`;
                              const { error: upErr } = await supabase.storage
                                .from("book-covers")
                                .upload(filePath, file, { upsert: true });
                              if (upErr) throw upErr;
                              const { data: urlData } = supabase.storage
                                .from("book-covers")
                                .getPublicUrl(filePath);
                              const updated = [...form.preview_images];
                              updated[idx] = urlData.publicUrl;
                              updateField("preview_images", updated);
                              toast.success(`Preview ${idx + 1} uploaded!`);
                            } catch (err: any) {
                              console.error(err);
                              toast.error(`Preview upload failed: ${err?.message || "Unknown error"}`);
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="bk-active" className="cursor-pointer">Active</Label>
              <p className="text-xs text-muted-foreground">Show this on the site</p>
            </div>
            <Switch
              id="bk-active"
              checked={form.is_active}
              onCheckedChange={(checked) => updateField("is_active", checked)}
            />
          </div>

          <Separator />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : (isEditing ? "Save" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
