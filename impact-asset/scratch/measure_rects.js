import fs from 'fs';
import { execSync } from 'child_process';

const measureScript = `
<script>
  window.addEventListener('load', () => {
    const col2 = document.querySelectorAll('.col')[1];
    const children = Array.from(col2.children);
    const rects = children.map((child, idx) => {
      const rect = child.getBoundingClientRect();
      
      // If it's the First Year Impact container, let's also measure its children
      let innerChildren = [];
      if (idx === 3) {
        innerChildren = Array.from(child.children).map(inner => {
          const innerRect = inner.getBoundingClientRect();
          return {
            tag: inner.tagName,
            class: inner.className,
            text: inner.innerText ? inner.innerText.substring(0, 30) + '...' : '',
            top: innerRect.top,
            bottom: innerRect.bottom,
            height: innerRect.height
          };
        });
      }
      
      return {
        tag: child.tagName,
        class: child.className,
        text: child.innerText ? child.innerText.substring(0, 30) + '...' : '',
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        innerChildren: innerChildren
      };
    });
    
    const debugInfo = {
      colTop: col2.getBoundingClientRect().top,
      colBottom: col2.getBoundingClientRect().bottom,
      colHeight: col2.getBoundingClientRect().height,
      rects: rects
    };
    
    const div = document.createElement('div');
    div.id = 'measure-results';
    div.innerText = JSON.stringify(debugInfo);
    document.body.appendChild(div);
  });
</script>
`;

const html = fs.readFileSync('impact_asset.html', 'utf8');
const injectedHtml = html.replace('</body>', measureScript + '</body>');
fs.writeFileSync('temp_measure.html', injectedHtml);

try {
  execSync('"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --window-size=1200,900 --dump-dom temp_measure.html > temp_dom.html');
  const dom = fs.readFileSync('temp_dom.html', 'utf8');
  const startTag = '<div id="measure-results">';
  const endTag = '</div>';
  const startIdx = dom.indexOf(startTag);
  if (startIdx !== -1) {
    const endIdx = dom.indexOf(endTag, startIdx);
    const content = dom.substring(startIdx + startTag.length, endIdx);
    console.log('RECTS:', JSON.stringify(JSON.parse(content), null, 2));
  } else {
    console.log('Could not find measure results in DOM.');
  }
} catch (err) {
  console.error('Error running Chrome:', err);
} finally {
  try { fs.unlinkSync('temp_measure.html'); } catch (e) {}
  try { fs.unlinkSync('temp_dom.html'); } catch (e) {}
}
