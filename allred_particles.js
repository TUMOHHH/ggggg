/*! ALLRED Studio scene — pyramids + strong interactivity (Tilda HEAD external JS) */
(function(){
  const CDN1="https://unpkg.com/three@0.160.0/build/three.min.js";
  const CDN2="https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js";

  // ---------- CSS + HTML ----------
  function addStyle(){
    if(document.getElementById("allred-style")) return;
    const css = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@1,2,300,400,500,700&display=swap');
:root{--fg:#0a0a0a}
.allred-stage{position:relative;width:100%;height:100%;min-height:100vh;overflow:hidden;
  background:radial-gradient(120vmax 80vmax at 50% 40%, #fff 0%, #eef1f5 55%, #e9edf2 100%);
  font-family:"Satoshi",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--fg)}
#allred-fx{position:absolute;inset:0;display:block;z-index:1}
.allred-ui{position:relative;z-index:2;width:100%;height:100%;display:grid;place-items:center;pointer-events:none}
.center{text-align:center;pointer-events:auto}
.t{font-weight:800;letter-spacing:.02em;font-size:clamp(28px,8vw,96px);line-height:.95}
.s{margin-top:.6rem;font-size:clamp(14px,2.4vw,24px);opacity:.86}
.b{margin-top:1.1rem;display:inline-flex;gap:.6rem;align-items:center;padding:.85rem 1.15rem;border-radius:999px;
  border:1px solid #00000012;background:#111;color:#fff;font-weight:700;letter-spacing:.02em;cursor:pointer}
.grid{position:absolute;inset:0;z-index:0;pointer-events:none;background:
  repeating-linear-gradient(to right,rgba(0,0,0,.06) 0,rgba(0,0,0,.06) 1px,transparent 60px),
  repeating-linear-gradient(to bottom,rgba(0,0,0,.04) 0,rgba(0,0,0,.04) 1px,transparent 60px);
  transform:perspective(1200px) rotateX(35deg) translateY(16vh);opacity:.45;filter:blur(.2px)}
.grain{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:.14;mix-blend-mode:multiply;
  background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.9"/></svg>');
  animation:g 1.6s steps(2) infinite}
@keyframes g{0%{transform:translate(0,0)}25%{transform:translate(-8px,5px)}50%{transform:translate(7px,-4px)}75%{transform:translate(-3px,10px)}100%{transform:translate(0,0)}}
.glitch{position:absolute;inset:auto 0 18vh 0;height:1px;background:linear-gradient(90deg,#e10600,transparent 60%);opacity:.25;filter:blur(.3px);
  animation:gl 5s linear infinite}@keyframes gl{0%,60%{transform:translateX(-100vw)}65%,100%{transform:translateX(100vw)}}
`;
    const s=document.createElement("style"); s.id="allred-style"; s.textContent=css; document.head.appendChild(s);
  }
  function addMarkup(){
    const root=document.getElementById("allred-root")||document.body;
    if(document.getElementById("ALLRED_STAGE")) return;
    root.insertAdjacentHTML("beforeend", `
<div class="allred-stage" id="ALLRED_STAGE">
  <div class="grid"></div>
  <canvas id="allred-fx" aria-hidden="true"></canvas>
  <div class="allred-ui">
    <div class="center">
      <div class="t">ALLRED Studio</div>
      <div class="s">We Make The Internet Better</div>
      <button class="b" id="allred-cta">Leave a request</button>
    </div>
  </div>
  <div class="grain"></div>
  <div class="glitch"></div>
</div>`);
  }

  function ready(fn){document.readyState!=="loading"?fn():document.addEventListener("DOMContentLoaded",fn)}
  function ensureTHREE(cb){
    if(window.THREE) return cb();
    const a=document.createElement("script"); a.src=CDN1; a.onload=cb; a.onerror=()=>{const b=document.createElement("script"); b.src=CDN2; b.onload=cb; document.head.appendChild(b)}; document.head.appendChild(a);
  }

  // ---------- SCENE ----------
  function start(){
    addStyle(); addMarkup();

    // Тюнинг
    const BASE_W=1536, COUNT=130, SIZE_MIN=1.3, SIZE_MAX=3.2, HOVER_FORCE=0.18, CLICK_FORCE=0.38, DAMP=0.93, RADIUS=3.2;

    const cvs=document.getElementById("allred-fx");
    const renderer=new THREE.WebGLRenderer({canvas:cvs,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.setSize(innerWidth,innerHeight);

    const scene=new THREE.Scene(); scene.fog=new THREE.Fog(0xf1f5fb,22,60);
    const camera=new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 150);
    camera.position.set(0,1.1,16); scene.add(camera);

    scene.add(new THREE.HemisphereLight(0xffffff,0xd6deea,1.0));
    const dir=new THREE.DirectionalLight(0xffffff,.95); dir.position.set(8,10,7); scene.add(dir);

    // env + noise
    const env=makeEnv();
    const normalTex=noise(256,256,.9,true);
    const roughTex =noise(256,256,.5,false);
    const RED=new THREE.Color(0xe10600);

    const glass=new THREE.MeshPhysicalMaterial({
      color:0xf0f5ff, metalness:.65, roughness:.2, clearcoat:1, clearcoatRoughness:.06,
      transmission: renderer.capabilities.isWebGL2 ? 0.6 : 0.0, thickness:1.1, ior:1.4,
      envMap:env, envMapIntensity:1.1, normalMap:normalTex, roughnessMap:roughTex
    });
    const redMetal=new THREE.MeshPhysicalMaterial({
      color:RED, metalness:.78, roughness:.25, clearcoat:.85, clearcoatRoughness:.12,
      envMap:env, envMapIntensity:1.05, normalMap:normalTex, roughnessMap:roughTex
    });

    // ТОЛЬКО пирамиды
    const geos=[
      new THREE.ConeGeometry(.55,1.25,3).translate(0,.62,0), // трёхгранная пирамида
      new THREE.TetrahedronGeometry(.7,0),                   // тетраэдр
      new THREE.ConeGeometry(.48,1.05,3).translate(0,.52,0)
    ];

    // Боковые крупные осколки
    const side=new THREE.Group(); scene.add(side);
    const scale=Math.min(1.45, Math.max(.7, innerWidth/BASE_W));
    const count=Math.round(COUNT*scale);
    const shards=[];

    function spawn(area,n){
      for(let i=0;i<n;i++){
        const g=geos[(Math.random()*geos.length)|0];
        const mat=(Math.random()<.3? redMetal: glass).clone();
        const m=new THREE.Mesh(g,mat);
        const base=new THREE.Vector3(
          THREE.MathUtils.randFloat(area.minX,area.maxX),
          THREE.MathUtils.randFloat(area.minY,area.maxY),
          THREE.MathUtils.randFloat(-2.6,2.2)
        );
        m.position.copy(base);
        m.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
        m.scale.setScalar(THREE.MathUtils.randFloat(SIZE_MIN,SIZE_MAX));
        m.userData={ base:base.clone(), vel:new THREE.Vector3(
          THREE.MathUtils.randFloat(-.02,.02), THREE.MathUtils.randFloat(-.02,.02), THREE.MathUtils.randFloat(-.012,.012)
        )};
        side.add(m); shards.push(m);
      }
    }
    const X=11, Y=7.2;
    spawn({minX:-X,maxX:-X*.45,minY:-1,maxY:Y}, Math.round(count*.55));
    spawn({minX: X*.45,maxX: X,  minY:-1,maxY:Y}, Math.round(count*.55));
    spawn({minX:-X*.9, maxX: X*.9, minY:Y*.55,maxY:Y}, Math.round(count*.35));

    // Центральная фигура (большие пирамиды)
    const center=new THREE.Group(); scene.add(center); center.position.set(0,.2,0);
    const cluster=new THREE.Group(); center.add(cluster);
    function pyr(r,h,red){const g=new THREE.ConeGeometry(r,h,3).translate(0,h/2,0); return new THREE.Mesh(g, red?redMetal.clone():glass.clone());}
    const P=[];
    const p1=pyr(1.18,2.2,0); p1.rotation.y=Math.PI/7; cluster.add(p1); P.push(p1);
    const p2=pyr(.85,1.8,1); p2.position.set(1.6,.1,.2); p2.rotation.set(.05,-.4,.2); cluster.add(p2); P.push(p2);
    const p3=pyr(.75,1.6,0); p3.position.set(-1.5,-.15,-.3); p3.rotation.set(-.2,.5,-.15); cluster.add(p3); P.push(p3);
    const p4=pyr(.65,1.35,0); p4.position.set(.25,-.55,1.25); p4.rotation.set(.35,-.2,.1); cluster.add(p4); P.push(p4);
    const p5=pyr(.58,1.25,1); p5.position.set(-.35,.78,.95); p5.rotation.set(-.1,.25,0); cluster.add(p5); P.push(p5);
    const pdata=P.map(m=>({m,base:m.position.clone(),rot:m.rotation.clone()}));

    // Микро-дебрис
    const dGeo=new THREE.TetrahedronGeometry(.09,0);
    const dMat=new THREE.MeshPhysicalMaterial({color:0xffffff, metalness:.55, roughness:.35, envMap:env, envMapIntensity:1.0, normalMap:normalTex, roughnessMap:roughTex});
    const debris=[], dGroup=new THREE.Group(); center.add(dGroup);
    for(let i=0;i<120;i++){
      const m=new THREE.Mesh(dGeo, (Math.random()<.25?redMetal:dMat).clone());
      const r=THREE.MathUtils.randFloat(1.6,3.0), a=Math.random()*Math.PI*2;
      m.position.set(Math.cos(a)*r, THREE.MathUtils.randFloat(-.8,1.2), Math.sin(a)*r);
      m.userData={base:m.position.clone(),ph:Math.random()*Math.PI*2};
      dGroup.add(m); debris.push(m);
    }

    // ----- Взаимодействие (правильная точка луча!) -----
    const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
    const pointer=new THREE.Vector3();                 // точка на плоскости z=0
    const planeZ0=new THREE.Plane(new THREE.Vector3(0,0,1), 0); // z=0
    let active=false, hover=false;

    addEventListener("pointermove",(e)=>{
      const rect=renderer.domElement.getBoundingClientRect();
      ndc.x=((e.clientX-rect.left)/rect.width)*2-1;
      ndc.y=-((e.clientY-rect.top)/rect.height)*2+1;
      ray.setFromCamera(ndc,camera);
      ray.ray.intersectPlane(planeZ0, pointer);    // <-- вот это фикс интерактива
      active=true; hover = pointer.distanceTo(center.position) < 3.2;
    },{passive:true});
    addEventListener("pointerleave",()=>{active=false; hover=false;});
    addEventListener("click",()=> impulse(CLICK_FORCE, RADIUS*1.2));

    function impulse(force,rad){
      for(const m of shards){
        const d=m.position.distanceTo(pointer);
        if(d<rad){
          const dir=m.position.clone().sub(pointer).normalize();
          m.userData.vel.addScaledVector(dir, force*(1-d/rad));
        }
      }
    }

    // ----- Анимация -----
    function tick(t){
      requestAnimationFrame(tick);

      for(const m of shards){
        if(active){
          const d=m.position.distanceTo(pointer);
          if(d<RADIUS){
            const dir=m.position.clone().sub(pointer).normalize();
            m.userData.vel.addScaledVector(dir, HOVER_FORCE*(1-d/RADIUS));
          }
        }
        m.position.add(m.userData.vel);
        m.userData.vel.multiplyScalar(DAMP);
        m.position.add(m.userData.base.clone().sub(m.position).multiplyScalar(0.02));
        m.rotation.x+=m.userData.vel.y*0.7; m.rotation.y+=m.userData.vel.x*0.7;
      }
      side.rotation.y=Math.sin(t*0.00025)*0.07;

      center.rotation.y=Math.sin(t*0.00035)*0.26;
      for(const d of debris){
        const p=d.userData.base.clone();
        p.x+=Math.sin(t*0.0016+d.userData.ph)*.12;
        p.y+=Math.cos(t*0.0013+d.userData.ph)*.10;
        d.position.lerp(p,.18);
        d.rotation.x+=.012; d.rotation.y+=.01;
      }
      for(const o of pdata){
        const m=o.m;
        if(hover){
          const dir=m.position.clone().sub(cluster.position).normalize();
          const target=o.base.clone().addScaledVector(dir,.52);
          m.position.lerp(target,.22);
          m.rotation.x+=.009; m.rotation.y+=.010;
        }else{
          m.position.lerp(o.base,.14);
          m.rotation.x=THREE.MathUtils.lerp(m.rotation.x,o.rot.x,.14);
          m.rotation.y=THREE.MathUtils.lerp(m.rotation.y,o.rot.y,.14);
          m.rotation.z=THREE.MathUtils.lerp(m.rotation.z,o.rot.z,.14);
        }
      }

      renderer.render(scene,camera);
    }
    tick(0);

    addEventListener("resize",()=>{
      renderer.setSize(innerWidth,innerHeight);
      camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    });

    document.getElementById("allred-cta")?.addEventListener("click",()=> alert("ALLRED Studio — request form goes here."));

    // helpers
    function makeEnv(){
      const faces=[]; for(let i=0;i<6;i++){ const c=document.createElement("canvas"); c.width=c.height=256;
        const x=c.getContext("2d"), g=x.createLinearGradient(0,0,256,256);
        if(i%2===0){ g.addColorStop(0,"#ffffff"); g.addColorStop(1,"#b9c7da"); }
        else{ g.addColorStop(0,"#f3f6fb"); g.addColorStop(.7,"#c9d4e4"); g.addColorStop(1,"#e10600"); }
        x.fillStyle=g; x.fillRect(0,0,256,256); faces.push(c);
      }
      const cube=new THREE.CubeTexture(faces); cube.needsUpdate=true; return cube;
    }
    function noise(w,h,inten,asNormal){
      const c=document.createElement("canvas"); c.width=w; c.height=h; const x=c.getContext("2d");
      const img=x.createImageData(w,h);
      for(let i=0;i<img.data.length;i+=4){
        const n=Math.random()*255;
        if(asNormal){
          img.data[i]=128+(n-128)*.4; img.data[i+1]=128+(Math.random()*255-128)*.4; img.data[i+2]=255; img.data[i+3]=255;
        } else {
          const v=255-n*inten; img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255;
        }
      }
      x.putImageData(img,0,0);
      const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,2); return t;
    }
  }

  ready(()=> ensureTHREE(()=>{ addStyle(); addMarkup(); start(); }));
})();
