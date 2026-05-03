
import sys

def replace_in_file(filename, search_text, replace_text):
    with open(filename, 'r') as f:
        content = f.read()
    
    if search_text in content:
        new_content = content.replace(search_text, replace_text)
        with open(filename, 'w') as f:
            f.write(new_content)
        print(f"Successfully replaced text in {filename}")
        return True
    else:
        print(f"Search text not found in {filename}")
        # Print a bit of the content to see what's wrong (first 100 chars after stripping whitespace)
        return False

# Wheel animation fix
wheel_search = """                                 transition={wheelSpinning ? { 
                                    duration: 1.5, 
                                    repeat: Infinity, 
                                    ease: "linear" 
                                  } : { 
                                    duration: 6, 
                                    ease: [0.15, 0, 0, 1] 
                                  }}"""

wheel_replace = """                                 transition={{ 
                                    duration: wheelSpinning ? 12 : 6, 
                                    ease: [0.15, 0, 0, 1] 
                                  }}"""

# Multiples checkbox fix
multiples_search = """                            <div className="flex gap-4"><input type="number" value={config.minPurchaseForWheel || ''} onChange={e => setConfig({...config, minPurchaseForWheel: parseFloat(e.target.value)})} className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold" /><div className="flex items-center gap-2 bg-orange-50 px-3 rounded-xl"><input type="checkbox" id="wCum" checked={config.isSpinCumulative} onChange={e => setConfig({...config, isSpinCumulative: e.target.checked})} className="accent-orange-500"/><label htmlFor="wCum" className="text-[10px] font-bold text-orange-700 uppercase">Múltiplos</label></div></div>"""

multiples_replace = """                            <div className="flex gap-4">
                               <input type="number" placeholder="Valor Mínimo" value={config.minPurchaseForWheel || ''} onChange={e => setConfig({...config, minPurchaseForWheel: parseFloat(e.target.value)})} className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold" />
                            </div>"""

success1 = replace_in_file('src/App.tsx', wheel_search, wheel_replace)
success2 = replace_in_file('src/App.tsx', multiples_search, multiples_replace)

if not success1 or not success2:
    sys.exit(1)
