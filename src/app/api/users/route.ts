import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { User } from "@/modules/users/user.model";
import { AuditLog } from "@/modules/documents/document.model";
import { ROLES } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    await requireSession("users:view");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    const q: Record<string, unknown> = {};
    if (sp.get("status")) q.status = sp.get("status");
    if (sp.get("role")) q.roles = sp.get("role");
    if (sp.get("q")) {
      const term = sp.get("q")!;
      q.$or = [
        { email: new RegExp(term, "i") },
        { name: new RegExp(term, "i") },
        { mobile: new RegExp(term, "i") },
      ];
    }
    const limit = Math.min(100, Number(sp.get("limit") || 50));
    const items = await User.find(q)
      .select("-passwordHash -resetToken -resetTokenExpires")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return ok(items);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession("users:edit");
    await connectDB();
    const body = await req.json();
    const user = await User.findById(body.id);
    if (!user) return fail("Not found", 404);

    const prev = {
      status: user.status,
      roles: [...(user.roles || [])],
      emailVerified: user.emailVerified,
    };

    if (body.status && ["active", "inactive", "suspended"].includes(body.status)) {
      user.status = body.status;
    }
    if (Array.isArray(body.roles)) {
      const valid = body.roles.filter((r: string) => (ROLES as readonly string[]).includes(r));
      if (!valid.length) return fail("At least one valid role required", 400);
      // Prevent removing last super_admin from self
      if (String(user._id) === session.id && !valid.includes("super_admin") && !valid.includes("admin")) {
        return fail("Cannot remove your own admin access", 400);
      }
      user.roles = valid;
    }
    if (typeof body.emailVerified === "boolean") user.emailVerified = body.emailVerified;
    if (typeof body.name === "string") user.name = body.name;

    await user.save();
    await AuditLog.create({
      userId: session.id,
      action: "updated",
      entity: "User",
      entityId: String(user._id),
      previousValue: prev,
      newValue: { status: user.status, roles: user.roles, emailVerified: user.emailVerified },
    });

    const safe = user.toObject();
    delete (safe as { passwordHash?: string }).passwordHash;
    delete (safe as { resetToken?: string }).resetToken;
    return ok(safe);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
