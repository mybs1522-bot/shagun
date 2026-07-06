"use client";

import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Service } from "@/features/profile/types/services";
import { supabase } from "@/lib/supabase";

type ServiceLead = {
  id: string;
  name: string;
  phone: string;
  service_id: string;
  payment_status: string | null;
  created_at: string;
  services: Pick<Service, "title"> | null;
};

export function ServiceLeadsTab() {
  const [leads, setLeads] = useState<ServiceLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_leads")
      .select(`
        *,
        services (
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load service leads");
      console.error(error);
    } else {
      setLeads(data as unknown as ServiceLead[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Service Leads</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center border rounded-lg border-dashed">
          <p className="text-muted-foreground">No leads captured yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Requested Service</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>
                  {lead.services ? (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20">
                      {lead.services.title}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Deleted Service</span>
                  )}
                </TableCell>
                <TableCell>
                  {lead.payment_status === "completed" ? (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/10 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-400/20">
                      Completed
                    </span>
                  ) : lead.payment_status === "pending" ? (
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-700/10 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-400/20">
                      Pending
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {dayjs(lead.created_at).format("MMM D, YYYY h:mm A")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
