import fs from 'fs';
import path from 'path';

// Let's create an HTML page with different crop parameters to inspect where the phone border lies.
// We will try different offsets:
// For an image of 764 x 1568:
// We will test container dimensions and image shifts to see what clips the background perfectly.

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #e2dbd0;
      margin: 30px;
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
    }
    .test-box {
      background: white;
      padding: 10px;
      border: 1px solid #999;
      text-align: center;
    }
    /* Crop Wrapper */
    .crop-container {
      position: relative;
      overflow: hidden;
      background: rgba(255,0,0,0.1);
      border: 2px dashed red;
    }
    .crop-container img {
      position: absolute;
    }
  </style>
</head>
<body>

  <!-- Test 1: Width 710px, Height 1530px, Shift Left -27px, Shift Top -19px -->
  <div class="test-box">
    <h3>Test 1: Left -27px, Top -19px, W 710px, H 1530px</h3>
    <div class="crop-container" style="width: 355px; height: 765px; border-radius: 36px;">
      <img src="../home_screen.png" style="width: 382px; height: 784px; left: -13.5px; top: -9.5px;">
    </div>
  </div>

  <!-- Test 2: Width 700px, Height 1520px, Shift Left -32px, Shift Top -24px -->
  <div class="test-box">
    <h3>Test 2: Left -32px, Top -24px, W 700px, H 1520px</h3>
    <div class="crop-container" style="width: 350px; height: 760px; border-radius: 36px;">
      <img src="../home_screen.png" style="width: 382px; height: 784px; left: -16px; top: -12px;">
    </div>
  </div>

  <!-- Test 3: Width 720px, Height 1540px, Shift Left -22px, Shift Top -14px -->
  <div class="test-box">
    <h3>Test 3: Left -22px, Top -14px, W 720px, H 1540px</h3>
    <div class="crop-container" style="width: 360px; height: 770px; border-radius: 36px;">
      <img src="../home_screen.png" style="width: 382px; height: 784px; left: -11px; top: -7px;">
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync('scratch/test_crop.html', html);
console.log('Wrote scratch/test_crop.html');
