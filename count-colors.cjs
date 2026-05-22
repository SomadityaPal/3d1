const fs = require('fs');

const p = 'src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

const matches = code.match(/text-[a-z0-9-]+(\/[0-9]+)?/g);
const counts = {};
if (matches) {
  matches.forEach(m => counts[m] = (counts[m] || 0) + 1);
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  console.log(sorted.slice(0, 50));
}
