import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = path.resolve(import.meta.dirname, '..');
const original = await fs.readFile(path.join(import.meta.dirname, 'labs-logo-original.svg'), 'utf8');
const paths = [...original.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*\/>/g)].map(m => m[1]);
if (paths.length !== 3) throw new Error(`Expected the three original Figma paths, got ${paths.length}`);

function sampleCubicPath(d, steps = 32) {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);
  let i = 0, command = '', x = 0, y = 0;
  const points = [];
  const next = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/^[a-z]$/i.test(tokens[i])) command = tokens[i++];
    if (command === 'M') {
      x = next(); y = next(); points.push([x, y]); command = 'L';
    } else if (command === 'L') {
      x = next(); y = next(); points.push([x, y]);
    } else if (command === 'C') {
      const x1 = next(), y1 = next(), x2 = next(), y2 = next(), x3 = next(), y3 = next();
      for (let k = 1; k <= steps; k++) {
        const t = k / steps, u = 1 - t;
        points.push([u*u*u*x + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3,
          u*u*u*y + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3]);
      }
      x = x3; y = y3;
    } else if (command === 'Z' || command === 'z') {
      command = '';
    } else {
      throw new Error(`Unexpected path command ${command}`);
    }
  }
  return points;
}

const bodySource = sampleCubicPath(paths[1]);
// Dimensions are measured from the original blue halo after straightening it.
const ringCenter = {x: 51.46, y: 52.8};
const ringHorizontalScale = 0.97;
const ringLeftInner = -39.5 * ringHorizontalScale;
const ringRightInner = 39.2 * ringHorizontalScale;
const canvasCenter = {x: 51.5, y: 51.5};
const bodyCenter = {x: 51.4587, y: 52.4602};
const fmt = n => (Math.round(n * 1000) / 1000).toFixed(3);
const gauss = (v, width) => Math.exp(-0.5 * (v / width) ** 2);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// The GIF preview uses a separate, evenly spaced 50 fps sampling over 1.26 s.
// Its temporary frames are separate from the 24/60 fps deliverable.
const gifPreview = process.env.LABS_GIF_PREVIEW === '1';
const outputRoot = gifPreview && process.env.LABS_GIF_OUTPUT_ROOT
  ? path.resolve(process.env.LABS_GIF_OUTPUT_ROOT) : root;
const internalSamples = gifPreview ? 126 : 150;
const internalFps = gifPreview ? 100 : 120;

function geometry(frame) {
  const phase = 2 * Math.PI * frame / internalSamples;
  const sway = Math.sin(phase);
  const travel = 0.65*sway + 0.35*sway**3;
  // Symmetric world angles: ring left => left edge lower; right => right lower.
  const angle = 14 * travel;
  const radians = angle * Math.PI / 180;
  // Continuous single-lobed orbit, based on version 2. A lowered baseline
  // keeps impacts close to the waist without dragging the hoop down twice.
  const ringX = 8.1 * travel;
  const ringY = bodyCenter.y-ringCenter.y + 6.2 + 1.2*Math.cos(phase);
  const ellipseScale = 0.88 + 0.08*Math.cos(phase);
  const center = {x: ringCenter.x + ringX, y: ringCenter.y + ringY};
  const planetOffset = -1.0 * sway;
  const planetAngle = -0.8 * sway * Math.PI / 180;
  const cosBody = Math.cos(planetAngle), sinBody = Math.sin(planetAngle);
  const body = bodySource.map(([x,y]) => {
    const dx = x-bodyCenter.x, dy = y-bodyCenter.y;
    return [bodyCenter.x + dx*cosBody-dy*sinBody + planetOffset,
      bodyCenter.y + dx*sinBody+dy*cosBody];
  });
  const cos = Math.cos(radians), sin = Math.sin(radians);
  const toRing = ([x,y]) => [(x-center.x)*cos + (y-center.y)*sin,
    -(x-center.x)*sin + (y-center.y)*cos];
  const outline = body.map(toRing);
  const intersections = [];
  for (let i=0; i<outline.length; i++) {
    const [u1,v1] = outline[i], [u2,v2] = outline[(i+1)%outline.length];
    if ((v1 <= 0 && v2 > 0) || (v2 <= 0 && v1 > 0)) {
      const t = -v1/(v2-v1);
      intersections.push(u1 + t*(u2-u1));
    }
  }
  if (intersections.length !== 2) throw new Error(`Expected 2 waist intersections, got ${intersections.length}`);
  const lo = Math.min(...intersections), hi = Math.max(...intersections);
  return {phase,sway,angle,ringX,ringY,ellipseScale,center,body,planetOffset,cos,sin,toRing,
    bodyCenterU: toRing([bodyCenter.x+planetOffset, bodyCenter.y])[0],
    leftOverlap: Math.max(0, ringLeftInner-lo), rightOverlap: Math.max(0, hi-ringRightInner),
    leftGap: lo-ringLeftInner, rightGap: ringRightInner-hi};
}

