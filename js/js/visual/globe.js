import * as THREE from "three";

export function createGlobe(mount, simulation) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, 0, 4.15);
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  mount.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);
  const loader = new THREE.TextureLoader();
  const earthTexture = loader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  const bumpTexture = loader.load("https://threejs.org/examples/textures/planets/earth_normal_2048.jpg");
  const specTexture = loader.load("https://threejs.org/examples/textures/planets/earth_specular_2048.jpg");
  const earthMat = new THREE.MeshPhongMaterial({ map: earthTexture, bumpMap: bumpTexture, bumpScale: .025, specularMap: specTexture, specular: new THREE.Color(0x344a64), shininess: 12 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), earthMat);
  group.add(earth);

  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 1024; cloudCanvas.height = 512;
  const ctx = cloudCanvas.getContext("2d");
  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  cloudTexture.colorSpace = THREE.SRGBColorSpace;
  const cloudMat = new THREE.MeshPhongMaterial({ map: cloudTexture, transparent: true, opacity: .45, depthWrite: false });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 48), cloudMat);
  group.add(clouds);
  function drawClouds(amount) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0,0,1024,512);
      ctx.globalAlpha = .15 + amount / 125;
      ctx.drawImage(img,0,0,1024,512);
      ctx.globalCompositeOperation = "destination-in";
      const mask = ctx.createLinearGradient(0,0,0,512);
      mask.addColorStop(0,"rgba(255,255,255,.25)"); mask.addColorStop(.15,"white"); mask.addColorStop(.85,"white"); mask.addColorStop(1,"rgba(255,255,255,.25)");
      ctx.fillStyle=mask;ctx.fillRect(0,0,1024,512);
      ctx.globalCompositeOperation = "source-over";
      cloudTexture.needsUpdate = true;
    };
    img.src = "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";
  }
  drawClouds(simulation.getState().cloudCover);

  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.075,64,48), new THREE.ShaderMaterial({
    vertexShader:`varying vec3 vNormal; varying vec3 vView; void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-mvPosition.xyz);gl_Position=projectionMatrix*mvPosition;}`,
    fragmentShader:`varying vec3 vNormal; varying vec3 vView; void main(){float intensity=pow(0.72-dot(vNormal,vView),3.0);gl_FragColor=vec4(0.20,0.62,1.0,intensity*0.48);}`,
    blending:THREE.AdditiveBlending,side:THREE.BackSide,transparent:true,depthWrite:false
  }));
  group.add(atmosphere);

  const starGeo = new THREE.BufferGeometry();
  const starPositions = [];
  for(let i=0;i<650;i++){const r=9+Math.random()*22,theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1);starPositions.push(r*Math.sin(phi)*Math.cos(theta),r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi));}
  starGeo.setAttribute("position",new THREE.Float32BufferAttribute(starPositions,3));
  const stars = new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x8ba8d2,size:.035,transparent:true,opacity:.75}));
  scene.add(stars);
  const ambient = new THREE.AmbientLight(0x8ca9d1,1.05);scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffe8cb,2.25);sun.position.set(-4,2,5);scene.add(sun);
  const rim = new THREE.PointLight(0x258dff,2.5,12);rim.position.set(3,-1,-3);scene.add(rim);

  let dragging=false, previous={x:0,y:0}, autoRotate=true, zoom=4.15;
  const dom=renderer.domElement;
  dom.style.cursor="grab";
  dom.addEventListener("pointerdown",e=>{dragging=true;previous={x:e.clientX,y:e.clientY};dom.setPointerCapture(e.pointerId);dom.style.cursor="grabbing";});
  dom.addEventListener("pointermove",e=>{if(!dragging)return;const dx=e.clientX-previous.x,dy=e.clientY-previous.y;group.rotation.y+=dx*.005;group.rotation.x=Math.max(-1.1,Math.min(1.1,group.rotation.x+dy*.005));previous={x:e.clientX,y:e.clientY};});
  const stopDrag=()=>{dragging=false;dom.style.cursor="grab";};dom.addEventListener("pointerup",stopDrag);dom.addEventListener("pointercancel",stopDrag);
  dom.addEventListener("wheel",e=>{zoom=Math.max(2.2,Math.min(7,zoom+e.deltaY*.003));camera.position.z=zoom;},{passive:true});
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  dom.addEventListener("click",e=>{const rect=dom.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(earth);if(hit.length){const p=hit[0].point.clone().applyMatrix4(group.matrixWorld).normalize();const lat=Math.asin(p.y)*180/Math.PI;const lon=Math.atan2(p.z,p.x)*180/Math.PI;document.getElementById("coordsValue").textContent=`${lat.toFixed(1)}° / ${lon.toFixed(1)}°`;}});

  let cloudTarget=simulation.getState().cloudCover;
  function animate(){requestAnimationFrame(animate);const s=simulation.getState();if(s.autoRotate&&!dragging)group.rotation.y+=.00055;clouds.rotation.y+=.00008;cloudMat.opacity=.12+(s.cloudCover/100)*.58;cloudMat.needsUpdate=true;const t=Math.max(0,Math.min(1,(s.temperature+100)/200));earthMat.color.setRGB(.82+.18*t,.9-.16*t,.98-.25*t);if(s.layer==="temperature"){earthMat.color.setRGB(.9,.48+.35*(1-t),.22+.65*t);}else if(s.layer==="wind"){earthMat.color.setRGB(.45,.8,.9);}else{earthMat.color.setRGB(.92,.96,1);}renderer.render(scene,camera);}
  animate();
  function resize(){const w=mount.clientWidth,h=mount.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  function update(state){autoRotate=state.autoRotate;cloudTarget=state.cloudCover;cloudMat.opacity=.12+(cloudTarget/100)*.58;}
  return {resize,update,zoomIn(){zoom=Math.max(2.2,zoom-.35);camera.position.z=zoom;document.getElementById("altitudeValue").textContent=(4.15/zoom).toFixed(1)+"×";},zoomOut(){zoom=Math.min(7,zoom+.35);camera.position.z=zoom;document.getElementById("altitudeValue").textContent=(4.15/zoom).toFixed(1)+"×";},resetView(){zoom=4.15;camera.position.set(0,0,zoom);group.rotation.set(0,0,0);document.getElementById("altitudeValue").textContent="1.0×";}};
}
