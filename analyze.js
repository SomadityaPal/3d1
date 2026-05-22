const fs = require('fs');
const content = fs.readFileSync('/src/App.jsx', 'utf8');
const matches = content.match(/text-[a-zA-Z0-9/\-\[\]\.]+/g) || [];
const counts = {};
matches.forEach(c => counts[c] = (counts[c] || 0) + 1);
const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
sorted.forEach(c => console.log(`${counts[c]}: ${c}`));
