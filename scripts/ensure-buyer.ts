import { connectDB } from "../src/lib/db";
import { User } from "../src/modules/users/user.model";
import { hashPassword } from "../src/lib/auth";

async function main() {
  await connectDB();
  let user = await User.findOne({ email: "buyer@kingdomtrade.demo" });
  if (!user) {
    user = await User.create({
      email: "buyer@kingdomtrade.demo",
      passwordHash: await hashPassword("Buyer123!"),
      name: { en: "Demo Buyer", ar: "مشتري تجريبي" },
      roles: ["buyer"],
      preferredLanguage: "en",
      status: "active",
    });
    console.log("created buyer", String(user._id));
  } else {
    user.passwordHash = await hashPassword("Buyer123!");
    user.roles = Array.from(new Set([...(user.roles || []), "buyer"]));
    user.status = "active";
    await user.save();
    console.log("updated buyer", String(user._id));
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
