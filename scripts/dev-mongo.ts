import { MongoMemoryServer } from "mongodb-memory-server";
import { writeFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27018, dbName: "kingdom-trade" },
  });
  const uri = mongod.getUri("kingdom-trade");
  const out = resolve(process.cwd(), ".mongo-dev-uri");
  writeFileSync(out, uri, "utf8");
  console.log(`[dev-mongo] Running at ${uri}`);
  console.log(`[dev-mongo] URI written to ${out}`);
  console.log("[dev-mongo] Keep this process open while developing.");

  const shutdown = async () => {
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Keep alive
  await new Promise(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
