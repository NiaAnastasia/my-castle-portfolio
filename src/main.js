import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";
import { startDragonAnimation } from "./loadingAnimation";

const canvas = document.getElementById("dragon-canvas");
const stopAnimation = startDragonAnimation(canvas);

k.loadSprite("player", "./player.png", {
  sliceX: 6,
  sliceY: 3,
  anims: {
    "idle-down": 0,
    "walk-down": { from: 0, to: 5, loop: true, speed: 8 },
    "idle-side": 6,
    "walk-side": { from: 6, to: 11, loop: true, speed: 8 },
    "idle-up": 12,
    "walk-up": { from: 12, to: 17, loop: true, speed: 8 },
  },
});

k.loadSprite("map", "./map.png");

k.loadSprite("guardian", "./guardian.png", {
  sliceX: 8,
  sliceY: 1,
  anims: {
    idle: { from: 0, to: 0, loop: true, speed: 1 },
  },
});

k.loadSprite("bread", "./bread.png");

k.setBackground(k.Color.fromHex("#000000"));

const churchMusic = new Audio("./church-music.mp3");
churchMusic.loop = true;
churchMusic.volume = 0.3;

const fireAmbient = new Audio("./fire-ambient.mp3");
fireAmbient.loop = true;
fireAmbient.volume = 0.2;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playFootstep() {
  if (!audioEnabled) return;
  const buffer = audioCtx.createBuffer(
    1,
    audioCtx.sampleRate * 0.08,
    audioCtx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  filter.Q.value = 0.5;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.7;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

let footstepInterval = null;

function startFootsteps() {
  if (footstepInterval) return;
  footstepInterval = setInterval(playFootstep, 420);
}

function stopFootsteps() {
  clearInterval(footstepInterval);
  footstepInterval = null;
}

//  asking click before playing audio
document.addEventListener(
  "click",
  () => {
    churchMusic.play();
    fireAmbient.play();
  },
  { once: true },
);

let audioEnabled = true;
const audioBtn = document.getElementById("audio-toggle");

audioBtn.addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  if (audioEnabled) {
    churchMusic.play();
    fireAmbient.play();
    document.getElementById("audio-icon").src = "./music-on.svg";
  } else {
    churchMusic.pause();
    fireAmbient.pause();
    stopFootsteps();
    document.getElementById("audio-icon").src = "./music-off.svg";
  }
});

