# Meteor Madness — Simulador de Impacto

Uma aplicação web educativa para o desafio **Meteor Madness** (NASA Space Apps).  
Permite **simular cenários de impacto de asteroides**, visualizar **efeitos previstos** (tsunami, cratera, tremor), estimar **energia (Mt TNT)** e **diâmetro aproximado de cratera**, além de avaliar **mitigação** (agir anos antes do impacto). Inclui **exemplos de NEOs** (objetos próximos da Terra), **mapa clicável** (Leaflet), **exportar imagem** e **toggle PT/EN**.

**Demo (GitHub Pages):** https://edumarcal87.github.io/meteor-madness-simulator-v2/

---

## ✨ Principais recursos

- **Controles simples:** tamanho (pequeno/médio/gigante), velocidade (lento/rápido/super), terreno (oceano/costa/interior/floresta).
- **Mitigação (quando agir):** 10 anos, 5 anos, 1 ano, 1 mês, último minuto – **reduz a severidade** quanto mais cedo.
- **Efeitos previstos:** barras para **tsunami**, **cratera** e **tremor** (BAIXO/MÉDIO/ALTO).
- **Números educativos:** **energia estimada (Mt TNT)**, **cratera (~km)** e **índice de energia (1–9)**.
- **Exemplos NASA (educativos):** sortear NEO ou avançar para o próximo; exibe nome e parâmetros aproximados.
- **Mapa clicável (Leaflet):** escolha o local no globo e selecione o **terreno** no popup.
- **Exportar imagem:** baixa PNG do painel de resultados para usar em slides/submissão.
- **Acessibilidade e idioma:** tooltips (glossário), foco/teclado, **PT/EN** com um clique.
- **100% estático:** roda em GitHub Pages, sem servidor backend.

---

## 🧠 Como funciona (modelo educativo)

- **Índice de energia:**  
  `energy_index = peso(tamanho) × peso(velocidade)` → varia de **1 a 9**.
  - Pesos definidos em `rules.json`.
  - Aplicamos **fator de mitigação** conforme o tempo de ação (ex.: 10 anos = 0.50).

- **Classificação por terreno:**  
  Para cada terreno, comparamos o `energy_index` mitigado com **thresholds** (em `rules.json`) e obtemos **BAIXO/MÉDIO/ALTO**.

- **Energia estimada (Mt TNT):**  
  Considera **diâmetro** e **velocidade** (do NEO ou das bandas escolhidas), densidade **3.000 kg/m³** e  
  `E = ½ m v²`, com `1 Mt TNT ≈ 4.184×10¹⁵ J`.  
  > Educativo/simplificado: não substitui modelos científicos completos.

- **Cratera (~km):**  
  Estimativa aproximada: `crater_km ≈ 0.30 × (Mt)^(1/3)` (escala didática).

---

## 📁 Estrutura do projeto
/
├─ index.html
├─ style.css
├─ scripts/
│ └─ script.js
├─ rules/
│ ├─ rules.json # pesos, bandas e thresholds por terreno
│ └─ neos.json # NEOs educativos (nome, diâmetro, velocidade, data)
└─ assets/
└─ icons/ # favicons e manifest


---

## 🚀 Executar localmente

> Como há `fetch()` de JSON, **abra com um servidor local** (não use `file://`).

**Opção A — VS Code (recomendado):**
- Instale a extensão **Live Server** → clique **Go Live** abrindo `index.html`.

**Opção B — Python 3:**
```bash
# na raiz do projeto
python -m http.server 5500
# acesse http://localhost:5500

🧩 Dados e fontes

NEOs (educativo): rules/neos.json contém exemplos aproximados (diâmetro, velocidade, data) apenas para demonstração.

Regras: rules/rules.json define bandas, pesos e thresholds por terreno.

Mapa: Tiles do OpenStreetMap (atribuição automática via Leaflet).

Referências: NASA NEO (dados públicos) e USGS (contexto de terreno/efeitos) — não integramos APIs diretamente nesta versão; usamos valores simplificados para fins didáticos.

Aviso: Este projeto é educativo. As estimativas não representam previsões oficiais e não substituem análise científica.

🛠️ Tecnologias

Front-end: HTML, CSS, JavaScript Vanilla

Mapas: Leaflet 1.9.x + OpenStreetMap tiles

Exportar PNG: html2canvas

Hospedagem: GitHub Pages

Acessibilidade/UX: Tooltips, foco, contrastes, responsividade

Branding: Favicon/manifest (PWA-ready)

