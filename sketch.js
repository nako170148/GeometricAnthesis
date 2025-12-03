let cursorSize = 40;
let bgColor;
let accentColor;
let currentScene = "opening";
let openingPhrases = [
  "Let your own flower bloom", // English
  "Lassen Sie Ihre eigene einzigartige Blume blühen", // German
  "Fais fleurir ta propre fleur", // French
  "Haz que florezca tu propia flor", // Spanish
  "Fai sbocciare il tuo fiore", // Italian
  "Deixe sua própria flor florescer", // Portuguese
  "Позволь своему цветку расцвести", // Russian
  "讓屬於你的花綻放", // Traditional Chinese
  "让属于你的花绽放", // Simplified Chinese
  "당신만의 꽃을 피우세요", // Korean
  "अपना अनोखा फूल खिलने दें", // Hindi
  "دع زهرتك الفريدة تتفتح", // Arabic
  "ให้ดอกไม้ของคุณเบ่งบาน", // Thai
  "Hãy để bông hoa của riêng bạn nở rộ", // Vietnamese
  "Biarkan bungamu sendiri mekar", // Indonesian
  "Kendi çiçeğinin açmasına izin ver", // Turkish
  "Laat jouw eigen bloem tot bloei komen", // Dutch
  "Låt din egen blomma blomma", // Swedish
  "La din egen blomst blomstre", // Norwegian
  "Anna oman kukkasi puhjeta", // Finnish
];
let colors = [
  { key: "pink", value: [255, 180, 230] },
  { key: "yellow", value: [255, 220, 120] },
  { key: "blue", value: [150, 200, 255] },
  { key: "green", value: [170, 230, 190] },
  { key: "purple", value: [210, 170, 255] },
  { key: "orange", value: [255, 190, 150] },
  { key: "mint", value: [190, 255, 220] },
  { key: "sky", value: [180, 220, 255] },
  { key: "magenta", value: [255, 140, 210] },
  { key: "lime", value: [210, 255, 170] },
];
let selectedColorIndex = 0;
let seeds = [
  { key: "circle", label: "maru", shape: "circle" },
  { key: "triangle", label: "sankaku", shape: "triangle" },
  { key: "square", label: "shikaku", shape: "square" },
  { key: "diamond", label: "daiya", shape: "diamond" },
  { key: "trapezoid", label: "daikei", shape: "trapezoid" },
  { key: "pentagon", label: "gakakkei", shape: "pentagon" },
  { key: "hexagon", label: "rokkakkei", shape: "hexagon" },
  { key: "star", label: "hoshi", shape: "star" },
];
let selectedSeedIndex = 0;
let selectedNutrientIndex = 0;
let seedSelectionPhase = 0;
let soils = [
  { key: "dark", label: "黒土", color: [40, 30, 30] },
  { key: "sand", label: "砂", color: [210, 190, 150] },
  { key: "white", label: "白砂", color: [235, 235, 240] },
  { key: "moss", label: "苔", color: [60, 90, 60] },
];
let selectedSoilIndex = 0;
let waters = [
  { key: "low", label: "少なめ", level: 0.4, color: [120, 180, 255] },
  { key: "mid", label: "ちょうど", level: 0.7, color: [90, 150, 255] },
  { key: "high", label: "たっぷり", level: 0.95, color: [60, 120, 255] },
];
let selectedWaterIndex = 1;
let growProgress = 0;
let bloomStartFrame = 0;
let lastGrowAngle = null;
const SPIRO_TURNS = 14;
let bloomButtons = [];
let waterButtons = [];
let waterNextButton = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  bgColor = color(10, 10, 20);
  accentColor = color(...colors[selectedColorIndex].value);
}

function withSeedClip(shape, cx, cy, size, drawFn) {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  traceSeedPath(ctx, shape, cx, cy, size);
  ctx.clip();
  drawFn();
  ctx.restore();
}

function strokeSeedShape(shape, cx, cy, size, strokeCol, weight = 4, glowCol) {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  traceSeedPath(ctx, shape, cx, cy, size);
  ctx.lineWidth = weight;
  ctx.strokeStyle = strokeCol?.toString ? strokeCol.toString() : strokeCol;
  if (glowCol) {
    ctx.shadowBlur = weight * 2.4;
    ctx.shadowColor = glowCol.toString ? glowCol.toString() : glowCol;
  }
  ctx.stroke();
  ctx.restore();
}

