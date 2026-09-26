const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

// Run the shipped inline script with a controlled clock. No browser dependencies.
const script = readFileSync(join(__dirname, '..', 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function setup() {
  const elements = new Map(), frames = new Map(), launches = [];
  let now = 0, frameId = 0;
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set(id.startsWith('screen-') && id !== 'screen-home' ? ['hidden'] : []);
      const listeners = new Map();
      elements.set(id, {
        value: id === 'room' ? 'AMOR' : '', textContent: '', checked: false,
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
        style: { setProperty() {} }, focus() {}, setAttribute() {}, setPointerCapture() {},
        getBoundingClientRect: () => ({ left: 0, right: 200, top: 0, bottom: 60 }),
        addEventListener(type, callback) { listeners.set(type, callback); },
        emit(type, event = {}) { listeners.get(type)?.({ preventDefault() {}, ...event }); },
      });
    }
    return elements.get(id);
  }
  const document = element('document');
  document.getElementById = element;
  const window = element('window');
  window.scrollTo = () => {};
  const context = vm.createContext({ document, window, performance: { now: () => now },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  vm.runInContext(script, context);
  context.captureLaunch = mission => launches.push({ ...mission });
  // Observe the boundary before bomb rendering and timer startup.
  vm.runInContext('launchMission = captureLaunch', context);
  return {
    element, launches, document, window,
    run: code => vm.runInContext(code, context),
    advance(ms) { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); },
    down(extra = {}) { element('confirm-hold').emit('pointerdown', { button: 0, isPrimary: true, pointerId: 1, ...extra }); },
    up() { element('confirm-hold').emit('pointerup', { pointerId: 1 }); },
  };
}

test('both roles wait for a continuous three-second hold before launching once', () => {
  for (const role of ['campo', 'manual']) {
    const app = setup();
    app.run(`start('${role}')`);
    assert.equal(app.run('typeof state'), 'undefined');
    app.down(); app.advance(2999);
    assert.equal(app.launches.length, 0);
    app.advance(1);
    assert.deepEqual(app.launches, [{ code: 'AMOR', papel: role }]);
    assert.doesNotMatch(app.element('hold-status').textContent, /cancelada/);
    app.advance(3000); app.up();
    assert.equal(app.launches.length, 1);
  }
});

test('early release resets the entire duration', () => {
  const app = setup(); app.run("start('campo')");
  app.down(); app.advance(2400); app.up(); app.advance(4000);
  assert.equal(app.launches.length, 0);
  app.down(); app.advance(600);
  assert.equal(app.launches.length, 0);
  app.advance(2400);
  assert.equal(app.launches.length, 1);
});

test('pointer cancellation, capture loss, leaving button, blur and hidden page cancel', () => {
  const cancellations = [
    app => app.element('confirm-hold').emit('pointercancel', { pointerId: 1 }),
    app => app.element('confirm-hold').emit('lostpointercapture', { pointerId: 1 }),
    app => app.element('confirm-hold').emit('pointermove', { pointerId: 1, clientX: 201, clientY: 30 }),
    app => app.element('confirm-hold').emit('blur'),
    app => app.window.emit('blur'),
    app => { app.document.hidden = true; app.document.emit('visibilitychange'); },
  ];
  for (const cancel of cancellations) {
    const app = setup(); app.run("start('campo')"); app.down(); app.advance(2000);
    cancel(app); app.advance(4000);
    assert.equal(app.launches.length, 0);
  }
});

test('back cancels pending launch and preserves room for correction or a new role', () => {
  const app = setup(); app.element('room').value = 'DUPLAX';
  app.run("start('campo')"); app.down(); app.advance(2000); app.run('backToRoom()'); app.advance(4000);
  assert.equal(app.launches.length, 0);
  assert.equal(app.element('room').value, 'DUPLAX');
  assert.equal(app.element('screen-home').classList.contains('hidden'), false);
  app.run("start('manual')"); app.down(); app.advance(3000);
  assert.deepEqual(app.launches, [{ code: 'DUPLAX', papel: 'manual' }]);
});

test('Space and Enter support release, repetition and full hold', () => {
  for (const key of [' ', 'Enter']) {
    const app = setup(); app.run("start('manual')"); const button = app.element('confirm-hold');
    button.emit('keydown', { key }); app.advance(1000); button.emit('keyup', { key }); app.advance(3000);
    assert.equal(app.launches.length, 0);
    button.emit('keydown', { key }); app.advance(1500); button.emit('keydown', { key, repeat: true }); app.advance(1500);
    assert.equal(app.launches.length, 1);
  }
});

test('other pointers and mouse buttons cannot start or interrupt confirmation', () => {
  const app = setup(); app.run("start('campo')");
  app.down({ button: 2 }); app.advance(4000); assert.equal(app.launches.length, 0);
  app.down({ isPrimary: false }); app.advance(4000); assert.equal(app.launches.length, 0);
  app.down(); app.advance(1500);
  app.element('confirm-hold').emit('pointerup', { pointerId: 2 }); app.down({ pointerId: 2 });
  app.advance(1500); assert.equal(app.launches.length, 1);
});

test('displayed code, difficulty and launched code agree, including short codes', () => {
  for (const [input, expected] of [[' ab!x ', 'ABX'], ['x', 'X'], ['', 'AMOR'], ['abcdefgxx', 'ABCDEFG']]) {
    const app = setup(); app.element('room').value = input; app.run("start('campo')");
    assert.equal(app.element('confirm-code').textContent, expected);
    assert.equal(app.element('diffcheck').checked, expected.endsWith('X'));
    app.down(); app.advance(3000); assert.equal(app.launches[0].code, expected);
  }
  const app = setup(); app.element('room').value = 'ABCXXXX'; app.run('syncRoom()');
  app.element('diffcheck').checked = false; app.run('toggleDiff()');
  assert.equal(app.element('room').value, 'ABC');
  assert.equal(app.element('diffcheck').checked, false);
});
