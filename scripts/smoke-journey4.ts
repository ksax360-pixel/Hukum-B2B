import { connectDB } from "../src/lib/db";
import { Quotation, RFQ, RFQVendor } from "../src/modules/rfqs/rfq.model";
import {
  buildJourney4Reminders,
  processJourney4Automations,
} from "../src/modules/rfqs/quotation-reminders";
import { Vendor } from "../src/modules/vendors/vendor.model";
import { formatQuoteDates, canSendReminderNow } from "../src/lib/saudi-schedule";

async function main() {
  await connectDB();

  const vendor = await Vendor.findOne({}).select("_id ownerUserId tradeName").lean();
  const rfq = await RFQ.findOne({}).select("_id buyerId title status").lean();
  const quote = await Quotation.findOne({})
    .select("_id status validity vendorId rfqId vatIncluded")
    .lean();

  console.log(
    "sample",
    JSON.stringify(
      {
        vendor: vendor
          ? { id: String(vendor._id), owner: String(vendor.ownerUserId) }
          : null,
        rfq: rfq
          ? { id: String(rfq._id), buyer: String(rfq.buyerId), status: rfq.status }
          : null,
        quote: quote
          ? {
              id: String(quote._id),
              status: quote.status,
              vat: quote.vatIncluded,
              dates: formatQuoteDates(quote.validity, "en"),
            }
          : null,
        schedule: canSendReminderNow(),
      },
      null,
      2
    )
  );

  if (vendor?.ownerUserId) {
    const sellerRem = await buildJourney4Reminders({
      userId: String(vendor.ownerUserId),
      vendorId: String(vendor._id),
      locale: "en",
    });
    console.log(
      "sellerReminders",
      sellerRem.length,
      sellerRem.slice(0, 5).map((r) => ({
        type: r.type,
        title: r.title,
        smart: r.meta?.smartAction,
      }))
    );
  }

  if (rfq?.buyerId) {
    const buyerRem = await buildJourney4Reminders({
      userId: String(rfq.buyerId),
      locale: "en",
    });
    console.log(
      "buyerReminders",
      buyerRem.length,
      buyerRem.slice(0, 5).map((r) => ({
        type: r.type,
        title: r.title,
        smart: r.meta?.smartAction,
      }))
    );
  }

  const auto = await processJourney4Automations();
  console.log("automations", JSON.stringify(auto));

  const statusCounts = await RFQVendor.aggregate([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const quoteStatus = await Quotation.aggregate([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  console.log("inviteStatuses", JSON.stringify(statusCounts));
  console.log("quoteStatuses", JSON.stringify(quoteStatus));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
