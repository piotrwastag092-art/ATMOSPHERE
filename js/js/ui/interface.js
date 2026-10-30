const $ = id => document.getElementById(id);
const DEFAULTS = {temperature:14,humidity:58,windSpeed:18,cloudCover:42,pressure:1013};
const pageInfo = {
 global:["WIDOK GLOBALNY","Podgląd planety","Obserwuj świat, wybieraj obszary i modyfikuj jego atmosferę w czasie rzeczywistym.","Warunki atmosferyczne"],
 weather:["POGODA","Sterowanie pogodą","Ustaw parametry atmosferyczne dla wybranego obszaru.","Warunki atmosferyczne"],
 storms:["BURZE I ZJAWISKA","Laboratorium zjawisk","Twórz i usuwaj ekstremalne zjawiska atmosferyczne.","Generator zjawisk"],
 climate:["KLIMAT","Kontrola klimatu","Eksperymentuj z temperaturą i długoterminowymi warunkami planety.","Parametry klimatyczne"],
 wind:["WIATR","Macierz wiatrów","Steruj prędkością wiatru i obserwuj jego wpływ na atmosferę.","Sterowanie wiatrem"],
 clouds:["CHMURY I OPADY","Laboratorium chmur","Kontroluj zachmurzenie i wilgotność atmosfery.","Chmury i opady"],
 time:["KONTROLA CZASU","Manipulacja czasem","Zmieniaj tempo upływu czasu w symulowanym świecie.","Czas symulacji"],
 scenarios:["SCENARIUSZE","Laboratorium scenariuszy","Uruchamiaj gotowe konfiguracje lub zapisuj własny świat.","Scenariusze"],
 analytics:["ANALITYKA PLANETY","Dane planety","Monitoruj wartości parametrów i aktywne zjawiska.","Analityka"],
 god:["GOD MODE","Nieograniczona kontrola","W trybie sandbox możesz nadpisywać parametry bez ograniczeń fizycznych.","God Mode"]
};
const eventDefinitions = [
 ["storm","Burza superkomórkowa","ϟ","Silna konwekcja · pioruny · intensywne opady"],
 ["hurricane","Huragan","◉","Wir cyklonalny · bardzo silny wiatr"],
 ["tornado","Tornado","↗","Lokalny wir o ekstremalnej prędkości"],
 ["blizzard","Zamieć śnieżna","❄","Intensywne opady śniegu i silny wiatr"],
 ["heat","Fala upałów","☼","Długotrwała anomalia wysokiej temperatury"],
 ["dust","Burza pyłowa","〰","Silny wiatr i zawieszone cząstki"]
];
export function bindInterface(sim, globe) {
  const inputs=["temperature","humidity","windSpeed","cloudCover","pressure"];
  const format={temperature:v=>`${v>0?"+":""}${Math.round(v)}°C`,humidity:v=>`${Math.round(v)}%`,windSpeed:v=>`${Math.round(v)} km/h`,cloudCover:v=>`${Math.round(v)}%`,pressure:v=>`${Math.round(v)} hPa`};
  function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove("show"),2400);}
  function render(s){
    inputs.forEach(key=>{if($(key))$(key).value=s[key];if($(key+"Out"))$(key+"Out").textContent=format[key](s[key]);});
    $("metricTemp").innerHTML=`${s.temperature>0?"+":""}${s.temperature.toFixed(1)}<span>°C</span>`;
    $("metricHumidity").innerHTML=`${Math.round(s.humidity)}<span>%</span>`;
    $("metricWind").innerHTML=`${Math.round(s.windSpeed)}<span>km/h</span>`;
    $("tempBar").style.width=`${(s.temperature+100)/2}%`;$("humidityBar").style.width=`${s.humidity}%`;$("windBar").style.width=`${s.windSpeed/5}%`;
    $("metricEvents").innerHTML=`${String(s.events.length).padStart(2,"0")}<span> / 06</span>`;
    $("eventSummary").textContent=s.events.length?`Aktywne: ${s.events.map(e=>e.name).join(", ")}`:"Brak aktywnych zjawisk";
    $("selectedRegionLabel").textContent="OBSZAR: "+({global:"GLOBALNY",europe:"EUROPA",poland:"POLSKA","north-america":"AMERYKA PŁN.",africa:"AFRYKA",asia:"AZJA",oceans:"OCEANY"}[s.region]||"GLOBALNY");
    $("layerValue").textContent=({atmosphere:"ATMOSFERA",clouds:"CHMURY",temperature:"TEMPERATURA",wind:"WIATR"}[s.layer]);
    $("weatherLabel").textContent=s.temperature<0?"WARUNKI: MRÓZ":s.temperature>35?"WARUNKI: UPAŁ":s.humidity>85?"WARUNKI: WYSOKA WILGOTNOŚĆ":"WARUNKI: ZMIENNE";
    $("pauseText").textContent=s.running?"Wstrzymaj":"Wznów";$("pauseIcon").textContent=s.running?"Ⅱ":"▶";
    $("timePlay").textContent=s.running?"Ⅱ":"▶";$("timeSpeedLabel").textContent=`PRĘDKOŚĆ ×${s.speed}`;
    const total=Math.floor(s.elapsed),day=Math.floor(total/86400)+1,seconds=total%86400,h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),sec=seconds%60;
    $("simClock").textContent=`DZIEŃ ${String(day).padStart(3,"0")} · ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    $("timelineTime").textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    $("timelineScrubber").value=m+h*60;$("timelineProgress").style.width=`${(m+h*60)/1440*100}%`;
    $("eventList").innerHTML=s.events.length?s.events.map(e=>`<div class="event-entry"><span class="event-symbol">${eventDefinitions.find(d=>d[0]===e.type)?.[2]||"ϟ"}</span><div><b>${e.name}</b><small>${e.detail}</small></div><button data-remove="${e.id}" title="Usuń zjawisko">×</button></div>`).join(""):`<div class="empty-event"><span>◌</span><div><b>Brak aktywnych zjawisk</b><small>Utwórz zjawisko, aby obserwować je tutaj.</small></div></div>`;
    $("eventList").querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>sim.removeEvent(btn.dataset.remove)));
  }
  sim.onChange(render);
  inputs.forEach(key=>$(key).addEventListener("input",e=>sim.set(key,Number(e.target.value))));
  $("regionSelect").addEventListener("change",e=>{sim.setRegion(e.target.value);toast("Zakres sterowania zmieniony.");});
  $("pauseButton").addEventListener("click",()=>sim.setRunning(!sim.getState().running));
  $("timePlay").addEventListener("click",()=>sim.setRunning(!sim.getState().running));
  $("timeSpeed").addEventListener("change",e=>sim.setSpeed(e.target.value));
  $("timelineScrubber").addEventListener("input",e=>{const s=sim.getState();const day=Math.floor(s.elapsed/86400)*86400;sim.setElapsed(day+Number(e.target.value)*60);});
  $("timeBack").addEventListener("click",()=>sim.setElapsed(Math.max(0,sim.getState().elapsed-3600)));
  $("timeForward").addEventListener("click",()=>sim.setElapsed(sim.getState().elapsed+3600));
  $("autoRotateButton").addEventListener("click",()=>{sim.set("autoRotate",!sim.getState().autoRotate);toast(sim.getState().autoRotate?"Automatyczny obrót włączony":"Automatyczny obrót wyłączony");});
  $("zoomIn").addEventListener("click",()=>globe.zoomIn());$("zoomOut").addEventListener("click",()=>globe.zoomOut());$("resetView").addEventListener("click",()=>globe.resetView());
  $("resetControls").addEventListener("click",()=>{sim.updateMany(DEFAULTS);toast("Przywrócono domyślne parametry.");});
  $("resetButton").addEventListener("click",()=>{if(confirm("Czy na pewno zresetować cały świat do ustawień początkowych?")){sim.reset();$("regionSelect").value="global";toast("Symulacja została zresetowana.");}});
  $("saveButton").addEventListener("click",()=>{sim.save();toast("Świat zapisany w tej przeglądarce.");});
  $("modalOk").addEventListener("click",()=> $("modalBackdrop").classList.remove("open"));
  $("modalClose").addEventListener("click",()=> $("modalBackdrop").classList.remove("open"));
  $("aboutButton").addEventListener("click",()=> $("modalBackdrop").classList.add("open"));
  $("layerValue").textContent="ATMOSFERA";
  document.querySelectorAll(".layer-chip").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".layer-chip").forEach(b=>b.classList.remove("active"));btn.classList.add("active");sim.setLayer(btn.dataset.layer);}));
  document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>openPanel(btn.dataset.panel)));
  document.querySelectorAll("[data-panel].text-button").forEach(btn=>btn.addEventListener("click",()=>openPanel(btn.dataset.panel)));
  function openPanel(key){
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.panel===key));
    const info=pageInfo[key]||pageInfo.global;
    $("sectionName").textContent=info[0];$("pageTitle").innerHTML=info[1]+"<span>.</span>";$("pageDescription").textContent=info[2];$("controlTitle").textContent=info[3];
    const controls=$("dynamicControls");
    if(key==="storms"){
      controls.innerHTML=`<div class="event-picker">${eventDefinitions.map(d=>`<button class="event-pick" data-event="${d[0]}"><span>${d[2]}</span><b>${d[1]}</b><small>${d[3]}</small></button>`).join("")}</div>`;
      controls.querySelectorAll("[data-event]").forEach(btn=>btn.addEventListener("click",()=>{const d=eventDefinitions.find(x=>x[0]===btn.dataset.event);sim.addEvent(d[0],d[1],d[3]);toast(sim.getState().events.some(e=>e.type===d[0])?"Zjawisko aktywowane.":"Zjawisko usunięte.");}));
    } else if(key==="scenarios"){
      controls.innerHTML=`<div class="scenario-grid"><button data-scenario="ice"><b>❄ Epoka lodowcowa</b><small>Globalne ochłodzenie</small></button><button data-scenario="heat"><b>☼ Ekstremalny upał</b><small>Gorący i suchy świat</small></button><button data-scenario="storm"><b>ϟ Planeta burz</b><small>Silna aktywność burzowa</small></button><button data-scenario="tropical"><b>◉ Klimat tropikalny</b><small>Ciepło i wysoka wilgotność</small></button><button data-scenario="clear"><b>✧ Bezchmurny świat</b><small>Suche, spokojne niebo</small></button></div>`;
      controls.querySelectorAll("[data-scenario]").forEach(btn=>btn.addEventListener("click",()=>{sim.applyScenario(btn.dataset.scenario);toast("Scenariusz został uruchomiony.");}));
    } else if(key==="time"){
      controls.innerHTML=`<div class="module-copy"><p>Kontroluj tempo upływu czasu w wirtualnym świecie.</p><div class="speed-grid">${[1,10,60,300,1000].map(v=>`<button data-speed="${v}">×${v}</button>`).join("")}</div><button class="wide-action" id="timePause">Zatrzymaj / wznów czas</button></div>`;
      controls.querySelectorAll("[data-speed]").forEach(b=>b.addEventListener("click",()=>{sim.setSpeed(b.dataset.speed);$("timeSpeed").value=b.dataset.speed;}));$("timePause").addEventListener("click",()=>sim.setRunning(!sim.getState().running));
    } else if(key==="analytics"){
      controls.innerHTML=`<div class="analytics-list"><div><span>Temperatura</span><b id="aTemp">—</b></div><div><span>Wilgotność</span><b id="aHumidity">—</b></div><div><span>Wiatr</span><b id="aWind">—</b></div><div><span>Ciśnienie</span><b id="aPressure">—</b></div><div><span>Zachmurzenie</span><b id="aClouds">—</b></div><div><span>Aktywne zjawiska</span><b id="aEvents">—</b></div></div>`;
      const s=sim.getState();$("aTemp").textContent=formatValue(s.temperature,"°C");$("aHumidity").textContent=s.humidity+"%";$("aWind").textContent=s.windSpeed+" km/h";$("aPressure").textContent=s.pressure+" hPa";$("aClouds").textContent=s.cloudCover+"%";$("aEvents").textContent=s.events.length;
    } else if(key==="god"){
      controls.innerHTML=`<div class="god-warning">✳ TRYB SANDBOX AKTYWNY</div><p class="module-note">W tym trybie możesz nadawać parametrom dowolne wartości dostępne w suwakach. Zależności fizyczne nie ograniczają eksperymentu.</p><div class="god-actions"><button data-event="storm">Wywołaj burzę</button><button data-event="hurricane">Utwórz huragan</button><button data-event="blizzard">Uruchom zamieć</button><button id="clearEvents">Usuń wszystkie zjawiska</button></div>`;
      controls.querySelectorAll("[data-event]").forEach(b=>b.addEventListener("click",()=>{const d=eventDefinitions.find(x=>x[0]===b.dataset.event);sim.addEvent(d[0],d[1],d[3]);}));
      $("clearEvents").addEventListener("click",()=>sim.updateMany({events:[]}));
    } else {
      controls.innerHTML=`<div class="control-row"><div class="control-label"><label for="temperature">Temperatura</label><output id="temperatureOut">—</output></div><input id="temperature" type="range" min="-100" max="100" value="${sim.getState().temperature}"><div class="range-labels"><span>−100°C</span><span>+100°C</span></div></div><div class="control-row"><div class="control-label"><label for="humidity">Wilgotność</label><output id="humidityOut">—</output></div><input id="humidity" type="range" min="0" max="100" value="${sim.getState().humidity}"><div class="range-labels"><span>0%</span><span>100%</span></div></div><div class="control-row"><div class="control-label"><label for="windSpeed">Prędkość wiatru</label><output id="windSpeedOut">—</output></div><input id="windSpeed" type="range" min="0" max="500" value="${sim.getState().windSpeed}"><div class="range-labels"><span>0 km/h</span><span>500 km/h</span></div></div><div class="control-row"><div class="control-label"><label for="cloudCover">Zachmurzenie</label><output id="cloudCoverOut">—</output></div><input id="cloudCover" type="range" min="0" max="100" value="${sim.getState().cloudCover}"><div class="range-labels"><span>0%</span><span>100%</span></div></div><div class="control-row"><div class="control-label"><label for="pressure">Ciśnienie</label><output id="pressureOut">—</output></div><input id="pressure" type="range" min="850" max="1100" value="${sim.getState().pressure}"><div class="range-labels"><span>850 hPa</span><span>1100 hPa</span></div></div>`;
      inputsRebind();
    }
  }
  function inputsRebind(){inputs.forEach(key=>{const el=$(key);if(!el)return;el.addEventListener("input",e=>{const val=Number(e.target.value);$(key+"Out").textContent=({temperature:v=>formatValue(v,"°C"),humidity:v=>v+"%",windSpeed:v=>v+" km/h",cloudCover:v=>v+"%",pressure:v=>v+" hPa"})[key](val);sim.set(key,val);});});}
  function formatValue(v,u){return `${v>0&&u==="°C"?"+":""}${Math.round(v)}${u}`;}
  sim.load();
  openPanel("global");
}
