const fs = require("fs");
const path = require("path");

const baseApi =
  process.env.NEXT_PUBLIC_BASE_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

const publicDir = path.join(__dirname, "..", "public");
const configPath = path.join(publicDir, "config.json");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(configPath, JSON.stringify({ baseApi }, null, 2));

console.log("Wrote config.json with baseApi:", baseApi);
