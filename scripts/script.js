// Conecta dados (rules.json / neos.json) e anima os medidores.
// energy_index = weight(size) * weight(speed)  (1..9)

const state = {
  rules: null,
  neos: [],
  lastNEO: null,
  neoIndex: -1 // índice do NEO atual (para "Próximo exemplo")
};


document.addEventListener('DOMContentLoaded', () => {
  wireSelectionButtons();
  loadData();
  document.getElementById('btn-next-neo').addEventListener('click', pickNextNEO);
  document.getElementById('btn-simular').addEventListener('click', simulate);
  document.getElementById('btn-nasa').addEventListener('click', pickRandomNEO);

  // ---- Modal "Como funciona" ---- (já existia na etapa anterior)
  const modal = document.getElementById('how-modal');
  const open = document.getElementById('btn-info');
  const closeBtn = document.getElementById('btn-close-modal');
  const ok = document.getElementById('btn-ok-modal');

  function openModal(){
    if(!modal) return;
    modal.hidden = false;
    ok?.focus();
  }
  function closeModal(){
    if(!modal) return;
    modal.hidden = true;
    open?.focus();
  }

  open?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  ok?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target.matches('.modal-backdrop,[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') closeModal();
  });
});

// ---- Carregamento de dados ----
async function loadData() {
  try {
    const [rules, neos] = await Promise.all([
      fetch('rules/rules.json').then(r => r.json()),
      fetch('rules/neos.json').then(r => r.json()),
    ]);
    state.rules = rules;
    state.neos = neos;
    console.log('Dados carregados:', { rules, neos });
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
    alert('Erro ao carregar dados. Confira se rules.json e neos.json estão na raiz do projeto.');
  }
}

// ---- UI: seleção de botões ----
function wireSelectionButtons() {
  document.querySelectorAll('.btn-group').forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      group.querySelectorAll('button').forEach(b => {
        b.classList.remove('filled');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('filled');
      btn.setAttribute('aria-pressed', 'true');

      // NOVO: se o usuário mexer em tamanho/velocidade, desfaz o "NEO selecionado"
      const name = group.dataset.name;
      if (name === 'size' || name === 'speed') {
        state.lastNEO = null;
        setSelectedNEO(null);
      }
    });
  });
}

function getSelection(groupName) {
  const group = document.querySelector(`.btn-group[data-name="${groupName}"]`);
  const sel = group?.querySelector('button.filled');
  return sel ? sel.dataset.value : null;
}

