import { createGlobe } from "./visual/globe.js";
import { createSimulation } from "./simulation/engine.js";
import { bindInterface } from "./ui/interface.js";

const simulation = createSimulation();
const globe = createGlobe(document.getElementById("globeMount"), simulation);
bindInterface(simulation, globe);
simulation.onChange((state) => globe.update(state));
window.addEventListener("resize", () => globe.resize());