const states = Array.from({length:internalSamples}, (_,i) => geometry(i));
// The collision target comes from the measured contact gap. During separation,
// the indentation decays over a few frames as a soft rebound. Run several cycles
// first so the physics state is periodic across the frame-30/frame-01 seam.
let left = 0, right = 0;
const reboundDecay = 0.62 ** (24/internalFps);
for (let cycle=0; cycle<12; cycle++) {
  for (const s of states) {
    left = Math.max(s.leftOverlap, left*reboundDecay);
    right = Math.max(s.rightOverlap, right*reboundDecay);
    if (left < 0.015) left = 0;
    if (right < 0.015) right = 0;
    s.leftPress = left;
    s.rightPress = right;
  }
}

function deformBody(s) {
  return s.body.map(p => {
    const [u,v] = s.toRing(p);
    const relativeU = u-s.bodyCenterU;
    const sideT = clamp((Math.abs(relativeU)-16)/12,0,1);
    const side = sideT*sideT*(3-2*sideT);
    const isLeft = relativeU < 0;
    const pressure = isLeft ? s.leftPress : s.rightPress;
    // Half the previous influence width, centered at the waist. A smooth
    // cutoff makes the pressure exactly zero outside this local region so the
    // head and distinctive bumps retain their original shape.
    const cutoffT = clamp((Math.abs(v)-8)/4,0,1);
    const cutoff = 1-cutoffT*cutoffT*(3-2*cutoffT);
    // Also bound the influence in the planet's vertical coordinates: a
    // tilted hoop must not pull the head or neck toward the contact point.
    const waistT = clamp((Math.abs(p[1]-bodyCenter.y)-8)/4,0,1);
    const waistWindow = 1-waistT*waistT*(3-2*waistT);
    const profile = gauss(v,4.75)*cutoff*waistWindow;
    const du = (isLeft ? 1 : -1)*pressure*side*profile;
    return [p[0]+du*s.cos, p[1]+du*s.sin];
  });
}

function constrainedGaps(s) {
  const outline = deformBody(s).map(s.toRing);
  const intersections = [];
  for (let i=0; i<outline.length; i++) {
    const [u1,v1] = outline[i], [u2,v2] = outline[(i+1)%outline.length];
    if ((v1<=0 && v2>0) || (v2<=0 && v1>0)) {
      intersections.push(u1 - v1*(u2-u1)/(v2-v1));
    }
  }
  if (intersections.length !== 2) throw new Error('Unable to check deformed contact points');
  return {left: Math.min(...intersections)-ringLeftInner,
    right: ringRightInner-Math.max(...intersections)};
}

function projectedHaloShadow(s) {
  // A shallow 3D proxy is used solely for the shadow: a circular hoop and the
  // star's rounded body are lit from the viewer's direction and slightly above.
  // Visible halo and body geometry continue to use the exact existing paths.
  const radiusX = 43.9*ringHorizontalScale;
  const radiusY = 13.5*s.ellipseScale;
  const depthRadius = Math.sqrt(radiusX*radiusX-radiusY*radiusY);
  const depthOffset = 5*Math.cos(s.phase);
  const starX = bodyCenter.x+s.planetOffset, starY = bodyCenter.y;
  const starRX = 32.96, starRY = 32.26, starRZ = 32.6;
  const lightDown = 0.18;
  const A = (lightDown/starRY)**2 + (1/starRZ)**2;
  const paths = [];
  let run = [];
  const finish = () => { if (run.length>1) paths.push(run); run = []; };
  for (let i=0; i<=720; i++) {
    const arc = Math.PI*i/720;
    const u = radiusX*Math.cos(arc), v = radiusY*Math.sin(arc);
    const x = s.center.x + u*s.cos - v*s.sin;
    const y = s.center.y + u*s.sin + v*s.cos;
    const z = depthRadius*Math.sin(arc) + depthOffset;
    const dx = x-starX, dy = y-starY;
    const B = 2*(dy*lightDown/(starRY*starRY) - z/(starRZ*starRZ));
    const C = (dx/starRX)**2 + (dy/starRY)**2 + (z/starRZ)**2 - 1;
    const discriminant = B*B - 4*A*C;
    if (discriminant < 0) { finish(); continue; }
    const distance = (-B-Math.sqrt(discriminant))/(2*A);
    const hitZ = z-distance;
    // A rear-half ring cannot shadow the front face from a frontal light.
    if (distance < 0 || hitZ <= 0) { finish(); continue; }
    run.push([x,y+lightDown*distance]);
  }
  finish();
  return paths.map(points => points.map(([x,y],i) =>
    `${i ? 'L' : 'M'}${fmt(x)} ${fmt(y)}`).join(' '));
}

