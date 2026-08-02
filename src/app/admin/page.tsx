"use client";

import { Loader2, Lock, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BooksTab } from "./components/books-tab";
import { LeadsTab } from "./components/leads-tab";
import { ProjectsTab } from "./components/projects-tab";
import { ReviewsTab } from "./components/reviews-tab";
import { ServiceLeadsTab } from "./components/service-leads-tab";
import { ServicesTab } from "./components/services-tab";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  // Hydrate persistent auth from localStorage & cookies
  useEffect(() => {
    const storedLocal = localStorage.getItem("admin_auth");
    const storedSession = sessionStorage.getItem("admin_auth");
    const hasCookie = document.cookie.includes("admin_auth=true");

    if (storedLocal === "true" || storedSession === "true" || hasCookie) {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_auth");
    document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setAuthenticated(false);
    toast.success("Logged out successfully");
  };

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authenticated) {
    return <PasswordGate onSuccess={() => setAuthenticated(true)} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}

// ---------------------------------------------------------------------------
// Password Gate
// ---------------------------------------------------------------------------

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        // Store persistent login so user stays logged in until explicit logout
        localStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_auth", "true");
        document.cookie = "admin_auth=true; path=/; max-age=31536000; SameSite=Lax";
        toast.success("Logged in successfully");
        onSuccess();
      } else {
        toast.error("Invalid password");
        setPassword("");
      }
    } catch {
      toast.error("Failed to verify password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Admin Access</h2>
          <p className="text-sm text-muted-foreground">
            Enter your password to continue
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Enter"
          )}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <Tabs defaultValue="service-leads" className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <TabsList className="flex flex-wrap h-auto w-full max-w-3xl justify-start gap-2 bg-transparent">
          <TabsTrigger value="service-leads" className="data-[state=active]:bg-muted font-semibold">
            Service Leads
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-muted">
            Services
          </TabsTrigger>
          <TabsTrigger value="books" className="data-[state=active]:bg-muted">
            E-Books
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-muted">
            Book Leads
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-muted">
            Reviews
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-muted">
            Projects
          </TabsTrigger>
        </TabsList>

        <Button
          variant="outline"
          size="default"
          onClick={onLogout}
          className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="size-3.5" />
          Log Out
        </Button>
      </div>
      
      <TabsContent value="service-leads" className="border rounded-xl p-6 bg-card shadow-sm mt-0">
        <ServiceLeadsTab />
      </TabsContent>

      <TabsContent value="services" className="border rounded-xl p-6 bg-card shadow-sm">
        <ServicesTab />
      </TabsContent>
      
      <TabsContent value="books" className="border rounded-xl p-6 bg-card shadow-sm">
        <BooksTab />
      </TabsContent>
      
      <TabsContent value="leads" className="border rounded-xl p-6 bg-card shadow-sm mt-0">
        <LeadsTab />
      </TabsContent>

      <TabsContent value="reviews" className="border rounded-xl p-6 bg-card shadow-sm">
        <ReviewsTab />
      </TabsContent>

      <TabsContent value="projects" className="border rounded-xl p-6 bg-card shadow-sm">
        <ProjectsTab />
      </TabsContent>
    </Tabs>
  );
}
