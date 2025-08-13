/*! ALLRED Studio — BUILD 10 (pyramids only, strong hover, clean glass/metal) */
(function(){
  const CDN1="https://unpkg.com/three@0.160.0/build/three.min.js";
  const CDN2="https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js";

  function addStyle(){
    if(document.getElementById("allred-style")) return;
    const css=`
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
.grain{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:.1;mix-blend-mode:multiply;
  background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.9"/></svg>');
  animation:g 1.6s steps(2) infinite}
@keyframes g{0%{transform:translate(0,0)}25%{transform:translate(-8px,5px)}50%{transform:translate(7px,-4px)}75%{transform:translate(-3px,10px)}100%{transform:translate(0,0)}}
#allred-build{position:fixed;right:10px;bottom:10px;z-index:9;font:600 11px/1 system-ui;padding:.25rem .5rem;border-radius:.5rem;background:#000c;color:#fff}
`;
    const s=document.createElement("style"); s.id="allred-style"; s.textContent=css; document.head.appendChild(s);
  }
  function addMarkup(){
    const root=document.getElementById("allred-root")||document.body;
    // убьём старую сцену, если оставалась
    const old=document.getElementById("ALLRED_STAGE"); if(old) old.remove();
    const tag=document.getElementById("allred-build"); if(tag) tag.remove();

    root.insertAdjacentHTML("beforeend",`
<div class="allred-stage" id="ALLRED_STAGE">
  <div class="grid"></div>
  <canvas id="allred-fx" aria-hidden="true"></canvas>
  <div class="allred-ui"><div class="center">
    <div class="t">ALLRED Studio</div>
    <div class="s">We Make The Internet Better</div>
    <button class="b" id="allred-cta">Leave a request</button>
  </div></div>
  <div class="grain"></div>
</div>`);
    const b=document.createElement('div'); b.id='allred-build';
    b.textContent='ALLRED build '+(window.ALLRED_BUILD||'10');
    document.body.appendChild(b);
  }
  function ready(fn){document.readyState!=="loading"?fn():document.addEventListener("DOMContentLoaded",fn)}
  function ensureTHREE(cb){
    if(window.THREE) return cb();
    const a=document.createElement("script"); a.src=CDN1; a.onload=cb; a.onerror=()=>{const b=document.createElement("script"); b.src=CDN2; b.onload=cb; document.head.appendChild(b)}; document.head.appendChild(a);
  }

  function start(){
    addStyle(); addMarkup();

    // Настройки
    const BASE_W=1536, COUNT=130, SIZE_MIN=1.3, SIZE_MAX=3.2, HOVER_FORCE=0.28, CLICK_FORCE=0.55, DAMP=0.93, RADIUS=3.6;

    const cvs=document.getElementById("allred-fx");
    const renderer=new THREE.WebGLRenderer({canvas:cvs,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.setSize(innerWidth,innerHeight);

    const scene=new THREE.Scene(); scene.fog=new THREE.Fog(0xf1f5fb,22,60);
    const camera=new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 150);
    camera.position.set(0,1.1,16); scene.add(camera);

    scene.add(new THREE.HemisphereLight(0xffffff,0xd6deea,1.0));
    const dir=new THREE.DirectionalLight(0xffffff,.95); dir.position.set(8,10,7); scene.add(dir);

    // env + noise (чистые блики)
    const env=makeEnv();
    const nm=noise(256,256,.6,true); nm.wrapS=nm.wrapT=THREE.RepeatWrapping; nm.repeat.set(2,2);
    const rm=noise(256,256,.25,false);
    const normalScale=new THREE.Vector2(0.15,0.15);
    const RED=new THREE.Color(0xe10600);

    const glass=new THREE.MeshPhysicalMaterial({
      color:0xf8fbff, metalness:.35, roughness:.05,
      clearcoat:1, clearcoatRoughness:.025,
      transmission: renderer.capabilities.isWebGL2 ? 0.75 : 0.0, thickness:0.9, ior:1.45,
      envMap:env, envMapIntensity:1.3, normalMap:nm, roughnessMap:rm
    });
    glass.normalScale=normalScale.clone();

    const redMetal=new THREE.MeshPhysicalMaterial({
      color:RED, metalness:.95, roughness:.22,
      clearcoat:1, clearcoatRoughness:.05,
      envMap:env, envMapIntensity:1.25, normalMap:nm, roughnessMap:rm
    });
    redMetal.normalScale=normalScale.clone();

    // ТОЛЬКО пирамиды
    const geos=[
      new THREE.ConeGeometry(.6,1.35,3).translate(0,.675,0),
      new THREE.TetrahedronGeometry(.85,0),
      new THREE.ConeGeometry(.5,1.1,3).translate(0,.55,0),
    ];

    // Боковые осколки
    const side=new THREE.Group(); scene.add(side);
    const scale=Math.min(1.5, Math.max(.7, innerWidth/BASE_W));
    const count=Math.round(COUNT*scale);
    const shards=[];
    function spawn(a,n){
      for(let i=0;i<n;i++){
        const g=geos[(Math.random()*geos.length)|0];
        const mat=(Math.random()<.5?redMetal:glass).clone();
        const m=new THREE.Mesh(g,mat);
        const base=new THREE.Vector3(
          THREE.MathUtils.randFloat(a.minX,a.maxX),
          THREE.MathUtils.randFloat(a.minY,a.maxY),
          THREE.MathUtils.randFloat(-2.4,2.2)
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
    const X=11,Y=7.2;
    spawn({minX:-X,maxX:-X*.45,minY:-1,maxY:Y}, Math.round(count*.55));
    spawn({minX: X*.45,maxX: X,  minY:-1,maxY:Y}, Math.round(count*.55));
    spawn({minX:-X*.9,maxX: X*.9,minY:Y*.55,maxY:Y}, Math.round(count*.35));

    // Центральная фигура
    const center=new THREE.Group(); scene.add(center); center.position.set(0,.2,0);
    const cluster=new THREE.Group(); center.add(cluster);
    function pyr(r,h,isRed){const g=new THREE.ConeGeometry(r,h,3).translate(0,h/2,0); return new THREE.Mesh(g,isRed?redMetal.clone():glass.clone());}
    const P=[], PD=[];
    const p1=pyr(1.2,2.25,false); p1.rotation.y=Math.PI/7; cluster.add(p1); P.push(p1);
    const p2=pyr(.9,1.85,true); p2.position.set(1.65,.1,.2); p2.rotation.set(.05,-.42,.2); cluster.add(p2); P.push(p2);
    const p3=pyr(.78,1.65,false); p3.position.set(-1.52,-.15,-.3); p3.rotation.set(-.2,.5,-.15); cluster.add(p3); P.push(p3);
    const p4=pyr(.66,1.35,false); p4.position.set(.25,-.55,1.25); p4.rotation.set(.35,-.2,.1); cluster.add(p4); P.push(p4);
    const p5=pyr(.6,1.25,true); p5.position.set(-.35,.78,.95); p5.rotation.set(-.1,.25,0); cluster.add(p5); P.push(p5);
    P.forEach(m=>PD.push({m,base:m.position.clone(),rot:m.rotation.clone()}));

    // Микро-дебрис (малые пирамидки)
    const dGeo=new THREE.TetrahedronGeometry(.1,0);
    const dMat=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:.6,roughness:.28,envMap:env,envMapIntensity:1.15,normalMap:nm,roughnessMap:rm});
    dMat.normalScale=normalScale.clone();
    const debris=[], dGroup=new THREE.Group(); center.add(dGroup);
    for(let i=0;i<120;i++){
      const m=new THREE.Mesh(dGeo,(Math.random()<.3?redMetal:dMat).clone());
      const r=THREE.MathUtils.randFloat(1.6,3.0), a=Math.random()*Math.PI*2;
      m.position.set(Math.cos(a)*r, THREE.MathUtils.randFloat(-.8,1.2), Math.sin(a)*r);
      m.userData={base:m.position.clone(),ph:Math.random()*Math.PI*2};
      dGroup.add(m); debris.push(m);
    }

    // Наведение: пересечение луча с плоскостью z=0
    const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
    const pointer=new THREE.Vector3(); const planeZ0=new THREE.Plane(new THREE.Vector3(0,0,1),0);
    let active=false, hover=false;
    addEventListener("pointermove",(e)=>{
      const rect=renderer.domElement.getBoundingClientRect();
      ndc.x=((e.clientX-rect.left)/rect.width)*2-1;
      ndc.y=-((e.clientY-rect.top)/rect.height)*2+1;
      ray.setFromCamera(ndc,camera);
      ray.ray.intersectPlane(planeZ0, pointer);
      active=true; hover = pointer.distanceTo(center.position) < 3.3;
    },{passive:true});
    addEventListener("pointerleave",()=>{active=false; hover=false;});
    addEventListener("click",()=>impulse(CLICK_FORCE,RADIUS*1.25));

    function impulse(F,rad){
      for(const m of shards){
        const d=m.position.distanceTo(pointer);
        if(d<rad){
          const dir=m.position.clone().sub(pointer).normalize();
          m.userData.vel.addScaledVector(dir, F*(1-d/rad));
        }
      }
    }

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
      for(const o of PD){
        const m=o.m;
        if(hover){
          const dir=m.position.clone().sub(cluster.position).normalize();
          const target=o.base.clone().addScaledVector(dir,.58);
          m.position.lerp(target,.24);
          m.rotation.x+=.012; m.rotation.y+=.012;
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

    addEventListener("resize",()=>{renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();});
    document.getElementById("allred-cta")?.addEventListener("click",()=> alert("ALLRED Studio — request form goes here."));

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
          img.data[i]=128+(n-128)*.2; img.data[i+1]=128+(Math.random()*255-128)*.2; img.data[i+2]=255; img.data[i+3]=255;
        } else {
          const v=255-n*inten; img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255;
        }
      }
      x.putImageData(img,0,0); return new THREE.CanvasTexture(c);
    }
  }

  ready(()=> ensureTHREE(()=>{ addStyle(); addMarkup(); start(); }));
})();
