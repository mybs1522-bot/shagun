"use client";

import { ArrowRightIcon,Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useCallback,useEffect, useState } from "react";
import Link from "next/link";

import { Book } from "@/features/books/types";
import { supabase } from "@/lib/supabase";

export function BooksSection() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setBooks(data as Book[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  if (loading) {
    return (
      <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-xl font-bold tracking-tight">E-Books</h2>
        </div>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return null; // Don't show the section if no active books
  }

  return (
    <div id="books" className="scroll-mt-22 flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
      <div className="border-b border-border bg-muted/20 px-6 py-4">
        <h2 className="text-xl font-bold tracking-tight">E-Books</h2>
      </div>

      <div className="relative p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-6 text-center transition-all hover:bg-muted/50"
            >
              {book.price > 0 && (
                <span className="absolute top-3 right-3 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-white shadow-sm tracking-wide">
                  ₹{book.price.toLocaleString("en-IN")}
                </span>
              )}
              {book.thumbnail_url ? (
                <div className="relative mb-4 w-24 aspect-[9/16] overflow-hidden rounded shadow-sm border border-border">
                  <Image
                    src={book.thumbnail_url}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                    priority
                  />
                </div>
              ) : (
                <div className="mb-4 flex w-24 aspect-[9/16] items-center justify-center rounded shadow-sm border border-border bg-muted">
                  <span className="text-xs text-muted-foreground">No Cover</span>
                </div>
              )}
              <h3 className="font-medium">{book.title}</h3>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
                View Details <ArrowRightIcon className="size-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
