const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src", "app");

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === "page.tsx" && p.includes(`${path.sep}admin${path.sep}`)) acc.push(p);
  }
  return acc;
}

const importLine = 'import { ADMIN_NAV } from "@/lib/admin-nav";\n';
const files = walk(root);

for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  if (!s.includes("DashboardShell")) continue;
  if (s.includes("@/lib/admin-nav")) {
    // already using shared nav — ensure nav prop
    if (s.includes("nav={nav}")) {
      s = s.replace(/nav=\{nav\}/g, "nav={[...ADMIN_NAV]}");
      fs.writeFileSync(f, s);
      console.log("fixed prop", f);
    } else {
      console.log("skip", f);
    }
    continue;
  }
  const re = /const nav = \[[\s\S]*?\];\n*/;
  if (!re.test(s)) {
    console.log("no nav block", f);
    continue;
  }
  s = s.replace(re, "");
  if (/from "@\/components\/dashboard\/DashboardShell"/.test(s)) {
    s = s.replace(
      /import \{ DashboardShell[^}]*\} from "@\/components\/dashboard\/DashboardShell";\n/,
      (m) => m + importLine
    );
  } else if (/from '@\/components\/dashboard\/DashboardShell'/.test(s)) {
    s = s.replace(
      /import \{ DashboardShell[^}]*\} from '@\/components\/dashboard\/DashboardShell';\n/,
      (m) => m + importLine
    );
  } else {
    s = importLine + s;
  }
  s = s.replace(/nav=\{nav\}/g, "nav={[...ADMIN_NAV]}");
  fs.writeFileSync(f, s);
  console.log("updated", f);
}
