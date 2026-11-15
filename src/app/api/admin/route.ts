import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { RFQ, Quotation } from "@/modules/rfqs/rfq.model";
import { User } from "@/modules/users/user.model";
import { AnalyticsEvent, AIExtraction, SearchHistory } from "@/modules/platform/platform.model";
import { AuditLog } from "@/modules/documents/document.model";

export async function GET(req: Request) {
  try {
    await requireSession("admin:view");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const resource = sp.get("resource") || "kpis";

    if (resource === "kpis") {
      const [
        totalVendors,
        verifiedVendors,
        pendingVendors,
        totalBuyers,
        totalProducts,
        publishedProducts,
        pendingProducts,
        totalRfqs,
        activeRfqs,
        quotations,
        searches,
        productViews,
        vendorViews,
        aiVolume,
        aiErrors,
      ] = await Promise.all([
        Vendor.countDocuments(),
        Vendor.countDocuments({ verificationStatus: "verified" }),
        Vendor.countDocuments({ verificationStatus: "pending" }),
        User.countDocuments({ roles: "buyer" }),
        Product.countDocuments(),
        Product.countDocuments({ status: "published" }),
        Product.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
        RFQ.countDocuments(),
        RFQ.countDocuments({ status: { $in: ["open", "matching", "quoted"] } }),
        Quotation.countDocuments(),
        SearchHistory.countDocuments(),
        AnalyticsEvent.countDocuments({ type: "product_view" }),
        AnalyticsEvent.countDocuments({ type: "vendor_view" }),
        AIExtraction.countDocuments(),
        AIExtraction.countDocuments({ status: "failed" }),
      ]);

      return ok({
        totalVendors,
        verifiedVendors,
        pendingVendors,
        totalBuyers,
        totalProducts,
        publishedProducts,
        pendingProducts,
        totalRfqs,
        activeRfqs,
        quotations,
        searches,
        productViews,
        vendorViews,
        registrations: await User.countDocuments(),
        aiProcessingVolume: aiVolume,
        aiErrors,
      });
    }

    if (resource === "audit") {
      const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
      return ok(logs);
    }

    if (resource === "analytics") {
      const byType = await AnalyticsEvent.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
      return ok({ byType });
    }

    if (resource === "contacts") {
      const types = [
        "vendor_contact_whatsapp",
        "vendor_contact_phone",
        "vendor_contact_email",
        "vendor_contact_location",
        "vendor_contact_directions",
        "vendor_send_inquiry",
        "vendor_request_quote",
        "contact_form_submitted",
        "product_contact_whatsapp",
        "product_contact_phone",
        "product_contact_email",
      ];
      const filter = sp.get("type");
      const q: Record<string, unknown> = filter
        ? { type: filter }
        : { type: { $regex: /contact|inquiry|quote|whatsapp|phone|email|directions/i } };
      const items = await AnalyticsEvent.find(q)
        .sort({ createdAt: -1 })
        .limit(Math.min(100, Number(sp.get("limit") || 50)))
        .populate("vendorId", "legalName tradeName")
        .populate("productId", "name sku")
        .lean();
      const byType = await AnalyticsEvent.aggregate([
        { $match: { type: { $in: types } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      return ok({ items, byType });
    }

    if (resource === "dashboard") {
      const [
        totalVendors,
        verifiedVendors,
        pendingVendors,
        publishedProducts,
        totalRfqs,
        totalBuyers,
        topVendors,
        topCategories,
        recentProducts,
        trafficSeries,
      ] = await Promise.all([
        Vendor.countDocuments(),
        Vendor.countDocuments({ verificationStatus: "verified" }),
        Vendor.countDocuments({ verificationStatus: "pending" }),
        Product.countDocuments({ status: "published" }),
        RFQ.countDocuments(),
        User.countDocuments({ roles: "buyer" }),
        Product.aggregate([
          { $match: { status: "published" } },
          { $group: { _id: "$vendorId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "vendors",
              localField: "_id",
              foreignField: "_id",
              as: "vendor",
            },
          },
          { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
        ]),
        Product.aggregate([
          { $match: { status: "published", categoryId: { $exists: true, $ne: null } } },
          { $group: { _id: "$categoryId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        ]),
        Product.find({ status: "published" })
          .sort({ createdAt: -1 })
          .limit(6)
          .select("name slug brand status createdAt")
          .lean(),
        AnalyticsEvent.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 7 * 86400000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const topCat = topCategories[0];
      const publishedTotal = Math.max(1, publishedProducts);
      const catShare = topCat ? Math.round((topCat.count / publishedTotal) * 100) : 0;
      const seriesMap = new Map(trafficSeries.map((d: { _id: string; count: number }) => [d._id, d.count]));
      const series: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        series.push(seriesMap.get(day) || 0);
      }

      return ok({
        kpis: {
          totalVendors,
          verifiedVendors,
          pendingVendors,
          publishedProducts,
          totalRfqs,
          totalBuyers,
        },
        gauge: {
          label: topCat?.category?.name?.en || topCat?.category?.name?.ar || "No category yet",
          percent: catShare,
        },
        ranking: topVendors.map((v: { vendor?: { legalName?: { en?: string; ar?: string }; tradeName?: string }; count: number }) => ({
          name: v.vendor?.legalName?.en || v.vendor?.legalName?.ar || v.vendor?.tradeName || "Vendor",
          value: String(v.count),
          meta: "SKUs",
        })),
        activitySeries: series,
        pipeline: [
          { label: "Pending", value: pendingVendors },
          { label: "Verified", value: verifiedVendors },
          { label: "Published", value: publishedProducts },
          { label: "RFQs", value: totalRfqs },
        ],
        recent: recentProducts.map((p: { _id: unknown; name?: { en?: string; ar?: string }; brand?: string }) => ({
          title: p.name?.en || p.name?.ar || "Product",
          meta: p.brand || "Listing",
          href: `/admin/products`,
          id: String(p._id),
        })),
      });
    }

    return fail("Unknown resource", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
