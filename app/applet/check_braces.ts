
import * as fs from 'fs';

const content = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');
const lines = content.split('\n');

let openBraces = 0;
let inPromotionAreaTab = false;
let startLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function PromotionAreaTab')) {
    inPromotionAreaTab = true;
    startLine = i + 1;
  }
  
  if (inPromotionAreaTab) {
    const chars = lines[i].split('');
    for (const char of chars) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
    }
    
    if (openBraces === 0 && startLine !== -1) {
      console.log(`PromotionAreaTab ends at line ${i + 1}`);
      inPromotionAreaTab = false;
      startLine = -1;
    }
  }
}
