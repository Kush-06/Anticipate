import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const homeScreenPath = path.join(__dirname, 'home_screen.png');
const learnScreenPath = path.join(__dirname, 'learn_screen.png');
const storeBadgesPath = path.join(__dirname, 'store_badges.png');
const outputPath = path.join(__dirname, 'impact_asset.html');

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
      overflow: hidden;
    }

    #poster-wrapper {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-sizing: border-box;
    }

    #poster-page {
      width: 1120px;
      height: 792px;
      box-sizing: border-box;
      padding: 16px 20px 16px 20px;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      gap: 8px;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.18);
    }

    #poster-page::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--p-coral);
      background-image: 
        radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
        radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px);
      background-size: 28px 28px;
      background-position: 0 0, 14px 14px;
      z-index: -2;
      pointer-events: none;
    }

    .poster-header-strip {
      display: flex;
      justify-content: space-between;
      width: 100%;
      border-bottom: 1.5px solid rgba(255, 255, 255, 0.35);
      padding-bottom: 6px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      color: #fffdf8;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      box-sizing: border-box;
    }

    .columns-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr;
      gap: 20px;
      flex: 1;
      min-height: 0;
      box-sizing: border-box;
      position: relative;
      z-index: 10;
      transform: translate3d(0, 0, 0);
    }

    .col {
      background-color: var(--p-card);
      border-radius: 24px;
      padding: 12px 14px;
      box-shadow: 0 10px 35px rgba(28, 26, 36, 0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      box-sizing: border-box;
      z-index: 10;
      position: relative;
      transform: translate3d(0, 0, 0);
      overflow: hidden;
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
      width: 245px;
      height: 315px;
      margin: 4px auto;
      flex-shrink: 0;
      transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .phones-wrapper:hover {
      transform: scale(1.03) translateY(-3px);
    }

    .phone-mockup-new {
      width: 155px;
      height: auto;
      display: block;
      filter: drop-shadow(0 12px 24px rgba(28,26,36,0.22));
      position: absolute;
    }

    /* Tilted background phone (Learn screen) */
    .phone-back {
      left: 82px;
      top: 5px;
      transform: rotate(8deg) scale(0.96);
      z-index: 1;
      opacity: 0.95;
    }

    /* Straight foreground phone (Home timeline screen) */
    .phone-front {
      left: 5px;
      top: 20px;
      z-index: 2;
    }

    .phone-peeking-sage-new {
      position: absolute;
      width: 76px;
      height: 76px;
      left: -30px;
      top: -18px;
      z-index: 1.5;
      transform: rotate(-18deg);
      pointer-events: none;
      filter: drop-shadow(0 6px 12px rgba(28,26,36,0.18));
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
      font-family: var(--font-body);
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
      z-index: 1; /* Positioned behind the cards (.col has z-index: 10) */
      pointer-events: none;
    }

    .sage-top-left {
      top: -30px;
      left: 82px;
      transform: rotate(-14deg);
    }

    .sage-top-right {
      top: -30px;
      right: 200px;
      transform: rotate(14deg);
    }

    /* Floating / Fixed Controls */
    .download-controls {
      position: fixed;
      top: 18px;
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
    @page {
      size: 297mm 210mm landscape;
      margin: 0;
    }
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
      #poster-wrapper {
        width: 297mm !important;
        height: 210mm !important;
        overflow: hidden !important;
        display: block !important;
        background: none !important;
      }
      #poster-page {
        width: 297mm !important;
        height: 210mm !important;
        box-shadow: none !important;
        border: none !important;
        padding: 16px 20px 16px 20px !important;
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

  <div id="poster-wrapper">
    <!-- Poster Element -->
    <div id="poster-page">
    
    <!-- Poster Header Strip -->
    <div class="poster-header-strip">
      <span>Sterling</span>
      <span>September 2027</span>
    </div>
    
    <!-- Columns Grid -->
    <div class="columns-grid">

      <!-- Peeking Sage Stickers (Positioned inside columns-grid to stack behind cards) -->
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
    <div class="col" style="justify-content: flex-start; gap: 6px; height: 100%;">
      <!-- Opening quote -->
      <div style="font-family: var(--font-display); font-size: 11.5px; font-style: italic; color: var(--p-coral); text-align: center; border-bottom: 1.5px dashed var(--p-line); padding-bottom: 2px; line-height: 1.3; margin-bottom: 0px; flex-shrink: 0;">
        "She opened her first payslip, saw a number she didn't recognise, and quietly closed the app."
      </div>
      
      <div style="flex-shrink: 0;">
        <h2 style="font-size: 20px; margin-bottom: 2px; line-height: 1.1;">A generation entering the workforce financially blind.</h2>
        <p class="col-desc" style="font-size: 11px; line-height: 1.35; margin-bottom: 0;">
          Young adults are leaving education and entering the workforce with no understanding of the financial systems that govern their lives. The school system dedicates 48 minutes per month to financial education, 33 times less than maths. The consequences are immediate, measurable, and lasting.
        </p>
      </div>

      <!-- Combined Stats Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 2px; flex-shrink: 0;">
        <!-- 61% Stat Box -->
        <div class="stat-box" style="padding: 4px 6px; border-radius: 10px; display: flex; flex-direction: column; justify-content: center; gap: 1px; box-sizing: border-box;">
          <div class="stat-number" style="font-size: 24px; line-height: 1.0; margin-bottom: 0;">61%</div>
          <div class="stat-label" style="font-size: 9.5px; line-height: 1.2;">of young adults do not recall receiving any financial education in school</div>
        </div>
        <!-- 70% Stat Box -->
        <div class="stat-box" style="padding: 4px 6px; border-radius: 10px; display: flex; flex-direction: column; justify-content: center; gap: 1px; box-sizing: border-box;">
          <div class="stat-number" style="font-size: 24px; line-height: 1.0; margin-bottom: 0;">70%</div>
          <div class="stat-label" style="font-size: 9.5px; line-height: 1.2;">of UK adults aged 18 to 40 actively avoid looking at their bills due to anxiety</div>
        </div>
        <!-- 33% Stat Box -->
        <div class="stat-box" style="padding: 4px 6px; border-radius: 10px; display: flex; flex-direction: column; justify-content: center; gap: 1px; box-sizing: border-box;">
          <div class="stat-number" style="font-size: 24px; line-height: 1.0; margin-bottom: 0;">33%</div>
          <div class="stat-label" style="font-size: 9.5px; line-height: 1.2;">Have taken time off due to financial stress</div>
        </div>
        <!-- 28% Stat Box -->
        <div class="stat-box" style="padding: 4px 6px; border-radius: 10px; display: flex; flex-direction: column; justify-content: center; gap: 1px; box-sizing: border-box;">
          <div class="stat-number" style="font-size: 24px; line-height: 1.0; margin-bottom: 0;">28%</div>
          <div class="stat-label" style="font-size: 9.5px; line-height: 1.2;">Of under-35s query HR about payslips monthly</div>
        </div>
      </div>

      <!-- Authority Quote -->
      <div style="border-bottom: 1.5px dashed var(--p-line); padding-bottom: 2px; margin-bottom: 0px; margin-top: 0px; flex-shrink: 0;">
        <p style="font-family: var(--font-display); font-size: 12px; line-height: 1.3; font-style: italic; color: var(--p-ink); margin: 0 0 2px 0;">
          "Financial illiteracy is a quiet crisis holding back millions of people across the UK"
        </p>
        <span style="font-size: 9px; font-weight: 700; color: var(--p-ink-tertiary);">~ Bim Afolami, Former Economic Secretary to the Treasury</span>
      </div>

      <!-- What it does for you -->
      <div style="display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;">
        <div style="font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--p-coral); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
          How anticipate changes this
        </div>
        
        <div class="feature-list" style="gap: 4px;">
          <div class="feature-item">
            <!-- Sage bullet icon -->
            <div class="feature-icon" style="width: 18px; height: 18px; margin-top: 1px;">
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sage-grad-ft1-col1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFE4D4" />
                    <stop offset="100%" stop-color="#FFD4B8" />
                  </linearGradient>
                </defs>
                <g>
                  <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
                  <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
                  <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
                  <circle cx="50" cy="62" r="30" fill="url(#sage-grad-ft1-col1)" stroke="#e9694a" stroke-width="3.5" />
                  <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                  <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                  <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
                </g>
              </svg>
            </div>
            <div class="feature-content">
              <div class="feature-desc" style="font-size: 11px; line-height: 1.35; color: var(--p-ink-secondary);">
                <strong style="color: var(--p-ink);">A financial friend who knows your life.</strong> Sage is a personalised AI companion that builds a picture of your life from day one, your job, your worries, your upcoming milestones, and quietly prepares you for each one before it arrives. Not a chatbot. A guide that gets more useful the more your life changes.
              </div>
            </div>
          </div>

          <div class="feature-item">
            <!-- Sage bullet icon -->
            <div class="feature-icon" style="width: 18px; height: 18px; margin-top: 1px;">
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sage-grad-ft2-col1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFE4D4" />
                    <stop offset="100%" stop-color="#FFD4B8" />
                  </linearGradient>
                </defs>
                <g>
                  <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
                  <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
                  <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
                  <circle cx="50" cy="62" r="30" fill="url(#sage-grad-ft2-col1)" stroke="#e9694a" stroke-width="3.5" />
                  <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                  <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                  <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
                </g>
              </svg>
            </div>
            <div class="feature-content">
              <div class="feature-desc" style="font-size: 11px; line-height: 1.35; color: var(--p-ink-secondary);">
                <strong style="color: var(--p-ink);">You stop dreading the documents.</strong> Employment contracts, HMRC letters, pension opt-out forms decoded instantly into plain English at the exact moment they land in front of you.
              </div>
            </div>
          </div>

          <div class="feature-item">
            <!-- Sage bullet icon -->
            <div class="feature-icon" style="width: 18px; height: 18px; margin-top: 1px;">
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sage-grad-ft3-col1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFE4D4" />
                    <stop offset="100%" stop-color="#FFD4B8" />
                  </linearGradient>
                </defs>
                <g>
                  <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
                  <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
                  <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
                  <circle cx="50" cy="62" r="30" fill="url(#sage-grad-ft3-col1)" stroke="#e9694a" stroke-width="3.5" />
                  <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                  <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                  <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
                </g>
              </svg>
            </div>
            <div class="feature-content">
              <div class="feature-desc" style="font-size: 11px; line-height: 1.35; color: var(--p-ink-secondary);">
                <strong style="color: var(--p-ink);">You learn what you need, when you need it.</strong> A wide range of real-life financial milestones covered through short, jargon-free lessons timed to your life, not a generic curriculum.
              </div>
            </div>
          </div>

          <div class="feature-item">
            <!-- Sage bullet icon -->
            <div class="feature-icon" style="width: 18px; height: 18px; margin-top: 1px;">
              <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sage-grad-ft4-col1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFE4D4" />
                    <stop offset="100%" stop-color="#FFD4B8" />
                  </linearGradient>
                </defs>
                <g>
                  <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
                  <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
                  <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
                  <circle cx="50" cy="62" r="30" fill="url(#sage-grad-ft4-col1)" stroke="#e9694a" stroke-width="3.5" />
                  <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                  <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
                  <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
                </g>
              </svg>
            </div>
            <div class="feature-content">
              <div class="feature-desc" style="font-size: 11px; line-height: 1.35; color: var(--p-ink-secondary);">
                <strong style="color: var(--p-ink);">You are never the only one who doesn't know.</strong> An anonymous peer community where people ask the questions they are too embarrassed to raise with anyone else.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sources -->
      <div style="font-family: var(--font-mono); font-size: 8px; color: var(--p-ink-tertiary); line-height: 1.2; border-top: 1.5px solid var(--p-ink); padding-top: 4px; margin-top: auto; flex-shrink: 0;">
        Sources: MoneyReady Financial Education Report; OneFamily Money Anxiety Survey; PayFit / HR Review Payslip Study.
      </div>
    </div>

    <!-- Center Column: The Product -->
    <div class="col" style="justify-content: flex-start; gap: 6px; height: 100%;">
      <div class="brand-section" style="margin-bottom: 4px; width: 100%; display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
        <div class="brand-logo" style="line-height: 1; margin: 0 0 2px 0; text-align: center; font-size: 28px;">anticipate.</div>
        <div class="brand-tagline" style="text-align: center; font-size: 9px; letter-spacing: 0.08em;">YOUR PERSONALISED FINANCIAL GUIDE</div>
      </div>

      <!-- Overlapping Smartphone Mockups -->
      <div class="phones-wrapper" style="margin: 2px auto; flex-shrink: 0;">
        <!-- Sage Avatar (Coming out sideways from the top-left of the phone) -->
        <svg class="phone-peeking-sage-new" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sage-grad-phone" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#FFE4D4" />
              <stop offset="100%" stop-color="#FFD4B8" />
            </linearGradient>
          </defs>
          <g>
            <path d="M50 34 L50 20" stroke="#5fab84" stroke-width="5" stroke-linecap="round" />
            <ellipse cx="42" cy="14" rx="6" ry="10" fill="#5fab84" />
            <ellipse cx="58" cy="14" rx="6" ry="10" fill="#5fab84" />
            <circle cx="50" cy="62" r="30" fill="url(#sage-grad-phone)" stroke="#e9694a" stroke-width="3.5" />
            <path d="M38 50 Q 42 46, 45 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="M55 50 Q 58 46, 62 50" stroke="#1c1a24" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <ellipse cx="42" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
            <ellipse cx="58" cy="57" rx="3" ry="4.5" fill="#1c1a24" />
            <circle cx="33" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
            <circle cx="67" cy="64" r="5" fill="#FFB8A0" fill-opacity="0.6" />
            <path d="M44 68 Q 50 74, 56 68" stroke="#1c1a24" stroke-width="3.5" stroke-linecap="round" fill="none" />
          </g>
        </svg>
        <img src="data:image/png;base64,${learnScreenBase64}" class="phone-mockup-new phone-back" alt="Learn Screen">
        <img id="home-screen-img" src="data:image/png;base64,${homeScreenBase64}" class="phone-mockup-new phone-front" alt="Home Screen">
      </div>

      <!-- Testimonials Quote Box -->
      <div class="quote-box" style="margin: 2px 0; padding: 4px 0; border-top: 1px solid var(--p-line); border-bottom: 1px solid var(--p-line); box-sizing: border-box; width: 100%; flex-shrink: 0;">
        <p class="quote-text" style="text-align: center; font-size: 10.5px; margin-bottom: 2px; line-height: 1.3; font-style: italic; color: var(--p-ink);">
          "For too long, financial tools have been purely reactive, tracking where our young workforce's money went yesterday rather than where it is going tomorrow. Anticipate is the only platform that prepares them for what is coming, delivering clarity before it lands."
        </p>
        <div class="quote-author" style="text-align: center; font-size: 8.5px; font-weight: 700; color: var(--p-ink-tertiary);">
          ~ Hugo Sanchez, Senior Financial Advisor
        </div>
      </div>

      <!-- First Year Impact Section -->
      <div style="margin-top: 8px; width: 100%; text-align: left; display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;">
          <div style="font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--p-coral); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            Our first year impact:
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; background-color: var(--p-bg-2); border: 1.5px solid var(--p-line); border-radius: 12px; padding: 6px 8px;">
            <div style="font-size: 10.5px; line-height: 1.25; color: var(--p-ink-secondary); display: flex; gap: 6px; align-items: flex-start;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5fab84" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 1px;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span><strong>47,000+</strong> young adults onboarded in the first year</span>
            </div>
            <div style="font-size: 10.5px; line-height: 1.25; color: var(--p-ink-secondary); display: flex; gap: 6px; align-items: flex-start; border-top: 1px solid var(--p-line); padding-top: 3px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5fab84" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 1px;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span><strong>68%</strong> report feeling more confident opening financial documents after 4 weeks</span>
            </div>
            <div style="font-size: 10.5px; line-height: 1.25; color: var(--p-ink-secondary); display: flex; gap: 6px; align-items: flex-start; border-top: 1px solid var(--p-line); padding-top: 3px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5fab84" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 1px;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span><strong>£2,400</strong> average annual saving per user from avoided pension opt-outs and overpayments</span>
            </div>
            <div style="font-size: 10.5px; line-height: 1.25; color: var(--p-ink-secondary); display: flex; gap: 6px; align-items: flex-start; border-top: 1px solid var(--p-line); padding-top: 3px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5fab84" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 1px;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span><strong>74%</strong> of users opened a Lifetime ISA (LISA) or boosted their property savings within six months of onboarding</span>
            </div>
          </div>
        </div>

        <!-- Action area with App Store & Google Play download badges -->
        <div class="action-info" style="padding: 6px 8px; gap: 4px; margin-top: auto; width: 100%; background: var(--p-card); border: 1.5px dashed var(--p-coral); border-radius: 12px; flex-shrink: 0;">
          <div style="font-family: var(--font-display); font-weight: 700; font-size: 13px; color: var(--p-ink); margin-bottom: 2px; letter-spacing: -0.01em;">
            Download <span style="color: var(--p-coral);">anticipate.</span> today
          </div>
          <div style="display: flex; gap: 8px; justify-content: center; width: 100%;">
            <!-- Google Play Crop -->
            <a href="#" class="store-badge-clip-new" style="width: 95px; height: 27px; border-radius: 4px; overflow: hidden; position: relative; display: inline-block;" onclick="event.preventDefault()">
              <img src="data:image/png;base64,${storeBadgesBase64}" style="position: absolute; width: 220px; height: auto; left: -8px; top: -38px; display: block;">
            </a>
            <!-- App Store Crop -->
            <a href="#" class="store-badge-clip-new" style="width: 92px; height: 27px; border-radius: 4px; overflow: hidden; position: relative; display: inline-block;" onclick="event.preventDefault()">
              <img src="data:image/png;base64,${storeBadgesBase64}" style="position: absolute; width: 220px; height: auto; left: -120px; top: -38px; display: block;">
            </a>
          </div>
        </div>
    </div>

    <!-- Right Column: Features & Impact -->
    <div class="col" style="justify-content: flex-start; gap: 6px; height: 100%;">
      <div style="flex-shrink: 0;">
        <h2 style="font-size: 20px; margin-bottom: 8px; line-height: 1.15;">Built for you. Felt by everyone around you.</h2>
      </div>

      <!-- What users say -->
      <div style="border-top: 1.5px dashed var(--p-line); padding-top: 6px; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0;">
        <div style="font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--p-coral); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
          What users say
        </div>
        
        <!-- Quote 1: Sarah -->
        <div class="quote-box" style="margin: 0; padding: 0; border: none;">
          <p class="quote-text" style="font-size: 10.5px; line-height: 1.3; font-family: var(--font-display); font-style: italic; color: var(--p-ink); margin: 0 0 2px 0; border-left: 2.5px solid var(--p-coral); padding-left: 8px;">
            "I was nervous thinking about my first payslip because school leaves you completely blank on tax codes and pensions. But three days before payday, Sage sent me a simple four minute walkthrough, so I actually understood my take-home pay instead of just hoping it was right."
          </p>
          <span class="quote-author" style="font-size: 8.5px; font-weight: 700; color: var(--p-ink-tertiary); display: block; margin-top: 2px; padding-left: 10px;">~ Sarah, 21 year old graduate</span>
        </div>

        <!-- Quote 2: Leo -->
        <div class="quote-box" style="margin: 4px 0 0 0; padding-top: 4px; border-top: 1px dashed var(--p-line); border-bottom: none;">
          <p class="quote-text" style="font-size: 10.5px; line-height: 1.3; font-family: var(--font-display); font-style: italic; color: var(--p-ink); margin: 0 0 2px 0; border-left: 2.5px solid var(--p-coral); padding-left: 8px;">
            "Trying to buy a house feels completely overwhelming with the sheer amount of mortgage and ISA terms. Anticipate laid everything out on a visual timeline, showing me exactly what documents and fees were coming weeks before they were due so I could make decisions with confidence."
          </p>
          <span class="quote-author" style="font-size: 8.5px; font-weight: 700; color: var(--p-ink-tertiary); display: block; margin-top: 2px; padding-left: 10px;">~ Leo, 30 year old looking to buy his first house</span>
        </div>
      </div>

      <!-- Wider Impact -->
      <div style="border-top: 1.5px dashed var(--p-line); padding-top: 6px; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;">
        <div style="font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--p-coral); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
          Wider Impact
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center; background: #fffdfb; border: 1.5px solid var(--p-line); border-radius: 12px; padding: 8px 10px;">
          <!-- 60% Chart -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; width: 64px;">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e6dbc4" stroke-width="3.5" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e9694a" stroke-width="4" stroke-dasharray="60, 100" stroke-linecap="round" transform="rotate(-90 18 18)" />
              <text x="18" y="21.5" font-family="'Instrument Sans', Arial, sans-serif" font-weight="700" font-size="10" text-anchor="middle" fill="var(--p-ink)">60%</text>
            </svg>
            <div style="font-size: 8px; line-height: 1.1; color: var(--p-ink-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; text-align: center;">Reports</div>
          </div>
          <div style="font-size: 11px; line-height: 1.35; color: var(--p-ink-secondary); flex: 1;">
            60% of HR professionals have reported a decrease in payslip and employment contract queries, freeing them to focus on high value employee and recruitement support.
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; background: #fffdfb; border: 1.5px solid var(--p-line); border-radius: 12px; padding: 8px 10px;">
          <!-- 40% Chart -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; width: 64px;">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e6dbc4" stroke-width="3.5" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e9694a" stroke-width="4" stroke-dasharray="40, 100" stroke-linecap="round" transform="rotate(-90 18 18)" />
              <text x="18" y="21.5" font-family="'Instrument Sans', Arial, sans-serif" font-weight="700" font-size="10" text-anchor="middle" fill="var(--p-ink)">40%</text>
            </svg>
            <div style="font-size: 7.5px; line-height: 1.1; color: var(--p-ink-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; text-align: center;">Increased<br>Pension<br>Contributions</div>
          </div>
          <div style="font-size: 11px; line-height: 1.35; color: var(--p-ink-secondary); flex: 1;">
            What's more, since the app's launch, a 40% increase in employee pension contributions has caught the attention of the Department for Work and Pensions (DWP). This shift has sparked discussions with government policymakers about how the app's trajectory protects future public budgets by preventing a generation from reaching retirement dependent on state benefits and social care.
          </div>
        </div>
        
        <p style="font-size: 11px; line-height: 1.35; color: var(--p-ink-secondary); margin: 2px 0 0 0;">
          Anticipate’s impact has attracted attention from prominent government-level departments, who see it as a promising tool for bridging the structural financial literacy gap as young adults enter the modern economy.
        </p>
      </div>

      <!-- Closing Slogan -->
      <div style="background-color: var(--p-card-accent); border: 1.5px dashed var(--p-coral); border-radius: 10px; padding: 10px 12px; text-align: center; margin-top: auto; flex-shrink: 0;">
        <p style="font-family: var(--font-display); font-size: 12.5px; font-weight: 800; line-height: 1.35; color: var(--p-coral); margin: 0; text-align: center;">
          The financial education you should have received. Finally, at the exact moment you need it.
        </p>
      </div>
    </div>

    </div>

  </div>
  </div>

  <script>
    function adjustScale() {
      const poster = document.getElementById('poster-page');
      if (!poster) return;
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      
      const targetWidth = 1120;
      const targetHeight = 792;
      
      const scaleX = winWidth / targetWidth;
      const scaleY = winHeight / targetHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      
      poster.style.transform = 'scale(' + scale + ')';
      poster.style.transformOrigin = 'center center';
    }
    
    window.addEventListener('resize', adjustScale);
    window.addEventListener('load', adjustScale);
    adjustScale();

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
      const originalTransform = element.style.transform;
      
      try {
        element.style.transform = 'none'; // Reset scale for export
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
          backgroundColor: '#e9694a',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1150,
          windowHeight: 820
        });
        
        const link = document.createElement('a');
        link.download = 'anticipate_impact_poster.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('PNG Generation Error:', err);
        alert('Could not generate PNG. Please open the HTML file in a modern browser like Chrome to download.');
      } finally {
        element.style.transform = originalTransform; // Restore scale
        pngBtn.innerHTML = originalText;
        pngBtn.disabled = false;
      }
    }

    async function generatePDF() {
      const element = document.getElementById('poster-page');
      const pdfBtn = document.querySelector('.btn-pdf');
      const originalText = pdfBtn.innerHTML;
      const originalTransform = element.style.transform;
      
      try {
        element.style.transform = 'none'; // Reset scale for export
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
          html2canvas:  { 
            scale: 2.5, 
            useCORS: true, 
            allowTaint: true, 
            logging: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 1150,
            windowHeight: 820
          },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('Could not generate PDF. Please try downloading the PNG instead.');
      } finally {
        element.style.transform = originalTransform; // Restore scale
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
