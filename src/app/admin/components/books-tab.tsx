"use client";

import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
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
};

export function BooksTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to load books");
      console.error(error);
    } else {
      setBooks(data as Book[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

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
      fetchBooks();
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingBook(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Free Books</h2>
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
              <TableHead>Link</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>PDF Link</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
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
                <TableCell>
                  <a href={book.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline max-w-[150px] truncate block">
                    {book.link}
                  </a>
                </TableCell>
                <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                  {book.price > 0 ? `₹${book.price}` : "Free"}
                </TableCell>
                <TableCell>
                  {book.pdf_url ? (
                    <a href={book.pdf_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline max-w-[150px] truncate block">
                      {book.pdf_url}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">No PDF</span>
                  )}
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
            ))}
          </TableBody>
        </Table>
      )}

      <BookDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={() => { handleDialogClose(); fetchBooks(); }}
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

      console.log("Upload succeeded:", uploadData);

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
      // Reset file input so same file can be re-selected
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
