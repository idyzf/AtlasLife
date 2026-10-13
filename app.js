(function(){
'use strict';

var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var root = document.documentElement;
var state = { paused:false, stopActive:false };

/* ---------------------------------------------------------------
   Page content
---------------------------------------------------------------- */
var PAGES = {
  structure:{
    title:'How DNA is built',
    lead:'DNA is two long chains wound around each other. The chains are the rails, and the base pairs between them are the rungs.',
    blocks:[
      {h:'The backbone', p:'Each chain is a backbone of alternating sugar and phosphate groups. The two chains run in opposite directions, which is called antiparallel: one runs 5\u2032 to 3\u2032, its partner 3\u2032 to 5\u2032.'},
      {h:'The four bases', p:'Attached to the sugars are the bases A, T, G and C. A pairs with T through two hydrogen bonds, and G pairs with C through three. Because the pairs are fixed, one strand always predicts the other.'},
      {h:'The shape', p:'The helix is about 2 nm wide and completes a turn every 10 to 10.5 base pairs, roughly 3.4 nm along its length. The backbones are not evenly spaced, which leaves a wide major groove and a narrow minor groove where proteins read the bases.'}
    ],
    facts:[['2 nm','width of the helix'],['10.5','base pairs per turn'],['3.1 billion','base pairs in a human genome']],
    next:'replication'
  },
  replication:{
    title:'How it copies itself',
    lead:'Before a cell divides, it copies all of its DNA. Each new molecule keeps one old strand and gains one new strand, so the process is called semiconservative.',
    blocks:[
      {h:'Unzip', p:'The enzyme helicase separates the two strands at an origin of replication, opening a Y-shaped replication fork.'},
      {h:'Prime and extend', p:'Primase lays down a short RNA primer. DNA polymerase then adds nucleotides to it, always building in the 5\u2032 to 3\u2032 direction.'},
      {h:'Leading and lagging strands', p:'On one template the copy is made continuously, which is the leading strand. On the other it is made in short pieces called Okazaki fragments, because polymerase can only build in one direction.'},
      {h:'Stitch and proofread', p:'DNA ligase seals the gaps between fragments. Polymerase proofreads as it goes, and with repair systems included, copying errors fall to roughly one per billion bases.'}
    ],
    facts:[['1958','Meselson and Stahl show replication is semiconservative'],['5\u2032 \u2192 3\u2032','the only direction polymerase builds']],
    next:'genes'
  },
  genes:{
    title:'How genes become proteins',
    lead:'A gene is a stretch of DNA that a cell can read to make a functional product, most often a protein.',
    blocks:[
      {h:'Transcription', p:'RNA polymerase copies a gene into messenger RNA (mRNA). RNA uses U in place of T.'},
      {h:'Translation', p:'Ribosomes read the mRNA three letters at a time. Each triplet, called a codon, specifies one amino acid. The start codon AUG codes for methionine, and UAA, UAG and UGA signal stop.'},
      {h:'Scale', p:'Humans have about 20,000 protein-coding genes. Together they make up only a small fraction of the genome, roughly 1 to 2 percent.'}
    ],
    facts:[['64','possible codons'],['20','amino acids'],['~20,000','protein-coding genes in humans']],
    extra:'<p class="block" style="padding-bottom:0;color:var(--ink-2)">Want to see it happen? <a href="#/complement" data-replace style="color:var(--copper-hi)">Translate a sequence in the complement tool.</a></p>',
    next:'mutations'
  },
  mutations:{
    title:'How it changes',
    lead:'A mutation is a change in the DNA sequence. Most are harmless. A few matter a great deal.',
    blocks:[
      {h:'Types of change', p:'A substitution swaps one base for another. An insertion or deletion adds or removes bases. If the number of bases is not a multiple of three, the reading frame shifts and everything after the change is read differently.'},
      {h:'Effects on proteins', p:'A silent mutation leaves the amino acid unchanged. A missense mutation changes one amino acid. A nonsense mutation creates an early stop codon and cuts the protein short.'},
      {h:'Repair', p:'Cells fix much of the damage. Mismatch repair corrects copying errors, and excision repair cuts out damaged bases or short stretches of DNA.'},
      {h:'Why it matters', p:'Mutations are the raw material of evolution, and they can also cause disease, including cancer. The same change can be neutral, harmful or useful, depending on where it lands and on the environment.'}
    ],
    next:'complement'
  },
  complement:{
    title:'Complement a strand',
    lead:'Type a DNA sequence. The tool writes the partner strand, then reads your strand as a gene and translates it.',
    custom:'complement',
    next:'glossary'
  },
  glossary:{
    title:'Glossary',
    lead:'Twelve terms from this tour.',
    terms:[
      ['Antiparallel','The two strands of the helix run in opposite directions.'],
      ['Base','One of A, T, G or C, the letters of DNA.'],
      ['Base pair','Two bases joined across the helix: A with T, G with C.'],
      ['Codon','Three bases that specify one amino acid or a stop signal.'],
      ['Gene','A stretch of DNA that encodes an RNA or protein product.'],
      ['Genome','All of the DNA in an organism.'],
      ['Helicase','The enzyme that unwinds the double helix.'],
      ['mRNA','Messenger RNA: a working copy of a gene carried to the ribosome.'],
      ['Mutation','A change in the DNA sequence.'],
      ['Nucleotide','A base, a sugar and a phosphate. The building block of DNA.'],
      ['Polymerase','An enzyme that builds a new strand of DNA or RNA from a template.'],
      ['Ribosome','The molecular machine that reads mRNA and builds proteins.']
    ],
    next:'structure'
  }
};
var ORDER_TITLES = {};
Object.keys(PAGES).forEach(function(k){ ORDER_TITLES[k] = PAGES[k].title; });

/* ---------------------------------------------------------------
   Page overlay + routing
---------------------------------------------------------------- */
var pageEl = document.getElementById('page');
var bodyEl = document.getElementById('page-body');
var nextEl = document.getElementById('page-next');
var siteEl = document.getElementById('site');
var backBtn = document.getElementById('back');
var lastPt = null, openerEl = null, savedScroll = 0, cameFromApp = false, isOpen = false, closeTimer = null;

function renderPage(key){
  var p = PAGES[key], html = '<h1>'+p.title+'</h1><p class="lead">'+p.lead+'</p>';
  if(p.blocks){
    p.blocks.forEach(function(b){ html += '<section class="block"><h2>'+b.h+'</h2><p>'+b.p+'</p></section>'; });
  }
  if(p.facts){
    html += '<dl class="facts">';
    p.facts.forEach(function(f){ html += '<div><dt>'+f[0]+'</dt><dd>'+f[1]+'</dd></div>'; });
    html += '</dl>';
  }
  if(p.extra) html += p.extra;
  if(p.terms){
    html += '<dl class="glossary">';
    p.terms.forEach(function(t){ html += '<div><dt>'+t[0]+'</dt><dd>'+t[1]+'</dd></div>'; });
    html += '</dl>';
  }
  if(p.custom === 'complement'){
    html += '<div class="tool">'
      + '<label for="seq">DNA sequence (5\u2032 to 3\u2032)</label>'
      + '<textarea id="seq" spellcheck="false" autocapitalize="characters" autocomplete="off"></textarea>'
      + '<p class="hint">Use the letters A, T, G and C. Other characters are ignored. Up to 60 bases.</p>'
      + '<div class="btns"><button class="btn" type="button" id="rand">Random sequence</button><button class="btn" type="button" id="clear">Clear</button></div>'
      + '<div id="out"></div></div>';
  }
  bodyEl.innerHTML = html;
  pageEl.setAttribute('aria-label', p.title);
  var n = PAGES[p.next];
  nextEl.innerHTML = '<small>Next</small><a href="#/'+p.next+'" data-replace>'+n.title+'</a>';
  if(p.custom === 'complement') mountComplement();
  bodyEl.parentNode.parentNode.scrollTop = 0;
}

function showPage(key){
  var wasOpen = isOpen;
  clearTimeout(closeTimer);
  if(!wasOpen){ savedScroll = window.pageYOffset; }
  renderPage(key);
  pageEl.hidden = false;
  pageEl.classList.remove('closing','opening');
  if(!wasOpen && lastPt){
    pageEl.style.setProperty('--cx', lastPt.x+'px');
    pageEl.style.setProperty('--cy', lastPt.y+'px');
    void pageEl.offsetWidth;
    pageEl.classList.add('opening');
  }
  siteEl.setAttribute('inert','');
  root.style.overflow = 'hidden';
  isOpen = true; state.paused = true;
  document.title = PAGES[key].title + ' | Helix';
  if(!wasOpen){ (bodyEl).focus({preventScroll:true}); }
}

function hidePage(){
  if(!isOpen) return;
  isOpen = false;
  pageEl.classList.remove('opening');
  pageEl.classList.add('closing');
  siteEl.removeAttribute('inert');
  root.style.overflow = '';
  window.scrollTo(0, savedScroll);
  state.paused = false;
  document.title = 'Helix: a guided tour of DNA';
  closeTimer = setTimeout(function(){
    pageEl.hidden = true; pageEl.classList.remove('closing');
    window.scrollTo(0, savedScroll);
    if(openerEl && document.body.contains(openerEl)){ try{ openerEl.focus({preventScroll:true}); }catch(e){} }
  }, reduce ? 0 : 230);
}

function route(){
  var m = location.hash.match(/^#\/(\w+)$/);
  var key = m && PAGES[m[1]] ? m[1] : null;
  if(key) showPage(key); else hidePage();
}

document.addEventListener('click', function(e){
  var a = e.target.closest && e.target.closest('a[href^="#/"]');
  if(!a) return;
  if(a.hasAttribute('data-replace')){
    e.preventDefault();
    var target = a.getAttribute('href');
    try{ location.replace(target); }catch(err){ location.hash = target; }
    route();
    return;
  }
  var r = a.getBoundingClientRect();
  lastPt = e.detail ? {x:e.clientX, y:e.clientY} : {x:r.left + r.width/2, y:r.top + r.height/2};
  openerEl = a;
  cameFromApp = true;
});
window.addEventListener('hashchange', route);
backBtn.addEventListener('click', function(){
  if(cameFromApp){ history.back(); }
  else { location.hash = ''; }
});
window.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && isOpen){ backBtn.click(); }
});

