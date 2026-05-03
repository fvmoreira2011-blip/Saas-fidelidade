
import * as fs from 'fs';

const filename = '/app/applet/src/App.tsx';
let content = fs.readFileSync(filename, 'utf8');

const multiples_replace = `<div className="flex gap-4">
                               <input type="number" placeholder="Valor Mínimo" value={config.minPurchaseForWheel || ''} onChange={e => setConfig({...config, minPurchaseForWheel: parseFloat(e.target.value)})} className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold" />
                            </div>`;

const animation_replace = `transition={{ 
                                   duration: wheelSpinning ? 12 : 6, 
                                   ease: [0.15, 0, 0, 1] 
                                }}`;

// Regex for multiples
const multiples_regex = /<div className="flex gap-4"><input type="number" value=\{config\.minPurchaseForWheel \|\| ''\}.*?Múltiplos<\/label><\/div><\/div>/;
if (multiples_regex.test(content)) {
    content = content.replace(multiples_regex, multiples_replace);
    console.log("Replaced multiples checkbox via regex");
} else {
    console.log("Multiples regex failed");
}

// Regex for animation
const animation_regex = /transition=\{wheelSpinning \? \{.*?duration: 1\.5,.*?repeat: Infinity,.*?ease: "linear".*?\} : \{.*?duration: 6,.*?ease: \[0\.15, 0, 0, 1\].*?\}\}/s;

if (animation_regex.test(content)) {
    content = content.replace(animation_regex, animation_replace);
    console.log("Replaced wheel animation via regex");
} else {
    console.log("Animation regex failed");
}

fs.writeFileSync(filename, content);