function traceSeedPath(ctx, shape, cx, cy, size) {
  const half = size / 2;
  if (shape === "circle") {
    ctx.arc(cx, cy, half, 0, TWO_PI);
  } else if (shape === "square") {
    ctx.moveTo(cx - half, cy - half);
    ctx.lineTo(cx + half, cy - half);
    ctx.lineTo(cx + half, cy + half);
    ctx.lineTo(cx - half, cy + half);
    ctx.closePath();
  } else if (shape === "triangle") {
    let h = (sqrt(3) / 2) * size;
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx + size / 2, cy + h / 2);
    ctx.lineTo(cx - size / 2, cy + h / 2);
    ctx.closePath();
  } else if (shape === "diamond") {
    ctx.moveTo(cx, cy - half);
    ctx.lineTo(cx + half, cy);
    ctx.lineTo(cx, cy + half);
    ctx.lineTo(cx - half, cy);
    ctx.closePath();
  } else if (shape === "trapezoid") {
    let topW = size * 0.6;
    let bottomW = size;
    let h = size * 0.7;
    ctx.moveTo(cx - topW / 2, cy - h / 2);
    ctx.lineTo(cx + topW / 2, cy - h / 2);
    ctx.lineTo(cx + bottomW / 2, cy + h / 2);
    ctx.lineTo(cx - bottomW / 2, cy + h / 2);
    ctx.closePath();
  } else if (shape === "pentagon" || shape === "hexagon") {
    let sides = shape === "pentagon" ? 5 : 6;
    ctx.moveTo(cx + half * cos(-HALF_PI), cy + half * sin(-HALF_PI));
    for (let i = 1; i <= sides; i++) {
      let angle = -HALF_PI + (TWO_PI * i) / sides;
      ctx.lineTo(cx + half * cos(angle), cy + half * sin(angle));
    }
    ctx.closePath();
  } else if (shape === "star") {
    let angleStep = TWO_PI / 5;
    let outer = half;
    let inner = half * 0.4;
    ctx.moveTo(cx, cy - outer);
    for (let i = 1; i < 10; i++) {
      let angle = -HALF_PI + (angleStep / 2) * i;
      let radius = i % 2 === 0 ? outer : inner;
      ctx.lineTo(cx + cos(angle) * radius, cy + sin(angle) * radius);
    }
    ctx.closePath();
  } else {
    ctx.arc(cx, cy, half, 0, TWO_PI);
  }
}

function draw() {
  background(bgColor);
  if (currentScene === "opening") {
    drawOpeningScene();
  } else if (currentScene === "colorSelect") {
    drawColorScene();
  } else if (currentScene === "seedSelect") {
    drawSeedScene();
  } else if (currentScene === "soilSelect") {
    drawSoilScene();
  } else if (currentScene === "waterSelect") {
    drawWaterScene();
  } else if (currentScene === "grow") {
    drawGrowScene();
  } else if (currentScene === "bloom") {
    drawBloomScene();
  }

  // マウス位置を仮の "手カーソル" として使う
  drawCursorCircle(mouseX, mouseY);
}

function drawOpeningScene() {
  noStroke();
  textAlign(CENTER, CENTER);

  // 日本語メインコピー（必須表示・中央）
  let baseY = height * 0.4;
  let floatOffset = sin(frameCount * 0.02) * 10;

  fill(255);
  textSize(36);
  text("あなただけの花を咲かせよう", width / 2, baseY + floatOffset);

  // 多言語コピーを画面いっぱいにばらまく
  let startY = height * 0.1;
  let lineGap = 26;
  for (let i = 0; i < openingPhrases.length; i++) {
    let phrase = openingPhrases[i];

    // 言語ごとに大きさを少し変える（マチマチでOKという要件）
    let size = 14 + (i % 5) * 4;
    textSize(size);

    // わずかに色と位置を揺らして、画面全体にリズムを付ける
    let wobbleX = sin(frameCount * 0.01 + i) * 60;
    let y = startY + i * lineGap + floatOffset * 0.3;

    // 日本語メインコピーの背後には文字を描かない帯を作る
    let bandCenter = baseY + floatOffset;
    let bandHalfHeight = 40; // 帯の高さ（必要なら後で調整）
    if (y > bandCenter - bandHalfHeight && y < bandCenter + bandHalfHeight) {
      continue;
    }

    fill(200 + (i % 3) * 15);
    text(phrase, width / 2 + wobbleX, y);
  }

  // 操作説明（今日はクリックで次へ）
  textSize(10);
  fill(200);
  textAlign(RIGHT, BOTTOM);
  text("手をかざしてください（今日はクリックで次へ進みます）", width * 0.98, height * 0.96);
}

