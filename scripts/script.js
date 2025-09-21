// ===== I18N (PT/EN) =====
const I18N = {
  pt: {
    "app.title": "Meteor Madness — Simulador de Impacto",
    "panel.controls": "⚙️ Controles",
    "panel.mapResults": "🌐 Mapa & Resultados",
    "btn.nasa": "🔭 Usar Exemplo da NASA",
    "btn.next": "➡️ Próximo exemplo",
    "btn.simulate": "▶ Simular",
    "label.size": "Tamanho do asteroide",
    "label.speed": "Velocidade relativa",
    "label.terrain": "Local de impacto",
    "label.mitigation": "Mitigação (agir antes do impacto)",
    "opt.size.small": "Pequeno",
    "opt.size.medium": "Médio",
    "opt.size.large": "Gigante",
    "opt.speed.slow": "Lento",
    "opt.speed.fast": "Rápido",
    "opt.speed.super": "Super",
    "opt.terrain.ocean": "Oceano",
    "opt.terrain.coast": "Costa/Cidade",
    "opt.terrain.inland": "Interior",
    "opt.terrain.forest": "Floresta",
    "opt.mitigation.10y": "10 anos",
    "opt.mitigation.5y": "5 anos",
    "opt.mitigation.1y": "1 ano",
    "opt.mitigation.1m": "1 mês",
    "opt.mitigation.0d": "Último minuto",
    "neo.none": "Objeto selecionado: —",
    "effects.title": "📊 Efeitos Previstos",
    "effects.tsunami": "🌊 Tsunami",
    "effects.crater": "🕳️ Cratera",
    "effects.quake": "🌐 Tremor",
    "facts.energy": "Energia estimada",
    "facts.crater": "Cratera (~diâmetro)",
    "facts.index": "Índice de energia",
    "disclaimer.base": "🔗 Dados: NASA NEO (tamanho/velocidade) + USGS (terreno). Versão educativa/simplificada.",
    "neo.selectedPrefix": "Objeto selecionado",
    "level.low": "BAIXO",
    "level.medium": "MÉDIO",
    "level.high": "ALTO",
    "level.na": "N/A"
  },
  en: {
    "app.title": "Meteor Madness — Impact Simulator",
    "panel.controls": "⚙️ Controls",
    "panel.mapResults": "🌐 Map & Results",
    "btn.nasa": "🔭 Use NASA Example",
    "btn.next": "➡️ Next example",
    "btn.simulate": "▶ Simulate",
    "label.size": "Asteroid size",
    "label.speed": "Relative speed",
    "label.terrain": "Impact location",
    "label.mitigation": "Mitigation (act before impact)",
    "opt.size.small": "Small",
    "opt.size.medium": "Medium",
    "opt.size.large": "Large",
    "opt.speed.slow": "Slow",
    "opt.speed.fast": "Fast",
    "opt.speed.super": "Super",
    "opt.terrain.ocean": "Ocean",
    "opt.terrain.coast": "Coast/City",
    "opt.terrain.inland": "Inland",
    "opt.terrain.forest": "Forest",
    "opt.mitigation.10y": "10 years",
    "opt.mitigation.5y": "5 years",
    "opt.mitigation.1y": "1 year",
    "opt.mitigation.1m": "1 month",
    "opt.mitigation.0d": "Last minute",
    "neo.none": "Selected object: —",
    "effects.title": "📊 Predicted Effects",
    "effects.tsunami": "🌊 Tsunami",
    "effects.crater": "🕳️ Crater",
    "effects.quake": "🌐 Quake",
    "facts.energy": "Estimated energy",
    "facts.crater": "Crater (~diameter)",
    "facts.index": "Energy index",
    "disclaimer.base": "🔗 Data: NASA NEO (size/speed) + USGS (terrain). Educational/simplified version.",
    "neo.selectedPrefix": "Selected object",
    "level.low": "LOW",
    "level.medium": "MEDIUM",
    "level.high": "HIGH",
    "level.na": "N/A"
  }
};