/* ---------------------------------------------------------------
   Complement tool
---------------------------------------------------------------- */
var CODON_AA = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
var BASE_IDX = {T:0,C:1,A:2,G:3};
var COMP = {A:'T',T:'A',G:'C',C:'G'};

function mountComplement(){
  var seq = document.getElementById('seq');
  var out = document.getElementById('out');
  seq.value = 'ATGGCCATTGTAATGGGCCGC';
  function clean(v){ return v.toUpperCase().replace(/[^ATGC]/g,'').slice(0,60); }
  function tile(b){ return '<span class="tile b-'+b+'">'+b+'</span>'; }
  function render(){
    var s = clean(seq.value);
    if(!s){ out.innerHTML = '<p class="hint" style="margin-top:1.4rem">Enter a sequence to see its partner strand.</p>'; return; }
    var cols = '';
    for(var i=0;i<s.length;i++){ cols += '<div class="pair">'+tile(s[i])+'<i></i>'+tile(COMP[s[i]])+'</div>'; }
    var gc = Math.round(100 * (s.split('').filter(function(c){return c==='G'||c==='C';}).length) / s.length);
    var start = s.indexOf('ATG'), prot = '', note = '';
    if(start < 0){
      note = 'No start codon (ATG) found in this strand, so there is nothing to translate.';
    } else {
      var hitStop = false;
      for(var j=start;j+3<=s.length;j+=3){
        var c = s.substr(j,3);
        var aa = CODON_AA[16*BASE_IDX[c[0]] + 4*BASE_IDX[c[1]] + BASE_IDX[c[2]]];
        if(aa === '*'){ prot += '<span class="aa stop">stop</span>'; hitStop = true; break; }
        prot += '<span class="aa">'+aa+'</span>';
      }
      note = hitStop ? 'Translation starts at the first ATG and ends at a stop codon.' : 'Translation starts at the first ATG and runs to the end of your sequence.';
    }
    var mrna = s.replace(/T/g,'U');
    out.innerHTML =
      '<div class="strands"><div class="strand-label"><span>5\u2032</span><span>top strand</span></div>'
      + '<div class="pairs">'+cols+'</div>'
      + '<div class="strand-label"><span>3\u2032</span><span>partner strand</span></div></div>'
      + '<div class="readout">'
      + '<div><h2>GC content</h2><p>'+gc+'% of the bases are G or C. G\u2013C pairs have three hydrogen bonds, so higher GC content makes the helix harder to melt.</p></div>'
      + '<div><h2>mRNA of the top strand</h2><p style="word-break:break-all;letter-spacing:.1em">'+mrna+'</p></div>'
      + '<div><h2>Protein</h2><p>'+note+'</p>'+(prot ? '<div class="protein">'+prot+'</div>' : '')+'</div>'
      + '</div>';
  }
  seq.addEventListener('input', render);
  document.getElementById('clear').addEventListener('click', function(){ seq.value=''; render(); seq.focus(); });
  document.getElementById('rand').addEventListener('click', function(){
    var l='ATGC', s='ATG';
    for(var i=0;i<21;i++){ s += l[Math.floor(Math.random()*4)]; }
    seq.value = s; render();
  });
  render();
}

