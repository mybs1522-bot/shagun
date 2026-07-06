import { Phone } from "lucide-react";
import React from "react";

import { supabase } from "@/lib/supabase";

import { Service } from "../../types/services";
import { Panel, PanelHeader, PanelTitle } from "../panel";
import { ServiceItem } from "./service-item";

async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch services:", error);
    return [];
  }

  return data ?? [];
}

function groupByCategory(services: Service[]) {
  const groups: Record<string, Service[]> = {};
  for (const service of services) {
    const cat = service.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(service);
  }
  return groups;
}

export async function Services() {
  const services = await getServices();

  if (services.length === 0) return null;

  const grouped = groupByCategory(services);

  return (
    <Panel id="services" className="scroll-mt-22">
      <div className="p-4">
        {Object.entries(grouped).map(([category, items], groupIndex) => (
          <div key={category} className={groupIndex > 0 ? "mt-6" : ""}>
            <p className="mb-4 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-foreground">
              {category.toLowerCase().includes("consultation call") ? (
                <>
                  <Phone className="size-4" />
                  Book Consultation Call
                </>
              ) : (
                category
              )}
            </p>
            <div className="space-y-3">
              {items.map((service) => (
                <ServiceItem key={service.id} service={service} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