function drawColorScene() {
  noStroke();
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(28);
  text("色を選んでください", width / 2, height * 0.2);

  textSize(14);
  fill(210);
  text("今日はマウスで色を選択します", width / 2, height * 0.27);

  // 色パレットを中央に横並びで配置
  let paletteWidth = min(width * 0.7, 520);
  let itemWidth = paletteWidth / colors.length;
  let centerY = height * 0.55;

  for (let i = 0; i < colors.length; i++) {
    let cx = width / 2 - paletteWidth / 2 + itemWidth * (i + 0.5);
    let cy = centerY;
    let r = itemWidth * 0.35;

    // ホバー判定
    let isHover = dist(mouseX, mouseY, cx, cy) < r * 1.1;
    let isSelected = i === selectedColorIndex;

    let [baseR, baseG, baseB] = colors[i].value;

    // 外側のリング
    noFill();
    strokeWeight(isSelected ? 5 : isHover ? 3 : 2);
    stroke(baseR, baseG, baseB, 220);
    circle(cx, cy, r * 2.4);

    // 色の本体
    noStroke();
    let factor = isSelected ? 1.35 : isHover ? 1.2 : 1.0;
    fill(baseR, baseG, baseB);
    circle(cx, cy, r * 2 * factor);
  }

  // 次のシーンへ進むボタン（今日はクリックで遷移）
  let btnW = 120;
  let btnH = 40;
  let btnX = width * 0.85;
  let btnY = height * 0.85;

  let isHoverNext = mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("次へ", btnX, btnY);
}

function drawSeedScene() {
  noStroke();
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(28);
  let isOuterPhase = seedSelectionPhase === 0;
  text(
    isOuterPhase
      ? "種（外枠）を選んでください"
      : "養分（内側で動く図形）を選んでください",
    width / 2,
    height * 0.2
  );

  textSize(14);
  fill(210);
  text(
    isOuterPhase
      ? "今日はマウスで外枠になる図形を選択します"
      : "次に、内側で動きをつくる図形を選択します",
    width / 2,
    height * 0.27
  );

  // 種のパレットを中央に横並びで配置
  let paletteWidth = min(width * 0.8, 640);
  let itemWidth = paletteWidth / seeds.length;
  let centerY = height * 0.55;

  textSize(24);
  for (let i = 0; i < seeds.length; i++) {
    let cx = width / 2 - paletteWidth / 2 + itemWidth * (i + 0.5);
    let cy = centerY;
    let w = itemWidth * 0.7;
    let h = w;

    // ホバー判定
    let isHover = mouseX > cx - w / 2 && mouseX < cx + w / 2 && mouseY > cy - h / 2 && mouseY < cy + h / 2;
    let isSelected = isOuterPhase ? i === selectedSeedIndex : i === selectedNutrientIndex;

    // 図形アイコン（枠ではなく形そのものを強調）
    drawSeedIcon(seeds[i].shape, cx, cy, w * 0.7, isHover, isSelected);
  }

  // 次のシーンへ進むボタン（今日はクリックで遷移）
  let btnW = 120;
  let btnH = 40;
  let btnX = width * 0.85;
  let btnY = height * 0.85;

  let isHoverNext = mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("次へ", btnX, btnY);
}

function drawCursorCircle(x, y) {
  noStroke();
  fill(accentColor);
  circle(x, y, cursorSize);

  // 中心に小さな白い点
  fill(255);
  circle(x, y, cursorSize * 0.25);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (currentScene === "opening") {
    currentScene = "colorSelect";
  } else if (currentScene === "colorSelect") {
    if (!handleColorNextClick()) {
      handleColorClick();
    }
  } else if (currentScene === "seedSelect") {
    if (!handleSeedNextClick()) {
      handleSeedClick();
    }
  } else if (currentScene === "soilSelect") {
    if (!handleSoilNextClick()) {
      handleSoilClick();
    }
  } else if (currentScene === "waterSelect") {
    if (!handleWaterNextClick()) {
      handleWaterClick();
    }
  } else if (currentScene === "bloom") {
    handleBloomClick();
  }
}

function handleWaterNextClick() {
  let btnW = 120;
  let btnH = 40;
  let btnX = width * 0.85;
  let btnY = height * 0.85;

  if (mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2) {
    startGrowScene();
    return true;
  }
  return false;
}

function mouseReleased() {
  lastGrowAngle = null;
}

function drawSoilScene() {
  noStroke();
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(28);
  text("土を選んでください", width / 2, height * 0.2);

  textSize(14);
  fill(210);
  text("今日はマウスで土を選択します", width / 2, height * 0.27);

  // 土のパレットを中央に横並びで配置
  let paletteWidth = min(width * 0.7, 520);
  let itemWidth = paletteWidth / soils.length;
  let centerY = height * 0.55;

  for (let i = 0; i < soils.length; i++) {
    let cx = width / 2 - paletteWidth / 2 + itemWidth * (i + 0.5);
    let cy = centerY;
    let w = itemWidth * 0.6;
    let h = w * 0.5;

    // ホバー判定
    let isHover = mouseX > cx - w / 2 && mouseX < cx + w / 2 && mouseY > cy - h / 2 && mouseY < cy + h / 2;
    let isSelected = i === selectedSoilIndex;

    // 土の色
    let [r, g, b] = soils[i].color;
    rectMode(CENTER);
    let sizeFactor = isSelected ? 1.3 : isHover ? 1.15 : 1.0;
    if (isSelected) {
      fill(r + 20, g + 20, b + 20);
    } else if (isHover) {
      fill(r + 10, g + 10, b + 10);
    } else {
      fill(r, g, b);
    }
    rect(cx, cy, w * sizeFactor, h * sizeFactor, 8);

    // 少しだけテクスチャ風のドット
    push();
    translate(cx - (w * sizeFactor) / 2, cy - (h * sizeFactor) / 2);
    noStroke();
    fill(255, 255, 255, 30);
    for (let n = 0; n < 25; n++) {
      let px = random(w * sizeFactor);
      let py = random(h * sizeFactor);
      circle(px, py, 2);
    }
    pop();

    // ラベル
    fill(230);
    textAlign(CENTER, TOP);
    textSize(14);
    text(soils[i].label, cx, cy + h * sizeFactor * 0.6);
  }

  // 次のシーン（水）へ進むボタン（今日はクリックで遷移）
  let btnW = 120;
  let btnH = 40;
  let btnX = width * 0.85;
  let btnY = height * 0.85;

  let isHoverNext = mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("次へ", btnX, btnY);
}

