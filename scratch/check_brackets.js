const fs = require('fs');
const content = fs.readFileSync('src/screens/AdminDashboardScreen.js', 'utf8');

function check(charOpen, charClose) {
  let count = 0;
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (let char of lines[i]) {
      if (char === charOpen) count++;
      if (char === charClose) count--;
    }
    if (count < 0) {
      console.log(`Bracket imbalance at line ${i+1}: too many ${charClose}`);
      return;
    }
  }
  if (count > 0) {
    console.log(`Bracket imbalance: ${count} unclosed ${charOpen}`);
  } else {
    console.log(`Brackets ${charOpen}${charClose} are balanced.`);
  }
}

check('{', '}');
check('[', ']');
check('(', ')');
check('<', '>');
