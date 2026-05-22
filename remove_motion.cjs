const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Remove importing motion and AnimatePresence
code = code.replace(/import \{ motion, AnimatePresence \} from "motion\/react"\n?/, '');

// Replace <AnimatePresence (any props)> with nothing
code = code.replace(/<AnimatePresence[^>]*>\n?/g, '');
code = code.replace(/<\/AnimatePresence>\n?/g, '');

// Process <motion.div ...> and </motion.div>
// 1. replace </motion.div>
code = code.replace(/<\/motion\.div>/g, '</div>');

// 2. replace <motion.div with <div
code = code.replace(/<motion\.div/g, '<div');

// 3. remove motion props
code = code.replace(/\s+(initial|animate|exit|transition)=\{\{[^}]*\}\}/g, '');
code = code.replace(/\s+(initial|animate|exit|transition)=\{[^}]*\}/g, '');
code = code.replace(/\s+mode="[^"]*"/g, '');

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx processed successfully');
