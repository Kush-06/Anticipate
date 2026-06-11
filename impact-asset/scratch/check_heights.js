import fs from 'fs';
import { execSync } from 'child_process';

const scriptContent = `
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      const cols = document.querySelectorAll('.col');
      const results = [];
      cols.forEach((col, idx) => {
        const childrenInfo = Array.from(col.children).map(child => ({
          tag: child.tagName,
          id: child.id,
          class: child.className,
          text: child.innerText ? child.innerText.substring(0, 30) + '...' : '',
          offsetTop: child.offsetTop,
          offsetHeight: child.offsetHeight,
          scrollHeight: child.scrollHeight
        }));
        
        results.push({
          column: idx + 1,
          clientWidth: col.clientWidth,
          offsetWidth: col.offsetWidth,
          clientHeight: col.clientHeight,
          scrollHeight: col.scrollHeight,
          offsetHeight: col.offsetHeight,
          children: childrenInfo
        });
      });
      
      const debugInfo = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        results: results
      };
      
      const div = document.createElement('div');
      div.id = 'height-results';
      div.innerText = JSON.stringify(debugInfo);
      document.body.appendChild(div);
    }, 500);
  });
</script>
`;

const html = fs.readFileSync('impact_asset.html', 'utf8');
const injectedHtml = html.replace('</body>', scriptContent + '</body>');

fs.writeFileSync('temp_measure.html', injectedHtml);

try {
  execSync('"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --window-size=1200,900 --virtual-time-budget=2000 --dump-dom temp_measure.html > temp_dom.html');
  const dom = fs.readFileSync('temp_dom.html', 'utf8');
  const startTag = '<div id="height-results">';
  const endTag = '</div>';
  const startIdx = dom.indexOf(startTag);
  if (startIdx !== -1) {
    const endIdx = dom.indexOf(endTag, startIdx);
    const content = dom.substring(startIdx + startTag.length, endIdx);
    console.log('MEASURED HEIGHT BOUNDS:', content);
  } else {
    console.log('Could not find measurement results in DOM.');
  }
} catch (err) {
  console.error('Error running Chrome:', err);
} finally {
  try { fs.unlinkSync('temp_measure.html'); } catch (e) {}
  try { fs.unlinkSync('temp_dom.html'); } catch (e) {}
}
