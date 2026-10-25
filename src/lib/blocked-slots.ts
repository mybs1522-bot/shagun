export function isAdminBlockedLead(lead: {
  id?: string | null;
  name?: string | null;
  phone?: string | null;
} | null | undefined): boolean {
  if (!lead) return false;
  const name = String(lead.name || "").toLowerCase().trim();
  const phoneDigits = String(lead.phone || "").replace(/\D/g, "");
  const idStr = String(lead.id || "");

  return (
    name.includes("blocked") ||
    phoneDigits === "0000000000" ||
    phoneDigits.endsWith("0000000000") ||
    idStr.startsWith("block_") ||
    idStr.startsWith("mem_block_")
  );
}
