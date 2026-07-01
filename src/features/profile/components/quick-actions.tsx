"use client";

import { Phone, SendIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { USER } from "@/data/user";
import { ServiceDialog } from "@/features/profile/components/services/service-dialog";
import { Service } from "@/features/profile/types/services";
import { useIsClient } from "@/hooks/use-is-client";
import { supabase } from "@/lib/supabase";
import { decodeEmail } from "@/utils/string";

export function QuickActions() {
  const isClient = useIsClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetService, setTargetService] = useState<Service | null>(null);

  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .ilike("title", "%Call With Ar Shagun%")
      .limit(1)
      .single()
      .then(({ data }) => setTargetService(data));
  }, []);

  return (
    <>
      <div className="h-14" />

      <div className="fixed inset-x-0 bottom-0 z-50 bg-background pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="screen-line-before before:z-1">
          <div className="mx-auto px-4 md:max-w-3xl">
            <div className="border-x border-grid pt-2">
              <div className="screen-line-before screen-line-after -mx-px grid grid-cols-2 gap-4">
                <Button size="lg" onClick={() => {
                  if (targetService) setDialogOpen(true);
                  else {
                    // Fallback if service not found, scroll to services
                    const servicesEl = document.getElementById("services");
                    if (servicesEl) servicesEl.scrollIntoView({ behavior: "smooth" });
                  }
                }}>
                  <Phone className="animate-[ring_1.2s_ease-in-out_infinite]" />
                  <span>Book Consultation</span>
                </Button>

                <Button size="lg" asChild>
                  <a
                    href={isClient ? `mailto:${decodeEmail(USER.email)}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SendIcon />
                    <span>Send Email</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        service={targetService}
      />
    </>
  );
}