function drawWaterScene() {
  noStroke();
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(28);
  text("水を選んでください", width / 2, height * 0.2);

  textSize(14);
  fill(210);
  text("今日はマウスで水量を選択します", width / 2, height * 0.27);

  let paletteWidth = min(width * 0.6, 420);
  let itemWidth = paletteWidth / waters.length;
  let centerY = height * 0.55;
  waterButtons = [];

  for (let i = 0; i < waters.length; i++) {
    let cx = width / 2 - paletteWidth / 2 + itemWidth * (i + 0.5);
    let cy = centerY;
    let radius = itemWidth * 0.35;

    let isHover = dist(mouseX, mouseY, cx, cy) < radius * 1.1;
    let isSelected = i === selectedWaterIndex;

    let [r, g, b] = waters[i].color;
    let sizeFactor = isSelected ? 1.3 : isHover ? 1.15 : 1.0;

    // 波紋風リング
    noFill();
    stroke(r, g, b, 180);
    strokeWeight(2);
    for (let ring = 0; ring < 3; ring++) {
      let ripple = radius * (1.1 + ring * 0.2);
      circle(cx, cy, ripple * 2);
    }

    // 水滴本体
    noStroke();
    fill(r, g, b, 200);
    circle(cx, cy, radius * 2 * sizeFactor);
    fill(255, 220);
    ellipse(cx - radius * 0.2, cy - radius * 0.3, radius * 0.4, radius * 0.7);

    // ラベル
    fill(230);
    textAlign(CENTER, TOP);
    textSize(14);
    text(waters[i].label, cx, cy + radius * sizeFactor + 10);

    waterButtons.push({ cx, cy, radius: radius * sizeFactor, index: i });
  }

  // 次へ
  let btnW = 120;
  let btnH = 40;
  let btnX = width * 0.85;
  let btnY = height * 0.85;
  waterNextButton = { x: btnX - btnW / 2, y: btnY - btnH / 2, w: btnW, h: btnH };

  let isHoverNext = isPointInsideRect(mouseX, mouseY, waterNextButton.x, waterNextButton.y, waterNextButton.w, waterNextButton.h);

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("次へ", btnX, btnY);
}

function drawGrowScene() {
  updateGrowProgress();

  let params = getSpiroParams();
  let soilStyle = getSoilStyle();
  let progress = constrain(growProgress, 0, 1);
  let currentShape = seeds[selectedSeedIndex]?.shape || "circle";
  let shapeSize = min(width, height) * 0.65;
  let centerX = width / 2;
  let centerY = height / 2;

  // subtle background overlay based on土
  noStroke();
  fill(soilStyle.bgTint, 45);
  rectMode(CORNER);
  rect(0, 0, width, height);

  let reveal = progress > 0 ? constrain(pow(progress, 0.85), 0, 1) : 0;
  let outlineStrokeGrow = color(red(accentColor), green(accentColor), blue(accentColor), max(80, 180 * reveal));

  if (progress > 0) {
    let mainStroke = color(red(accentColor), green(accentColor), blue(accentColor), 235 * reveal);
    let outlineStroke = color(red(accentColor), green(accentColor), blue(accentColor), 120 * reveal);
    let ghostStroke = color(red(accentColor), green(accentColor), blue(accentColor), 50 * reveal);

    withSeedClip(currentShape, centerX, centerY, shapeSize, () => {
      fill(red(soilStyle.bgTint), green(soilStyle.bgTint), blue(soilStyle.bgTint), 80 * reveal);
      rect(0, 0, width, height);
      drawSpirograph(params, progress, {
        strokeWidth: soilStyle.strokeWeight + 0.6,
        strokeColor: mainStroke,
        outlineColor: outlineStroke,
        backgroundStrokeColor: ghostStroke,
        glowColor: mainStroke,
        glowStrength: 22,
        showMechanism: true,
        mechanismColor: outlineStroke,
      });
    });

    strokeSeedShape(currentShape, centerX, centerY, shapeSize, outlineStrokeGrow, 3.5, mainStroke);
  } else {
    strokeSeedShape(currentShape, centerX, centerY, shapeSize, outlineStrokeGrow, 3.5, outlineStrokeGrow);
  }

  // Progress bar
  let barWidth = width * 0.5;
  let barX = (width - barWidth) / 2;
  let barY = height * 0.82;
  noStroke();
  fill(255, 40);
  rect(barX, barY, barWidth, 12, 999);
  fill(red(accentColor), green(accentColor), blue(accentColor), 200);
  rect(barX, barY, barWidth * progress, 12, 999);

  // Instructions
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(28);
  text("手をぐるぐる回して成長させよう", width / 2, height * 0.15);
  textSize(16);
  fill(210);
  text("今日はマウスを円を描くように動かすだけでOK", width / 2, height * 0.22);

  if (progress >= 1 && currentScene === "grow") {
    enterBloomScene();
  }
}