k.scene("main", async () => {
  const mapData = await (await fetch("./map.json")).json();
  const layers = mapData.layers;

  const map = k.add([k.sprite("map"), k.pos(0, 0), k.scale(1)]);

  const player = k.make([
    k.sprite("player", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 6), 28, 28),
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);

  function revealAllPoints() {
    // эффект салюта из хлебов
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const crumb = k.add([
        k.text("🍞", { size: 14 }),
        k.pos(player.pos),
        k.anchor("center"),
        k.z(50),
        {
          vel: k.vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
          life: 1.2,
        },
      ]);
      k.onUpdate(() => {
        if (!crumb.exists()) return;
        crumb.pos.x += crumb.vel.x * k.dt();
        crumb.pos.y += crumb.vel.y * k.dt();
        crumb.vel.y += 120 * k.dt();
        crumb.life -= k.dt();
        crumb.opacity = Math.max(0, crumb.life);
        if (crumb.life <= 0) crumb.destroy();
      });
    }

    // markers for all points of interest
    const pointNames = [
      "piano",
      "pc",
      "library",
      "about",
      "resume",
      "contacts",
      "artwork",
      "church-art",
      "mirror",
      "food",
      "fashion",
    ];

    for (const name of pointNames) {
      const pos = boundaryPositions[name];
      if (!pos) continue;

      const marker = k.add([
        k.text("▼", { size: 24 }),
        k.anchor("center"),
        k.pos(pos.x, pos.y - 30),
        k.color(k.Color.fromHex("#FFD700")),
        k.z(20),
      ]);

      const glow = k.add([
        k.text("▼", { size: 32 }),
        k.anchor("center"),
        k.pos(pos.x, pos.y - 30),
        k.color(k.Color.fromHex("#c9a84c")),
        k.z(19),
      ]);

      k.onUpdate(() => {
        if (!marker.exists()) return;
        const bounce = Math.sin(k.time() * 4) * 6;
        marker.pos.y = pos.y - 30 + bounce;
        glow.pos.y = pos.y - 30 + bounce;
        marker.opacity = 1;
        glow.opacity = 0.3 + Math.sin(k.time() * 3) * 0.2;
      });
    }
  }
  let breadCount = 0;
  const boundaryPositions = {};

  for (const layer of layers) {
    if (layer.name === "boundaries") {
      for (const boundary of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name,
        ]);

        if (boundary.name) {
          boundaryPositions[boundary.name] = k.vec2(
            boundary.x + boundary.width / 2,
            boundary.y - 20,
          );

          player.onCollide(boundary.name, () => {
            player.isInDialogue = true;
            displayDialogue(
              dialogueData[boundary.name],
              () => (player.isInDialogue = false),
            );
          });
        }
      }
      continue;
    }

    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = k.vec2(entity.x, entity.y);
          k.add(player);
          continue;
        }

        if (entity.name === "guardian") {
          const guardianBaseY = entity.y;
          const guardian = k.add([
            k.sprite("guardian", { anim: "idle" }),
            k.anchor("center"),
            k.pos(entity.x, entity.y),
            k.scale(scaleFactor),
            k.area({ shape: new k.Rect(k.vec2(0, 0), 60, 80) }),
            k.z(10),
            "guardian",
          ]);

          k.onUpdate(() => {
            guardian.pos.y = guardianBaseY + Math.sin(k.time() * 2) * 3;
          });

          player.onCollide("guardian", () => {
            if (player.isInDialogue) return;
            player.isInDialogue = true;
            displayDialogue(dialogueData[`guardian-${breadCount}`], () => {
              player.isInDialogue = false;
              if (breadCount === 3) {
                revealAllPoints();
                document.getElementById("bread-counter").style.display = "none";
              }
            });

            // show bread counter on first collision with guardian
            const counter = document.getElementById("bread-counter");
            counter.style.display = "block";
            document.getElementById("bread-count").textContent = breadCount;
          });
          continue;
        }

        if (entity.name.startsWith("bread")) {
          const breadObj = k.add([
            k.sprite("bread"),
            k.anchor("center"),
            k.pos(entity.x, entity.y),
            k.scale(scaleFactor),
            k.area({ shape: new k.Rect(k.vec2(0, 0), 32, 32) }),
            k.z(10),
            entity.name,
            "bread",
          ]);

          // мерцающая звёздочка над хлебом
          const star = k.add([
            k.text("✦", { size: 16 }),
            k.pos(entity.x, entity.y - 40),
            k.anchor("center"),
            k.color(k.Color.fromHex("#c9a84c")),
            k.z(11),
            entity.name + "-star",
          ]);

          k.onUpdate(() => {
            star.pos.y = entity.y - 40 + Math.sin(k.time() * 4) * 4;
            star.opacity = 0.6 + Math.sin(k.time() * 3) * 0.4;
          });

          player.onCollide(entity.name, () => {
            if (player.isInDialogue) return;
            player.isInDialogue = true;
            displayDialogue(dialogueData[entity.name], () => {
              player.isInDialogue = false;
              breadObj.destroy();
              star.destroy();
              breadCount++;
              document.getElementById("bread-count").textContent = breadCount;
            });
          });
          continue;
        }
      }
    }
  }

  // intro dialogue after loading
  setTimeout(() => {
    player.isInDialogue = true;
    displayDialogue(`*yawns* Where am I... This place looks ancient.`, () => {
      setTimeout(() => {
        displayDialogue(
          `There's someone standing near the stained glass... Maybe I should talk to them?`,
          () => {
            setTimeout(() => {
              displayDialogue(
                `And what are those glowing lights around the hall? Let's explore!`,
                () => {
                  player.isInDialogue = false;
                },
              );
            }, 100);
          },
        );
      }, 100);
    });
  }, 5500);

  k.camPos(player.worldPos().x, player.worldPos().y);
  setCamScale(k);

  k.onResize(() => {
    setCamScale(k);
  });

  k.onUpdate(() => {
    k.camPos(player.worldPos().x, player.worldPos().y);
  });

  k.onMouseDown((mouseBtn) => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    startFootsteps();
    if (mouseBtn !== "left" || player.isInDialogue) return;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.curAnim() !== "walk-up"
    ) {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (
      mouseAngle < -lowerBound &&
      mouseAngle > -upperBound &&
      player.curAnim() !== "walk-down"
    ) {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  function stopAnims() {
    if (player.direction === "down") {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up") {
      player.play("idle-up");
      return;
    }

    player.play("idle-side");
  }

  k.onMouseRelease(() => {
    stopAnims();
    stopFootsteps();
  });

  k.onKeyRelease(() => {
    stopAnims();
    stopFootsteps();
  });
  k.onKeyDown((key) => {
    const keyMap = [
      k.isKeyDown("right"),
      k.isKeyDown("left"),
      k.isKeyDown("up"),
      k.isKeyDown("down"),
    ];

    let nbOfKeyPressed = 0;
    for (const key of keyMap) {
      if (key) {
        nbOfKeyPressed++;
      }
    }

    if (nbOfKeyPressed > 1) return;

    if (player.isInDialogue) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    startFootsteps();
    if (keyMap[0]) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      player.move(player.speed, 0);
      return;
    }

    if (keyMap[1]) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      player.move(-player.speed, 0);
      return;
    }

    if (keyMap[2]) {
      if (player.curAnim() !== "walk-up") player.play("walk-up");
      player.direction = "up";
      player.move(0, -player.speed);
      return;
    }

    if (keyMap[3]) {
      if (player.curAnim() !== "walk-down") player.play("walk-down");
      player.direction = "down";
      player.move(0, player.speed);
    }
  });
});

k.go("main");

// take care of loading screen
const loading = document.getElementById("loading-screen");
if (loading) {
  setTimeout(() => {
    stopAnimation();
    loading.style.opacity = "0";
    setTimeout(() => (loading.style.display = "none"), 1500);
  }, 5000);
}

// Particles
const particlesCanvas = document.getElementById("particles-canvas");
const ctx = particlesCanvas.getContext("2d");

function resizeParticles() {
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;
}
resizeParticles();
window.addEventListener("resize", resizeParticles);

const particles = Array.from({ length: 60 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  size: Math.random() * 3 + 1.5,
  speedY: Math.random() * 0.4 + 0.1,
  speedX: (Math.random() - 0.5) * 0.3,
  opacity: Math.random() * 0.4 + 0.6,
  rotation: Math.random() * Math.PI * 2,
  rotationSpeed: (Math.random() - 0.5) * 0.05,
}));

function animateParticles() {
  ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
  for (const p of particles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.lineTo(0, p.size * 2);
      ctx.lineTo(p.size * 0.5, p.size * 0.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    p.y += p.speedY;
    p.x += p.speedX;
    p.opacity -= 0.001;
    p.rotation += p.rotationSpeed;

    if (p.y > particlesCanvas.height || p.opacity <= 0) {
      p.x = Math.random() * particlesCanvas.width;
      p.y = -5;
      p.opacity = Math.random() * 0.6 + 0.2;
    }
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();
