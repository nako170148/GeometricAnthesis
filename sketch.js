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
let cam;
let camReady = false;
let hands = null;
let handModelStatus = "idle";
let handStatusDetail = "";
let pointerX = null;
let pointerY = null;
let isPinching = false;
let wasPinching = false;
let lastPrimaryActionAtMs = 0;
let lastVideoTimeMs = -1; // not heavily used now, kept for possible tuning
let lastHandInferMs = 0;
let handInferInFlight = false;
let uiPointerX = 0;
let uiPointerY = 0;
let growProgress = 0;
let bloomStartFrame = 0;
let lastGrowAngle = null;
const SPIRO_TURNS = 14;
let bloomButtons = [];
let waterButtons = [];
let waterNextButton = null;

async function initHandModel() {
  try {
    if (typeof Hands === "undefined") {
      handModelStatus = "noHands";
      handStatusDetail = "Hands class undefined";
      return;
    }

    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onHandsResults);

    handModelStatus = "ready";
    handStatusDetail = "Hands ready";
  } catch (e) {
    console.error("Failed to load HandLandmarker", e);
    handModelStatus = "error";
    handStatusDetail = String(e && e.message ? e.message : e);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  bgColor = color(10, 10, 20);
  accentColor = color(...colors[selectedColorIndex].value);
  cam = createCapture(VIDEO, () => (camReady = true));
  cam.size(640, 480);
  cam.hide();
  initHandModel();
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
  // UIで使うポインタ座標（手が取れていれば手、なければマウス）
  const px = pointerX !== null ? pointerX : mouseX;
  const py = pointerY !== null ? pointerY : mouseY;
  uiPointerX = px;
  uiPointerY = py;

  if (camReady) {
    drawCameraBackdrop();
    // 全シーン共通で、カメラの上に少し暗いオーバーレイをかける
    // grow / bloom ではこの上から土色のオーバーレイを重ねて雰囲気を出す
    push();
    noStroke();
    rectMode(CORNER);
    fill(10, 10, 20, 170);
    rect(0, 0, width, height);
    pop();
  } else {
    background(bgColor);
  }
  if (currentScene === "opening") {
    drawOpeningScene();
  } else if (currentScene === "openingGuide") {
    drawOpeningGuideScene();
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
  drawCursorCircle(uiPointerX, uiPointerY);

  updateHandTracking();

  // ピンチジェスチャーをクリック扱いにする
  const pinchNow = isPinching;
  if (pointerX !== null && pointerY !== null && pinchNow) {
    const nowMs = millis();
    if (nowMs - lastPrimaryActionAtMs > 500) {
      handlePrimaryAction();
      lastPrimaryActionAtMs = nowMs;
    }
  }
  wasPinching = pinchNow;

  if (pointerX !== null && pointerY !== null) {
    push();
    noFill();
    stroke(0, 255, 0);
    strokeWeight(3);
    circle(pointerX, pointerY, cursorSize * 1.4);
    pop();
  }

  // デバッグ表示を一番上に重ねる
  push();
  fill(255);
  textSize(16);
  textAlign(LEFT, BOTTOM);
  text(
    `camReady: ${camReady}  model: ${handModelStatus}  pinch: ${isPinching}`,
    30,
    height - 30
  );
  textSize(12);
  text(handStatusDetail, 30, height - 12);
  pop();
}

function drawCameraBackdrop() {
  push();
  translate(width, 0);
  scale(-1, 1); // mirror so movement feels natural
  const camAspect = cam.width / cam.height;
  const canvasAspect = width / height;
  let drawWidth, drawHeight;
  if (canvasAspect > camAspect) {
    drawWidth = width;
    drawHeight = width / camAspect;
  } else {
    drawHeight = height;
    drawWidth = height * camAspect;
  }
  const offsetY = (height - drawHeight) / 2;
  image(cam, 0, offsetY, drawWidth, drawHeight);
  pop();
}

function updateHandTracking() {
  if (!hands || !camReady) {
    pointerX = null;
    pointerY = null;
    isPinching = false;
    return;
  }

  const video = cam.elt;
  if (!video || video.readyState < 2) {
    return;
  }

  // 推論が重いので、200ms ごと & 1リクエストのみ同時に処理する
  const nowMs = performance.now();
  if (handInferInFlight || nowMs - lastHandInferMs < 200) {
    return;
  }
  handInferInFlight = true;
  lastHandInferMs = nowMs;

  hands
    .send({ image: video })
    .catch((e) => {
      handModelStatus = "error";
      handStatusDetail = String(e && e.message ? e.message : e);
    })
    .finally(() => {
      handInferInFlight = false;
    });
}

function onHandsResults(results) {
  const lmList = results.multiHandLandmarks;
  if (!lmList || !lmList.length) {
    pointerX = null;
    pointerY = null;
    isPinching = false;
    return;
  }

  const lm = lmList[0];
  const indexTip = lm[8];
  const thumbTip = lm[4];

  const ixNorm = 1 - indexTip.x; // 鏡映しにする
  const iyNorm = indexTip.y;
  const txNorm = 1 - thumbTip.x;
  const tyNorm = thumbTip.y;

  const ix = ixNorm * width;
  const iy = iyNorm * height;
  const tx = txNorm * width;
  const ty = tyNorm * height;

  pointerX = ix;
  pointerY = iy;

  const dx = ix - tx;
  const dy = iy - ty;
  const distSq = dx * dx + dy * dy;
  const pinchThresholdSq = 50 * 50; // 判定を少し厳しめに
  isPinching = distSq < pinchThresholdSq;
}

function drawOpeningScene() {
  noStroke();

  // わずかに上下に揺れる演出
  let floatOffset = sin(frameCount * 0.015) * 8;

  // タイトルまわり
  textAlign(CENTER, CENTER);

  // タイトル
  let titleY = height * 0.28 + floatOffset;
  let titleText = "Geometric Anthesis";

  push();
  let glowCol = color(
    red(accentColor),
    green(accentColor),
    blue(accentColor),
    220
  );
  textSize(51); // 元の約1.5倍
  fill(255);
  let ctx = drawingContext;
  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = glowCol.toString();
  text(titleText, width / 2, titleY);
  ctx.restore();
  pop();

  // サブタイトル（約1.5倍）
  textSize(36);
  text("あなただけの花を咲かせよう", width / 2, height * 0.36 + floatOffset * 0.8);

  // 説明テキスト
  textAlign(CENTER, TOP);
  textSize(14);
  fill(220);

  let story =
    "鏡を持って自分自身を画面に映してみて？\n" +
    "そしたら手をかざして。\n" +
    "指に緑の丸が映ったらそれはあなたの魔法の力。\n" +
    "緑の丸を表示したまま手をぎゅっと握って進んでみて。";

  let storyBoxWidth = min(width * 0.7, 560);
  let storyX = width / 2;
  // タイトルとの間隔を少し広げるため、ストーリーをやや下げる
  let storyY = height * 0.52 + floatOffset * 0.4;

  // 中央揃えのマルチラインテキスト
  let lines = story.split("\n");
  let lineHeight = 22;
  let startY = storyY - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], storyX, startY + i * lineHeight);
  }
}

