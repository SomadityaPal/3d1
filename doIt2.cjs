const fs = require('fs');

const filePaths = ['/src/App.jsx', '/app/applet/src/App.jsx', 'src/App.jsx'];
let p;
for (const check of filePaths) {
  if (fs.existsSync(check)) {
    p = check;
    break;
  }
}

if (!p) {
  console.log("Could not find App.jsx");
  process.exit(1);
}

let code = fs.readFileSync(p, 'utf8');

// The user wants to increase the brightness of the text. There is an issue with text readability.
// text-neutral-500 -> text-neutral-400
// text-neutral-400 -> text-neutral-300
// text-neutral-300 -> text-neutral-200
// text-neutral-200 -> text-neutral-100
// text-neutral-100 -> text-white

code = code.replace(/text-neutral-500/g, 'text-neutral-400');
code = code.replace(/text-neutral-400/g, 'text-neutral-300');
code = code.replace(/text-neutral-300/g, 'text-neutral-200');
code = code.replace(/text-neutral-200/g, 'text-neutral-100');
code = code.replace(/text-neutral-100/g, 'text-white');
// text-gold-500 -> text-gold-400
// text-gold-400 -> text-gold-300
// text-gold-300 -> text-gold-200
// text-gold-200 -> text-gold-100
code = code.replace(/text-gold-500/g, 'text-gold-400');
code = code.replace(/text-gold-400/g, 'text-gold-300');
code = code.replace(/text-gold-300/g, 'text-gold-200');
code = code.replace(/text-gold-200/g, 'text-gold-100');
code = code.replace(/text-gold-100/g, 'text-gold-50');

fs.writeFileSync(p, code);
console.log('App.jsx color brightened.');
