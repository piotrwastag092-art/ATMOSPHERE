const DEFAULTS = { temperature:14, humidity:58, windSpeed:18, cloudCover:42, pressure:1013 };
const clone = value => JSON.parse(JSON.stringify(value));

export function createSimulation() {
  let state = {
    ...DEFAULTS,
    region: "global",
    layer: "atmosphere",
    running: true,
    autoRotate: true,
    elapsed: 0,
    speed: 1,
    events: [],
    mode: "sandbox",
    revision: 0
  };
  const listeners = new Set();
  let lastTick = performance.now();

  function emit() {
    state.revision++;
    listeners.forEach(fn => fn(clone(state)));
  }
  function set(key, value) {
    state[key] = value;
    emit();
  }
  function updateMany(values) {
    Object.assign(state, values);
    emit();
  }
  function reset() {
    state = { ...state, ...DEFAULTS, region:"global", events:[], elapsed:0, running:true, speed:1 };
    emit();
  }
  function addEvent(type, name, detail) {
    const existing = state.events.find(e => e.type === type);
    if (existing) state.events = state.events.filter(e => e.type !== type);
    else state.events.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), type, name, detail });
    emit();
  }
  function removeEvent(id) {
    state.events = state.events.filter(e => e.id !== id);
    emit();
  }
  function tick(now) {
    const delta = Math.min((now - lastTick) / 1000, .1);
    lastTick = now;
    if (state.running) {
      state.elapsed += delta * state.speed * 60;
      // Lekka, kosmetyczna zmienność — wartości pozostają pod kontrolą operatora.
      if (Math.floor(state.elapsed / 30) !== Math.floor((state.elapsed - delta * state.speed * 60) / 30)) {
        state.temperature = Math.max(-100, Math.min(100, state.temperature + (Math.random() - .5) * .12));
        state.humidity = Math.max(0, Math.min(100, state.humidity + (Math.random() - .5) * .4));
        emit();
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return {
    getState: () => clone(state),
    onChange(fn) { listeners.add(fn); fn(clone(state)); return () => listeners.delete(fn); },
    set, updateMany, reset, addEvent, removeEvent,
    setRegion(region) { set("region", region); },
    setLayer(layer) { set("layer", layer); },
    setRunning(value) { set("running", value); },
    setSpeed(value) { set("speed", Number(value)); },
    setElapsed(value) { set("elapsed", Number(value)); },
    applyScenario(name) {
      const scenarios = {
        ice: {temperature:-35,humidity:34,windSpeed:42,cloudCover:66,pressure:1002},
        heat: {temperature:48,humidity:12,windSpeed:9,cloudCover:4,pressure:1008},
        storm: {temperature:27,humidity:96,windSpeed:115,cloudCover:100,pressure:965},
        tropical: {temperature:31,humidity:88,windSpeed:24,cloudCover:75,pressure:1005},
        clear: {temperature:22,humidity:28,windSpeed:8,cloudCover:0,pressure:1025}
      };
      updateMany({ ...scenarios[name], events: name === "storm" ? [{id:"scenario-storm",type:"storm",name:"Superkomórka burzowa",detail:"Aktywny układ burzowy · tryb sandbox"}] : [] });
    },
    save() {
      localStorage.setItem("atmosphere-world-v1", JSON.stringify(state));
    },
    load() {
      const saved = localStorage.getItem("atmosphere-world-v1");
      if (!saved) return false;
      try { state = { ...state, ...JSON.parse(saved) }; emit(); return true; } catch { return false; }
    }
  };
}