function frameSVG(s) {
  const deformed = deformBody(s);
  const bodyD = deformed.map(([x,y],i) => `${i ? 'L':'M'}${fmt(x)} ${fmt(y)}`).join(' ') + ' Z';
  // The two original half-ring shapes are joined behind the planet, then only
  // the near half is drawn in front. This keeps their original color and shape
  // without exposed end caps as the ring moves around the body.
  const halo = `<g transform="translate(0.51 0) rotate(14 51.5 53)"><path fill="#ADDCFF" fill-rule="evenodd" d="${paths[0]}"/><path fill="#ADDCFF" fill-rule="evenodd" d="${paths[2]}"/></g>`;
  const ringTransform = `translate(${fmt(s.ringX)} ${fmt(s.ringY)}) rotate(${fmt(s.angle)} ${ringCenter.x} ${ringCenter.y}) translate(${ringCenter.x} ${ringCenter.y}) scale(${ringHorizontalScale} ${fmt(s.ellipseScale)}) translate(-${ringCenter.x} -${ringCenter.y})`;
  // A faint baseline belongs to the front arc that remains visible at every
  // phase; the projected portion changes as the hoop moves in depth.
  const near = (1+Math.cos(s.phase))/2;
  const projectedPaths = projectedHaloShadow(s);
  const shadowOpacity = 0.12 + 0.12*near;
  const shadowHalo = halo.replaceAll('#ADDCFF','#8EA9B9');
  return `<svg width="309" height="309" viewBox="0 0 103 103" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="near"><rect x="-100" y="${ringCenter.y}" width="300" height="200"/></clipPath>
      <clipPath id="body"><path fill-rule="evenodd" d="${bodyD}"/></clipPath>
    </defs>
    <g transform="translate(${canvasCenter.x} ${canvasCenter.y}) scale(0.89) translate(-${canvasCenter.x} -${canvasCenter.y})">
      <g transform="${ringTransform}">${halo}</g>
      <path fill="#F5F8FA" fill-rule="evenodd" d="${bodyD}"/>
      <g clip-path="url(#body)">
        <g opacity="0.055" transform="translate(0 1.35)">
          <g transform="${ringTransform}"><g clip-path="url(#near)">${shadowHalo}</g></g>
        </g>
        <g fill="none" stroke="#8EA9B9" stroke-width="7.6" stroke-opacity="${fmt(shadowOpacity)}" stroke-linecap="round" stroke-linejoin="round">
          ${projectedPaths.map(d => `<path d="${d}"/>`).join('')}
        </g>
      </g>
      <g transform="${ringTransform}"><g clip-path="url(#near)">${halo}</g></g>
    </g>
  </svg>`;
}

for (const [fps,count] of (gifPreview ? [[50,63]] : [[24,30],[60,75]])) {
  const dir = path.join(outputRoot,`frames-${fps}fps`);
  await fs.mkdir(dir, {recursive:true});
  const stride = internalSamples/count;
  for (let i=0; i<count; i++) {
    const output = path.join(dir,`labs-loading-${String(i+1).padStart(3,'0')}.png`);
    await sharp(Buffer.from(frameSVG(states[i*stride]))).png().toFile(output);
  }
}
if (!gifPreview) await fs.writeFile(path.join(root,'source','frame-diagnostics.json'), JSON.stringify(states.map((s,i) => {
  const actualGap = constrainedGaps(s);
  const contactRadius = s.sway >= 0 ? ringLeftInner : ringRightInner;
  const contactY = s.center.y + contactRadius*s.sin;
  const warped = deformBody(s);
  const headMovement = Math.max(0, ...s.body.map((p,i) => p[1] <= bodyCenter.y-12
    ? Math.hypot(warped[i][0]-p[0],warped[i][1]-p[1]) : 0));
  return {frame: i+1, tilt: Number(s.angle.toFixed(2)), haloOffset: Number(s.ringX.toFixed(2)),
    haloYOffset: Number(s.ringY.toFixed(3)), ellipseScale: Number(s.ellipseScale.toFixed(4)),
    contactY: Number(contactY.toFixed(2)), waistY: Number(bodyCenter.y.toFixed(2)),
    maxHeadDeformation: Number(headMovement.toFixed(5)),
    restingLeftGap: Number(s.leftGap.toFixed(2)), restingRightGap: Number(s.rightGap.toFixed(2)),
    actualLeftGap: Number(actualGap.left.toFixed(2)), actualRightGap: Number(actualGap.right.toFixed(2)),
    leftCompression: Number(s.leftPress.toFixed(2)), rightCompression: Number(s.rightPress.toFixed(2))};
}),null,2));
console.log(gifPreview ? 'Rendered 63 frames for the Figma GIF.' :
  'Rendered 30 frames at 24 fps and 75 frames at 60 fps, all 309 × 309.');
