import fs from 'fs';
import path from 'path';

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #e2dbd0;
      margin: 40px;
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    .test-section {
      background: white;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 12px;
    }
    
    .badge-crop-container {
      position: relative;
      overflow: hidden;
      border: 1px dashed red;
    }
    .badge-crop-container img {
      position: absolute;
    }
  </style>
</head>
<body>

  <div class="test-section">
    <h2>Badges Crop Tests</h2>
    <div style="display: flex; gap: 20px;">
      <!-- Crop 1: Container W 210px, H 45px, Image W 210px, H 54px, top -9px -->
      <div>
        <h4>Crop 1: W 210px, H 45px, top -9px</h4>
        <div class="badge-crop-container" style="width: 210px; height: 45px;">
          <img src="../store_badges.png" style="width: 210px; height: 54px; left: 0; top: -9px;">
        </div>
      </div>
      <!-- Crop 2: Container W 220px, H 48px, Image W 220px, H 56px, top -10px -->
      <div>
        <h4>Crop 2: W 220px, H 48px, top -10px</h4>
        <div class="badge-crop-container" style="width: 220px; height: 48px;">
          <img src="../store_badges.png" style="width: 220px; height: 56px; left: 0; top: -10px;">
        </div>
      </div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync('scratch/test_crop.html', html);
console.log('Wrote scratch/test_crop.html');
