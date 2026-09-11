// إعدادات قابلة للتعديل لضبط إحساس الجزيرة
const ISLAND_RADIUS = 22;   // نصف قطر اليابسة؛ كبّره لتطويل وقت المشي من طرف لطرف
const PLAYER_SPEED = 5;     // وحدات بالثانية
const PROXIMITY = 4;        // مسافة التفاعل مع نقاط الاهتمام (الحيط، الصيد، النار)
const CAMERA_HEIGHT = 6;    // ارتفاع الكاميرا فوق اللاعب
const CAMERA_BACK = 9;      // بعد الكاميرا وراء اللاعب

const HOUSE_CENTER = { x: 6, z: -6 };
const WALL_LENGTH = 6;
const WALL_HEIGHT = 2.2;
const WALL_THICKNESS = 0.3;
const WALL_SPECS = [
  { id: 'north', x: HOUSE_CENTER.x, z: HOUSE_CENTER.z - WALL_LENGTH / 2, rotY: 0 },
  { id: 'south', x: HOUSE_CENTER.x, z: HOUSE_CENTER.z + WALL_LENGTH / 2, rotY: 0 },
  { id: 'east', x: HOUSE_CENTER.x + WALL_LENGTH / 2, z: HOUSE_CENTER.z, rotY: Math.PI / 2 },
  { id: 'west', x: HOUSE_CENTER.x - WALL_LENGTH / 2, z: HOUSE_CENTER.z, rotY: Math.PI / 2 },
];

const FISH_POS = { x: 0, z: ISLAND_RADIUS - 4 };
const FIRE_POS = { x: -6, z: -6 };

const params = new URLSearchParams(location.search);
let islandId = params.get('island');
if (!islandId) {
  islandId = Math.random().toString(36).slice(2, 8);
  params.set('island', islandId);
  history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
}

let playerId = localStorage.getItem('silent-island-player-id');
if (!playerId) {
  playerId = 'p-' + Math.random().toString(36).slice(2, 10);
  localStorage.setItem('silent-island-player-id', playerId);
}

let role = localStorage.getItem('silent-island-role');

const db = firebase.database();
const islandRef = db.ref(`islands/${islandId}`);
const playersRef = islandRef.child('players');
const myPlayerRef = playersRef.child(playerId);
const inventoryRef = islandRef.child('sharedInventory');
const houseRef = islandRef.child('house');
const campfireRef = islandRef.child('campfire');
const placedFishRef = islandRef.child('placedFish');

let scene, camera, renderer;
let localGroup;
const wallGhosts = {};
const wallSolids = {};
let fireUnlit, fireFlame;
let houseDoor, houseWindowL, houseWindowR, houseRoof;
let waterMap;
const remoteGroups = {};
const placedFishMeshes = {};

const localPos = { x: 0, z: 0 };
let myHolding = null;
let carryingFish = false;
let houseState = {};
let campfireState = { fish: 0, lit: false };

const moveState = { up: false, down: false, left: false, right: false };

function makeSweaterTexture(text, bg) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Tahoma, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeSandTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e4d19a';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(170, 140, 90, 0.16)' : 'rgba(255, 245, 210, 0.28)';
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  return tex;
}

function makeWaterTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#49b0dd');
  grad.addColorStop(1, '#2e86b8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    const y = i * 28 + 8;
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.06 + i) * 5);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

function makeWoodTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = `rgba(60, 35, 15, ${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    const y = i * 9 + Math.random() * 4;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(32, y + 6, 96, y - 6, 128, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

function enableShadows(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return obj;
}

function buildCharacter(charRole) {
  const isBoy = charRole !== 'girl';
  const shirtColor = isBoy ? '#2f6fb0' : '#c9528f';
  const pantsColor = isBoy ? '#33404d' : '#4a3f5c';
  const skinColor = 0xe8b98d;
  const hairColor = isBoy ? 0x2b1d14 : 0x3a2418;
  const sweaterText = isBoy ? 'حبيب ريم' : 'حبيبة علي';

  const group = new THREE.Group();

  const legGeo = new THREE.CapsuleGeometry(0.16, 0.55, 4, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.75 });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.18, 0.4, 0);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.18, 0.4, 0);
  group.add(legL, legR);

  const shoeGeo = new THREE.BoxGeometry(0.22, 0.12, 0.32);
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(-0.18, 0.08, 0.05);
  const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
  shoeR.position.set(0.18, 0.08, 0.05);
  group.add(shoeL, shoeR);

  const torsoMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.5, 4, 10), torsoMat);
  torso.position.set(0, 1.3, 0);
  group.add(torso);

  const sweaterTex = makeSweaterTexture(sweaterText, shirtColor);
  const sweaterPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshStandardMaterial({ map: sweaterTex, roughness: 0.7 })
  );
  sweaterPlane.position.set(0, 1.3, 0.4);
  group.add(sweaterPlane);

  const armGeo = new THREE.CapsuleGeometry(0.11, 0.5, 4, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  const armL = new THREE.Mesh(armGeo, armMat);
  armL.position.set(-0.52, 1.32, 0);
  armL.rotation.z = 0.14;
  const armR = new THREE.Mesh(armGeo, armMat);
  armR.position.set(0.52, 1.32, 0);
  armR.rotation.z = -0.14;
  group.add(armL, armR);

  const handGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const handMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
  const handL = new THREE.Mesh(handGeo, handMat);
  handL.position.set(-0.6, 1.02, 0);
  const handR = new THREE.Mesh(handGeo, handMat);
  handR.position.set(0.6, 1.02, 0);
  group.add(handL, handR);

  const headGeo = new THREE.SphereGeometry(0.32, 16, 14);
  const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.55 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 2.0, 0);
  group.add(head);

  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85 });
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
    hairMat
  );
  hair.position.set(0, 2.06, 0);
  group.add(hair);

  return enableShadows(group);
}

function buildTree(x, z) {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.4, 7), trunkMat);
  trunk.position.y = 0.7;

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3c8a4c, roughness: 0.85 });
  const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.3, 8), leafMat);
  leaf1.position.y = 1.9;
  const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.1, 8), leafMat);
  leaf2.position.y = 2.6;
  const leaf3 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 8), leafMat);
  leaf3.position.y = 3.2;

  group.add(trunk, leaf1, leaf2, leaf3);
  group.position.set(x, 0, z);
  return enableShadows(group);
}

function triangleFin(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, height / 2);
  shape.lineTo(-width, 0);
  shape.lineTo(0, -height / 2);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function buildFish() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff9d4d, roughness: 0.4, metalness: 0.15 });
  const finMat = new THREE.MeshStandardMaterial({ color: 0xffcf9e, side: THREE.DoubleSide, roughness: 0.5 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), bodyMat);
  body.scale.set(1.7, 0.95, 0.75);
  group.add(body);

  const tail = new THREE.Mesh(triangleFin(0.24, 0.3), finMat);
  tail.rotation.y = Math.PI / 2;
  tail.position.set(-0.3, 0, 0);
  group.add(tail);

  const dorsal = new THREE.Mesh(triangleFin(0.16, 0.14), finMat);
  dorsal.rotation.x = -Math.PI / 2;
  dorsal.rotation.z = Math.PI / 2;
  dorsal.position.set(0.02, 0.16, 0);
  group.add(dorsal);

  const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.2, 0.05, 0.14);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.2, 0.05, -0.14);
  group.add(eyeL, eyeR);

  return enableShadows(group);
}

function buildRoof() {
  const group = new THREE.Group();
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7a3b2e, roughness: 0.8 });
  const panelGeo = new THREE.BoxGeometry(WALL_LENGTH + 0.7, 0.15, WALL_LENGTH / 2 + 0.6);

  const left = new THREE.Mesh(panelGeo, roofMat);
  left.position.set(HOUSE_CENTER.x, WALL_HEIGHT + 0.85, HOUSE_CENTER.z - WALL_LENGTH / 4 + 0.15);
  left.rotation.x = -0.5;

  const right = new THREE.Mesh(panelGeo, roofMat);
  right.position.set(HOUSE_CENTER.x, WALL_HEIGHT + 0.85, HOUSE_CENTER.z + WALL_LENGTH / 4 - 0.15);
  right.rotation.x = 0.5;

  group.add(left, right);
  group.visible = false;
  return enableShadows(group);
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe6ff);
  scene.fog = new THREE.Fog(0xbfe6ff, 45, 150);

  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.0);
  sun.position.set(24, 32, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -26;
  sun.shadow.camera.right = 26;
  sun.shadow.camera.top = 26;
  sun.shadow.camera.bottom = -26;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  scene.add(ambient, sun);

  waterMap = makeWaterTexture();
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(ISLAND_RADIUS * 4, 40),
    new THREE.MeshStandardMaterial({ map: waterMap, roughness: 0.25, metalness: 0.15, transparent: true, opacity: 0.94 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.2;
  water.receiveShadow = true;
  scene.add(water);

  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS * 1.08, 2, 24),
    new THREE.MeshStandardMaterial({ map: makeSandTexture(), roughness: 0.95 })
  );
  island.position.y = -1;
  island.receiveShadow = true;
  scene.add(island);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = ISLAND_RADIUS * (0.55 + Math.random() * 0.3);
    scene.add(buildTree(Math.cos(angle) * r, Math.sin(angle) * r));
  }

  const wallGeo = new THREE.BoxGeometry(WALL_LENGTH, WALL_HEIGHT, WALL_THICKNESS);
  const ghostMat = new THREE.MeshStandardMaterial({ color: 0x8bd67a, transparent: true, opacity: 0.4 });
  const solidMat = new THREE.MeshStandardMaterial({ map: makeWoodTexture(), roughness: 0.85 });
  WALL_SPECS.forEach((w) => {
    const ghost = new THREE.Mesh(wallGeo, ghostMat);
    ghost.position.set(w.x, WALL_HEIGHT / 2, w.z);
    ghost.rotation.y = w.rotY;
    scene.add(ghost);
    wallGhosts[w.id] = ghost;

    const solid = new THREE.Mesh(wallGeo, solidMat);
    solid.position.set(w.x, WALL_HEIGHT / 2, w.z);
    solid.rotation.y = w.rotY;
    solid.visible = false;
    solid.castShadow = true;
    solid.receiveShadow = true;
    scene.add(solid);
    wallSolids[w.id] = solid;
  });

  houseDoor = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.7, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x4a3423, roughness: 0.7 })
  );
  houseDoor.position.set(HOUSE_CENTER.x, 0.85, HOUSE_CENTER.z + WALL_LENGTH / 2 + 0.05);
  houseDoor.visible = false;
  houseDoor.castShadow = true;
  scene.add(houseDoor);

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xbfe6ff,
    roughness: 0.2,
    metalness: 0.25,
    emissive: 0x224466,
    emissiveIntensity: 0.15,
  });
  const windowGeo = new THREE.PlaneGeometry(0.8, 0.8);
  houseWindowL = new THREE.Mesh(windowGeo, windowMat);
  houseWindowL.position.set(HOUSE_CENTER.x - 1.5, 1.3, HOUSE_CENTER.z - WALL_LENGTH / 2 - 0.03);
  houseWindowR = new THREE.Mesh(windowGeo, windowMat);
  houseWindowR.position.set(HOUSE_CENTER.x + 1.5, 1.3, HOUSE_CENTER.z - WALL_LENGTH / 2 - 0.03);
  houseWindowL.visible = houseWindowR.visible = false;
  scene.add(houseWindowL, houseWindowR);

  houseRoof = buildRoof();
  scene.add(houseRoof);

  const fishMarker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.15, 12),
    new THREE.MeshStandardMaterial({ color: 0xf2d33c, roughness: 0.6 })
  );
  fishMarker.position.set(FISH_POS.x, 0.05, FISH_POS.z);
  fishMarker.receiveShadow = true;
  scene.add(fishMarker);

  fireUnlit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 0.4, 10),
    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 })
  );
  fireUnlit.position.set(FIRE_POS.x, 0.2, FIRE_POS.z);
  fireUnlit.castShadow = true;
  fireUnlit.receiveShadow = true;
  scene.add(fireUnlit);

  fireFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.9, 10),
    new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xaa3300, roughness: 0.4 })
  );
  fireFlame.position.set(FIRE_POS.x, 0.9, FIRE_POS.z);
  fireFlame.visible = false;
  scene.add(fireFlame);

  localPos.x = role === 'girl' ? 2 : -2;
  localPos.z = 3;
  localGroup = buildCharacter(role);
  localGroup.position.set(localPos.x, 0, localPos.z);
  scene.add(localGroup);

  playersRef.on('child_added', onRemoteSnapshot);
  playersRef.on('child_changed', onRemoteSnapshot);
  playersRef.on('child_removed', (snap) => {
    const g = remoteGroups[snap.key];
    if (g) {
      scene.remove(g);
      delete remoteGroups[snap.key];
    }
  });

  myPlayerRef.child('holding').on('value', (snap) => {
    myHolding = snap.val();
    updateHoldingBadge();
  });

  myPlayerRef.child('carryingFish').on('value', (snap) => {
    carryingFish = !!snap.val();
    updateFishBadge();
  });

  placedFishRef.on('child_added', (snap) => {
    const data = snap.val();
    if (!data) return;
    const fish = buildFish();
    fish.position.set(data.x, 0.15, data.z);
    fish.rotation.y = data.rotY ?? 0;
    scene.add(fish);
    placedFishMeshes[snap.key] = fish;
  });

  inventoryRef.transaction((cur) => cur || { wood: 10, rods: 2 });
  inventoryRef.on('value', (snap) => updateInventoryUI(snap.val() || {}));

  houseRef.on('value', (snap) => {
    houseState = snap.val() || {};
    const walls = houseState.walls || {};
    WALL_SPECS.forEach((w) => {
      const built = !!walls[w.id];
      wallGhosts[w.id].visible = !built;
      wallSolids[w.id].visible = built;
    });
    houseDoor.visible = !!walls.south;
    houseWindowL.visible = !!walls.north;
    houseWindowR.visible = !!walls.north;
    houseRoof.visible = WALL_SPECS.every((w) => walls[w.id]);
  });

  campfireRef.on('value', (snap) => {
    campfireState = snap.val() || { fish: 0, lit: false };
    fireFlame.visible = !!campfireState.lit;
    fireUnlit.material.color.set(campfireState.lit ? 0x333333 : 0x555555);
  });

  myPlayerRef.update({ role, x: localPos.x, z: localPos.z, online: true });
  myPlayerRef.onDisconnect().update({ online: false });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  requestAnimationFrame(loop);
}

function onRemoteSnapshot(snap) {
  if (snap.key === playerId) return;
  const data = snap.val();
  if (!data) return;
  let g = remoteGroups[snap.key];
  if (!g) {
    g = buildCharacter(data.role);
    scene.add(g);
    remoteGroups[snap.key] = g;
  }
  g.position.set(data.x ?? 0, 0, data.z ?? 0);
}

function updateInventoryUI(data) {
  document.getElementById('wood-count').textContent = data.wood ?? 0;
  document.getElementById('rod-count').textContent = data.rods ?? 0;
}

function updateHoldingBadge() {
  const badge = document.getElementById('holding-badge');
  if (myHolding === 'wood') {
    badge.textContent = '✋ ماسك خشب';
    badge.classList.remove('hidden');
  } else if (myHolding === 'rod') {
    badge.textContent = '✋ ماسك سنارة';
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function updateFishBadge() {
  const badge = document.getElementById('fish-badge');
  if (carryingFish) {
    badge.textContent = '🐟 ماسك سمكة - حطها بمكان حلو!';
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function dist2D(x1, z1, x2, z2) {
  return Math.hypot(x1 - x2, z1 - z2);
}

function nearestUnbuiltWall() {
  const walls = houseState.walls || {};
  let best = null;
  let bestDist = Infinity;
  WALL_SPECS.forEach((w) => {
    if (walls[w.id]) return;
    const d = dist2D(localPos.x, localPos.z, w.x, w.z);
    if (d < bestDist) {
      bestDist = d;
      best = w;
    }
  });
  return best ? { wall: best, dist: bestDist } : null;
}

function houseComplete() {
  const walls = houseState.walls || {};
  return WALL_SPECS.every((w) => walls[w.id]);
}

function updateActionButton() {
  const btn = document.getElementById('action-btn');
  const nearestWall = nearestUnbuiltWall();
  const nearFish = dist2D(localPos.x, localPos.z, FISH_POS.x, FISH_POS.z) < PROXIMITY;
  const nearFire = dist2D(localPos.x, localPos.z, FIRE_POS.x, FIRE_POS.z) < PROXIMITY;

  btn.onclick = null;
  if (myHolding === 'wood' && nearestWall && nearestWall.dist < PROXIMITY) {
    btn.textContent = 'ابني الحيط 🧱';
    btn.classList.remove('hidden');
    btn.onclick = () => buildWall(nearestWall.wall.id);
  } else if (carryingFish) {
    btn.textContent = 'حط السمكة هون 🐟';
    btn.classList.remove('hidden');
    btn.onclick = placeFish;
  } else if (myHolding === 'rod' && nearFish) {
    btn.textContent = 'اصطد سمكة 🎣';
    btn.classList.remove('hidden');
    btn.onclick = catchFish;
  } else if (nearFire && (campfireState.fish || 0) > 0 && !campfireState.lit) {
    btn.textContent = 'حط السمكة عالنار 🔥';
    btn.classList.remove('hidden');
    btn.onclick = lightFire;
  } else {
    btn.classList.add('hidden');
  }
}

function updateHint() {
  const hint = document.getElementById('hint');
  let text = '';

  if (myHolding === 'wood' && !houseComplete()) {
    const nearest = nearestUnbuiltWall();
    if (nearest && nearest.dist >= PROXIMITY) {
      text = `🧱 امشِ نحو الحيط (${Math.round(nearest.dist)} م)`;
    }
  } else if (carryingFish) {
    text = '';
  } else if (myHolding === 'rod') {
    if ((campfireState.fish || 0) > 0 && !campfireState.lit) {
      const d = Math.round(dist2D(localPos.x, localPos.z, FIRE_POS.x, FIRE_POS.z));
      if (d >= PROXIMITY) text = `🔥 رجّع عالنار حتى تشعلها (${d} م)`;
    } else {
      const d = Math.round(dist2D(localPos.x, localPos.z, FISH_POS.x, FISH_POS.z));
      if (d >= PROXIMITY) text = `🎣 امشِ لمكان الصيد (${d} م)`;
    }
  } else if (!houseComplete()) {
    text = '🎒 افتح قائمة التجهيز واسحب خشب حتى تبني حيط من البيت';
  }

  hint.textContent = text;
  hint.classList.toggle('hidden', !text);
}

function buildWall(id) {
  houseRef.child('walls').child(id).set(true);
  myPlayerRef.child('holding').set(null);
}

function catchFish() {
  campfireRef.child('fish').transaction((v) => (v || 0) + 1);
  myPlayerRef.child('carryingFish').set(true);
}

function placeFish() {
  placedFishRef.push({ x: localPos.x, z: localPos.z, rotY: Math.random() * Math.PI * 2 });
  myPlayerRef.child('carryingFish').set(false);
}

function lightFire() {
  campfireRef.child('fish').transaction((v) => ((v || 0) > 0 ? v - 1 : v));
  campfireRef.update({ lit: true });
}

let lastSyncAt = 0;
function syncPosition(now) {
  if (now - lastSyncAt < 120) return;
  lastSyncAt = now;
  myPlayerRef.update({ x: localPos.x, z: localPos.z, role, online: true });
}

function updateCamera() {
  const desired = new THREE.Vector3(localPos.x, CAMERA_HEIGHT, localPos.z + CAMERA_BACK);
  camera.position.lerp(desired, 0.08);
  camera.lookAt(localPos.x, 1, localPos.z);
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  let dx = 0;
  let dz = 0;
  if (moveState.up) dz -= 1;
  if (moveState.down) dz += 1;
  if (moveState.left) dx -= 1;
  if (moveState.right) dx += 1;

  if (dx !== 0 || dz !== 0) {
    const len = Math.hypot(dx, dz);
    dx = (dx / len) * PLAYER_SPEED * dt;
    dz = (dz / len) * PLAYER_SPEED * dt;
    let nx = localPos.x + dx;
    let nz = localPos.z + dz;
    const dist = Math.hypot(nx, nz);
    const maxDist = ISLAND_RADIUS - 3;
    if (dist > maxDist) {
      const scale = maxDist / dist;
      nx *= scale;
      nz *= scale;
    }
    localPos.x = nx;
    localPos.z = nz;
    localGroup.position.set(nx, 0, nz);
    localGroup.rotation.y = Math.atan2(dx, dz);
  }

  if (waterMap) {
    waterMap.offset.x += dt * 0.02;
    waterMap.offset.y += dt * 0.01;
  }

  syncPosition(now);
  updateActionButton();
  updateHint();
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function bindHold(el, dir) {
  const set = (v) => (e) => {
    e.preventDefault();
    moveState[dir] = v;
  };
  el.addEventListener('pointerdown', set(true));
  el.addEventListener('pointerup', set(false));
  el.addEventListener('pointerleave', set(false));
  el.addEventListener('pointercancel', set(false));
}
bindHold(document.getElementById('btn-up'), 'up');
bindHold(document.getElementById('btn-down'), 'down');
bindHold(document.getElementById('btn-left'), 'left');
bindHold(document.getElementById('btn-right'), 'right');

addEventListener('keydown', (e) => setKeyDir(e.key, true));
addEventListener('keyup', (e) => setKeyDir(e.key, false));
function setKeyDir(key, val) {
  if (key === 'ArrowUp') moveState.up = val;
  if (key === 'ArrowDown') moveState.down = val;
  if (key === 'ArrowLeft') moveState.left = val;
  if (key === 'ArrowRight') moveState.right = val;
}

document.getElementById('inventory-btn').onclick = () => {
  document.getElementById('inventory-panel').classList.toggle('hidden');
};
document.getElementById('close-inventory-btn').onclick = () => {
  document.getElementById('inventory-panel').classList.add('hidden');
};

document.getElementById('take-wood-btn').onclick = () => {
  inventoryRef.child('wood').transaction(
    (v) => ((v || 0) > 0 ? v - 1 : v),
    (err, committed) => {
      if (!err && committed) myPlayerRef.child('holding').set('wood');
    }
  );
};
document.getElementById('take-rod-btn').onclick = () => {
  inventoryRef.child('rods').transaction(
    (v) => ((v || 0) > 0 ? v - 1 : v),
    (err, committed) => {
      if (!err && committed) myPlayerRef.child('holding').set('rod');
    }
  );
};

document.getElementById('share-link-btn').onclick = async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    alert('✅ انسخ الرابط! ابعتيه لصاحبك/صاحبتك.');
  } catch (e) {
    prompt('انسخ هيدا الرابط:', location.href);
  }
};

function startGame() {
  document.getElementById('role-modal').classList.add('hidden');
  initScene();
}

document.getElementById('role-boy').onclick = () => {
  role = 'boy';
  localStorage.setItem('silent-island-role', role);
  startGame();
};
document.getElementById('role-girl').onclick = () => {
  role = 'girl';
  localStorage.setItem('silent-island-role', role);
  startGame();
};

if (role) startGame();
