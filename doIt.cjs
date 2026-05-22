const fs = require('fs');

const p = 'src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

// Replace standard glass styles with premium frosted glass
code = code.replace(/bg-white\/5 backdrop-blur-[A-Za-z0-9]+/g, 'bg-white/[0.02] backdrop-blur-3xl');
code = code.replace(/bg-white\/10 backdrop-blur-[A-Za-z0-9]+/g, 'bg-white/[0.04] backdrop-blur-3xl');
code = code.replace(/bg-white\/20 backdrop-blur-[A-Za-z0-9]+/g, 'bg-white/[0.06] backdrop-blur-3xl');
code = code.replace(/bg-white\/10/g, 'bg-white/[0.04]');
code = code.replace(/bg-white\/5/g, 'bg-white/[0.02]');
// Add inset shadows
code = code.replace(/shadow-\[0_8px_32px_rgba\(0,0,0,0\.2\)\]/g, 'shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]');
code = code.replace(/shadow-\[0_8px_32px_rgba\(0,0,0,0\.3\)\]/g, 'shadow-[0_12px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]');
code = code.replace(/shadow-\[0_12px_40px_rgba\(251,191,36,0\.15\)\]/g, 'shadow-[0_12px_40px_rgba(251,191,36,0.15)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]');
code = code.replace(/shadow-\[inset_0_2px_4px_rgba\(0,0,0,0\.2\)\]/g, 'shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] shadow-[inset_0_0_1px_rgba(255,255,255,0.1)]');
code = code.replace(/shadow-\[0_4px_16px_rgba\(0,0,0,0\.2\)\]/g, 'shadow-[0_8px_24px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]');
code = code.replace(/shadow-\[0_-8px_32px_rgba\(0,0,0,0\.3\)\]/g, 'shadow-[0_-8px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]');

// Handle minimum heights for ScrambleText wrappers
code = code.replace(/<h2 className="text-3xl md:text-5xl font-serif font-light tracking-tight text-neutral-100 leading-tight">/g, '<h2 className="text-3xl md:text-5xl font-serif font-light tracking-tight text-neutral-100 leading-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">');
code = code.replace(/<h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight text-neutral-100 leading-tight">/g, '<h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight text-neutral-100 leading-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">');
code = code.replace(/<h2 className="text-3xl md:text-5xl font-serif font-light tracking-tight">/g, '<h2 className="text-3xl md:text-5xl font-serif font-light tracking-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">');
code = code.replace(/<h2 className="text-3xl md:text-5xl font-serif font-light text-neutral-100 tracking-tight">/g, '<h2 className="text-3xl md:text-5xl font-serif font-light text-neutral-100 tracking-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">');
code = code.replace(/<h2 className="text-lg md:text-2xl font-serif text-neutral-300 italic">/g, '<h2 className="text-lg md:text-2xl font-serif text-neutral-300 italic min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">');
code = code.replace(/<h2 className="text-2xl md:text-4xl font-serif italic text-gold-100 leading-relaxed font-light">/g, '<h2 className="text-2xl md:text-4xl font-serif italic text-gold-100 leading-relaxed font-light min-h-[4.5em] md:min-h-[2em] flex items-center justify-center text-center">');

// Make borders more subtle but sharp
code = code.replace(/border-white\/10/g, 'border-white/[0.08]');
code = code.replace(/border border-white\/20/g, 'border border-white/[0.12]');

fs.writeFileSync(p, code);
console.log('App.jsx glassmorphism processed.');
