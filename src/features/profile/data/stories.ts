export interface StoryHighlight {
  id: string;
  title: string;
  image: string;
  tagline: string;
  category: string;
  description: string;
  features: string[];
  serviceLink?: string;
  actionText?: string;
}

export const STORY_HIGHLIGHTS: StoryHighlight[] = [
  {
    id: "floor-plan",
    title: "Floor Plan",
    image: "/images/stories/floor-plan.jpg",
    tagline: "Vastu & Space Planning",
    category: "Architectural Planning",
    description:
      "Strategic 2D architectural layouts and furniture circulation planning tailored to your exact plot dimensions, daily family routines, and natural light orientations.",
    features: [
      "Vastu-compliant functional zoning",
      "Maximizing natural cross-ventilation & light",
      "Ergonomic furniture circulation flow",
      "Dimensioned structural drafting & column grid",
    ],
    serviceLink: "/#services",
    actionText: "Book Floor Plan Call",
  },
  {
    id: "3d-interior",
    title: "3D Interior Design",
    image: "/images/stories/3d-interior.jpg",
    tagline: "Photorealistic 3D Renders",
    category: "Interior Architecture",
    description:
      "High-definition 3D visualizations for living rooms, master bedrooms, modular kitchens, and washrooms with exact material specifications, textures, and mood lighting.",
    features: [
      "Photorealistic 8K render visualization",
      "Curated color schemes & wall paneling",
      "False ceiling & ambient lighting layouts",
      "Modular wardrobe & joinery detailing",
    ],
    serviceLink: "/#services",
    actionText: "Book 3D Design Call",
  },
  {
    id: "elevations",
    title: "Elevations",
    image: "/images/stories/elevations.jpg",
    tagline: "Contemporary Villa Facades",
    category: "Exterior Architecture",
    description:
      "Modern exterior elevation design featuring geometric cantilevers, wooden louvers, stone cladding, and warm architectural facade uplighting.",
    features: [
      "Modern luxury facade styling & proportions",
      "Material selection (Stone, Wood, Glass, Metal)",
      "Balcony, terrace & parapet architectural details",
      "Day & twilight exterior visualization",
    ],
    serviceLink: "/#services",
    actionText: "Consult on Elevation",
  },
  {
    id: "plumbing-design",
    title: "Plumbing Design",
    image: "/images/stories/plumbing.jpg",
    tagline: "Sanitary & MEP Engineering",
    category: "Engineering Schematics",
    description:
      "Concealed leakage-proof plumbing layouts, pressure-balanced water supply routing, and gravity drainage schematics for modern luxury bathrooms.",
    features: [
      "Concealed pipe routing & slope alignment",
      "Pressure-balanced hot/cold water supply",
      "Drainage trap & vent pipe engineering",
      "Sanitary fixture placement & rough-in coordinates",
    ],
    serviceLink: "/#services",
    actionText: "Consult on Plumbing",
  },
  {
    id: "electrical-design",
    title: "Electrical Design",
    image: "/images/stories/electrical.jpg",
    tagline: "Lighting & Circuit Schematics",
    category: "Electrical Layouts",
    description:
      "Comprehensive Reflected Ceiling Plans (RCP), mood lighting circuits, magnetic track layouts, and smart home automation switchboard positioning.",
    features: [
      "Reflected Ceiling Plan (RCP) drafting",
      "Mood, task & ambient lighting circuit loops",
      "Heavy load distribution & MCB phase balancing",
      "Smart switchboard & two-way socket positions",
    ],
    serviceLink: "/#services",
    actionText: "Consult on Electrical",
  },
  {
    id: "estimates",
    title: "Estimates",
    image: "/images/stories/estimates.jpg",
    tagline: "Accurate Budget Forecasting",
    category: "Financial Planning",
    description:
      "Realistic market-rate cost estimations so you know exactly how much your renovation or new build will cost before laying a single brick.",
    features: [
      "Material & labor market rate breakdown",
      "Phase-wise cashflow & expense scheduling",
      "Vendor quotation cross-verification",
      "Prevents 20-40% unexpected budget blowouts",
    ],
    serviceLink: "/#services",
    actionText: "Get Budget Estimates",
  },
  {
    id: "boq",
    title: "BOQ",
    image: "/images/stories/boq.jpg",
    tagline: "Bill of Quantities & Materials",
    category: "Cost & Specifications",
    description:
      "Itemized Bill of Quantities covering every bag of cement, square foot of tile, hardware specs, and paint finish to prevent contractor overbilling.",
    features: [
      "Itemized material quantity schedules",
      "Clear brand & grade technical specifications",
      "Contractor vetting & billing shield",
      "Ready-to-use bidding document for vendors",
    ],
    serviceLink: "/#services",
    actionText: "Get BOQ Consultation",
  },
];