function drawBloomScene() {
  let params = getSpiroParams();
  let soilStyle = getSoilStyle();
  let elapsed = frameCount - bloomStartFrame;
  let pulse = 1 + 0.05 * sin(elapsed * 0.05);
  let currentShape = seeds[selectedSeedIndex]?.shape || "circle";
  let shapeSize = min(width, height) * 0.68;
  let centerX = width / 2;
  let centerY = height / 2;

  rectMode(CORNER);
  noStroke();
  fill(soilStyle.bgTint, 55);
  rect(0, 0, width, height);

  let accentR = red(accentColor);
  let accentG = green(accentColor);
  let accentB = blue(accentColor);
  let mainStroke = color(accentR, accentG, accentB, 235);
  let outlineStroke = color(accentR, accentG, accentB, 150);
  let ghostStroke = color(accentR, accentG, accentB, 70);
  let glowStroke = color(255, 230, 245, 230);

  withSeedClip(currentShape, centerX, centerY, shapeSize, () => {
    fill(red(soilStyle.bgTint), green(soilStyle.bgTint), blue(soilStyle.bgTint), 90);
    rect(0, 0, width, height);

    // メインの花：growシーンと同じ描写を100%進行で行い、pulsingだけ加える
    drawSpirograph(params, 1, {
      strokeWidth: soilStyle.strokeWeight + 0.8,
      strokeColor: mainStroke,
      outlineColor: outlineStroke,
      backgroundStrokeColor: ghostStroke,
      glowColor: mainStroke,
      glowStrength: 26,
      showMechanism: true,
      showMechanismArm: false,
      mechanismColor: outlineStroke,
      scaleFactor: pulse,
    });

    // 祝福用にホワイトのハイライトを重ねる
    drawSpirograph(params, 1, {
      strokeWidth: soilStyle.strokeWeight + 0.3,
      strokeColor: color(255, 255, 255, 220),
      outlineColor: color(accentR, accentG, accentB, 110),
      glowColor: glowStroke,
      glowStrength: 32,
      scaleFactor: pulse + 0.04,
    });
  });

  textAlign(CENTER, CENTER);
  fill(255);
  textSize(32);
  text("花が咲きました", width / 2, height * 0.2);
  textSize(18);
  fill(220);
  text("ゆらぎと光、音でお祝い（演出は今後実装）", width / 2, height * 0.25);

  // Buttons to restart journey
  let btnWidth = 180;
  let btnHeight = 46;
  bloomButtons = [
    { label: "Openingへ", target: "opening", x: width * 0.4 - btnWidth / 2, y: height * 0.78 - btnHeight / 2 },
    { label: "色選びへ", target: "colorSelect", x: width * 0.6 - btnWidth / 2, y: height * 0.78 - btnHeight / 2 },
  ];

  for (const btn of bloomButtons) {
    let hovering = isPointInsideRect(mouseX, mouseY, btn.x, btn.y, btnWidth, btnHeight);
    fill(hovering ? color(255, 200, 230, 230) : color(200, 160, 210, 200));
    rect(btn.x, btn.y, btnWidth, btnHeight, 12);
    fill(40, 20, 60);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(btn.label, btn.x + btnWidth / 2, btn.y + btnHeight / 2 + 1);
  }
}

