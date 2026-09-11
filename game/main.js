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

let scene, camera, renderer;
let localGroup;
const wallGhosts = {};
const wallSolids = {};
let fireUnlit, fireFlame;
const remoteGroups = {};

const localPos = { x: 0, z: 0 };
let myHolding = null;
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

function buildCharacter(charRole) {
  const isBoy = charRole !== 'girl';
  const shirtColor = isBoy ? '#2f6fb0' : '#c9528f';
  const pantsColor = isBoy ? '#33404d' : '#4a3f5c';
  const sweaterText = isBoy ? 'حبيب ريم' : 'حبيبة علي';

  const group = new THREE.Group();

  const legGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
  const legMat = new THREE.MeshStandardMaterial({ color: pantsColor });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.22, 0.45, 0);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.22, 0.45, 0);
  group.add(legL, legR);

  const torsoGeo = new THREE.BoxGeometry(0.9, 1.0, 0.5);
  const plainMat = new THREE.MeshStandardMaterial({ color: shirtColor });
  const frontMat = new THREE.MeshStandardMaterial({ map: makeSweaterTexture(sweaterText, shirtColor) });
  // ترتيب أوجه BoxGeometry: [+x, -x, +y, -y, +z, -z] — النص محطوط عالوجه الأمامي (+z) بس
  const torso = new THREE.Mesh(torsoGeo, [plainMat, plainMat, plainMat, plainMat, frontMat, plainMat]);
  torso.position.set(0, 1.4, 0);
  group.add(torso);

  const armGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
  const armL = new THREE.Mesh(armGeo, plainMat);
  armL.position.set(-0.65, 1.4, 0);
  const armR = new THREE.Mesh(armGeo, plainMat);
  armR.position.set(0.65, 1.4, 0);
  group.add(armL, armR);

  const headGeo = new THREE.SphereGeometry(0.35, 12, 10);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xe8b98d });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 2.15, 0);
  group.add(head);

  return group;
}

function buildTree(x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2f })
  );
  trunk.position.y = 0.7;
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 2, 7),
    new THREE.MeshStandardMaterial({ color: 0x3c8a4c })
  );
  leaves.position.y = 2.1;
  group.add(trunk, leaves);
  group.position.set(x, 0, z);
  return group;
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe6ff);

  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const sun = new THREE.DirectionalLight(0xfff3d6, 0.9);
  sun.position.set(30, 40, 10);
  scene.add(ambient, sun);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(ISLAND_RADIUS * 4, 32),
    new THREE.MeshStandardMaterial({ color: 0x3fa7d6 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.2;
  scene.add(water);

  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS * 1.08, 2, 8),
    new THREE.MeshStandardMaterial({ color: 0xe4d19a })
  );
  island.position.y = -1;
  scene.add(island);

  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const r = ISLAND_RADIUS * (0.55 + Math.random() * 0.3);
    scene.add(buildTree(Math.cos(angle) * r, Math.sin(angle) * r));
  }

  const wallGeo = new THREE.BoxGeometry(WALL_LENGTH, WALL_HEIGHT, WALL_THICKNESS);
  const ghostMat = new THREE.MeshStandardMaterial({ color: 0x8bd67a, transparent: true, opacity: 0.4 });
  const solidMat = new THREE.MeshStandardMaterial({ color: 0x8a5a34 });
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
    scene.add(solid);
    wallSolids[w.id] = solid;
  });

  const fishMarker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.15, 10),
    new THREE.MeshStandardMaterial({ color: 0xf2d33c })
  );
  fishMarker.position.set(FISH_POS.x, 0.05, FISH_POS.z);
  scene.add(fishMarker);

  fireUnlit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  fireUnlit.position.set(FIRE_POS.x, 0.2, FIRE_POS.z);
  scene.add(fireUnlit);

  fireFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xaa3300 })
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
