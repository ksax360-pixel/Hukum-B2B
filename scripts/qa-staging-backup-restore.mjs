/**
 * Staging-only Mongo backup → restore verification (Node / mongoose).
 * Copies collections from source DB into an isolated restore DB, compares counts.
 * Does NOT overwrite the source database.
 *
 * Usage:
 *   node scripts/qa-staging-backup-restore.mjs
 * Env:
 *   MONGODB_URI (default mongodb://127.0.0.1:27017/kingdom-trade)
 *   STAGING_RESTORE_DB (default kingdom-trade-restore-qa)
 */
import mongoose from "mongoose";

const SOURCE_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kingdom-trade";
const RESTORE_DB = process.env.STAGING_RESTORE_DB || "kingdom-trade-restore-qa";

function dbNameFromUri(uri) {
  const m = String(uri).match(/\/([^/?]+)(\?|$)/);
  return m?.[1] || "kingdom-trade";
}

async function main() {
  const sourceName = dbNameFromUri(SOURCE_URI);
  if (sourceName === RESTORE_DB) {
    throw new Error("STAGING_RESTORE_DB must differ from source database name");
  }

  console.log(`Source URI host/db: (secret redacted) / ${sourceName}`);
  console.log(`Restore DB: ${RESTORE_DB}`);
  console.log(`Started: ${new Date().toISOString()}`);

  await mongoose.connect(SOURCE_URI);
  const admin = mongoose.connection.db.admin();
  await admin.ping();

  const sourceDb = mongoose.connection.client.db(sourceName);
  const restoreDb = mongoose.connection.client.db(RESTORE_DB);

  // Wipe restore DB only (never source)
  await restoreDb.dropDatabase();
  console.log(`Dropped isolated DB ${RESTORE_DB}`);

  const collections = await sourceDb.listCollections().toArray();
  const report = [];

  for (const c of collections) {
    const name = c.name;
    if (name.startsWith("system.")) continue;
    // Ensure destination collection exists even when source is empty
    await restoreDb.createCollection(name).catch(() => undefined);
    const docs = await sourceDb.collection(name).find({}).toArray();
    if (docs.length) {
      await restoreDb.collection(name).insertMany(docs);
    }
    const indexes = await sourceDb.collection(name).indexes();
    for (const idx of indexes) {
      if (idx.name === "_id_") continue;
      const { key, name: idxName, v, ns, ...opts } = idx;
      try {
        await restoreDb.collection(name).createIndex(key, { ...opts, name: idxName });
      } catch (e) {
        console.warn(`Index skip ${name}.${idxName}: ${e.message}`);
      }
    }
    const srcCount = await sourceDb.collection(name).countDocuments();
    const dstCount = await restoreDb.collection(name).countDocuments();
    const srcIdx = (await sourceDb.collection(name).indexes()).length;
    const dstIdx = (await restoreDb.collection(name).indexes()).length;
    const ok = srcCount === dstCount;
    report.push({ name, srcCount, dstCount, srcIdx, dstIdx, ok });
    console.log(
      `${ok ? "PASS" : "FAIL"} ${name}: count ${srcCount}→${dstCount}, indexes ${srcIdx}→${dstIdx}`
    );
  }

  // App connectivity: open a second mongoose connection to restore DB
  const restoreUri = SOURCE_URI.replace(/\/[^/?]+(\?|$)/, `/${RESTORE_DB}$1`);
  const restoreConn = await mongoose.createConnection(restoreUri).asPromise();
  const ping = await restoreConn.db.admin().ping();
  console.log(`Restore DB app ping: ${ping?.ok === 1 ? "PASS" : "FAIL"}`);
  await restoreConn.close();

  const failed = report.filter((r) => !r.ok);
  console.log("\n=== BACKUP/RESTORE QA ===");
  console.log(`Collections copied: ${report.length}`);
  console.log(`Count mismatches: ${failed.length}`);
  console.log(
    "Note: This validates logical dump/restore via Mongo driver on an isolated DB."
  );
  console.log(
    "Docker mongodump/mongorestore scripts remain for VPS; prove those on staging host with Docker."
  );

  await mongoose.disconnect();
  if (failed.length || ping?.ok !== 1) process.exitCode = 1;
}

main().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});
