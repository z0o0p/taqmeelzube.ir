const PORTRAIT_EVENT = 'portrait:expression';

function getPortraitSvg(portraitHost) {
  if (portraitHost.matches('svg')) return portraitHost;

  try {
    const svg = portraitHost.contentDocument?.documentElement;
    return svg?.localName === 'svg' ? svg : null;
  } catch (error) {
    console.warn('The portrait SVG must be served from the same origin.', error);
    return null;
  }
}

function waitForPortraitSvg(portraitHost, timeout = 5000) {
  const loadedSvg = getPortraitSvg(portraitHost);
  if (loadedSvg) return Promise.resolve(loadedSvg);

  return new Promise(resolve => {
    let settled = false;
    let poll;

    const finish = svg => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.clearInterval(poll);
      portraitHost.removeEventListener('load', check);
      portraitHost.removeEventListener('error', fail);
      resolve(svg);
    };
    const check = () => {
      const svg = getPortraitSvg(portraitHost);
      if (svg) finish(svg);
    };
    const fail = () => finish(null);
    const timer = window.setTimeout(fail, timeout);

    portraitHost.addEventListener('load', check);
    portraitHost.addEventListener('error', fail, { once: true });
    poll = window.setInterval(check, 50);
    check();
  });
}

async function initializeCaricature() {
  const stage = document.getElementById('portrait-stage');
  if (!stage) return null;
  const portraitObject = document.getElementById('portrait-object') || stage.querySelector('svg');
  if (!portraitObject) return null;

  const svg = await waitForPortraitSvg(portraitObject);
  const svgDocument = svg?.ownerDocument;
  if (!svg || !svg.querySelector('#portrait-head')) {
    console.warn('The portrait SVG is unavailable.');
    return null;
  }
  if (!window.gsap) {
    console.warn('GSAP did not load; portrait will remain static.');
    return null;
  }

  const parts = {
    head: svg.querySelector('#portrait-head'),
    eyes: [svg.querySelector('#eye-shape-viewer-left'), svg.querySelector('#eye-shape-viewer-right')],
    pupils: [svg.querySelector('#pupil-viewer-left'), svg.querySelector('#pupil-viewer-right')],
    brows: [svg.querySelector('#brow-viewer-left'), svg.querySelector('#brow-viewer-right')],
    mouth: svg.querySelector('#portrait-mouth')
  };
  if (Object.values(parts).flat().some(part => !part)) return null;

  const HEAD_Y_OFFSET = 4;
  gsap.set(parts.head, { svgOrigin: '196 370', y: HEAD_Y_OFFSET });
  gsap.set([...parts.eyes, ...parts.brows, parts.mouth], { transformOrigin: '50% 50%' });
  let blinkCall;
  let idleTimeline;
  let interactionReset;
  let stageVisible = true;
  let expression = 'idle';
  let touching = false;
  let reduceMotion = false;
  let hasFinePointer = false;
  let lastPointer = null;

  const pupilX = parts.pupils.map(part => gsap.quickTo(part, 'x', { duration: .32, ease: 'power3.out' }));
  const pupilY = parts.pupils.map(part => gsap.quickTo(part, 'y', { duration: .32, ease: 'power3.out' }));
  const headRotation = gsap.quickTo(parts.head, 'rotation', { duration: .65, ease: 'power3.out' });
  const headY = gsap.quickTo(parts.head, 'y', { duration: .65, ease: 'power3.out' });
  const browY = parts.brows.map(part => gsap.quickTo(part, 'y', { duration: .4, ease: 'power3.out' }));
  const browRotation = parts.brows.map(part => gsap.quickTo(part, 'rotation', { duration: .4, ease: 'power3.out' }));
  const MAX_HEAD_TILT = 3;
  const clampPupilX = gsap.utils.clamp(-7, 7);
  const clampPupilY = gsap.utils.clamp(-2.6, 1.6);
  const clampBrowLift = gsap.utils.clamp(-.35, 2.1);
  const clampHeadRotation = gsap.utils.clamp(-MAX_HEAD_TILT, MAX_HEAD_TILT);
  const clampHeadY = gsap.utils.clamp(-3, 4);
  const canAnimate = () => !reduceMotion && stageVisible && !document.hidden;
  const svgRectAtRest = svg.getBoundingClientRect();
  const eyeRectsAtRest = parts.eyes.map(eye => eye.getBoundingClientRect());
  const eyeAnchorRatio = {
    x: ((eyeRectsAtRest[0].left + eyeRectsAtRest[0].width / 2 + eyeRectsAtRest[1].left + eyeRectsAtRest[1].width / 2) / 2 - svgRectAtRest.left) / svgRectAtRest.width,
    y: ((eyeRectsAtRest[0].top + eyeRectsAtRest[0].height / 2 + eyeRectsAtRest[1].top + eyeRectsAtRest[1].height / 2) / 2 - svgRectAtRest.top) / svgRectAtRest.height
  };

  function getEyeAnchor() {
    const rect = portraitObject.getBoundingClientRect();
    return {
      x: rect.left + rect.width * eyeAnchorRatio.x,
      y: rect.top + rect.height * eyeAnchorRatio.y
    };
  }

  function aimAtPoint(clientX, clientY, options = {}) {
    if (!canAnimate() || (!options.force && !['idle', 'attentive'].includes(expression))) return;
    const anchor = getEyeAnchor();
    const dx = clientX - anchor.x;
    const dy = clientY - anchor.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const intensity = gsap.utils.clamp(0, 1, distance / (Math.min(window.innerWidth, window.innerHeight) * .42));
    const directionX = dx / distance;
    const directionY = dy / distance;

    stopIdle();
    pupilX.forEach(move => move(clampPupilX(directionX * 7 * intensity)));
    pupilY.forEach(move => move(clampPupilY(directionY * 3 * intensity)));
    headRotation(clampHeadRotation((dx / Math.max(window.innerWidth * .35, 1)) * MAX_HEAD_TILT));
    headY(HEAD_Y_OFFSET + clampHeadY((dy / Math.max(window.innerHeight, 1)) * 5));
    if (options.eyebrowLift !== undefined) {
      browY.forEach(move => move(-options.eyebrowLift));
      browRotation[0](directionX * -2);
      browRotation[1](directionX * 2);
    } else {
      const lift = clampBrowLift(-directionY * 2.1 * intensity);
      const sideLift = directionX * .45 * intensity;
      const arch = Math.max(0, -directionY) * 1.4 * intensity;
      browY[0](-(lift - sideLift));
      browY[1](-(lift + sideLift));
      browRotation[0](directionX * -1.2 - arch);
      browRotation[1](directionX * 1.2 + arch);
    }
  }

  function scheduleBlink() {
    blinkCall?.kill();
    blinkCall = null;
    if (!canAnimate()) return;
    blinkCall = gsap.delayedCall(gsap.utils.random(2.8, 6.2), blink);
  }
  function blink() {
    if (!canAnimate()) return;
    if (expression === 'excited') return scheduleBlink();
    gsap.timeline({
      defaults: { transformOrigin: '50% 50%' },
      onComplete: scheduleBlink
    })
      .to(parts.eyes, { scaleY: .08, duration: .08, ease: 'power2.in' })
      .to(parts.eyes, { scaleY: 1, duration: .14, ease: 'power2.out' });
  }
  function stopIdle() {
    idleTimeline?.kill();
    idleTimeline = null;
  }
  function startIdle() {
    if (!canAnimate() || expression !== 'idle' || touching) return;
    if (idleTimeline?.isActive()) return;
    stopIdle();
    idleTimeline = gsap.timeline({
      defaults: { ease: 'sine.inOut' },
      repeat: -1,
      repeatDelay: 1.4
    })
      .addLabel('lookRight')
      .to(parts.pupils, { x: 2.5, y: -.5, duration: 1.4 }, 'lookRight')
      .to(parts.head, { rotation: 1.4, y: HEAD_Y_OFFSET - 1, duration: 2.2 }, 'lookRight')
      .to(parts.brows[0], { y: -1.1, duration: 1.2 }, 'lookRight+=0.3')
      .addLabel('lookLeft', 3)
      .to(parts.head, { rotation: -1.2, y: HEAD_Y_OFFSET, duration: 2.4 }, 'lookLeft')
      .to(parts.pupils, { x: -2, y: .6, duration: 1.8 }, 'lookLeft+=0.2')
      .to(parts.brows[0], { y: 0, duration: 1.1 }, 'lookLeft+=1.3')
      .addLabel('center', 6)
      .to(parts.head, { rotation: 0, y: HEAD_Y_OFFSET, duration: 1.8 }, 'center')
      .to(parts.pupils, { x: 0, y: 0, duration: 1.4 }, 'center+=0.2');
  }
  function scheduleIdle(delay = .65) {
    interactionReset?.kill();
    interactionReset = gsap.delayedCall(delay, () => {
      interactionReset = null;
      startIdle();
    });
  }
  function followPoint(clientX, clientY) {
    lastPointer = { clientX, clientY };
    aimAtPoint(clientX, clientY);
  }
  function returnToIdle(delay = .5) {
    interactionReset?.kill();
    interactionReset = gsap.delayedCall(delay, () => {
      interactionReset = null;
      setExpression('idle');
    });
  }

  const poses = {
    idle: [0, 0, 0, 0, 0, 0, 0, 0],
    attentive: [2.5, -1, 4, 0, -2, -2, -2, 2],
    curious: [-3, 0, 2, -1, -4, 1, -5, 2],
    thinking: [2, 1, -3, 2, 1, 1, 4, -4],
    playful: [4, -1, 4, 0, -4, 1, -5, 2],
    draw: [-2, 0, -2, 1, -4, 1, -4, 1],
    surprised: [-2, -3, 0, -1, -6, -6, 0, 0]
  };
  function applyPose(pose) {
    const [rotation, y, xEye, yEye, leftY, rightY, leftR, rightR] = pose;
    if (reduceMotion) {
      gsap.set(parts.head, { rotation: clampHeadRotation(rotation), y: HEAD_Y_OFFSET + y });
      gsap.set(parts.pupils, { x: xEye, y: yEye });
      gsap.set(parts.brows[0], { y: leftY, rotation: leftR });
      gsap.set(parts.brows[1], { y: rightY, rotation: rightR });
      return;
    }
    headRotation(clampHeadRotation(rotation));
    headY(HEAD_Y_OFFSET + y);
    pupilX.forEach(move => move(xEye));
    pupilY.forEach(move => move(yEye));
    browY[0](leftY);
    browY[1](rightY);
    browRotation[0](leftR);
    browRotation[1](rightR);
  }
  function setExpression(next = 'idle', options = {}) {
    expression = ['navigation', 'excited'].includes(next) || poses[next] ? next : 'idle';
    stopIdle();
    interactionReset?.kill();
    if (['navigation', 'excited'].includes(expression)) {
      const clientX = Number(options.clientX);
      const clientY = Number(options.clientY);
      if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
        aimAtPoint(clientX, clientY, {
          force: true,
          eyebrowLift: expression === 'excited' ? 8 : 1.5
        });
      }
      gsap.to(parts.eyes, {
        scaleY: expression === 'excited' ? 1.18 : 1,
        duration: reduceMotion ? 0 : .35,
        ease: 'power2.out',
        overwrite: 'auto'
      });
      gsap.to(parts.mouth, {
        scaleX: expression === 'excited' ? 1.12 : 1,
        scaleY: expression === 'excited' ? 1.35 : 1,
        duration: reduceMotion ? 0 : .35,
        ease: 'back.out(2)',
        overwrite: 'auto'
      });
      if (expression === 'excited') {
        browRotation[0](-3);
        browRotation[1](3);
        gsap.to(parts.head, { scale: 1.035, duration: reduceMotion ? 0 : .35, ease: 'back.out(2)', overwrite: 'auto' });
      }
      return;
    }
    const duration = reduceMotion ? 0 : .6;
    applyPose(poses[expression]);
    gsap.to(parts.eyes, { scaleY: 1, duration, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(parts.mouth, { scaleX: 1, scaleY: 1, duration, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(parts.head, { scale: 1, duration, ease: 'power3.out', overwrite: 'auto' });
    if (expression === 'idle') {
      if (hasFinePointer && lastPointer && canAnimate()) aimAtPoint(lastPointer.clientX, lastPointer.clientY);
      else if (reduceMotion) startIdle();
      else scheduleIdle();
    }
  }

  document.addEventListener('pointermove', event => {
    if (hasFinePointer && event.pointerType !== 'touch') followPoint(event.clientX, event.clientY);
  }, { passive: true });
  if (svgDocument !== document) {
    svgDocument.addEventListener('pointermove', event => {
      if (!hasFinePointer || event.pointerType === 'touch') return;
      const rect = portraitObject.getBoundingClientRect();
      followPoint(rect.left + event.clientX, rect.top + event.clientY);
    }, { passive: true });
  }
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    touching = true;
    stage.setPointerCapture(event.pointerId);
    lastPointer = { clientX: event.clientX, clientY: event.clientY };
    aimAtPoint(event.clientX, event.clientY, { force: true });
  });
  stage.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse') return;
    touching = false;
    returnToIdle(1.2);
  });
  const observer = new IntersectionObserver(([entry]) => {
    stageVisible = entry.isIntersecting;
    if (stageVisible) {
      scheduleBlink();
      if (!interactionReset) startIdle();
    } else {
      stopIdle();
      blinkCall?.kill();
      blinkCall = null;
    }
  }, { threshold: .1 });
  observer.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopIdle();
      blinkCall?.kill();
      blinkCall = null;
      return;
    }
    scheduleBlink();
    if (!interactionReset) startIdle();
  });
  document.addEventListener(PORTRAIT_EVENT, event => setExpression(event.detail?.state, event.detail));
  const media = gsap.matchMedia();
  media.add({
    reduceMotion: '(prefers-reduced-motion: reduce)',
    finePointer: '(hover: hover) and (pointer: fine)'
  }, context => {
    reduceMotion = context.conditions.reduceMotion;
    hasFinePointer = context.conditions.finePointer;
    setExpression('idle');
    if (canAnimate()) scheduleBlink();
    else {
      blinkCall?.kill();
      blinkCall = null;
    }
  });
  scheduleBlink();
  window.PortraitController = { setExpression, followPoint, aimAtPoint };
  return window.PortraitController;
}

function requestPortraitExpression(state, options = {}) {
  document.dispatchEvent(new CustomEvent(PORTRAIT_EVENT, { detail: { state, ...options } }));
}
