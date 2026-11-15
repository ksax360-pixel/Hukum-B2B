// Local-only: separate in-memory Mongo for auditing the handoff without touching other projects' DBs.
import { MongoMemoryServer } from "mongodb-memory-server";
async function main(): Promise<void> {
  const m = await MongoMemoryServer.create({ instance: { port: 27019, dbName: "hukum-handoff" } });
  console.log(`[dev-mongo] ${m.getUri("hukum-handoff")}`);
  await new Promise(() => {});
}
void main();