/* ---------------------------------------------------------------
   Stops: which option is at the middle of the screen
---------------------------------------------------------------- */
var stops = Array.prototype.slice.call(document.querySelectorAll('.stop'));
if('IntersectionObserver' in window){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ en.target.classList.toggle('is-active', en.isIntersecting); });
    var any = stops.some(function(s){ return s.classList.contains('is-active'); });
    document.body.classList.toggle('on-stop', any);
    state.stopActive = any;
  }, {rootMargin:'-42% 0px -42% 0px'});
  stops.forEach(function(s){ io.observe(s); });
} else {
  stops.forEach(function(s){ s.classList.add('is-active'); });
}

/* ---------------------------------------------------------------
   3D helix
---------------------------------------------------------------- */
function initHelix(){
  var canvas = document.getElementById('gl');
  var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  /* Procedural studio environment so the metal has something to reflect */
  var pmrem = new THREE.PMREMGenerator(renderer);
  var envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(60,32,16), new THREE.MeshBasicMaterial({color:0x202226, side:THREE.BackSide})));
  function panel(w,h,color,x,y,z){
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({color:color, side:THREE.DoubleSide}));
    m.position.set(x,y,z); m.lookAt(0,0,0); envScene.add(m);
  }
  panel(30,70,0xa9c6ee, 42, 8, 22);
  panel(24,50,0xc9814f,-42,-14, 12);
  panel(70,10,0xffffff,  0, 48, 10);
  panel(12,60,0x6b92c8,-12,  0, 46);
  panel(40,10,0x8fb0e0,  0,-46, 20);
  var envMap = pmrem.fromScene(envScene, 0.02).texture;
  pmrem.dispose();

  scene.add(new THREE.AmbientLight(0x8aa0c0, 0.25));
  var key = new THREE.DirectionalLight(0xbfd6ff, 1.1); key.position.set(6,5,8); scene.add(key);
  var rim = new THREE.DirectionalLight(0xd98a55, 0.8); rim.position.set(-7,-3,4); scene.add(rim);

  /* Helix geometry */
  var R = 1, PITCH = 3.6, LEN = 64, BP_PER_TURN = 10.5, PHASE = 2.5;
  var helix = new THREE.Group(); scene.add(helix);

  function pt(y, phase){
    var a = (y / PITCH) * Math.PI * 2 + phase;
    return new THREE.Vector3(Math.cos(a)*R, y, Math.sin(a)*R);
  }
  function HelixCurve(phase){ THREE.Curve.call(this); this.phase = phase; }
  HelixCurve.prototype = Object.create(THREE.Curve.prototype);
  HelixCurve.prototype.constructor = HelixCurve;
  HelixCurve.prototype.getPoint = function(t, target){
    target = target || new THREE.Vector3();
    return target.copy(pt((t - 0.5) * LEN, this.phase));
  };

  var backMat = new THREE.MeshStandardMaterial({color:0x6a97cf, metalness:1, roughness:0.3, envMap:envMap, envMapIntensity:1.25});
  [0, PHASE].forEach(function(ph){
    var geo = new THREE.TubeGeometry(new HelixCurve(ph), 950, 0.14, 14, false);
    helix.add(new THREE.Mesh(geo, backMat));
  });

  /* Base-pair rungs, coloured by base */
  var baseColors = {A:0x8fb8ea, T:0xd9a07a, G:0xbfc9d8, C:0xd48b84};
  var pairs = [['A','T'],['T','A'],['G','C'],['C','G']];
  var seed = 7;
  function rnd(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  var rodGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 10, 1);
  var up = new THREE.Vector3(0,1,0);
  function rod(a, b, mat){
    var dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    var m = new THREE.Mesh(rodGeo, mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(up, dir.normalize());
    m.scale.set(1, len, 1);
    return m;
  }
  function mkMat(c){
    return new THREE.MeshStandardMaterial({color:c, metalness:0.85, roughness:0.38, envMap:envMap, envMapIntensity:1.0, emissive:0x000000});
  }
  var rungs = [];
  var step = PITCH / BP_PER_TURN;
  for(var y = -LEN/2 + step; y < LEN/2 - step; y += step){
    var pr = pairs[Math.floor(rnd()*4)];
    var a = pt(y, 0), b = pt(y, PHASE), mid = a.clone().add(b).multiplyScalar(0.5);
    var m1 = mkMat(baseColors[pr[0]]), m2 = mkMat(baseColors[pr[1]]);
    helix.add(rod(a, mid, m1)); helix.add(rod(mid, b, m2));
    rungs.push({y:y, m1:m1, m2:m2, e:-1});
  }

  /* Layout */
  var s = 1, travel = 40, halfH = 1;
  function layout(){
    var w = window.innerWidth, h = window.innerHeight, aspect = w / h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    var halfW = halfH * aspect;
    var narrow = w < 760;
    var ndcX = narrow ? -0.62 : -0.52;
    s = narrow ? 0.55 : 1;
    helix.scale.setScalar(s);
    helix.position.x = ndcX * halfW;
    travel = Math.max(0, LEN * s - halfH * 2 - 2);
    var hxPx = (ndcX + 1) / 2 * w;
    var halfPx = (1.14 * s / halfW) * (w / 2);
    var stopEl = document.querySelector('.stop-link');
    var textLeft = stopEl ? stopEl.getBoundingClientRect().left : w * 0.42;
    var gl = hxPx + halfPx + 14, gw = Math.max(0, textLeft - 20 - gl);
    root.style.setProperty('--hx', hxPx + 'px');
    root.style.setProperty('--gl', gl + 'px');
    root.style.setProperty('--gw', gw + 'px');
  }
  window.addEventListener('resize', layout);
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(layout); }
  layout();

  /* Animation */
  var cur = 0, idle = 0, glow = 0.3, last = performance.now();
  var ty = new THREE.Vector3();
  function frame(t){
    requestAnimationFrame(frame);
    var dt = Math.min((t - last) / 1000, 0.05); last = t;
    if(state.paused || document.hidden) return;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, window.pageYOffset / max));
    var k = reduce ? 1 : 1 - Math.pow(0.0008, dt);
    cur += (p - cur) * k;
    if(!reduce) idle += dt * 0.12;
    helix.rotation.y = cur * Math.PI * 2 * 3 + idle;
    helix.position.y = (cur - 0.5) * travel;

    glow += ((state.stopActive ? 1 : 0.3) - glow) * Math.min(1, dt * 3);
    for(var i = 0; i < rungs.length; i++){
      var r = rungs[i];
      var wy = helix.position.y + r.y * s;
      var e = Math.exp(-(wy * wy) / (2 * 1.4 * 1.4)) * glow * 0.8;
      if(Math.abs(e - r.e) > 0.004){
        r.e = e;
        r.m1.emissive.setRGB(0.8 * e, 0.45 * e, 0.22 * e);
        r.m2.emissive.setRGB(0.8 * e, 0.45 * e, 0.22 * e);
      }
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

try{
  if(window.THREE){ initHelix(); } else { root.classList.add('no-gl'); }
}catch(err){
  root.classList.add('no-gl');
  console.error('Helix: WebGL unavailable', err);
}

/* Deep link on load */
route();

})();