const i18n = {
  current: localStorage.getItem('lang') || 'pt',
  t(key){ return (I18N[this.current] && I18N[this.current][key]) || I18N.pt[key] || key; },
  apply(){
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.getAttribute('data-i18n'));
    });
    // Atualiza botão de idioma
    const btn = document.getElementById('btn-lang');
    if (btn) {
      btn.textContent = this.current === 'pt' ? 'EN' : 'PT';
      btn.setAttribute('aria-label', this.current === 'pt' ? 'Switch language' : 'Mudar idioma');
    }
    // Se não houver NEO selecionado, mantém rótulo padrão
    if (!state.lastNEO) setSelectedNEO(null);
    // Atualiza disclaimer base (sem nota extra)
    setDisclaimer('');
  },
  set(lang){
    this.current = (lang === 'en') ? 'en' : 'pt';
    localStorage.setItem('lang', this.current);
    this.apply();
  },
  toggle(){
    this.set(this.current === 'pt' ? 'en' : 'pt');
  }
};

// ===== ESTADO =====
const state = {
  rules: null,
  neos: [],
  lastNEO: null,
  neoIndex: -1
};

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  wireSelectionButtons();
  loadData();

  document.getElementById('btn-simular')?.addEventListener('click', simulate);
  document.getElementById('btn-nasa')?.addEventListener('click', pickRandomNEO);
  document.getElementById('btn-next-neo')?.addEventListener('click', pickNextNEO);

  // Toggle idioma
  document.getElementById('btn-lang')?.addEventListener('click', () => i18n.toggle());
  i18n.apply();

  // Exportar imagem
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

  // Modal "Como funciona"
  const modal = document.getElementById('how-modal');
  const open = document.getElementById('btn-info');
  const closeBtn = document.getElementById('btn-close-modal');
  const ok = document.getElementById('btn-ok-modal');
  function openModal(){ if(!modal) return; modal.hidden = false; ok?.focus(); }
  function closeModal(){ if(!modal) return; modal.hidden = true; open?.focus(); }
  open?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  ok?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target.matches('.modal-backdrop,[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (!modal || modal.hidden) return; if (e.key === 'Escape') closeModal(); });

  // Tooltips acessíveis
  const tips = Array.from(document.querySelectorAll('.tip'));
  tips.forEach(t => {
    t.addEventListener('mouseenter', () => t.classList.add('open'));
    t.addEventListener('mouseleave', () => t.classList.remove('open'));
    t.addEventListener('focus', () => t.classList.add('open'));
    t.addEventListener('blur', () => t.classList.remove('open'));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { t.classList.remove('open'); t.blur(); }
    });
  });
});

// ===== Carregamento de dados =====
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

// ===== UI: seleção de botões =====
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

// ===== Simulação =====
function simulate(note = '') {
  if (!state.rules) {
    alert('Aguarde carregar os dados…');
    return;
  }

  const size = getSelection('size');
  const speed = getSelection('speed');
  const terrain = getSelection('terrain');
  const mitigation = getSelection('mitigation') || '0d';

  if (!size || !speed || !terrain) {
    alert('Escolha tamanho, velocidade e local de impacto.');
    return;
  }

  // Índice base (1..9)
  const wSize = state.rules.weights.size[size] ?? 1;
  const wSpeed = state.rules.weights.speed[speed] ?? 1;
  const energyIndexBase = wSize * wSpeed;

  // Mitigação
  const factor = mitigationFactor(mitigation);
  const energyIndexEff = Math.max(1, Math.min(9, energyIndexBase * factor)); // 1..9

  // Níveis por terreno
  const effConf = state.rules.effects[terrain];
  const levels = {
    tsunami: levelFromThresholds(effConf.tsunami, energyIndexEff),
    cratera: levelFromThresholds(effConf.cratera, energyIndexEff),
    tremor:  levelFromThresholds(effConf.tremor,  energyIndexEff),
  };

  renderLevels(levels);
  setDisclaimer(note);

  // Números educativos (usam bandas ou NEO real)
  const numbers = computeEducationalNumbers(size, speed, state.lastNEO);
  renderFacts(numbers, energyIndexEff);

  console.log('Simulação:', { size, speed, terrain, mitigation, factor, energyIndexBase, energyIndexEff, levels, numbers });
}

