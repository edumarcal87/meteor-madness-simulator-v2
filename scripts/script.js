// Conecta dados (rules.json / neos.json) e anima os medidores.
// energy_index = weight(size) * weight(speed)  (1..9)

const state = {
  rules: null,
  neos: [],
};

document.addEventListener('DOMContentLoaded', () => {
  wireSelectionButtons();
  loadData();
  // document.getElementById('btn-simular').addEventListener('click', simulate);
  document.getElementById('btn-nasa').addEventListener('click', pickRandomNEO);
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

  const size = getSelection('size');     // pequeno | medio | gigante
  const speed = getSelection('speed');   // lento | rapido | super
  const terrain = getSelection('terrain'); // oceano | costa | interior | floresta

  if (!size || !speed || !terrain) {
    alert('Escolha tamanho, velocidade e local de impacto.');
    return;
  }

  const wSize = state.rules.weights.size[size] ?? 1;
  const wSpeed = state.rules.weights.speed[speed] ?? 1;
  const energyIndex = wSize * wSpeed; // 1..9

  const effConf = state.rules.effects[terrain];
  const levels = {
    tsunami: levelFromThresholds(effConf.tsunami, energyIndex),
    cratera: levelFromThresholds(effConf.cratera, energyIndex),
    tremor:  levelFromThresholds(effConf.tremor,  energyIndex),
  };

  renderLevels(levels);
  setDisclaimer(note);
  console.log('Simulação:', { size, speed, terrain, energyIndex, levels });
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
  const sizeBand = mapSizeToBand(neo.approx_diameter_m);
  const speedBand = mapSpeedToBand(neo.velocity_kms);

  setSelection('size', sizeBand);
  setSelection('speed', speedBand);
  // Mantém o terreno atual escolhido

  const note = `Exemplo: ${neo.name} — diâmetro ~ ${neo.approx_diameter_m} m, velocidade ~ ${neo.velocity_kms} km/s.`;
  simulate(note);
  setSelectedNEO(neo);
}

function mapSizeToBand(meters) {
  const bands = state.rules.bands.size;
  for (const key in bands) {
    const b = bands[key];
    if (meters >= b.min_m && meters < b.max_m) return key;
  }
  // fallback
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

function setSelectedNEO(neo){
  const el = document.getElementById('neo-selected');
  if(!el || !neo) return;
  el.textContent = `NEO: ${neo.name} - ~${neo.approx_diameter_m} m @ ~${neo.velocity_kms} km/s (${neo.example_date})`;
}

// ---- Modal "Como funciona" ----
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('how-modal');
  const open = document.getElementById('btn-info');
  const closeBtn = document.getElementById('btn-close-modal');
  const ok = document.getElementById('btn-ok-modal');

  function openModal(){
    if(!modal) return;
    modal.hidden = false;
    // foco acessível
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
