// scripts/check-iolo.cjs
const fs = require("fs");
const path = require("path");

function check(pathParts) {
  const file = path.join(process.cwd(), ...pathParts);
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, "utf8");
    console.log(`✅ Found at: ${file}`);
    console.log("First 200 chars:\n", raw.slice(0, 200));
  } else {
    console.log(`❌ Not found at: ${file}`);
  }
}

check(["config", "merchants", "iolo.json"]);
check(["app", "config", "merchants", "iolo.json"]);
