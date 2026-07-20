import { Phone, LayoutPanelTop, Package, Calculator, Wallet } from "lucide-react";
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
                <React.Fragment key={service.id}>
                  <ServiceItem service={service} />
                  {service.title.toLowerCase().includes("google meet") && (
                    <div className="flex flex-wrap gap-2 py-1 justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-neutral-800 dark:border-neutral-200">
                        <LayoutPanelTop className="size-3.5" />
                        Floor Plan
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-neutral-800 dark:border-neutral-200">
                        <Package className="size-3.5" />
                        3D Design
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-neutral-800 dark:border-neutral-200">
                        <Calculator className="size-3.5" />
                        Estimates
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-neutral-800 dark:border-neutral-200">
                        <Wallet className="size-3.5" />
                        Budgeting
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
