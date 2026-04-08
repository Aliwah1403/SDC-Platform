const fs = require("fs");
const path = require("path");
const imgDir = path.join(__dirname, "../assets/images");

const files = ["Rectangle.svg", "Rectangle-1.svg", "Rectangle-2.svg"];
const out = ["badge-a.png", "badge-b.png", "badge-c.png"];

files.forEach((name, i) => {
  const svg = fs.readFileSync(path.join(imgDir, name), "utf8");
  const match = svg.match(/(?:xlink:href|href)="data:image\/png;base64,([^"]+)"/);
  if (match) {
    fs.writeFileSync(path.join(imgDir, out[i]), Buffer.from(match[1], "base64"));
    console.log(`✓ ${out[i]}`);
  } else {
    console.error(`✗ No PNG data found in ${name}`);
  }
});