function drawOpeningGuideScene() {
  noStroke();
  textAlign(CENTER, TOP);

  fill(255);
  textSize(30);
  let guide =
    "ここから先は、あなたの花に色とかたちが宿っていく物語。\n" +
    "最初の画面では、花びらの色をひとつえらびます。\n" +
    "つぎの画面では、外側と内側にひらく種のかたちをえらびます。\n" +
    "それから土と水をそっと与えると、花はゆっくりと咲いていきます。\n" +
    "画面の中の小さな緑の丸は、あなたの指さきのしるし。\n" +
    "その緑の丸をつまむように指を近づけるか手をぎゅっと握ると、この世界での『クリック』になるよ。\n" +
    "準備ができたら、『次へ』のボタンを押して色えらびの扉をひらいてみて。";

  let lines = guide.split("\n");
  let lineHeight = 42;
  let blockCenterY = height * 0.45;
  let startY = blockCenterY - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], width / 2, startY + i * lineHeight);
  }

  // 次へボタン（色選択へ）
  let btnW = Math.min(width * 0.5, 420);
  let btnH = 96;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  let isHoverNext =
    uiPointerX > btnX - btnW / 2 &&
    uiPointerX < btnX + btnW / 2 &&
    uiPointerY > btnY - btnH / 2 &&
    uiPointerY < btnY + btnH / 2;

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("次へ", btnX, btnY);
}