function drawSeedIcon(shape, cx, cy, size, isHover, isSelected) {
  let baseColor = color(240);
  let hoverColor = color(255, 220, 240);
  let selectedColor = color(255, 170, 210);

  let fillColor = baseColor;
  if (isSelected) {
    fillColor = selectedColor;
  } else if (isHover) {
    fillColor = hoverColor;
  }

  let effectiveSize = size * (isSelected ? 1.4 : isHover ? 1.2 : 1.0);

  noStroke();
  fill(fillColor);

  if (shape === "circle") {
    circle(cx, cy, effectiveSize);
  } else if (shape === "square") {
    rectMode(CENTER);
    rect(cx, cy, effectiveSize, effectiveSize, 6);
  } else if (shape === "triangle") {
    let h = (effectiveSize * sqrt(3)) / 2;
    triangle(
      cx,
      cy - h / 2,
      cx - effectiveSize / 2,
      cy + h / 2,
      cx + effectiveSize / 2,
      cy + h / 2
    );
  } else if (shape === "diamond") {
    beginShape();
    vertex(cx, cy - effectiveSize / 2);
    vertex(cx + effectiveSize / 2, cy);
    vertex(cx, cy + effectiveSize / 2);
    vertex(cx - effectiveSize / 2, cy);
    endShape(CLOSE);
  } else if (shape === "trapezoid") {
    let topW = effectiveSize * 0.6;
    let bottomW = effectiveSize;
    let h = effectiveSize * 0.7;
    beginShape();
    vertex(cx - topW / 2, cy - h / 2);
    vertex(cx + topW / 2, cy - h / 2);
    vertex(cx + bottomW / 2, cy + h / 2);
    vertex(cx - bottomW / 2, cy + h / 2);
    endShape(CLOSE);
  } else if (shape === "pentagon") {
    let r = effectiveSize * 0.55;
    beginShape();
    for (let i = 0; i < 5; i++) {
      let a = -HALF_PI + (TWO_PI * i) / 5;
      vertex(cx + cos(a) * r, cy + sin(a) * r);
    }
    endShape(CLOSE);
  } else if (shape === "hexagon") {
    let r = effectiveSize * 0.55;
    beginShape();
    for (let i = 0; i < 6; i++) {
      let a = -HALF_PI + (TWO_PI * i) / 6;
      vertex(cx + cos(a) * r, cy + sin(a) * r);
    }
    endShape(CLOSE);
  } else if (shape === "star") {
    let angle = TWO_PI / 5;
    let half = effectiveSize * 0.4;
    let full = effectiveSize * 0.8;
    beginShape();
    for (let a = -HALF_PI, i = 0; i < 10; i++, a += angle / 2) {
      let r = i % 2 === 0 ? full : half;
      let vx = cx + cos(a) * r;
      let vy = cy + sin(a) * r;
      vertex(vx, vy);
    }
    endShape(CLOSE);
  }
}

function handleSeedClick() {
  let paletteWidth = min(width * 0.8, 640);
  let itemWidth = paletteWidth / seeds.length;
  let centerY = height * 0.55;

  for (let i = 0; i < seeds.length; i++) {
    let cx = width / 2 - paletteWidth / 2 + itemWidth * (i + 0.5);
    let w = itemWidth * 0.7;
    let h = w;

    if (
      mouseX > cx - w / 2 &&
      mouseX < cx + w / 2 &&
      mouseY > centerY - h / 2 &&
      mouseY < centerY + h / 2
    ) {
      if (seedSelectionPhase === 0) {
        selectedSeedIndex = i;
      } else {
        selectedNutrientIndex = i;
      }
      break;
    }
  }
}

function handleColorClick() {
  let paletteWidth = min(width * 0.7, 520);
  let itemWidth = paletteWidth / colors.length;
  let centerY = height * 0.55;

  for (let i = 0; i < colors.length; i++) {
    let cx = width / 2 - paletteWidth / 2 + itemWidth * (i + 0.5);
    let cy = centerY;
    let r = itemWidth * 0.35;

    if (dist(mouseX, mouseY, cx, cy) < r) {
      selectedColorIndex = i;
      accentColor = color(...colors[selectedColorIndex].value);
      break;
    }
  }
}

function handleSeedNextClick() {
  let btnW = 120;
  let btnH = 40;
  let btnX = width * 0.85;
  let btnY = height * 0.85;

  if (mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2) {
    if (seedSelectionPhase === 0) {
      seedSelectionPhase = 1;
    } else {
      currentScene = "soilSelect";
      seedSelectionPhase = 0;
    }
    return true;
  }
  return false;
}

function handleColorNextClick() {
  let btnW = 120;
  let btnH = 40;
  let btnX = width * 0.85;
  let btnY = height * 0.85;

  if (mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2) {
    seedSelectionPhase = 0;
    currentScene = "seedSelect";
    return true;
  }
  return false;
}

function handleSoilClick() {
  let paletteWidth = min(width * 0.7, 520);
  let itemWidth = paletteWidth / soils.length;
  let centerY = height * 0.55;

  for (let i = 0; i < soils.length; i++) {
    let cx = width / 2 - paletteWidth / 2 + itemWidth * (i + 0.5);
    let cy = centerY;
    let w = itemWidth * 0.6;
    let h = w * 0.5;

    if (mouseX > cx - w / 2 && mouseX < cx + w / 2 && mouseY > cy - h / 2 && mouseY < cy + h / 2) {
      selectedSoilIndex = i;
      break;
    }
  }
}

