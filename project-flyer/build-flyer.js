import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const homeScreenPath = path.join(__dirname, 'homescreen.jpeg');
const learnScreenPath = path.join(__dirname, 'learnpage.jpeg');
const communityScreenPath = path.join(__dirname, 'community.jpeg');
const storeBadgesPath = path.join(__dirname, 'store_badges.png');
const outputPath = path.join(__dirname, 'project_flyer.html');

console.log('Converting screenshots and badges to Base64...');
const homeScreenBase64 = fs.readFileSync(homeScreenPath).toString('base64');
const learnScreenBase64 = fs.readFileSync(learnScreenPath).toString('base64');
const communityScreenBase64 = fs.readFileSync(communityScreenPath).toString('base64');
const storeBadgesBase64 = fs.readFileSync(storeBadgesPath).toString('base64');

console.log('Generating self-contained project flyer HTML...');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anticipate - Flyer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
  
  <!-- CDNs for A4 exporting/printing -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
    :root {
      --p-bg: #fffdf8; /* Same cream card color as the impact asset */
      --p-bg-2: #fbf5e9;
      --p-card: #ffffff; /* Card panels */
      --p-ink: #1c1a24;
      --p-ink-secondary: #5f5848;
      --p-ink-tertiary: #918970;
      --p-coral: #e9694a;
      --p-mint: #5fab84;
      --p-gold: #efb13c;
      --p-line: #e6dbc4;
      --font-display: 'Bricolage Grotesque', sans-serif;
      --font-body: 'Instrument Sans', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    body {
      background-color: #e2dbd0;
      font-family: var(--font-body);
      color: var(--p-ink);
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }

    #poster-wrapper {
      width: 100vw;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 20px 0;
    }

    /* Outer page container: Solid orange background, square corners */
    #poster-page {
      width: 792px;
      height: 1120px; /* Exact A4 aspect ratio in pixels (792x1120) */
      box-sizing: border-box;
      padding: 18px; /* The orange border margin */
      position: relative;
      z-index: 1;
      display: flex;
      flex-shrink: 0;
      background-color: var(--p-coral);
      border-radius: 0 !important; /* Square outer corners */
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.18);
    }

    /* Inner canvas: Curved corners and cream background */
    #poster-inner-canvas {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 32px 36px;
      border-radius: 24px; /* Beautiful curved inner boundary */
      background-color: var(--p-bg);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* Distribute space evenly, removing bottom gap */
      overflow: hidden;
    }

    #poster-inner-canvas::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(rgba(233, 105, 74, 0.06) 1.5px, transparent 1.5px),
        radial-gradient(rgba(233, 105, 74, 0.06) 1.5px, transparent 1.5px);
      background-size: 24px 24px;
      background-position: 0 0, 12px 12px;
      z-index: 1;
      pointer-events: none;
    }

    /* Big Center Header */
    .brand-header-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      margin-top: 4px;
      margin-bottom: 4px;
      position: relative;
      flex-shrink: 0;
      z-index: 10;
    }

    .brand-logo-large {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .brand-logo-text {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 64px;
      letter-spacing: -0.04em;
      margin: 0;
      line-height: 1;
      color: var(--p-coral);
    }

    .brand-tagline-large {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--p-ink-secondary);
      text-transform: uppercase;
      letter-spacing: 0.18em;
      margin-top: 8px;
    }

    /* Grid Rows - Sized by contents */
    .poster-row {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 32px;
      align-items: center;
      height: 380px;
      position: relative;
      z-index: 10;
      box-sizing: border-box;
    }

    .poster-row-bottom {
      grid-template-columns: 0.95fr 1.05fr;
    }

    .poster-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      box-sizing: border-box;
      height: 100%;
      justify-content: center;
    }

    /* Cards/Panels */
    .card-panel {
      background-color: var(--p-card);
      border-radius: 20px;
      padding: 20px 22px;
      border: 1.5px solid var(--p-line);
      box-shadow: 0 8px 24px rgba(28, 26, 36, 0.03);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      position: relative;
    }

    /* Text elements - Scaled up for readability */
    .promo-headline {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 28px;
      line-height: 1.2;
      color: var(--p-ink);
      margin: 0 0 10px 0;
      letter-spacing: -0.02em;
    }

    .promo-body {
      font-size: 15px;
      line-height: 1.5;
      color: var(--p-ink-secondary);
      margin: 0;
    }

    /* Phone showcases - Act as sturdy constraints */
    .phones-showcase-top {
      position: relative;
      width: 100%;
      height: 350px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    }

    .phones-showcase-bottom {
      position: relative;
      width: 100%;
      height: 350px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    }

    /* Sleek Real iPhone Mockup matching reference image exactly */
    .phone-mock {
      width: 155px; /* Exact same screen width as impact asset */
      aspect-ratio: 1206 / 2622; /* Natural aspect ratio of screenshot */
      background: #1c1a24;
      border-radius: 26px;
      box-shadow: 0 12px 32px rgba(28, 26, 36, 0.22);
      border: 5.5px solid #1c1a24;
      overflow: hidden;
      box-sizing: content-box; /* Crucial to prevent warping/stretching */
      position: absolute;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .phone-mock:hover {
      z-index: 20 !important;
      transform: scale(1.04) translateY(-4px) !important;
      box-shadow: 0 22px 48px rgba(28, 26, 36, 0.3);
    }

    /* Dynamic Island Camera Cutout */
    .phone-mock::before {
      content: "";
      position: absolute;
      top: 5px;
      left: 50%;
      transform: translateX(-50%);
      width: 28px; /* Proportional dynamic island width for 155px mock */
      height: 8px;
      background: #000000;
      border-radius: 10px;
      z-index: 30;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      border-radius: 21px; /* Curve inner corners */
    }

    /* Phone positions top row - Left phone overlapping Right phone */
    .phone-top-1 {
      left: 12px;
      top: 15px;
      transform: rotate(-4deg);
      z-index: 5; /* In front */
    }

    .phone-top-2 {
      right: 12px;
      top: 0;
      transform: rotate(5deg);
      z-index: 2; /* Behind */
    }

    /* Phone position bottom row - Perfectly Straight as requested */
    .phone-bottom-single {
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 5;
    }

    .phone-label-text {
      font-family: var(--font-mono);
      font-size: 9px;
      color: var(--p-ink-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
    }

    /* Bullet List style */
    .ad-bullet-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 2px;
    }

    .ad-bullet-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      font-size: 15px;
      line-height: 1.45;
      color: var(--p-ink-secondary);
    }

    .ad-bullet-item strong {
      color: var(--p-ink);
    }

    .bullet-check {
      color: var(--p-mint);
      font-weight: bold;
      font-size: 16px;
      line-height: 1;
      margin-top: 1px;
    }

    /* Testimonial Quote Banner */
    .testimonial-card {
      border-left: 3px solid var(--p-coral);
      padding-left: 16px;
      position: relative;
    }

    .testimonial-quote {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 700;
      line-height: 1.35;
      font-style: italic;
      color: var(--p-ink);
      margin: 0 0 4px 0;
    }

    .testimonial-quote::before {
      content: "“";
      font-size: 32px;
      position: absolute;
      left: 2px;
      top: -12px;
      color: var(--p-coral);
      opacity: 0.25;
    }

    .testimonial-author {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      color: var(--p-ink-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Sage Sprout border vectors */
    .border-sprout {
      position: absolute;
      pointer-events: none;
      z-index: 100;
      width: 44px;
      height: 44px;
    }

    .sprout-top-left {
      top: -12px;
      left: 45px;
      transform: rotate(-25deg);
    }

    .sprout-mid-right {
      top: 520px;
      right: -12px;
      transform: rotate(90deg);
    }

    .sprout-bottom-left {
      bottom: 80px;
      left: -12px;
      transform: rotate(-90deg);
    }

    /* Interactive export strip */
    .export-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: var(--p-bg-2);
      border-top: 1.5px solid var(--p-line);
      padding: 8px 16px;
      margin-top: auto;
      border-radius: 0 0 2px 2px;
      flex-shrink: 0;
      box-sizing: border-box;
      position: relative;
      z-index: 20;
    }

    .btn-export {
      background-color: var(--p-coral);
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: 10px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      box-shadow: 0 3px 0 #b33d21;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.1s;
    }

    .btn-export:active {
      transform: translateY(2px);
      box-shadow: 0 1px 0 #b33d21;
    }

    .store-badge-img {
      height: 22px;
      display: block;
    }

    /* Print styling to format PDF dynamically */
    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      #poster-wrapper {
        width: 210mm !important;
        height: 297mm !important;
        overflow: hidden !important;
        display: block !important;
        background: none !important;
        padding: 0 !important;
      }
      #poster-page {
        width: 210mm !important;
        height: 297mm !important;
        box-shadow: none !important;
        border: none !important;
        background-color: var(--p-coral) !important;
        padding: 4.8mm !important; /* Scale orange border */
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        transform: none !important;
        box-sizing: border-box !important;
        border-radius: 0 !important;
      }
      #poster-inner-canvas {
        border-radius: 6.4mm !important; /* Curved canvas inner edge */
        background-color: var(--p-bg) !important;
        padding: 6.4mm 8.5mm !important;
      }
      .export-strip {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div id="poster-wrapper">
    <!-- Outer page: square orange borders -->
    <div id="poster-page">

      <!-- Sage Sprouts sticking out from the inner canvas edges onto the orange border -->
      <!-- Sprout 1: Top Left -->
      <svg class="border-sprout sprout-top-left" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 90 L50 30" stroke="#5fab84" stroke-width="12" stroke-linecap="round" />
        <ellipse cx="30" cy="20" rx="16" ry="26" fill="#5fab84" transform="rotate(-30 30 20)" />
        <ellipse cx="70" cy="20" rx="16" ry="26" fill="#5fab84" transform="rotate(30 70 20)" />
      </svg>
      <!-- Sprout 2: Middle Right -->
      <svg class="border-sprout sprout-mid-right" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 90 L50 30" stroke="#5fab84" stroke-width="12" stroke-linecap="round" />
        <ellipse cx="30" cy="20" rx="16" ry="26" fill="#5fab84" transform="rotate(-30 30 20)" />
        <ellipse cx="70" cy="20" rx="16" ry="26" fill="#5fab84" transform="rotate(30 70 20)" />
      </svg>
      <!-- Sprout 3: Bottom Left -->
      <svg class="border-sprout sprout-bottom-left" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 90 L50 30" stroke="#5fab84" stroke-width="12" stroke-linecap="round" />
        <ellipse cx="30" cy="20" rx="16" ry="26" fill="#5fab84" transform="rotate(-30 30 20)" />
        <ellipse cx="70" cy="20" rx="16" ry="26" fill="#5fab84" transform="rotate(30 70 20)" />
      </svg>
      
      <!-- Inner Canvas: Curved corners, cream background -->
      <div id="poster-inner-canvas">

        <!-- Big Center Header -->
        <div class="brand-header-center">
          <div class="brand-logo-large">
            <!-- Big Sage Icon inside logo -->
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(28,26,36,0.12));">
              <defs>
                <linearGradient id="sage-logo-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#FFE4D4" />
                  <stop offset="100%" stop-color="#FFD4B8" />
                </linearGradient>
              </defs>
              <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="6" stroke-linecap="round" />
              <ellipse cx="40" cy="14" rx="7" ry="11" fill="#5fab84" />
              <ellipse cx="60" cy="14" rx="7" ry="11" fill="#5fab84" />
              <circle cx="50" cy="62" r="32" fill="url(#sage-logo-grad)" stroke="#e9694a" stroke-width="4" />
              <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
              <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
              <ellipse cx="42" cy="56" rx="3" ry="5" fill="#1c1a24" />
              <ellipse cx="58" cy="56" rx="3" ry="5" fill="#1c1a24" />
              <circle cx="33" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
              <circle cx="67" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
              <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="4" stroke-linecap="round" fill="none" />
            </svg>
            <h1 class="brand-logo-text">anticipate.</h1>
          </div>
          <div class="brand-tagline-large">Your personalised financial guide</div>
        </div>

        <!-- Row 1 (Top Half): Text left inside cards, two screenshots right -->
        <div class="poster-row">
          
          <!-- Top Left Text in Card Panels -->
          <div class="poster-col">
            <div class="card-panel">
              <h2 class="promo-headline">Anxious about first payslips, renting, or pensions?</h2>
              <p class="promo-body">
                Transitioning to the adult world shouldn't mean guessing your tax codes or signing lease contracts in the dark. Anticipate builds a friendly timeline of your milestones, guiding you through them before they happen.
              </p>
            </div>

            <div class="card-panel" style="padding: 16px 20px;">
              <h3 class="promo-headline" style="font-size: 18px; color: var(--p-coral); margin-bottom: 6px;">Predictive Timeline Guide</h3>
              <p class="promo-body" style="font-size: 14px;">
                We know your rent dates, job starts, or money worries, preparing you with simple, jargon-free checklists days in advance.
              </p>
            </div>
          </div>

          <!-- Top Right Screens (Perfect aspect ratio iPhones - overlapping foreground left) -->
          <div class="poster-col">
            <div class="phones-showcase-top">
              <div class="phone-mock phone-top-1">
                <img src="data:image/jpeg;base64,${homeScreenBase64}" class="phone-screen" alt="Timeline">
              </div>
              <div class="phone-mock phone-top-2">
                <img src="data:image/jpeg;base64,${learnScreenBase64}" class="phone-screen" alt="Lessons">
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0 32px; margin-top: 10px; z-index: 15; position: relative;">
              <span class="phone-label-text">01 / Timeline</span>
              <span class="phone-label-text">02 / Lessons</span>
            </div>
          </div>

        </div>

        <!-- Row 2 (Bottom Half): One screenshot left, Text right inside cards -->
        <div class="poster-row poster-row-bottom">
          
          <!-- Bottom Left Screen (Perfect aspect ratio iPhone - straight) -->
          <div class="poster-col">
            <div class="phones-showcase-bottom">
              <div class="phone-mock phone-bottom-single">
                <img src="data:image/jpeg;base64,${communityScreenBase64}" class="phone-screen" alt="Forum">
              </div>
            </div>
            <div style="text-align: center; margin-top: 10px; z-index: 15; position: relative;">
              <span class="phone-label-text">03 / Anonymous Forums</span>
            </div>

            <!-- Card panel below phone to fill space and prevent emptiness -->
            <div class="card-panel" style="margin-top: 12px; padding: 14px 18px;">
              <h3 class="promo-headline" style="font-size: 17px; color: var(--p-coral); margin-bottom: 4px;">Anonymity First</h3>
              <p class="promo-body" style="font-size: 13.5px;">Ask the questions you are too embarrassed to raise. Share insights and connect with peers in a safe, moderated space.</p>
            </div>
          </div>

          <!-- Bottom Right Text inside card panels -->
          <div class="poster-col">
            <div class="card-panel">
              <h2 class="promo-headline">Decode the adulting fine print in 4 minutes.</h2>
              
              <div class="ad-bullet-list">
                <div class="ad-bullet-item">
                  <span class="bullet-check">✓</span>
                  <span><strong>Wage Walkthroughs:</strong> Sage flags emergency tax codes early, showing you how to claim refunds.</span>
                </div>
                <div class="ad-bullet-item">
                  <span class="bullet-check">✓</span>
                  <span><strong>Lease Decoders:</strong> Drag-and-drop rental contracts to instantly isolate hidden fees and deposit clauses.</span>
                </div>
                <div class="ad-bullet-item">
                  <span class="bullet-check">✓</span>
                  <span><strong>Anonymous Support:</strong> Ask peer community topics you are too embarrassed to raise in public.</span>
                </div>
              </div>
            </div>

            <div class="card-panel" style="padding: 16px 20px;">
              <!-- Testimonial Quote Banner -->
              <div class="testimonial-card">
                <p class="testimonial-quote">"Finally, a financial guide that doesn't make me feel stupid."</p>
                <span class="testimonial-author">— Sarah, 2nd Year Student</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer Action Strip -->
        <div class="export-strip">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="data:image/png;base64,${storeBadgesBase64}" class="store-badge-img" alt="Download badges">
            <span style="font-family: var(--font-mono); font-size: 8px; color: var(--p-ink-tertiary); max-width: 200px; line-height: 1.25;">
              Available on iOS & Android.<br>© 2026 Anticipate App. All rights reserved.
            </span>
          </div>
          <button class="btn-export" id="export-pdf-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Poster PDF
          </button>
        </div>

      </div>

    </div>
  </div>

  <script>
    // PDF Export feature
    document.getElementById('export-pdf-btn').addEventListener('click', () => {
      const element = document.getElementById('poster-page');
      const opt = {
        margin: 0,
        filename: 'anticipate_project_leaflet.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'px', format: [792, 1120], orientation: 'portrait' }
      };
      
      // Temporary hide the button during render to look clean
      const btn = document.getElementById('export-pdf-btn');
      btn.style.visibility = 'hidden';
      
      html2pdf().set(opt).from(element).save().then(() => {
        btn.style.visibility = 'visible';
      });
    });
  </script>

</body>
</html>
`;

fs.writeFileSync(outputPath, htmlContent);
console.log('Successfully generated A4 Portrait leaflet at project_flyer.html!');

// Now trigger Google Chrome headless export to PDF automatically!
const pdfOutputPath = path.join(__dirname, 'project_flyer.pdf');
console.log('Compiling PDF using headless Google Chrome...');
try {
  const chromePath = `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`;
  const cmd = `${chromePath} --headless --disable-gpu --print-to-pdf="${pdfOutputPath}" --no-margins "${outputPath}"`;
  execSync(cmd);
  console.log('Successfully generated A4 Portrait leaflet PDF at project_flyer.pdf!');
} catch (error) {
  console.error('Error generating PDF using Chrome:', error.message);
}
