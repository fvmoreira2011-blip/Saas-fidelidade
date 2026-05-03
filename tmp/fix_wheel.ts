
import * as fs from 'fs';

const filename = 'src/App.tsx';
let content = fs.readFileSync(filename, 'utf8');

const wheel_search = `                                 transition={wheelSpinning ? { 
                                    duration: 1.5, 
                                    repeat: Infinity, 
                                    ease: "linear" 
                                  } : { 
                                    duration: 6, 
                                    ease: [0.15, 0, 0, 1] 
                                  }}`;

const wheel_replace = `                                 transition={{ 
                                    duration: wheelSpinning ? 12 : 6, 
                                    ease: [0.15, 0, 0, 1] 
                                  }}`;

const multiples_search = `                            <div className="flex gap-4"><input type="number" value={config.minPurchaseForWheel || ''} onChange={e => setConfig({...config, minPurchaseForWheel: parseFloat(e.target.value)})} className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold" /><div className="flex items-center gap-2 bg-orange-50 px-3 rounded-xl"><input type="checkbox" id="wCum" checked={config.isSpinCumulative} onChange={e => setConfig({...config, isSpinCumulative: e.target.checked})} className="accent-orange-500"/><label htmlFor="wCum" className="text-[10px] font-bold text-orange-700 uppercase">Múltiplos</label></div></div>`;

const multiples_replace = `                            <div className="flex gap-4">
                               <input type="number" placeholder="Valor Mínimo" value={config.minPurchaseForWheel || ''} onChange={e => setConfig({...config, minPurchaseForWheel: parseFloat(e.target.value)})} className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold" />
                            </div>`;

if (content.includes(wheel_search)) {
    content = content.replace(wheel_search, wheel_replace);
    console.log("Replaced wheel animation");
} else {
    console.log("Wheel search not found");
}

if (content.includes(multiples_search)) {
    content = content.replace(multiples_search, multiples_replace);
    console.log("Replaced multiples checkbox");
} else {
    console.log("Multiples search not found");
}

fs.writeFileSync(filename, content);
