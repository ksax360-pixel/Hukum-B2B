/**
 * ERP punchout (SAP / Oracle / Odoo) and Etimad public tender feed stubs.
 * Production wiring requires partner credentials and permitted data use.
 */

export type ErpConnector = {
  id: "sap" | "oracle" | "odoo";
  label: string;
  status: "stub" | "configured";
  punchout: boolean;
};

export function listErpConnectors(): ErpConnector[] {
  const configured = String(process.env.ERP_PUNCHOUT_SYSTEM || "").toLowerCase();
  return (["sap", "oracle", "odoo"] as const).map((id) => ({
    id,
    label: id === "sap" ? "SAP Ariba / punchout" : id === "oracle" ? "Oracle Procurement" : "Odoo Purchase",
    status: configured === id ? "configured" : "stub",
    punchout: true,
  }));
}

export function punchoutHandshakeStub(system: string, payload: Record<string, unknown>) {
  return {
    system,
    sessionId: `po-${Date.now()}`,
    returnUrl: "/buyer/rfqs",
    accepted: true,
    message: "Punchout handshake stub — connect ERP credentials for production.",
    echoed: {
      buyerCookie: payload.buyerCookie || null,
      cartCount: Array.isArray(payload.items) ? payload.items.length : 0,
    },
  };
}

export type EtimadTenderStub = {
  id: string;
  title: string;
  agency: string;
  closesAt: string;
  category: string;
  url: string;
};

/** Demo / permitted public-shaped feed — not live Etimad scraping. */
export function listEtimadFeedStub(): EtimadTenderStub[] {
  const closes = new Date();
  closes.setDate(closes.getDate() + 21);
  return [
    {
      id: "ETM-DEMO-1001",
      title: "Safety PPE framework agreement (demo)",
      agency: "Demo agency — Riyadh",
      closesAt: closes.toISOString(),
      category: "Personal protective equipment",
      url: "https://tenders.etimad.sa/",
    },
    {
      id: "ETM-DEMO-1002",
      title: "Office supplies annual contract (demo)",
      agency: "Demo agency — Jeddah",
      closesAt: closes.toISOString(),
      category: "Office & stationery",
      url: "https://tenders.etimad.sa/",
    },
  ];
}