function handleSoilNextClick() {
  let btnW = 120;
  let btnH = 40;
  let btnX = width * 0.85;
  let btnY = height * 0.85;

  if (mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2) {
    currentScene = "waterSelect";
    return true;
  }
  return false;
}

function handleWaterClick() {
  if (!waterButtons.length) return;
  for (const btn of waterButtons) {
    if (dist(mouseX, mouseY, btn.cx, btn.cy) < btn.radius) {
      selectedWaterIndex = btn.index;
      return;
    }
  }
}

function startGrowScene() {
  growProgress = 0;
  lastGrowAngle = null;
  currentScene = "grow";
}

function enterBloomScene() {
  currentScene = "bloom";
  bloomStartFrame = frameCount;
  bloomButtons = [];
}

function updateGrowProgress() {
  let cx = width / 2;
  let cy = height / 2;
  let angle = atan2(mouseY - cy, mouseX - cx);

  if (lastGrowAngle !== null) {
    let diff = angle - lastGrowAngle;
    while (diff > PI) diff -= TWO_PI;
    while (diff < -PI) diff += TWO_PI;

    let distance = abs(diff);
    if (distance > 0.002) {
      let waterBoost = 0.5 + waters[selectedWaterIndex].level * 0.5;
      growProgress += (distance / (TWO_PI * SPIRO_TURNS)) * waterBoost;
      growProgress = constrain(growProgress, 0, 1);
    }
  }

  lastGrowAngle = angle;
}

function getSpiroParams() {
  // キャンバスの短い方を基準に、図形のサイズを決める
  const base = min(width, height) * 0.30;

  // 種の種類ごとに「花びら数っぽい k」と「線の出っ張り具合 pRatio」を設定
  const presets = {
    circle:   { k: 6,  pRatio: 0.90 },
    triangle: { k: 3,  pRatio: 0.95 },
    square:   { k: 4,  pRatio: 0.85 },
    diamond:  { k: 5,  pRatio: 0.90 },
    trapezoid:{ k: 7,  pRatio: 0.80 },
    pentagon: { k: 5,  pRatio: 0.75 },
    hexagon:  { k: 8,  pRatio: 0.80 },
    star:     { k: 10, pRatio: 0.70 },
  };

  let key = seeds[selectedSeedIndex]?.key || "circle";
  let preset = presets[key] || presets.circle;

  // k を使って R と r を整数比にすることで、きれいに閉じるスピログラフにする
  // R = k * u, r = (k - 1) * u という関係にしている
  let k = preset.k;
  let unit = base / k;
  let R = unit * k;
  let r = unit * (k - 1);
  let p = r * preset.pRatio;

  return { R, r, p };
}

function getSoilStyle() {
  const soil = soils[selectedSoilIndex] || soils[0];
  if (soil.key === "dark") return { strokeWeight: 1.8, bgTint: color(20, 15, 25) };
  if (soil.key === "sand") return { strokeWeight: 1.6, bgTint: color(60, 30, 10) };
  if (soil.key === "white") return { strokeWeight: 1.4, bgTint: color(180, 200, 220) };
  if (soil.key === "moss") return { strokeWeight: 2.1, bgTint: color(10, 30, 20) };
  return { strokeWeight: 1.5, bgTint: color(0) };
}

