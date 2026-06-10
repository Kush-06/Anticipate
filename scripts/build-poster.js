import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const homeScreenPath = path.join(projectRoot, 'home_screen.png');
const learnScreenPath = path.join(projectRoot, 'learn_screen.png');
const storeBadgesPath = path.join(projectRoot, 'store_badges.png');
const outputPath = path.join(projectRoot, 'impact_asset.html');

console.log('Converting home screen to Base64...');
const homeScreenBase64 = fs.readFileSync(homeScreenPath).toString('base64');

console.log('Converting learn screen to Base64...');
const learnScreenBase64 = fs.readFileSync(learnScreenPath).toString('base64');

console.log('Converting store badges to Base64...');
const storeBadgesBase64 = fs.readFileSync(storeBadgesPath).toString('base64');

console.log('Generating self-contained HTML...');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anticipate - Impact Poster</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
  
  <!-- CDNs for export libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
    :root {
      --p-bg: #f3eadb; /* Match app background color precisely */
      --p-bg-2: #fbf5e9;
      --p-card: #fffdf8; /* Match app card color */
      --p-card-accent: #fbf5e9;
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
      size: A4 landscape;
      margin: 0;
    }

    body {
      background-color: #e2dbd0;
      font-family: var(--font-body);
      color: var(--p-ink);
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }

    /* Poster Container (Vibrant Orange Background themed from the app) */
    #poster-page {
      width: 1120px;
      height: 770px;
      background-color: var(--p-coral);
      background-image: 
        radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
        radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px);
      background-size: 28px 28px;
      background-position: 0 0, 14px 14px;
      box-sizing: border-box;
      padding: 40px 45px;
      position: relative;
      display: grid;
      grid-template-columns: 1.15fr 1.35fr 1.15fr;
      gap: 35px;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.18);
    }

    /* Columns layout transformed to rounded cards overlaying the orange background */
    .col {
      background-color: var(--p-card);
      border-radius: 24px;
      padding: 24px 22px;
      box-shadow: 0 10px 35px rgba(28, 26, 36, 0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      box-sizing: border-box;
      z-index: 5;
      position: relative;
    }

    /* Column headers */
    .col-header {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--p-coral);
      letter-spacing: 0.15em;
      margin-bottom: 12px;
      border-bottom: 2px solid var(--p-ink);
      padding-bottom: 6px;
    }

    /* Top Logo section */
    .brand-section {
      text-align: center;
      margin-bottom: 5px;
    }

    .brand-logo {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 34px;
      letter-spacing: -0.04em;
      margin: 0;
    }

    .brand-tagline {
      font-family: var(--font-mono);
      font-size: 9px;
      color: var(--p-coral);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: -2px;
    }

    /* Double phone presentation styling */
    .phones-wrapper {
      position: relative;
      width: 280px;
      height: 380px;
      margin: 10px auto;
      transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .phones-wrapper:hover {
      transform: scale(1.03) translateY(-3px);
    }

    .phone-mockup-new {
      width: 175px;
      height: auto;
      display: block;
      filter: drop-shadow(0 12px 24px rgba(28,26,36,0.22));
      position: absolute;
    }

    /* Tilted background phone (Learn screen) */
    .phone-back {
      left: 100px;
      top: 5px;
      transform: rotate(8deg) scale(0.96);
      z-index: 1;
      opacity: 0.95;
    }

    /* Straight foreground phone (Home timeline screen) */
    .phone-front {
      left: 10px;
      top: 25px;
      z-index: 2;
    }

    /* Typography */
    h2 {
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
      line-height: 1.15;
      margin: 0 0 10px 0;
      letter-spacing: -0.02em;
    }

    .col-desc {
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--p-ink-secondary);
      margin: 0 0 15px 0;
    }

    /* Stats Grid */
    .stats-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 5px;
    }

    .stat-box {
      background: #fffdfb;
      border: 1.5px solid var(--p-line);
      border-radius: 14px;
      padding: 12px 14px;
      text-align: center;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .stat-box:hover {
      transform: translateY(-2px);
      border-color: var(--p-coral);
    }

    .stat-number {
      font-family: var(--font-display);
      font-size: 32px;
      font-weight: 700;
      color: var(--p-coral);
      margin-bottom: 2px;
    }

    .stat-label {
      font-size: 10.5px;
      line-height: 1.35;
      color: var(--p-ink-secondary);
      font-weight: 500;
    }

    /* Feature items */
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .feature-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .feature-content {
      flex: 1;
    }

    .feature-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--p-ink);
      margin-bottom: 2px;
    }

    .feature-desc {
      font-size: 11px;
      line-height: 1.4;
      color: var(--p-ink-secondary);
    }

    /* Testimonials block */
    .quote-box {
      border-top: 1px solid var(--p-line);
      padding-top: 12px;
      margin-top: 15px;
    }

    .quote-text {
      font-family: var(--font-display);
      font-size: 13px;
      line-height: 1.45;
      font-style: italic;
      color: var(--p-ink);
      margin: 0 0 4px 0;
    }

    .quote-author {
      font-size: 10px;
      font-weight: 700;
      color: var(--p-ink-tertiary);
    }

    /* Center column action area with App Store & Google Play buttons */
    .action-info {
      background: var(--p-card-accent);
      border: 1.5px solid var(--p-line);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 15px 12px;
      text-align: center;
      box-sizing: border-box;
    }

    .store-badge-clip-new {
      border-radius: 5px;
      overflow: hidden;
      position: relative;
      display: inline-block;
      box-shadow: 0 2px 5px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .store-badge-clip-new:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.22);
    }

    .store-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }

    .store-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
      text-align: left;
    }

    .store-text-small {
      font-size: 7.5px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.8;
      font-family: var(--font-body);
    }

    .store-text-large {
      font-size: 12.5px;
      font-weight: 700;
      font-family: var(--font-body);
    }

    /* Peeking Sage sticker styles */
    .peeking-sage {
      position: absolute;
      z-index: 2; /* Positioned behind the cards but in front of background */
      pointer-events: none;
      filter: drop-shadow(0 5px 12px rgba(28,26,36,0.22));
    }

    .sage-top-left {
      top: 10px;
      left: 110px;
      transform: rotate(-14deg);
    }

    .sage-top-right {
      top: 10px;
      right: 110px;
      transform: rotate(14deg);
    }

    /* Floating / Fixed Controls */
    .download-controls {
      position: fixed;
      bottom: 25px;
      right: 25px;
      display: flex;
      gap: 12px;
      z-index: 1000;
    }

    .btn-download {
      color: #fff;
      border: none;
      padding: 12px 20px;
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 13.5px;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(28,26,36,0.15);
      transition: transform 0.2s, background-color 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-png {
      background-color: var(--p-mint);
      box-shadow: 0 4px 15px rgba(79,168,126,0.25);
    }

    .btn-png:hover {
      background-color: #3b8e66;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79,168,126,0.35);
    }

    .btn-pdf {
      background-color: var(--p-ink);
      box-shadow: 0 4px 15px rgba(28,26,36,0.25);
    }

    .btn-pdf:hover {
      background-color: #312e3e;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(28,26,36,0.35);
    }

    /* Loading Spinner Animation */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }

    /* Printing styles */
    @media print {
      html, body {
        width: 297mm;
        height: 210mm;
        margin: 0;
        padding: 0;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      #poster-page {
        width: 297mm !important;
        height: 210mm !important;
        box-shadow: none !important;
        border: none !important;
        padding: 40px 45px !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        transform: none !important;
        box-sizing: border-box !important;
      }
      .download-controls {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Controls overlay -->
  <div class="download-controls">
    <button class="btn-download btn-png" onclick="generatePNG()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Download High-Res PNG
    </button>
    
    <button class="btn-download btn-pdf" onclick="generatePDF()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      Download PDF
    </button>
  </div>

  <!-- Poster Element -->
  <div id="poster-page">
    
    <!-- Peeking Sage Stickers -->
    <!-- Sage 1: Peeking out top-left of column 1 -->
    <div class="peeking-sage sage-top-left">
      <svg width="76" height="76" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sage-grad-pk1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFE4D4" />
            <stop offset="100%" stop-color="#FFD4B8" />
          </linearGradient>
        </defs>
        <g>
          <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
          <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
          <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
          <circle cx="50" cy="62" r="30" fill="url(#sage-grad-pk1)" stroke="#e9694a" stroke-width="3.5" />
          <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
          <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
          <circle cx="33" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
          <circle cx="67" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
          <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
        </g>
      </svg>
    </div>

    <!-- Sage 2: Peeking out top-right of column 3 -->
    <div class="peeking-sage sage-top-right">
      <svg width="76" height="76" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sage-grad-pk2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFE4D4" />
            <stop offset="100%" stop-color="#FFD4B8" />
          </linearGradient>
        </defs>
        <g>
          <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
          <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
          <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
          <circle cx="50" cy="62" r="30" fill="url(#sage-grad-pk2)" stroke="#e9694a" stroke-width="3.5" />
          <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
          <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
          <circle cx="33" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
          <circle cx="67" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
          <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
        </g>
      </svg>
    </div>

    <!-- Left Column: The Crisis -->
    <div class="col">
      <div>
        <div class="col-header">01 / The Transition Crisis</div>
        <h2>A deficit in school leaves graduates vulnerable.</h2>
        <p class="col-desc">
          Young adults enter the workforce unequipped for financial independence. Without school guidance, they face immense psychological strain and vulnerability to costly mistakes.
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-number">61%</div>
          <div class="stat-label">Do not recall receiving any finance lessons at school.</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">70%</div>
          <div class="stat-label">Avoid looking at bills due to money anxiety.</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">33%</div>
          <div class="stat-label">Have taken time off work due to money worries.</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">28%</div>
          <div class="stat-label">Of staff under 35 query HR about payslips monthly.</div>
        </div>
      </div>

      <!-- Testimonials -->
      <div class="quote-box">
        <p class="quote-text">
          "I opened my first NHS payslip and felt absolute dread. The deductions were completely confusing. I just closed it and ignored it."
        </p>
        <span class="quote-author">~ Jamie, 22, Early-career Nurse</span>
      </div>
    </div>

    <!-- Center Column: The Product -->
    <div class="col" style="justify-content: flex-start; gap: 0px; height: 100%;">
      <div class="brand-section" style="margin-bottom: 12px; width: 100%; display: flex; flex-direction: column; align-items: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 4px;">
          <!-- Sage Avatar (Enlarged and positioned close to the logo) -->
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
            <defs>
              <linearGradient id="sage-grad-logo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#FFE4D4" />
                <stop offset="100%" stop-color="#FFD4B8" />
              </linearGradient>
            </defs>
            <g>
              <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
              <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
              <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
              <circle cx="50" cy="62" r="30" fill="url(#sage-grad-logo)" stroke="#e9694a" stroke-width="3.5" />
              <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
              <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
              <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
              <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
              <circle cx="33" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
              <circle cx="67" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
              <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
            </g>
          </svg>
          <div class="brand-logo" style="line-height: 1; margin: 0;">anticipate.</div>
        </div>
        <div class="brand-tagline" style="margin-left: 18px; text-align: center;">YOUR PERSONALISED FINANCIAL GUIDE</div>
      </div>

      <!-- Overlapping Smartphone Mockups (Image 2 style) -->
      <div class="phones-wrapper">
        <img src="data:image/png;base64,${learnScreenBase64}" class="phone-mockup-new phone-back" alt="Learn Screen">
        <img id="home-screen-img" src="data:image/png;base64,${homeScreenBase64}" class="phone-mockup-new phone-front" alt="Home Screen">
      </div>

      <!-- Testimonials Quote Box (Moved here, between phone and download) -->
      <div class="quote-box" style="margin: 12px 0 16px 0; padding: 12px 0; border-top: 1px solid var(--p-line); border-bottom: 1px solid var(--p-line); box-sizing: border-box; width: 100%;">
        <p class="quote-text" style="text-align: center; font-size: 12.5px; margin-bottom: 0;">
          "Sage tells you what is coming and what to do about it, days before the paycheck actually lands."
        </p>
      </div>

      <!-- Action area with App Store & Google Play download badges (Moved all the way to the bottom) -->
      <div class="action-info" style="padding: 12px 14px; gap: 8px; margin-top: auto; width: 100%;">
        <div style="font-family: var(--font-display); font-weight: 800; font-size: 13.5px; color: var(--p-ink); margin-bottom: 2px; letter-spacing: -0.01em;">
          Download anticipate today!
        </div>
        <div style="display: flex; gap: 12px; justify-content: center; width: 100%;">
          <!-- Google Play Crop -->
          <a href="#" class="store-badge-clip-new" style="width: 105px; height: 30px; border-radius: 5px; overflow: hidden; position: relative; display: inline-block;" onclick="event.preventDefault()">
            <img src="data:image/png;base64,${storeBadgesBase64}" style="position: absolute; width: 245px; height: auto; left: -9.5px; top: -42px; display: block;">
          </a>
          <!-- App Store Crop -->
          <a href="#" class="store-badge-clip-new" style="width: 102px; height: 30px; border-radius: 5px; overflow: hidden; position: relative; display: inline-block;" onclick="event.preventDefault()">
            <img src="data:image/png;base64,${storeBadgesBase64}" style="position: absolute; width: 245px; height: auto; left: -133.5px; top: -42px; display: block;">
          </a>
        </div>
      </div>
    </div>

    <!-- Right Column: Features & Impact -->
    <div class="col">
      <div>
        <div class="col-header">03 / What the app can do</div>
        <h2>Timeline-based proactive support.</h2>
      </div>

      <!-- Features list -->
      <div class="feature-list">
        <div class="feature-item">
          <!-- Sage bullet icon -->
          <div class="feature-icon">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sage-grad-ft1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#FFE4D4" />
                  <stop offset="100%" stop-color="#FFD4B8" />
                </linearGradient>
              </defs>
              <g>
                <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
                <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
                <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
                <circle cx="50" cy="62" r="30" fill="url(#sage-grad-ft1)" stroke="#e9694a" stroke-width="3.5" />
                <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
              </g>
            </svg>
          </div>
          <div class="feature-content">
            <div class="feature-title">Proactive Onboarding Timeline</div>
            <div class="feature-desc">Alerts you to payslip schedules, tax shifts, and auto-enrolment deadlines 3 days before they happen.</div>
          </div>
        </div>

        <div class="feature-item">
          <!-- Sage bullet icon -->
          <div class="feature-icon">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sage-grad-ft2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#FFE4D4" />
                  <stop offset="100%" stop-color="#FFD4B8" />
                </linearGradient>
              </defs>
              <g>
                <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
                <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
                <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
                <circle cx="50" cy="62" r="30" fill="url(#sage-grad-ft2)" stroke="#e9694a" stroke-width="3.5" />
                <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
              </g>
            </svg>
          </div>
          <div class="feature-content">
            <div class="feature-title">Document Decoder</div>
            <div class="feature-desc">Photograph contracts, HMRC letters, or pension opt-out papers and instantly translate them to plain English.</div>
          </div>
        </div>

        <div class="feature-item">
          <!-- Sage bullet icon -->
          <div class="feature-icon">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sage-grad-ft3" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#FFE4D4" />
                  <stop offset="100%" stop-color="#FFD4B8" />
                </linearGradient>
              </defs>
              <g>
                <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
                <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
                <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
                <circle cx="50" cy="62" r="30" fill="url(#sage-grad-ft3)" stroke="#e9694a" stroke-width="3.5" />
                <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
              </g>
            </svg>
          </div>
          <div class="feature-content">
            <div class="feature-title">Milestone Lessons</div>
            <div class="feature-desc">14 real-life career transitions covered in interactive, 4-minute visual lessons. No jargon.</div>
          </div>
        </div>

        <div class="feature-item">
          <!-- Sage bullet icon -->
          <div class="feature-icon">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sage-grad-ft4" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#FFE4D4" />
                  <stop offset="100%" stop-color="#FFD4B8" />
                </linearGradient>
              </defs>
              <g>
                <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
                <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
                <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
                <circle cx="50" cy="62" r="30" fill="url(#sage-grad-ft4)" stroke="#e9694a" stroke-width="3.5" />
                <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
              </g>
            </svg>
          </div>
          <div class="feature-content">
            <div class="feature-title">Anonymous Peer Community</div>
            <div class="feature-desc">A safe space to discuss pay queries, contract questions, and union details with coworkers.</div>
          </div>
        </div>
      </div>

      <!-- Testimonials -->
      <div class="quote-box">
        <p class="quote-text" style="font-size: 12px;">
          "Staff payslip inquiries dropped by 60% in the first two months. It is an operational necessity that saves HR hours of basic work."
        </p>
        <span class="quote-author">~ Sarah Jennings, HR Director</span>
      </div>
    </div>

  </div>

  <script>
    // Ensure image is completely decoded before exporting
    const imgEl = document.getElementById('home-screen-img');
    let isDecoded = false;
    imgEl.decode().then(() => {
      isDecoded = true;
    }).catch(err => console.error('Image decoding failed', err));

    async function generatePNG() {
      const element = document.getElementById('poster-page');
      const pngBtn = document.querySelector('.btn-png');
      const originalText = pngBtn.innerHTML;
      
      try {
        pngBtn.innerHTML = \`
          <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px;">
            <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" stroke-opacity="0.25" fill="none"></circle>
            <path d="M4 12a8 8 0 018-8" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"></path>
          </svg> Generating PNG...\`;
        pngBtn.disabled = true;
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const canvas = await html2canvas(element, {
          scale: 3, // 3x resolution for high-res print-ready image
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#e9694a'
        });
        
        const link = document.createElement('a');
        link.download = 'anticipate_impact_poster.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('PNG Generation Error:', err);
        alert('Could not generate PNG. Please open the HTML file in a modern browser like Chrome to download.');
      } finally {
        pngBtn.innerHTML = originalText;
        pngBtn.disabled = false;
      }
    }

    async function generatePDF() {
      const element = document.getElementById('poster-page');
      const pdfBtn = document.querySelector('.btn-pdf');
      const originalText = pdfBtn.innerHTML;
      
      try {
        pdfBtn.innerHTML = \`
          <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px;">
            <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2" stroke-opacity="0.25" fill="none"></circle>
            <path d="M4 12a8 8 0 018-8" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"></path>
          </svg> Generating PDF...\`;
        pdfBtn.disabled = true;
        
        await new Promise(resolve => setTimeout(resolve, 150));

        const opt = {
          margin:       0,
          filename:     'anticipate_impact_poster.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2.5, useCORS: true, allowTaint: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('Could not generate PDF. Please try downloading the PNG instead.');
      } finally {
        pdfBtn.innerHTML = originalText;
        pdfBtn.disabled = false;
      }
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(outputPath, htmlContent);
console.log('Successfully wrote self-contained impact_asset.html!');
