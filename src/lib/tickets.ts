export type SupportTicket = {
  id: string;
  _id?: string;
  topic: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  urgency: "High" | "Medium" | "Low";
  createdAt: string;
  requester: string;
  category: string;
  body: string;
};

async function parse(res: Response) {
  const j = await res.json();
  if (!j.success) throw new Error(j.message || "Ticket request failed");
  return j.data;
}

export async function listTickets(): Promise<SupportTicket[]> {
  const res = await fetch("/api/tickets", { cache: "no-store" });
  const data = await parse(res);
  return Array.isArray(data) ? data : [];
}

export async function createTicket(
  input: Omit<SupportTicket, "id" | "createdAt" | "status" | "_id"> & { roleScope?: string }
): Promise<SupportTicket> {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse(res);
}

export async function updateTicketStatus(
  id: string,
  status: SupportTicket["status"]
): Promise<SupportTicket[]> {
  const res = await fetch("/api/tickets", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  await parse(res);
  return listTickets();
}