function levelFromThresholds(conf, E) {
  if (!conf || conf.non_applicable) return { label: i18n.t('level.na'), pct: 0 };
  const [t1, t2] = conf.thresholds || [3, 6];
  if (E <= t1)  return { label: i18n.t('level.low'), pct: 30 };
  if (E <= t2)  return { label: i18n.t('level.medium'), pct: 60 };
  return { label: i18n.t('level.high'), pct: 90 };
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
  const base = i18n.t('disclaimer.base');
  disc.innerHTML = extraNote ? `☄️ ${extraNote}<br>${base}` : base;
}

// ===== NEOs (NASA exemplos educativos) =====
function pickRandomNEO() {
  if (!state.rules || !state.neos?.length) {
    alert('Aguarde carregar os dados…');
    return;
  }
  const idx = Math.floor(Math.random() * state.neos.length);
  state.neoIndex = idx;
  applyNEO(state.neos[idx]);
}
function pickNextNEO(){
  if (!state.rules || !state.neos?.length) {
    alert('Aguarde carregar os dados…');
    return;
  }
  state.neoIndex = (state.neoIndex + 1) % state.neos.length;
  applyNEO(state.neos[state.neoIndex]);
}
function applyNEO(neo){
  if(!neo) return;
  state.lastNEO = neo;
  setSelection('size',  mapSizeToBand(neo.approx_diameter_m));
  setSelection('speed', mapSpeedToBand(neo.velocity_kms));
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
  if(!el) return;
  if(!neo){
    el.textContent = i18n.t('neo.none');
    return;
  }
  const prefix = i18n.t('neo.selectedPrefix');
  el.textContent = `${prefix}: ${neo.name} — ~${neo.approx_diameter_m} m @ ~${neo.velocity_kms} km/s (${neo.example_date})`;
}

// ===== Cálculos educativos =====
function computeEducationalNumbers(sizeBand, speedBand, neo) {
  const typicalDiameter = { pequeno: 35, medio: 100, gigante: 300 }; // metros
  const typicalSpeed = { lento: 12, rapido: 18, super: 25 }; // km/s

  const d_m = neo?.approx_diameter_m ?? typicalDiameter[sizeBand] ?? 100;
  const v_kms = neo?.velocity_kms ?? typicalSpeed[speedBand] ?? 18;

  const density = 3000; // kg/m3 (educativo)
  const r = d_m / 2;
  const volume = (4/3) * Math.PI * Math.pow(r, 3);
  const mass = density * volume; // kg
  const v_ms = v_kms * 1000;
  const energyJ = 0.5 * mass * v_ms * v_ms;

  // 1 Mt TNT ≈ 4.184e15 J
  const mt = energyJ / 4.184e15;

  // Cratera (~km) — aproximação didática
  const crater_km = 0.30 * Math.cbrt(Math.max(mt, 0.000001));

  return { diameter_m: d_m, velocity_kms: v_kms, energy_mt: mt, crater_km };
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
  if (n >= 1000) {
    const compact = new Intl.NumberFormat('pt-BR', { notation:'compact', maximumFractionDigits:1 }).format(n);
    return compact.replace('.', ',');
  }
  return n.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function mitigationFactor(code){
  switch(code){
    case '10a': return 0.50;
    case '5a':  return 0.70;
    case '1a':  return 0.90;
    case '1m':  return 0.98;
    case '0d':
    default:    return 1.00;
  }
}
