const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const matches = content.match(/text-[a-z0-9-]+/g);
const counts = {};
if (matches) {
  matches.forEach(m => counts[m] = (counts[m] || 0) + 1);
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  console.log(sorted.slice(0, 30));
}