function drawColorScene() {
  noStroke();
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(28);
  text("色を選んでください", width / 2, height * 0.2);
  let totalColors = colors.length;

  for (let i = 0; i < totalColors; i++) {
    let layout = getColorItemLayout(i);
    let cx = layout.cx;
    let cy = layout.cy;
    let r = layout.r;
    let hitR = layout.hitR;

    let isHover = dist(uiPointerX, uiPointerY, cx, cy) < hitR;
    let isSelected = i === selectedColorIndex;

    let [baseR, baseG, baseB] = colors[i].value;

    noFill();
    strokeWeight(isSelected ? 5 : isHover ? 3 : 2);
    stroke(baseR, baseG, baseB, 220);
    circle(cx, cy, r * 2.2);

    noStroke();
    let factor = isSelected ? 1.35 : isHover ? 1.15 : 1.0;
    fill(baseR, baseG, baseB);
    circle(cx, cy, r * 2.0 * factor);
  }

  // 次のシーンへ進むボタン（今日はクリックで遷移）
  let btnW = min(width * 0.5, 420);
  let btnH = 96;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  let isHoverNext = uiPointerX > btnX - btnW / 2 && uiPointerX < btnX + btnW / 2 && uiPointerY > btnY - btnH / 2 && uiPointerY < btnY + btnH / 2;

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(32);
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
      ? "外枠になる図形を選択します"
      : "次に、内側で動きをつくる図形を選択します",
    width / 2,
    height * 0.27
  );

  textSize(24);
  let totalSeeds = seeds.length;
  for (let i = 0; i < totalSeeds; i++) {
    let layout = getSeedItemLayout(i);
    let cx = layout.cx;
    let cy = layout.cy;
    let size = layout.size;
    let hitW = layout.hitW;
    let hitH = layout.hitH;

    let isHover =
      uiPointerX > cx - hitW / 2 &&
      uiPointerX < cx + hitW / 2 &&
      uiPointerY > cy - hitH / 2 &&
      uiPointerY < cy + hitH / 2;
    let isSelected = isOuterPhase ? i === selectedSeedIndex : i === selectedNutrientIndex;

    drawSeedIcon(seeds[i].shape, cx, cy, size, isHover, isSelected);
  }

  // 次のシーンへ進むボタン（今日はクリックで遷移）
  let btnW = Math.min(width * 0.5, 420);
  let btnH = 96;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  let isHoverNext = uiPointerX > btnX - btnW / 2 && uiPointerX < btnX + btnW / 2 && uiPointerY > btnY - btnH / 2 && uiPointerY < btnY + btnH / 2;

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("次へ", btnX, btnY);
}

function getColorItemLayout(index) {
  const itemsPerRow = 4;
  const rows = Math.ceil(colors.length / itemsPerRow);
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;

  const gridWidth = Math.min(width * 0.9, 820);
  const cellWidth = gridWidth / itemsPerRow;
  const baseRadius = Math.min(cellWidth * 0.38, height * 0.1);

  const centerYBase = height * 0.58;
  const rowSpacing = baseRadius * 3.5;
  const cy = centerYBase + (row - (rows - 1) / 2) * rowSpacing;

  const startX = width / 2 - gridWidth / 2;
  const cx = startX + cellWidth * (col + 0.5);

  const r = baseRadius;
  const hitR = r * 2.0;

  return { cx, cy, r, hitR };
}

function getSeedItemLayout(index) {
  const itemsPerRow = 4;
  const rows = Math.ceil(seeds.length / itemsPerRow);
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;

  const gridWidth = Math.min(width * 0.9, 880);
  const cellWidth = gridWidth / itemsPerRow;
  const baseSize = Math.min(cellWidth * 0.7, height * 0.2);

  const centerYBase = height * 0.6;
  const rowSpacing = baseSize * 1.9;
  const cy = centerYBase + (row - (rows - 1) / 2) * rowSpacing;

  const startX = width / 2 - gridWidth / 2;
  const cx = startX + cellWidth * (col + 0.5);

  const size = baseSize;
  const hitW = size * 1.7;
  const hitH = size * 1.7;

  return { cx, cy, size, hitW, hitH };
}