function setSelection(groupName, value) {
  const group = document.querySelector(`.btn-group[data-name="${groupName}"]`);
  if (!group) return;
  group.querySelectorAll('button').forEach(b => {
    const on = b.dataset.value === value;
    b.classList.toggle('filled', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

// ---- Simulação ----
function simulate(note = '') {
  if (!state.rules) {
    alert('Aguarde carregar os dados…');
    return;
  }

  const size = getSelection('size');       // pequeno | medio | gigante
  const speed = getSelection('speed');     // lento | rapido | super
  const terrain = getSelection('terrain'); // oceano | costa | interior | floresta
  const mitigation = getSelection('mitigation') || '0d'; // NOVO

  if (!size || !speed || !terrain) {
    alert('Escolha tamanho, velocidade e local de impacto.');
    return;
  }

  // Índice base (1..9)
  const wSize = state.rules.weights.size[size] ?? 1;
  const wSpeed = state.rules.weights.speed[speed] ?? 1;
  const energyIndexBase = wSize * wSpeed;

  // Aplica mitigação (reduz o índice)
  const factor = mitigationFactor(mitigation);        // NOVO
  const energyIndexEff = Math.max(1, Math.min(9, energyIndexBase * factor)); // 1..9

  const effConf = state.rules.effects[terrain];
  const levels = {
    tsunami: levelFromThresholds(effConf.tsunami, energyIndexEff),
    cratera: levelFromThresholds(effConf.cratera, energyIndexEff),
    tremor:  levelFromThresholds(effConf.tremor,  energyIndexEff),
  };

  renderLevels(levels);
  setDisclaimer(note); // mantém o disclaimer base ou o texto do NEO

  // Números educativos (não mudam com mitigação por enquanto)
  const numbers = computeEducationalNumbers(size, speed, state.lastNEO);
  renderFacts(numbers, energyIndexEff); // mostra o índice mitigado

  console.log('Simulação:', { size, speed, terrain, mitigation, factor, energyIndexBase, energyIndexEff, levels, numbers });
}


function levelFromThresholds(conf, E) {
  if (!conf || conf.non_applicable) return { label: 'N/A', pct: 0 };
  const [t1, t2] = conf.thresholds || [3, 6];
  if (E <= t1)  return { label: 'BAIXO', pct: 30 };
  if (E <= t2)  return { label: 'MÉDIO', pct: 60 };
  return { label: 'ALTO', pct: 90 };
}

function renderLevels(levels) {
  const order = ['tsunami', 'cratera', 'tremor'];
  const meters = document.querySelectorAll('.results-card .meter');

  order.forEach((name, i) => {
    const meter = meters[i];
    if (!meter || !levels[name]) return;
    const levelSpan = meter.querySelector('.level');
    const bar = meter.querySelector('.meter-bar span');
    levelSpan.textContent = levels[name].label;
    bar.style.width = (levels[name].pct || 0) + '%';
  });
}

function setDisclaimer(extraNote = '') {
  const disc = document.querySelector('.results-card .disclaimer');
  if (!disc) return;
  const base = '🔗 Dados: NASA NEO (tamanho/velocidade) + USGS (terreno). Versão educativa/simplificada.';
  disc.innerHTML = extraNote ? `☄️ ${extraNote}<br>${base}` : base;
}

// ---- Exemplo da NASA (NEO aleatório) ----
function pickRandomNEO() {
  if (!state.rules || !state.neos?.length) {
    alert('Aguarde carregar os dados…');
    return;
  }
  const neo = state.neos[Math.floor(Math.random() * state.neos.length)];
  state.lastNEO = neo; // NOVO: guarda para usar nos cálculos
  const sizeBand = mapSizeToBand(neo.approx_diameter_m);
  const speedBand = mapSpeedToBand(neo.velocity_kms);

  const idx = Math.floor(Math.random() * state.neos.length);
  state.neoIndex = idx;
  applyNEO(state.neos[idx]);

  setSelection('size', sizeBand);
  setSelection('speed', speedBand);
  // Mantém o terreno atual escolhido

  const note = `Exemplo: ${neo.name} — diâmetro ~ ${neo.approx_diameter_m} m, velocidade ~ ${neo.velocity_kms} km/s.`;
  simulate(note);
  setSelectedNEO(neo);
}

function applyNEO(neo){
  if(!neo) return;
  state.lastNEO = neo;
  const sizeBand = mapSizeToBand(neo.approx_diameter_m);
  const speedBand = mapSpeedToBand(neo.velocity_kms);
  setSelection('size', sizeBand);
  setSelection('speed', speedBand);
  const note = `Exemplo: ${neo.name} — diâmetro ~ ${neo.approx_diameter_m} m, velocidade ~ ${neo.velocity_kms} km/s.`;
  simulate(note);
  setSelectedNEO(neo);
}

function pickNextNEO(){
  if (!state.rules || !state.neos?.length) {
    alert('Aguarde carregar os dados…');
    return;
  }
  state.neoIndex = (state.neoIndex + 1) % state.neos.length;
  applyNEO(state.neos[state.neoIndex]);
}


function mapSizeToBand(meters) {
  const bands = state.rules.bands.size;
  for (const key in bands) {
    const b = bands[key];
    if (meters >= b.min_m && meters < b.max_m) return key;
  }
  if (meters >= (bands.gigante?.min_m ?? 140)) return 'gigante';
  if (meters <= (bands.pequeno?.max_m ?? 50)) return 'pequeno';
  return 'medio';
}

function mapSpeedToBand(kms) {
  const bands = state.rules.bands.speed;
  for (const key in bands) {
    const b = bands[key];
    if (kms >= b.min_kms && kms < b.max_kms) return key;
  }
  if (kms >= (bands.super?.min_kms ?? 20)) return 'super';
  if (kms <= (bands.lento?.max_kms ?? 15)) return 'lento';
  return 'rapido';
}

// ---- NOVO: Mostrar qual NEO foi escolhido ----
function setSelectedNEO(neo){
  const el = document.getElementById('neo-selected');
  if(!el){
    return;
  }
  if(!neo){
    el.textContent = 'Objeto selecionado: —';
    return;
  }
  el.textContent = `Objeto selecionado: ${neo.name} — ~${neo.approx_diameter_m} m @ ~${neo.velocity_kms} km/s (${neo.example_date})`;
}

// ---- NOVO: Cálculos educativos de energia/cratera ----
function computeEducationalNumbers(sizeBand, speedBand, neo) {
  // Se veio NEO, usa os valores reais; senão, usa valores "representativos" das bandas
  const typicalDiameter = { pequeno: 35, medio: 100, gigante: 300 }; // metros
  const typicalSpeed = { lento: 12, rapido: 18, super: 25 }; // km/s

  const d_m = neo?.approx_diameter_m ?? typicalDiameter[sizeBand] ?? 100;
  const v_kms = neo?.velocity_kms ?? typicalSpeed[speedBand] ?? 18;

  // massa ~ densidade * volume; densidade rochosa ~3000 kg/m³
  const density = 3000; // kg/m3 (educativo)
  const r = d_m / 2;
  const volume = (4/3) * Math.PI * Math.pow(r, 3);
  const mass = density * volume; // kg
  const v_ms = v_kms * 1000;
  const energyJ = 0.5 * mass * v_ms * v_ms;

  // Conversão: 1 megatonelada TNT ≈ 4.184e15 J
  const mt = energyJ / 4.184e15;

  // Estimativa educativa de diâmetro da cratera (km):
  // aproximação simples baseada em energia: crater_km ≈ 0.30 * (Mt)^(1/3)
  // (rótulo educativo; não substitui modelos físicos completos)
  const crater_km = 0.30 * Math.cbrt(Math.max(mt, 0.000001));

  return {
    diameter_m: d_m,
    velocity_kms: v_kms,
    energy_mt: mt,
    crater_km: crater_km
  };
}

function renderFacts(numbers, energyIndex){
  const e = document.getElementById('fact-energy');
  const c = document.getElementById('fact-crater');
  const i = document.getElementById('fact-index');

  if(e) e.textContent = `${formatNumber(numbers.energy_mt, 1)} Mt TNT`;
  if(c) c.textContent = `${formatNumber(numbers.crater_km, 2)} km`;
  if(i) i.textContent = `${energyIndex} / 9`;
}

function formatNumber(n, digits = 1){
  if (!isFinite(n)) return '—';
  // Para valores muito grandes, alterna para notação compacta
  if (n >= 1000) {
    // ex.: 1.6k, 3.2k Mt
    const compact = new Intl.NumberFormat('pt-BR', { notation:'compact', maximumFractionDigits:1 }).format(n);
    return compact.replace('.', ',');
  }
  return n.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

// ---- Exportar imagem do painel direito ----
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('btn-export');
  const rightPanel = document.querySelector('.panel-right');
  if (exportBtn && rightPanel) {
    exportBtn.addEventListener('click', async () => {
      try {
        const canvas = await html2canvas(rightPanel, {
          backgroundColor: null,
          scale: window.devicePixelRatio > 1 ? 2 : 1
        });
        const link = document.createElement('a');
        link.download = `meteor-madness-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
        console.error('Falha ao exportar imagem:', e);
        alert('Não foi possível gerar a imagem. Tente novamente.');
      }
    });
  }
});

function mitigationFactor(code){
  switch(code){
    case '10a': return 0.50; // agir muito cedo → grande redução
    case '5a':  return 0.70;
    case '1a':  return 0.90;
    case '1m':  return 0.98;
    case '0d':
    default:    return 1.00; // último minuto → sem efeito
  }
}

// ---- Tooltips acessíveis ----
document.addEventListener('DOMContentLoaded', () => {
  const tips = Array.from(document.querySelectorAll('.tip'));
  tips.forEach(t => {
    // mouse
    t.addEventListener('mouseenter', () => t.classList.add('open'));
    t.addEventListener('mouseleave', () => t.classList.remove('open'));
    // teclado
    t.addEventListener('focus', () => t.classList.add('open'));
    t.addEventListener('blur', () => t.classList.remove('open'));
    // Esc para fechar
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        t.classList.remove('open');
        t.blur();
      }
    });
  });
});
