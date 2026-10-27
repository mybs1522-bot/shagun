import { Phone } from "lucide-react";
import React from "react";

import { getSupabaseAdmin } from "@/lib/supabase";

import { Service } from "../../types/services";
import { Panel } from "../panel";
import { ServiceItem } from "./service-item";

const FALLBACK_SERVICES: Service[] = [
  {
    id: "543181b2-ca87-42d8-ab69-59385ca6f843",
    title: "Concept 3D Design for 2BHK/3BHK",
    description: "This call will help you get your concept 3D Design by Ar Shagun. It includes colour codes and the look and feel of your space.",
    category: "Concept Design",
    image_url: null,
    amount: 6000,
    currency: "₹",
    payment_link: null,
    display_order: 0,
    is_active: true,
    created_at: "2026-10-04T14:02:52.042204+00:00",
    updated_at: "2026-10-04T14:02:52.042204+00:00",
  },
  {
    id: "5b3cf615-5c94-4ccd-927d-43487ea1823f",
    title: "Bedroom 3D Design",
    description: "Photorealistic 3D Bedroom visualization with custom wardrobe, bed back paneling, mood lighting, and color scheme curated by Ar Shagun.",
    category: "3D Design",
    image_url: null,
    amount: 5000,
    currency: "₹",
    payment_link: null,
    display_order: 1,
    is_active: true,
    created_at: "2026-10-22T12:50:39.697658+00:00",
    updated_at: "2026-10-22T12:50:39.697658+00:00",
  },
  {
    id: "12758d80-d1d3-4dce-9664-1289268ad734",
    title: "Kitchen 3D Design",
    description: "Modern modular kitchen 3D layout with ergonomic counter planning, cabinet finishes, splashback tiles, and appliance integration by Ar Shagun.",
    category: "3D Design",
    image_url: null,
    amount: 5000,
    currency: "₹",
    payment_link: null,
    display_order: 2,
    is_active: true,
    created_at: "2026-10-22T12:50:39.962671+00:00",
    updated_at: "2026-10-22T12:50:39.962671+00:00",
  },
  {
    id: "142d2670-a497-4cc0-acb9-488b3d8ff1bf",
    title: "Washroom 3D Design",
    description: "Luxury bathroom & washroom 3D concept featuring premium tile combinations, vanity layout, shower enclosure, and lighting design by Ar Shagun.",
    category: "3D Design",
    image_url: null,
    amount: 5000,
    currency: "₹",
    payment_link: null,
    display_order: 3,
    is_active: true,
    created_at: "2026-10-22T12:50:40.194579+00:00",
    updated_at: "2026-10-22T12:50:40.194579+00:00",
  },
  {
    id: "6184c407-d52a-4385-89bb-47c3434c3510",
    title: "Call With Ar Shagun | For Floor Plan & 3D Design Service",
    description: "Get personalized guidance on floor plans, architectural structural modifications, and 3D elevation designs directly from Ar Shagun.",
    category: "CONSULTATION CALL",
    image_url: null,
    amount: 1999,
    currency: "₹",
    payment_link: null,
    display_order: 0,
    is_active: true,
    created_at: "2026-10-04T14:02:52.042204+00:00",
    updated_at: "2026-10-04T14:02:52.042204+00:00",
  },
  {
    id: "08d7074c-1689-45fc-9922-5b8c6cb2a864",
    title: "Call With Ar Shagun | Ask All Your Interior/Exterior Design Questions",
    description: "Have questions about finishes, budget, layout or lighting? Clear all your architectural and interior doubts in one focused session.",
    category: "CONSULTATION CALL",
    image_url: null,
    amount: 1999,
    currency: "₹",
    payment_link: null,
    display_order: 1,
    is_active: true,
    created_at: "2026-10-04T14:02:52.042204+00:00",
    updated_at: "2026-10-04T14:02:52.042204+00:00",
  },
  {
    id: "296f4364-251b-4e15-80a5-553670356f05",
    title: "Call With Ar Shagun | Google Meet Consultation",
    description: "Interactive virtual video call with real-time screen sharing and visual walkthrough of design concepts and plans.",
    category: "CONSULTATION CALL",
    image_url: null,
    amount: 2999,
    currency: "₹",
    payment_link: null,
    display_order: 2,
    is_active: true,
    created_at: "2026-10-04T14:02:52.042204+00:00",
    updated_at: "2026-10-04T14:02:52.042204+00:00",
  },
  {
    id: "a5d26d07-d292-4836-b4f9-59ca6e9186d5",
    title: "Call With Ar Shagun's Team | Ask All Your Interior/Exterior Design Questions",
    description: "Consult with expert associate architects from Ar Shagun's studio to resolve questions about materials, vendors, and layout ideas.",
    category: "CONSULTATION CALL",
    image_url: null,
    amount: 999,
    currency: "₹",
    payment_link: null,
    display_order: 3,
    is_active: true,
    created_at: "2026-10-04T14:02:52.042204+00:00",
    updated_at: "2026-10-04T14:02:52.042204+00:00",
  },
  {
    id: "9bac736c-4cac-49a5-893e-5f145a39861f",
    title: "Call With Ar Shagun's Team | For Floor Plan & 3D Design Service",
    description: "Detailed session with Ar Shagun's design team covering functional zoning, measurements, and 3D space planning requirements.",
    category: "CONSULTATION CALL",
    image_url: null,
    amount: 999,
    currency: "₹",
    payment_link: null,
    display_order: 4,
    is_active: true,
    created_at: "2026-10-04T14:02:52.042204+00:00",
    updated_at: "2026-10-04T14:02:52.042204+00:00",
  },
];

async function getServices(): Promise<Service[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("Failed to fetch services:", error);
      return FALLBACK_SERVICES;
    }

    return data;
  } catch (err) {
    console.error("Error in getServices:", err);
    return FALLBACK_SERVICES;
  }
}

const CATEGORY_ORDER = [
  "CONSULTATION CALL",
  "Concept Design",
  "3D Design",
];

function groupByCategory(services: Service[]) {
  const groups: Record<string, Service[]> = {};
  for (const service of services) {
    const cat = service.category || "CONSULTATION CALL";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(service);
  }

  // Ensure items within every category are strictly sorted by display_order ascending
  Object.keys(groups).forEach((cat) => {
    groups[cat].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  });

  // Sort category groups by defined order
  const sortedEntries = Object.entries(groups).sort(([catA], [catB]) => {
    const indexA = CATEGORY_ORDER.findIndex(
      (c) => c.toLowerCase() === catA.toLowerCase()
    );
    const indexB = CATEGORY_ORDER.findIndex(
      (c) => c.toLowerCase() === catB.toLowerCase()
    );
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });

  return Object.fromEntries(sortedEntries);
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
              {items.map((service, index) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  staggerOffset={index * 600}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
