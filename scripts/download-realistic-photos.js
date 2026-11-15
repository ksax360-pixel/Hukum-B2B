const fs = require("fs");
const https = require("https");
const path = require("path");

const UA = "Mozilla/5.0 (compatible; KingdomTradeDemo/1.0)";

function fetchTo(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": UA, Accept: "image/*" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchTo(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`${res.statusCode} ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(dest)));
      file.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(25000, () => {
      req.destroy(new Error("timeout " + url));
    });
  });
}

function unsplash(id) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;
}

const products = {
  helmet: "photo-1504307651254-35680f356dfd",
  "helmet-2": "photo-1541888946425-d81bb19240f5",
  "helmet-3": "photo-1581094794329-adc7bb88aa38",
  cement: "photo-1503387762-592deb58ef4e",
  "cement-2": "photo-1486406149796-62312fbdb310",
  coffee: "photo-1447933601403-0c6688de566e",
  "coffee-2": "photo-1495474472287-4d71bcdd2085",
  medical: "photo-1576091160399-112ba8d25d1d",
  "medical-2": "photo-1584982751601-97dcc096659c",
  fabric: "photo-1523381210434-271e8be1f52b",
  "fabric-2": "photo-1558171813-4c088753af8f",
  cable: "photo-1473341304170-971dccb5ac1e",
  "cable-2": "photo-1544724569-5f546fd6f2b5",
  hvac: "photo-1581092160562-40aa08e78837",
  carton: "photo-1595079676339-1534801ad6cf",
  "carton-2": "photo-1605745341112-85968b19335b",
  drip: "photo-1625246333195-78d9c38ad449",
  "drip-2": "photo-1464226184884-fa280b87c399",
  coverall: "photo-1504309092620-4d0ec2a7a8c0",
  print: "photo-1562654501-a0ccc0fc38fb",
  stationery: "photo-1456735190827-d1262f71b8a1",
  toner: "photo-1612815154858-60aa4c59eaa6",
  pump: "photo-1565793298595-6a879b1d9492",
  solar: "photo-1509391366360-2e959784a276",
  service: "photo-1454165804606-c3d57bc86b40",
  "service-2": "photo-1521737604893-d14cc237f11d",
  default: "photo-1586528116311-ad8dd3fc3890",
};

const categories = {
  "safety-equipment": "photo-1504307651254-35680f356dfd",
  construction: "photo-1541888946425-d81bb19240f5",
  "building-materials": "photo-1503387762-592deb58ef4e",
  fmcg: "photo-1447933601403-0c6688de566e",
  "food-beverage": "photo-1495474472287-4d71bcdd2085",
  "medical-equipment": "photo-1576091160399-112ba8d25d1d",
  pharmaceuticals: "photo-1584305574647-0cc949a2b9b0",
  "lab-scientific": "photo-1582719471384-894fbb16e074",
  textiles: "photo-1523381210434-271e8be1f52b",
  apparel: "photo-1489987707025-afc232f7ea0f",
  "it-services": "photo-1518770660439-4636190af475",
  telecom: "photo-1544197150-b99a5804f08b",
  electrical: "photo-1473341304170-971dccb5ac1e",
  "industrial-machinery": "photo-1565793298595-6a879b1d9492",
  hvac: "photo-1581092160562-40aa08e78837",
  "oil-gas": "photo-1513828583688-c52646dbbd41",
  "renewable-energy": "photo-1509391366360-2e959784a276",
  automotive: "photo-1486262715619-67b85e0b08d3",
  packaging: "photo-1595079676339-1534801ad6cf",
  "printing-services": "photo-1562654501-a0ccc0fc38fb",
  stationery: "photo-1456735190827-d1262f71b8a1",
  "office-supplies": "photo-1497366216548-37526070297c",
  "furniture-fitout": "photo-1493663284031-b7e3aefcae8e",
  lighting: "photo-1513506003901-1e6a229e2d15",
  plumbing: "photo-1585704032915-c3400ca199e7",
  "tools-hardware": "photo-1504148455328-c376907d081c",
  agriculture: "photo-1625246333195-78d9c38ad449",
  logistics: "photo-1586528116311-ad8dd3fc3890",
  "facility-management": "photo-1486406149796-62312fbdb310",
  cleaning: "photo-1581578731548-c64695cc6952",
  chemicals: "photo-1532187863486-abf9dbad1b69",
  plastics: "photo-1611284446314-60a58ac0deb9",
  "security-systems": "photo-1557597774-9d46091ce0d1",
  hospitality: "photo-1566073771259-6a8506099945",
  beauty: "photo-1522335789203-aabd1fc54bc9",
  education: "photo-1503676260728-1c00da094a0b",
  "water-treatment": "photo-1581092918056-0c4c3acd3789",
  "waste-management": "photo-1532996122724-e3c354a0b15b",
  mining: "photo-1578662996442-48f60103fc96",
  "home-appliances": "photo-1556911220-bff31c812dba",
  "marketing-services": "photo-1460925895917-afdab827c52f",
  "company-formation": "photo-1454165804606-c3d57bc86b40",
  "legal-services": "photo-1589829545856-d10d557cf95f",
  "visa-services": "photo-1436491865332-7a61a109cc05",
  "accounting-finance": "photo-1554224155-6726b3ff858f",
  "hr-recruitment": "photo-1521737604893-d14cc237f11d",
  "translation-services": "photo-14565130808-af50476ee322",
  "professional-services": "photo-1522071820081-009f0129c71c",
  others: "photo-1586528116311-ad8dd3fc3890",
};

const vendors = {
  rss: "photo-1504307651254-35680f356dfd",
  najd: "photo-1503387762-592deb58ef4e",
  eastern: "photo-1581094794329-adc7bb88aa38",
  demo: "photo-1486406149796-62312fbdb310",
};

async function saveAll(map, dir, w = 1400) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [key, id] of Object.entries(map)) {
    const dest = path.join(dir, `${key}.jpg`);
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=78`;
    process.stdout.write(`${key} ... `);
    try {
      await fetchTo(url, dest);
      const size = fs.statSync(dest).size;
      if (size < 4000) throw new Error("too small " + size);
      console.log("ok", size);
    } catch (e) {
      console.log("FAIL", e.message);
    }
  }
}

(async () => {
  await saveAll(products, path.join("public", "products"), 1400);
  await saveAll(categories, path.join("public", "categories"), 800);
  await saveAll(vendors, path.join("public", "vendors"), 800);
  console.log("done");
})();
