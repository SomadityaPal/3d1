const fs = require('fs');

const p = 'src/components/LoadingScreen.jsx';
let code = fs.readFileSync(p, 'utf8');

// brighten texts
code = code.replace(/text-neutral-500/g, 'text-neutral-400');
code = code.replace(/text-neutral-400/g, 'text-neutral-300');
code = code.replace(/text-neutral-300/g, 'text-neutral-200');
code = code.replace(/text-neutral-200/g, 'text-neutral-100');
code = code.replace(/text-neutral-100/g, 'text-white');

code = code.replace(/text-gold-500/g, 'text-gold-400');
code = code.replace(/text-gold-400/g, 'text-gold-300');
code = code.replace(/text-gold-300/g, 'text-gold-200');
code = code.replace(/text-gold-200/g, 'text-gold-100');
code = code.replace(/text-gold-100/g, 'text-gold-50');

fs.writeFileSync(p, code);
console.log('LoadingScreen color brightened.');
