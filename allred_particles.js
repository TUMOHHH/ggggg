/*! ALLRED Studio interactive scene (Tilda HEAD-ready, external JS) */
(function(){
  const CDN_PRIMARY = "https://unpkg.com/three@0.160.0/build/three.min.js";
  const CDN_FALLBACK = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js";

  function injectStyle(){
    if (document.getElementById("allred-style")) return;
    const css = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@1,2,300,400,500,700&display=swap');
:root{ --bg:#f7f8fa; --fg:#0a0a0a; --accent:#e10600; }
.allred-stage{position:relative;width:100%;height:100%;min-height:100vh;overflow:hidden;
  background:radial-gradient(120vmax 80vmax at 50% 40%, #ffffff 0%, #eef1f5 55%, #e9edf2 100%);color:var(--fg);
  font-family:"Satoshi",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;}
canvas#allred-fx{position:absolute;inset:0;display:block;z-index:1;}
.allred-ui{position:relative;z-index:2;width:100%;height:100%;display:grid;place-items:center;pointer-events:none}
.allred-center{text-align:center;pointer-events:auto}
.allred-title{font-weight:800;letter-spacing:.02em;font-size:clamp(28px,8vw,96px);line-height:.95}
.allred-sub{margin-top:.6rem;font-size:clamp(14px,2.4vw,24px);opacity:.85}
.allred-btn{margin-top:1.1rem;display:inline-flex;gap:.6rem;align-items:center;padding:.85rem 1.15rem;border-radius:999px;
  border:1px solid #00000012;background:#111;color:#fff;font-weight:700;letter-spacing:.02em;cursor:pointer}
.allred-grid{position:absolute;inset:0;pointer-events:none;z-index:0;background:
  repeating-linear-gradient(to right,rgba(0,0,0,.06) 0,rgba(0,0,0,.06) 1px,transparent 60px),
  repeating-linear-gradient(to bottom,rgba(0,0,0,.04) 0,rgba(0,0,0,.04) 1px,transparent 60px);
  transform:perspective(1200px) rotateX(35deg) translateY(16vh);opacity:.45;filter:blur(.2px)}
.allred-grain{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:.14;mix-blend-mode:multiply;
  background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.9"/></svg>');
  animation:allredGrain 1.6s steps(2) infinite}
@keyframes allredGrain{0%{transform:translate(0,0)}25%{transform:translate(-8px,5px)}50%{transform:translate(7px,-4px)}75%{transform:translate(-3px,10px)}100%{transform:translate(0,0)}}
`;
    const style = document.createElement("style");
    style.id = "allred-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectMarkup(){
    const root = document.getElementById("allred-root") || document.body;
    if (document.getElementById("ALLRED_STAGE")) return;
    const html = `
<div class="allred-stage" id="ALLRED_STAGE">
  <div class="allred-grid"></div>
  <canvas id="allred-fx" aria-hidden="true"></canvas>
  <div class="allred-ui">
    <div class="allred-center">
      <div class="allred-title">ALLRED Studio</div>
      <div class="allred-sub">We Make The Internet Better</div>
      <button class="allred-btn" id="allred-cta">Leave a request</button>
    </div>
  </div>
  <div class="allred-grain"></div>
</div>`;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    root.appendChild(wrapper.firstElementChild);
  }

  function loadScript(src, onload){
    const s = document.createElement("script");
    s.src = src; s.async = true; s.onload = onload; s.onerror = onload;
    document.head.appendChild(s);
  }
  function ready(fn){ document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn); }
  function waitForTHREE(cb, tries=0){ if (window.THREE) return cb(); if (tries>100) return; setTimeout(()=>waitForTHREE(cb,tries+1),40); }
  function ensureTHREE(cb){ if (window.THREE) return cb(); loadScript(CDN_PRIMARY, ()=>{ if (window.THREE) cb(); else loadScript(CDN_FALLBACK, ()=>cb()); }); }

  // --------- Сцена ---------
  function start(){
    injectStyle();
    injectMarkup();

    // Настройки
    const BASE_W=1536, COUNT=120, SIZE_MIN=1.4, SIZE_MAX=3.0, HOVER_FORCE=0.11, CLICK_FORCE=0.28, DAMP=0.93, RADIUS=3.2;

    const canvas = document.getElementById('allred-fx');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf1f5fb, 22, 60);

    const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 150);
    camera.position.set(0, 1.1, 16); scene.add(camera);

    // Свет
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd6deea, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 0.95); dir.position.set(8,10,7); scene.add(dir);

    // Procedural env + noise textures
    const env = makeEnvCubeTexture();
    const normalTex = makeNoiseTexture(256,256,0.9,true);
    const roughnessTx = makeNoiseTexture(256,256,0.5,false);

    const RED = new THREE.Color(0xe10600);
    const metalGlass = new THREE.MeshPhysicalMaterial({
      color:0xf0f5ff, metalness:.65, roughness:.2, clearcoat:1, clearcoatRoughness:.06,
      transmission: renderer.capabilities.isWebGL2 ? 0.6 : 0.0, thickness:1.1, ior:1.4,
      envMap:env, envMapIntensity:1.1, normalMap:normalTex, roughnessMap:roughnessTx
    });
    const redMetal = new THREE.MeshPhysicalMaterial({
      color:RED, metalness:.75, roughness:.25, clearcoat:.8, clearcoatRoughness:.12,
      envMap:env, envMapIntensity:1.0, normalMap:normalTex, roughnessMap:roughnessTx
    });

    // Геометрии (объёмные осколки)
    const geos = [
      new THREE.IcosahedronGeometry(0.6,1),
      new THREE.DodecahedronGeometry(0.58,1),
      new THREE.ConeGeometry(0.55,1.2,5).translate(0,0.6,0)
    ];

    // Боковые/верхние крупные осколки
    const sideGroup = new THREE.Group(); scene.add(sideGroup);
    const scale = Math.min(1.4, Math.max(0.75, innerWidth / BASE_W));
    const count = Math.round(COUNT * scale);
    const shards = [];
    function spawn(area,n){
      for(let i=0;i<n;i++){
        const g = geos[(Math.random()*geos.length)|0];
        const mat = (Math.random()<0.28? redMetal: metalGlass).clone();
        const m = new THREE.Mesh(g, mat);
        const base = new THREE.Vector3(
          THREE.MathUtils.randFloat(area.minX, area.maxX),
          THREE.MathUtils.randFloat(area.minY, area.maxY),
          THREE.MathUtils.randFloat(-2.8, 2.2)
        );
        m.position.copy(base);
        m.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        m.scale.setScalar(THREE.MathUtils.randFloat(SIZE_MIN,SIZE_MAX));
        m.userData = { base: base.clone(), vel: new THREE.Vector3(
          THREE.MathUtils.randFloat(-0.02,0.02), THREE.MathUtils.randFloat(-0.02,0.02), THREE.MathUtils.randFloat(-0.012,0.012)
        )};
        sideGroup.add(m); shards.push(m);
      }
    }
    const X=11, Y=7.2;
    spawn({minX:-X, maxX:-X*0.45, minY:-1.0, maxY:Y}, Math.round(count*0.55));
    spawn({minX: X*0.45, maxX: X,   minY:-1.0, maxY:Y}, Math.round(count*0.55));
    spawn({minX:-X*0.9,  maxX: X*0.9, minY:Y*0.55, maxY:Y}, Math.round(count*0.35));

    // Центральный кластер
    const center = new THREE.Group(); scene.add(center);
    center.position.set(0,0.2,0);
    const cluster = new THREE.Group(); center.add(cluster);
    function pyramid(r,h,color){ const g=new THREE.ConeGeometry(r,h,5).translate(0,h/2,0); return new THREE.Mesh(g, color==='red'? redMetal.clone(): metalGlass.clone()); }
    const pieces=[];
    const p1=pyramid(1.15,2.1); p1.rotation.y=Math.PI/7; cluster.add(p1); pieces.push(p1);
    const p2=pyramid(0.82,1.7,'red'); p2.position.set(1.55,0.1,0.2); p2.rotation.set(0.05,-0.38,0.2); cluster.add(p2); pieces.push(p2);
    const p3=pyramid(0.72,1.55); p3.position.set(-1.45,-0.15,-0.3); p3.rotation.set(-0.2,0.5,-0.15); cluster.add(p3); pieces.push(p3);
    const p4=pyramid(0.62,1.3); p4.position.set(0.25,-0.55,1.25); p4.rotation.set(0.35,-0.2,0.1); cluster.add(p4); pieces.push(p4);
    const p5=pyramid(0.56,1.2,'red'); p5.position.set(-0.35,0.75,0.95); p5.rotation.set(-0.1,0.25,0.0); cluster.add(p5); pieces.push(p5);
    const pieceData = pieces.map(m=>({m,base:m.position.clone(),rot:m.rotation.clone()}));

    // Микро-дебрис
    const debrisGeo = new THREE.IcosahedronGeometry(0.08,0);
    const debrisMat = new THREE.MeshPhysicalMaterial({color:0xffffff, metalness:.5, roughness:.35, envMap:env, envMapIntensity:1.0, normalMap:normalTex, roughnessMap:roughnessTx});
    const debris=[]; const debrisGroup=new THREE.Group(); center.add(debrisGroup);
    for(let i=0;i<110;i++){
      const m=new THREE.Mesh(debrisGeo,(Math.random()<0.25?redMetal:debrisMat).clone());
      const r=THREE.MathUtils.randFloat(1.6,3.0), a=Math.random()*Math.PI*2;
      m.position.set(Math.cos(a)*r, THREE.MathUtils.randFloat(-0.8,1.2), Math.sin(a)*r);
      m.userData={base:m.position.clone(),phase:Math.random()*Math.PI*2};
      debrisGroup.add(m); debris.push(m);
    }

    // Взаимодействие
    const ray=new THREE.Raycaster(), ndc=new THREE.Vector2(), pointer=new THREE.Vector3();
    let pointerActive=false, clusterHover=false;
    addEventListener('pointermove', (e)=>{
      const rect=renderer.domElement.getBoundingClientRect();
      ndc.x=((e.clientX-rect.left)/rect.width)*2-1;
      ndc.y=-((e.clientY-rect.top)/rect.height)*2+1;
      ray.setFromCamera(ndc,camera); ray.ray.at(0,pointer);
      pointerActive=true; clusterHover = pointer.distanceTo(center.position) < 3.2;
    }, {passive:true});
    addEventListener('pointerleave', ()=>{ pointerActive=false; clusterHover=false; });
    addEventListener('click', ()=> impulse(CLICK_FORCE, RADIUS*1.2));

    function impulse(force,radius){
      for(const m of shards){
        const d=m.position.distanceTo(pointer);
        if(d<radius){
          const dir=m.position.clone().sub(pointer).normalize();
          const pow=(1-d/radius);
          m.userData.vel.addScaledVector(dir, force*pow);
        }
      }
    }

    // Анимация
    function animate(t){
      requestAnimationFrame(animate);
      for(const m of shards){
        if(pointerActive){
          const d=m.position.distanceTo(pointer);
          if(d<RADIUS){
            const dir=m.position.clone().sub(pointer).normalize();
            const pow=(1-d/RADIUS);
            m.userData.vel.addScaledVector(dir, HOVER_FORCE*pow);
          }
        }
        m.position.add(m.userData.vel);
        m.userData.vel.multiplyScalar(DAMP);
        m.position.add(m.userData.base.clone().sub(m.position).multiplyScalar(0.02));
        m.rotation.x+=m.userData.vel.y*0.7; m.rotation.y+=m.userData.vel.x*0.7;
      }
      sideGroup.rotation.y = Math.sin(t*0.00022)*0.07;

      center.rotation.y = Math.sin(t*0.00032)*0.26;
      for(const d of debris){
        const p=d.userData.base.clone();
        p.x+=Math.sin(t*0.0016+d.userData.phase)*0.12;
        p.y+=Math.cos(t*0.0013+d.userData.phase)*0.1;
        d.position.lerp(p,0.18);
        d.rotation.x+=0.012; d.rotation.y+=0.01;
      }
      for(const o of pieceData){
        const m=o.m;
        if(clusterHover){
          const dir=m.position.clone().sub(cluster.position).normalize();
          const target=o.base.clone().addScaledVector(dir,0.5);
          m.position.lerp(target,0.22); m.rotation.x+=0.008; m.rotation.y+=0.009;
        } else {
          m.position.lerp(o.base,0.14);
          m.rotation.x=THREE.MathUtils.lerp(m.rotation.x,o.rot.x,0.14);
          m.rotation.y=THREE.MathUtils.lerp(m.rotation.y,o.rot.y,0.14);
          m.rotation.z=THREE.MathUtils.lerp(m.rotation.z,o.rot.z,0.14);
        }
      }
      renderer.render(scene,camera);
    }
    animate(0);

    addEventListener('resize', ()=>{
      renderer.setSize(innerWidth,innerHeight);
      camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    });

    document.getElementById('allred-cta')?.addEventListener('click', ()=> alert('ALLRED Studio — request form goes here.'));

    // === helpers ===
    function makeEnvCubeTexture(){
      const faces=[]; for(let i=0;i<6;i++) faces.push(gradientFace(i));
      const cube=new THREE.CubeTexture(faces.map(c=>c.canvas)); cube.needsUpdate=true; return cube;
      function gradientFace(i){
        const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
        const g=x.createLinearGradient(0,0,256,256);
        if(i%2===0){ g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#b9c7da'); }
        else { g.addColorStop(0,'#f3f6fb'); g.addColorStop(0.7,'#c9d4e4'); g.addColorStop(1,'#e10600'); }
        x.fillStyle=g; x.fillRect(0,0,256,256); return x;
      }
    }
    function makeNoiseTexture(w,h,intensity=0.7,asNormal=false){
      const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
      const img=x.createImageData(w,h);
      for(let i=0;i<img.data.length;i+=4){
        const n=Math.random()*255;
        if(asNormal){
          img.data[i]=128+(n-128)*0.4; img.data[i+1]=128+(Math.random()*255-128)*0.4; img.data[i+2]=255; img.data[i+3]=255;
        } else {
          const v=255-n*intensity; img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255;
        }
      }
      x.putImageData(img,0,0);
      const tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(2,2); return tex;
    }
  } // start

  function ready(fn){ document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn); }
  function ensureTHREE(cb){
    if(window.THREE) return cb();
    const s=document.createElement('script'); s.src=CDN_PRIMARY; s.onload=cb; s.onerror=()=>{const f=document.createElement('script'); f.src=CDN_FALLBACK; f.onload=cb; document.head.appendChild(f)}; document.head.appendChild(s);
  }

  ready(()=> ensureTHREE(()=> { injectStyle(); injectMarkup(); waitForTHREE(start); }));
  function waitForTHREE(cb,tries=0){ if(window.THREE) return cb(); if(tries>100) return; setTimeout(()=>waitForTHREE(cb,tries+1),40); }
})();
