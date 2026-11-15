import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { hashPassword, verifyPassword, signSession, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { User } from "@/modules/users/user.model";
import { Buyer } from "@/modules/organizations/organization.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { DEMO_ACCOUNTS } from "@/data/demo-accounts";
import { slugifyText } from "@/lib/utils";

async function ensureDemoAccounts() {
  for (const acc of DEMO_ACCOUNTS) {
    let user = await User.findOne({ email: acc.email });
    if (!user) {
      user = await User.create({
        email: acc.email,
        passwordHash: await hashPassword(acc.password),
        name: acc.name,
        roles: [...acc.roles],
        preferredLanguage: "en",
        emailVerified: true,
        status: "active",
      });
    } else {
      user.passwordHash = await hashPassword(acc.password);
      user.roles = [...acc.roles];
      user.status = "active";
      await user.save();
    }

    if (acc.roles.includes("vendor_owner") && !user.vendorId) {
      const vendor = await Vendor.create({
        ownerUserId: user._id,
        legalName: { en: "Demo Industries", ar: "صناعات تجريبية" },
        tradeName: "Demo Industries",
        email: acc.email,
        verificationStatus: "verified",
        status: "verified",
        slug: { en: "demo-industries", ar: "demo-industries" },
        location: { country: "SA", city: "Riyadh" },
        companyType: "manufacturer",
        description: {
          en: "Temporary demo vendor for local sign-in testing.",
          ar: "مورد تجريبي مؤقت لتسجيل الدخول المحلي.",
        },
      });
      user.vendorId = vendor._id;
      await user.save();
    }

    if (acc.roles.includes("buyer")) {
      const existingBuyer = await Buyer.findOne({ userId: user._id });
      if (!existingBuyer) {
        await Buyer.create({ userId: user._id, type: "procurement", company: "Demo Buyer Co", city: "Riyadh" });
      }
    }
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  mobile: z.string().optional(),
  preferredLanguage: z.enum(["en", "ar"]).default("en"),
  // Public sign-up is buyer or supplier only. Staff accounts are created by staff.
  accountType: z.enum(["buyer", "vendor"]).default("buyer"),
  companyName: z.string().trim().max(120).optional(),
  city: z.string().trim().max(60).optional(),
  sells: z.string().trim().max(160).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || body.action;

    await connectDB();

    if (action === "register") {
      const data = registerSchema.parse(body);
      const existing = await User.findOne({ email: data.email.toLowerCase() });
      if (existing) return fail("Email already registered", 409);

      const roles = data.accountType === "vendor" ? ["vendor_owner"] : ["buyer"];
      if (data.accountType === "vendor" && !data.companyName) return fail("Company name is required", 400);

      const user = await User.create({
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
        name: data.name,
        mobile: data.mobile || "",
        preferredLanguage: data.preferredLanguage,
        roles,
      });

      if (data.accountType === "buyer") {
        await Buyer.create({ userId: user._id, type: "company" });
      }
      if (data.accountType === "vendor") {
        const company = data.companyName || data.name;
        const isArName = /[\u0600-\u06FF]/.test(company);
        const vendor = await Vendor.create({
          ownerUserId: user._id,
          legalName: isArName ? { en: "", ar: company } : { en: company, ar: "" },
          tradeName: company,
          email: data.email,
          phone: data.mobile,
          status: "draft",
          ...(data.city ? { location: { country: "SA", city: data.city } } : {}),
          ...(data.sells ? { description: { en: isArName ? "" : `We supply ${data.sells}.`, ar: isArName ? `نورّد ${data.sells}.` : "" } } : {}),
          slug: { en: `${slugifyText(company) || "supplier"}-${user._id.toString().slice(-5)}`, ar: "" },
        });
        user.vendorId = vendor._id;
        await user.save();
      }

      const sessionUser = {
        id: String(user._id),
        email: user.email,
        roles: Array.from(user.roles || []),
        vendorId: user.vendorId ? String(user.vendorId) : undefined,
        preferredLanguage: user.preferredLanguage,
      };
      const token = await signSession(sessionUser);
      await setSessionCookie(token);
      return ok({ user: sessionUser }, "Registered", 201);
    }

    if (action === "login") {
      const email = String(body.email || "").toLowerCase();
      const password = String(body.password || "");
      if (DEMO_ACCOUNTS.some((a) => a.email === email)) {
        await ensureDemoAccounts();
      }
      const user = await User.findOne({ email });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return fail("Invalid credentials", 401);
      }
      if (user.status !== "active") return fail("Account is not active", 403);
      const sessionUser = {
        id: String(user._id),
        email: user.email,
        roles: Array.from(user.roles || []),
        vendorId: user.vendorId ? String(user.vendorId) : undefined,
        organizationId: user.organizationId ? String(user.organizationId) : undefined,
        preferredLanguage: user.preferredLanguage,
      };
      const token = await signSession(sessionUser);
      await setSessionCookie(token);
      return ok({ user: sessionUser }, "Logged in");
    }

    if (action === "logout") {
      await clearSessionCookie();
      return ok(null, "Logged out");
    }

    if (action === "me") {
      const session = await getSession();
      if (!session) return fail("Unauthorized", 401);
      const user = await User.findById(session.id).select("-passwordHash -resetToken -resetTokenExpires").lean();
      const vendorSlug = await resolveVendorSlug(session.vendorId);
      return ok({ session, user, vendorSlug });
    }

    if (action === "update_profile") {
      const session = await getSession();
      if (!session) return fail("Unauthorized", 401);
      const input = z
        .object({
          name: z.string().trim().max(80).optional(),
          mobile: z.string().trim().regex(/^\+?[0-9 ]{7,16}$/).or(z.literal("")).optional(),
          preferredLanguage: z.enum(["en", "ar"]).optional(),
        })
        .parse(body);
      await User.updateOne({ _id: session.id }, { $set: input });
      return ok(null, "Saved");
    }

    if (action === "change_password") {
      const session = await getSession();
      if (!session) return fail("Unauthorized", 401);
      const input = z.object({ current: z.string().min(1).max(200), next: z.string().min(8).max(200) }).parse(body);
      const user = await User.findById(session.id).select("passwordHash");
      if (!user || !(await verifyPassword(input.current, user.passwordHash))) return fail("Current password is wrong", 400);
      user.passwordHash = await hashPassword(input.next);
      await user.save();
      return ok(null, "Password changed");
    }

    return fail("Unknown action", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.name === "ZodError") return fail("Validation error", 422, String(e));
    return fail(err.message || "Auth error", err.status || 500);
  }
}

async function resolveVendorSlug(vendorId?: string) {
  if (!vendorId) return undefined;
  const vendor = await Vendor.findById(vendorId).select("slug").lean();
  const slug = (vendor as { slug?: { en?: string } | string } | null)?.slug;
  if (!slug) return undefined;
  return typeof slug === "string" ? slug : slug.en;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("Unauthorized", 401);
    await connectDB();
    const user = await User.findById(session.id).select("-passwordHash -resetToken -resetTokenExpires").lean();
    const vendorSlug = await resolveVendorSlug(session.vendorId);
    return ok({ session, user, vendorSlug });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