function getSoilItemLayout(index) {
  const itemsPerRow = 2;
  const rows = Math.ceil(soils.length / itemsPerRow);
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;

  const gridWidth = Math.min(width * 0.85, 720);
  const cellWidth = gridWidth / itemsPerRow;
  const baseW = Math.min(cellWidth * 0.85, width * 0.35);
  const baseH = baseW * 0.6;

  const centerYBase = height * 0.58;
  const rowSpacing = baseH * 2.3;
  const cy = centerYBase + (row - (rows - 1) / 2) * rowSpacing;

  const startX = width / 2 - gridWidth / 2;
  const cx = startX + cellWidth * (col + 0.5);

  const hitW = baseW * 1.4;
  const hitH = baseH * 1.6;

  return { cx, cy, w: baseW, h: baseH, hitW, hitH };
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
  handlePrimaryAction();
}

function handlePrimaryAction() {
  if (currentScene === "opening") {
    // Opening のあとに説明シーンへ
    currentScene = "openingGuide";
  } else if (currentScene === "openingGuide") {
    // 説明シーンの「次へ」ボタンで色選択へ
    handleOpeningGuideNextClick();
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

function handleOpeningGuideNextClick() {
  let btnW = Math.min(width * 0.5, 420);
  let btnH = 96;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  if (
    uiPointerX > btnX - btnW / 2 &&
    uiPointerX < btnX + btnW / 2 &&
    uiPointerY > btnY - btnH / 2 &&
    uiPointerY < btnY + btnH / 2
  ) {
    currentScene = "colorSelect";
    return true;
  }
  return false;
}

function handleWaterNextClick() {
  let btnW = Math.min(width * 0.45, 390);
  let btnH = 96;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  if (uiPointerX > btnX - btnW / 2 && uiPointerX < btnX + btnW / 2 && uiPointerY > btnY - btnH / 2 && uiPointerY < btnY + btnH / 2) {
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

  for (let i = 0; i < soils.length; i++) {
    let layout = getSoilItemLayout(i);
    let cx = layout.cx;
    let cy = layout.cy;
    let w = layout.w;
    let h = layout.h;
    let hitW = layout.hitW;
    let hitH = layout.hitH;

    let isHover = uiPointerX > cx - hitW / 2 && uiPointerX < cx + hitW / 2 && uiPointerY > cy - hitH / 2 && uiPointerY < cy + hitH / 2;
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
    rect(cx, cy, w * sizeFactor * 0.7, h * sizeFactor * 0.7, 8);

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

    // ラベル（少し大きめ・約60）
    fill(230);
    textAlign(CENTER, TOP);
    textSize(60);
    text(soils[i].label, cx, cy + h * sizeFactor * 0.7);
  }

  // 次のシーン（水）へ進むボタン
  let btnW = min(width * 0.6, 540);
  let btnH = 120;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  let isHoverNext = uiPointerX > btnX - btnW / 2 && uiPointerX < btnX + btnW / 2 && uiPointerY > btnY - btnH / 2 && uiPointerY < btnY + btnH / 2;

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(32);
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

  let paletteWidth = min(width * 0.8, 640);
  let itemWidth = paletteWidth / waters.length;
  let centerY = height * 0.55;
  waterButtons = [];

  for (let i = 0; i < waters.length; i++) {
    let cx = width / 2 - paletteWidth / 2 + itemWidth * (i + 0.5);
    let cy = centerY;
    let radius = itemWidth * 0.45;

    let isHover = dist(uiPointerX, uiPointerY, cx, cy) < radius * 1.2;
    let isSelected = i === selectedWaterIndex;

    let [r, g, b] = waters[i].color;
    let sizeFactor = isSelected ? 1.25 : isHover ? 1.12 : 1.0;

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
    textSize(28);
    text(waters[i].label, cx, cy + radius * sizeFactor + 10);

    waterButtons.push({ cx, cy, radius: radius * sizeFactor * 1.1, index: i });
  }

  // 次へ
  let btnW = min(width * 0.45, 390);
  let btnH = 96;
  let btnX = width * 0.8;
  let btnY = height * 0.86;
  waterNextButton = { x: btnX - btnW / 2, y: btnY - btnH / 2, w: btnW, h: btnH };

  let isHoverNext = isPointInsideRect(uiPointerX, uiPointerY, waterNextButton.x, waterNextButton.y, waterNextButton.w, waterNextButton.h);

  rectMode(CENTER);
  if (isHoverNext) {
    fill(255, 200, 230, 220);
  } else {
    fill(200, 160, 210, 200);
  }
  rect(btnX, btnY, btnW, btnH, 10);

  fill(40, 20, 60);
  textAlign(CENTER, CENTER);
  textSize(32);
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

  // growシーンでは、カメラの上に土色をフルスクリーンでは重ねず、
  // シード形状の内側だけにうっすら色を乗せる

  let reveal = progress > 0 ? constrain(pow(progress, 0.85), 0, 1) : 0;
  let outlineStrokeGrow = color(red(accentColor), green(accentColor), blue(accentColor), max(80, 180 * reveal));

  if (progress > 0) {
    let mainStroke = color(red(accentColor), green(accentColor), blue(accentColor), 235 * reveal);
    let outlineStroke = color(red(accentColor), green(accentColor), blue(accentColor), 120 * reveal);
    let ghostStroke = color(red(accentColor), green(accentColor), blue(accentColor), 50 * reveal);

    withSeedClip(currentShape, centerX, centerY, shapeSize, () => {
      // カメラ映像を優先したいので、土色のオーバーレイはごく薄くする
      fill(red(soilStyle.bgTint), green(soilStyle.bgTint), blue(soilStyle.bgTint), 15 * reveal);
      rect(0, 0, width, height);
      drawSpirograph(params, progress, {
        strokeWidth: soilStyle.strokeWeight + 0.6,
        strokeColor: mainStroke,
        outlineColor: outlineStroke,
        backgroundStrokeColor: ghostStroke,
        glowColor: mainStroke,
        glowStrength: 22,
        showMechanism: true,
        showMechanismArm: false,
        mechanismColor: outlineStroke,
      });
    });

    strokeSeedShape(currentShape, centerX, centerY, shapeSize, outlineStrokeGrow, 3.5, mainStroke);
  } else {
    strokeSeedShape(currentShape, centerX, centerY, shapeSize, outlineStrokeGrow, 3.5, outlineStrokeGrow);
  }

  // Progress bar
  rectMode(CORNER);
  let barWidth = Math.min(width * 0.5, 480);
  let barHeight = 14;
  let barX = (width - barWidth) / 2;
  // 花の少し下あたりに来るように位置を調整
  let barY = height * 0.74;
  noStroke();
  fill(255, 40);
  rect(barX, barY, barWidth, barHeight, 999);
  fill(red(accentColor), green(accentColor), blue(accentColor), 200);
  rect(barX, barY, barWidth * progress, barHeight, 999);

  // Instructions
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(28);
  text("手をぐるぐる回して成長させよう", width / 2, height * 0.15);

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

  let accentR = red(accentColor);
  let accentG = green(accentColor);
  let accentB = blue(accentColor);
  let mainStroke = color(accentR, accentG, accentB, 235);
  let outlineStroke = color(accentR, accentG, accentB, 150);
  let ghostStroke = color(accentR, accentG, accentB, 70);
  let glowStroke = color(255, 230, 245, 230);

  withSeedClip(currentShape, centerX, centerY, shapeSize, () => {
    // bloomシーンでも、カメラ映像を優先するため土色オーバーレイはかなり薄くする
    rectMode(CORNER);
    noStroke();
    fill(red(soilStyle.bgTint), green(soilStyle.bgTint), blue(soilStyle.bgTint), 15);
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

    // ホワイトのハイライトを重ねる
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

  // Buttons to restart journey
  let btnWidth = Math.min(width * 0.35, 260);
  let btnHeight = 70;
  bloomButtons = [
    { label: "Openingへ", target: "opening", x: width * 0.35 - btnWidth / 2, y: height * 0.8 - btnHeight / 2 },
    { label: "色選びへ", target: "colorSelect", x: width * 0.65 - btnWidth / 2, y: height * 0.8 - btnHeight / 2 },
  ];

  for (const btn of bloomButtons) {
    let hovering = isPointInsideRect(uiPointerX, uiPointerY, btn.x, btn.y, btnWidth, btnHeight);
    fill(hovering ? color(255, 200, 230, 230) : color(200, 160, 210, 200));
    rect(btn.x, btn.y, btnWidth, btnHeight, 12);
    fill(40, 20, 60);
    textAlign(CENTER, CENTER);
    textSize(32);
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

  let effectiveSize = size * (isSelected ? 1.3 : isHover ? 1.15 : 1.0);

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
    let starSize = size * (isSelected ? 1.1 : isHover ? 1.05 : 1.0);
    let half = starSize * 0.35;
    let full = starSize * 0.7;
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
  let totalSeeds = seeds.length;

  for (let i = 0; i < totalSeeds; i++) {
    let layout = getSeedItemLayout(i);
    let cx = layout.cx;
    let cy = layout.cy;
    let hitW = layout.hitW;
    let hitH = layout.hitH;

    if (
      uiPointerX > cx - hitW / 2 &&
      uiPointerX < cx + hitW / 2 &&
      uiPointerY > cy - hitH / 2 &&
      uiPointerY < cy + hitH / 2
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
  let totalColors = colors.length;

  for (let i = 0; i < totalColors; i++) {
    let layout = getColorItemLayout(i);
    let cx = layout.cx;
    let cy = layout.cy;
    let hitR = layout.hitR;

    if (dist(uiPointerX, uiPointerY, cx, cy) < hitR) {
      selectedColorIndex = i;
      accentColor = color(...colors[selectedColorIndex].value);
      break;
    }
  }
}

function handleSeedNextClick() {
  // drawSeedScene の「次へ」ボタンと同じサイズに合わせる
  let btnW = Math.min(width * 0.5, 420);
  let btnH = 96;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  if (uiPointerX > btnX - btnW / 2 && uiPointerX < btnX + btnW / 2 && uiPointerY > btnY - btnH / 2 && uiPointerY < btnY + btnH / 2) {
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
  // drawColorScene の「次へ」ボタンと同じサイズに合わせる
  let btnW = Math.min(width * 0.5, 420);
  let btnH = 96;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  if (uiPointerX > btnX - btnW / 2 && uiPointerX < btnX + btnW / 2 && uiPointerY > btnY - btnH / 2 && uiPointerY < btnY + btnH / 2) {
    seedSelectionPhase = 0;
    currentScene = "seedSelect";
    return true;
  }
  return false;
}

function handleSoilClick() {
  for (let i = 0; i < soils.length; i++) {
    let layout = getSoilItemLayout(i);
    let cx = layout.cx;
    let cy = layout.cy;
    let hitW = layout.hitW;
    let hitH = layout.hitH;

    if (uiPointerX > cx - hitW / 2 && uiPointerX < cx + hitW / 2 && uiPointerY > cy - hitH / 2 && uiPointerY < cy + hitH / 2) {
      selectedSoilIndex = i;
      break;
    }
  }
}

function handleSoilNextClick() {
  let btnW = Math.min(width * 0.6, 540);
  let btnH = 120;
  let btnX = width * 0.8;
  let btnY = height * 0.86;

  if (uiPointerX > btnX - btnW / 2 && uiPointerX < btnX + btnW / 2 && uiPointerY > btnY - btnH / 2 && uiPointerY < btnY + btnH / 2) {
    currentScene = "waterSelect";
    return true;
  }
  return false;
}

function handleWaterClick() {
  if (!waterButtons.length) return;
  for (const btn of waterButtons) {
    if (dist(uiPointerX, uiPointerY, btn.cx, btn.cy) < btn.radius) {
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
  let angle = atan2(uiPointerY - cy, uiPointerX - cx);

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
  const step = 0.008;

  push();
  translate(width / 2, height / 2);
  scale(scaleFactor);

  if (showMechanism) {
    // 養分の図形（内側で回っている形）を取得
    const nutrientShape = seeds[selectedNutrientIndex]?.shape || "circle";

    // 描画間隔（細かすぎると重くなり、粗すぎるとスカスカになるので調整）
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

  // 現在位置のメカニズム（ペン先と円）の描画
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
  // メカニズム描画終わり

  pop();
}

function isPointInsideRect(px, py, x, y, w, h) {
  return px >= x && py >= y && px <= x + w && py <= y + h;
}

function handleBloomClick() {
  if (!bloomButtons?.length) return;
  // drawBloomScene の再スタートボタンと同じサイズに合わせる
  const btnWidth = Math.min(width * 0.35, 260);
  const btnHeight = 70;
  for (const btn of bloomButtons) {
    if (isPointInsideRect(uiPointerX, uiPointerY, btn.x, btn.y, btnWidth, btnHeight)) {
      currentScene = btn.target === "opening" ? "opening" : "colorSelect";
      growProgress = 0;
      lastGrowAngle = null;
      return;
    }
  }
}