function drawSpirograph(
  params,
  progress,
  {
    strokeWidth = 2,
    strokeColor = color(255),
    scaleFactor = 1,
    outlineColor = null,
    backgroundStrokeColor = null,
    glowColor = strokeColor,
    glowStrength = 16,
    showMechanism = false,
    showMechanismArm = true,
    mechanismColor = color(255)
  } = {}
) {
  const { R, r, p } = params;

  // 0〜1 の progress を角度に直接反映させる
  const cappedProgress = constrain(progress, 0, 1);
  if (cappedProgress <= 0) {
    return;
  }

  const maxT = SPIRO_TURNS * TWO_PI * cappedProgress;
  const step = 0.008; // 線の細かさ

  push();
  translate(width / 2, height / 2);
  scale(scaleFactor);

  // -----------------------------------------------------------
  // 【追加部分】動画のような「トンネル状の軌跡」を描く処理
  // -----------------------------------------------------------
  if (showMechanism) {
    // 養分の図形（内側で回っている形）を取得
    const nutrientShape = seeds[selectedNutrientIndex]?.shape || "circle";

    // 描画間隔（細かすぎると重くなり、粗すぎるとスカスカになるので調整）
    // 動画のような密度にするには 0.1 〜 0.2 程度がおすすめ
    const trailStep = 0.15;

    // 軌跡の色（アクセントカラーを薄くしたもの）
    // strokeColor から色成分を取り出して透明度をセット
    let trR = red(strokeColor);
    let trG = green(strokeColor);
    let trB = blue(strokeColor);

    noFill();
    strokeWeight(1); // 細い線で重ねる
    stroke(trR, trG, trB, 40); // 透明度 40/255 くらいで薄く重ねる

    for (let tVal = 0; tVal <= maxT; tVal += trailStep) {
      // 内側の円（回転円）の中心位置
      let cx = (R - r) * cos(tVal);
      let cy = (R - r) * sin(tVal);

      // 内側の円の自転角度
      // スピログラフの計算式に合わせて回転させる
      let rotationAngle = ((R - r) / r) * tVal;
      // ※もし逆回転に見える場合は符号をマイナスにしてください: -((R - r) / r) * tVal

      push();
      translate(cx, cy);
      rotate(rotationAngle); // 図形を回転

      // 図形を描画（中心 0,0 に描くことで translate/rotate が効く）
      const ctx = drawingContext;
      ctx.beginPath();
      // traceSeedPath は cx, cy を受け取るので、ここでは 0, 0 を渡す
      traceSeedPath(ctx, nutrientShape, 0, 0, r * 2);
      ctx.stroke();
      pop();
    }
  }
  // -----------------------------------------------------------
  // 【追加部分終わり】
  // -----------------------------------------------------------

  // 点列を計算（ペン先の軌跡：今まで通りのメインの線）
  let points = [];
  for (let t = 0; t <= maxT; t += step) {
    let x = (R - r) * cos(t) + p * cos(((R - r) / r) * t);
    let y = (R - r) * sin(t) - p * sin(((R - r) / r) * t);
    points.push({ x, y });
  }

  // 外周のうっすらした線
  if (backgroundStrokeColor) {
    push();
    noFill();
    stroke(backgroundStrokeColor);
    strokeWeight(strokeWidth * 0.5);
    beginShape();
    for (const pt of points) vertex(pt.x, pt.y);
    endShape();
    pop();
  }

  // 輪郭線
  if (outlineColor) {
    push();
    noFill();
    stroke(outlineColor);
    strokeWeight(strokeWidth * 0.9);
    drawingContext.shadowBlur = glowStrength * 0.6;
    drawingContext.shadowColor = outlineColor;
    beginShape();
    for (const pt of points) vertex(pt.x, pt.y);
    endShape();
    pop();
  }

  // メインの光る線
  push();
  noFill();
  stroke(strokeColor);
  strokeWeight(strokeWidth);
  drawingContext.shadowBlur = glowStrength;
  drawingContext.shadowColor = glowColor;
  beginShape();
  for (const pt of points) vertex(pt.x, pt.y);
  endShape();
  pop();

  // ---------- 現在位置のメカニズム（ペン先と円）の描画 ----------
  if (showMechanism) {
    const tCurrent = maxT;
    const nutrientShape = seeds[selectedNutrientIndex]?.shape || "circle";

    // 固定円（外枠）
    push();
    noFill();
    stroke(mechanismColor.levels[0], mechanismColor.levels[1], mechanismColor.levels[2], 60);
    strokeWeight(1);
    ellipse(0, 0, R * 2, R * 2);
    pop();

    // 現在の回転円の中心
    const cx = (R - r) * cos(tCurrent);
    const cy = (R - r) * sin(tCurrent);
    // 現在の回転角
    const currentRot = ((R - r) / r) * tCurrent;

    // 現在の回転円（先端にある実体）
    push();
    translate(cx, cy);
    rotate(currentRot); // ここも回転させる
    noFill();
    stroke(mechanismColor.levels[0], mechanismColor.levels[1], mechanismColor.levels[2], 200);
    strokeWeight(1.5);
    const ctx = drawingContext;
    ctx.beginPath();
    traceSeedPath(ctx, nutrientShape, 0, 0, r * 2);
    ctx.stroke();

    // アーム（回転円の中心からペン先）
    if (showMechanismArm) {
      line(0, 0, p, 0);
    }
    pop();

    // ペン先の点（現在位置）
    const px = points.length > 0 ? points[points.length - 1].x : (R - r + p);
    const py = points.length > 0 ? points[points.length - 1].y : 0;

    push();
    noStroke();
    fill(255, 240, 220, 255);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(255, 240, 220, 255);
    ellipse(px, py, 8, 8);
    pop();
  }
  // ---------- メカニズム描画終わり ----------

  pop();
}

function isPointInsideRect(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function handleBloomClick() {
  if (!bloomButtons?.length) return;
  const btnWidth = 180;
  const btnHeight = 46;
  for (const btn of bloomButtons) {
    if (isPointInsideRect(mouseX, mouseY, btn.x, btn.y, btnWidth, btnHeight)) {
      currentScene = btn.target === "opening" ? "opening" : "colorSelect";
      growProgress = 0;
      lastGrowAngle = null;
      return;
    }
  }
}
