export type Book = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  link: string;
  display_order: number;
  is_active: boolean;
  price: number;
  pdf_url: string | null;
  description: string | null;
  preview_images: string[] | null;
  created_at: string;
};

export type BookLead = {
  id: string;
  email: string;
  phone: string;
  book_id: string;
  payment_status: string | null;
  paid_at: string | null;
  created_at: string;
};
