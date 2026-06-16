const fromSelect = document.getElementById('fromSelect');
const toSelect = document.getElementById('toSelect');
const swapBtn = document.getElementById('swapBtn');
const goBtn = document.getElementById('goBtn');
const results = document.getElementById('results');

function renderLineStrip() {
  const strip = document.getElementById('lineStrip');
  if (!strip) return;
  strip.innerHTML = LINE_ORDER.map(key => {
    const s = STATIONS[key];
    const isInterchange = !!s.interchange;
    return `
      <div class="strip-stop ${isInterchange ? 'interchange' : ''}">
        <div class="strip-dot"></div>
        <div class="strip-code">${s.code}</div>
        <div class="strip-name">${s.name}</div>
      </div>
    `;
  }).join('');
}

function populateSelects() {
  LINE_ORDER.forEach(key => {
    const station = STATIONS[key];
    const label = `${station.code} · ${station.name}`;

    const opt1 = document.createElement('option');
    opt1.value = key;
    opt1.textContent = label;
    fromSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = key;
    opt2.textContent = label;
    toSelect.appendChild(opt2);
  });
  fromSelect.value = 'nana';
  toSelect.value = 'siam';
}

function renderEmpty() {
  results.innerHTML = `
    <div class="empty-state">
      <div class="display">Pick two stations</div>
      <div>Routes cover Siam, Chit Lom, Phloen Chit, Nana, and Asok.</div>
    </div>
  `;
}

function stepIcon(type) {
  if (type === 'start') return '●';
  if (type === 'ride') return '→';
  if (type === 'transfer') return '⚠';
  if (type === 'arrive') return '◉';
  return '○';
}

function renderInterchangeDiagram(station) {
  if (!station.interchange) return '';
  const ic = station.interchange;
  return `
    <div class="interchange-card">
      <div class="label">${station.name} interchange</div>
      <div class="ic-headline">${ic.headline}</div>
      <div class="levels">
        ${ic.levels.map((lvl, i) => `
          <div class="level-row ${i === 0 ? 'upper' : 'lower'}">
            <div class="level-top">
              <span class="level-tag">${lvl.tag}</span>
              <span class="level-dir">${lvl.direction}</span>
            </div>
            <p>${lvl.lines}</p>
          </div>
        `).join('')}
      </div>
      <div class="key-rule">${ic.watch}</div>
    </div>
  `;
}

function renderRoute(fromKey, toKey) {
  if (fromKey === toKey) {
    results.innerHTML = `
      <div class="empty-state">
        <div class="display">Same station selected</div>
        <div>Pick two different stations to get a route.</div>
      </div>
    `;
    return;
  }

  const route = getRoute(fromKey, toKey);
  if (!route) {
    renderEmpty();
    return;
  }

  const { from, to, steps, segment } = route;

  let html = '';

  // Meta pills
  html += `<div class="meta-row">`;
  html += `<span class="pill train">${from.line.split('+')[0].trim()} Line</span>`;
  html += `<span class="pill">${from.code} → ${to.code}</span>`;
  if (segment) {
    html += `<span class="pill">${segment.walkMinutes} min walk equiv.</span>`;
    if (segment.recommendTrain) {
      html += `<span class="pill">Train recommended</span>`;
    }
  }
  html += `</div>`;

  // Route steps
  html += `<div class="route-line">`;
  steps.forEach(step => {
    const cls = step.type === 'transfer' ? 'transfer' : (step.type === 'alert' ? 'alert' : '');
    html += `
      <div class="step ${cls}">
        <div class="step-title">${step.title}</div>
        <div class="step-detail">${step.detail}</div>
      </div>
    `;
  });
  html += `</div>`;

  // Siam interchange diagram if relevant to this route
  if (from.interchange) html += renderInterchangeDiagram(from);
  if (to.interchange && fromKey !== 'siam') html += renderInterchangeDiagram(to);

  results.innerHTML = html;
}

populateSelects();
renderLineStrip();
renderEmpty();

goBtn.addEventListener('click', () => {
  renderRoute(fromSelect.value, toSelect.value);
});

swapBtn.addEventListener('click', () => {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;
});
