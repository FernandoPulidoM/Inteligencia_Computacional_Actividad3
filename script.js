/* ───────────────────────────────────────────
   STATE
─────────────────────────────────────────── */
let currentStep = 0;
const totalSteps = 3;

/* ───────────────────────────────────────────
   VALIDATION RULES
─────────────────────────────────────────── */
const numRules = {
  Age:         { min: 18,  max: 100, label: 'Age',            unit: 'yrs'  },
  RestingBP:   { min: 80,  max: 200, label: 'Resting BP',     unit: 'mmHg' },
  Cholesterol: { min: 100, max: 600, label: 'Cholesterol',    unit: 'mg/dL'},
  MaxHR:       { min: 60,  max: 220, label: 'Max Heart Rate', unit: 'bpm'  },
  Oldpeak:     { min: -3,  max: 7,   label: 'ST Depression',  unit: ''     },
};

const stepFields = {
  0: { nums: ['Age'], selects: ['ChestPainType'], hidden: ['Sex'] },
  1: { nums: ['RestingBP','Cholesterol','MaxHR','Oldpeak'], selects: ['FastingBS'], hidden: [] },
  2: { nums: [], selects: ['RestingECG','ST_Slope'], hidden: ['ExerciseAngina'] },
};

/* ───────────────────────────────────────────
   OPTION CARDS
─────────────────────────────────────────── */
function selectOption(fieldId, value, el) {
  document.getElementById(fieldId).value = value;
  el.parentElement.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

/* ───────────────────────────────────────────
   NUMERIC VALIDATION + RANGE BAR
─────────────────────────────────────────── */
function validateNum(input, id, min, max, force = false) {
  const val   = input.value.trim();
  const errEl = document.getElementById('err-' + id);
  const wrap  = document.getElementById('wrap-' + id);
  const viEl  = document.getElementById('vi-' + id);
  const rbEl  = document.getElementById('rb-' + id);

  if (val === '') {
    clearFieldState(input, wrap, viEl, errEl);
    if (rbEl) rbEl.style.width = '0%';
    return false;
  }

  const num = parseFloat(val);

  if (rbEl) {
    const pct = Math.min(100, Math.max(0, ((num - min) / (max - min)) * 100));
    rbEl.style.width = pct + '%';
    rbEl.style.background = pct < 20 || pct > 90
      ? 'var(--accent)'
      : pct > 50 ? '#e8a500' : 'var(--safe)';
  }

  if (isNaN(num)) {
    setError(input, wrap, viEl, errEl, 'Please enter a valid number');
    return false;
  }
  if (num < min || num > max) {
    const r = numRules[id];
    setError(input, wrap, viEl, errEl, `${r.label} must be between ${min}–${max} ${r.unit}`);
    return false;
  }

  setValid(input, wrap, viEl, errEl);
  return true;
}

function setError(input, wrap, vi, err, msg) {
  input.className = 'invalid';
  wrap.className  = 'input-wrap';
  vi.textContent  = '';
  err.textContent = '⚠ ' + msg;
  err.classList.add('show');
}

function setValid(input, wrap, vi, err) {
  input.className = 'valid';
  wrap.className  = 'input-wrap valid';
  vi.textContent  = '✓';
  err.classList.remove('show');
}

function clearFieldState(input, wrap, vi, err) {
  input.className = '';
  wrap.className  = 'input-wrap';
  vi.textContent  = '';
  err.classList.remove('show');
}

function markSelectValid(sel) {
  const err = document.getElementById('err-' + sel.id);
  if (sel.value && err) err.classList.remove('show');
}

/* ───────────────────────────────────────────
   STEP NAVIGATION
─────────────────────────────────────────── */
function goToStep(n) {
  if (n > currentStep) return; // can't skip forward
  showPanel(n, n < currentStep ? 'back' : 'forward');
}

function nextStep(current) {
  if (!validateStep(current)) return;
  showPanel(current + 1, 'forward');
}

function prevStep(current) {
  showPanel(current - 1, 'back');
}

function showPanel(n, dir) {
  const panels = document.querySelectorAll('.panel');
  panels.forEach(p => p.classList.remove('active', 'panel-back'));

  const target = document.getElementById('panel-' + n);
  if (!target) return;
  target.classList.add('active');
  if (dir === 'back') target.classList.add('panel-back');

  currentStep = n;
  updateStepNav(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepNav(n) {
  for (let i = 0; i < totalSteps; i++) {
    const ind  = document.getElementById('step-ind-' + i);
    const dot  = document.getElementById('sd-' + i);
    const line = document.getElementById('sl-' + i);

    ind.className = 'step';
    if (i < n)        { ind.classList.add('done');   dot.textContent = '✓'; }
    else if (i === n) { ind.classList.add('active');  dot.textContent = i + 1; }
    else              {                               dot.textContent = i + 1; }

    if (line) line.className = 'step-line' + (i < n ? ' done' : '');
  }
  const rs = document.getElementById('step-ind-3');
  if (n === 'result') rs.classList.add('done');
}

/* ───────────────────────────────────────────
   STEP VALIDATION
─────────────────────────────────────────── */
function validateStep(step) {
  const rules = stepFields[step];
  let ok = true;

  for (const id of rules.nums) {
    const el = document.getElementById(id);
    const r  = numRules[id];
    const valid = validateNum(el, id, r.min, r.max, true);
    if (!valid) ok = false;
  }

  for (const id of rules.selects) {
    const el  = document.getElementById(id);
    const err = document.getElementById('err-' + id);
    if (!el.value) {
      if (err) { err.textContent = '⚠ Please make a selection'; err.classList.add('show'); }
      ok = false;
    } else {
      if (err) err.classList.remove('show');
    }
  }

  if (!ok) showToast('Please fill in all required fields correctly.');
  return ok;
}

/* ───────────────────────────────────────────
   TOAST
─────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = '⚠ ' + msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ───────────────────────────────────────────
   SUBMIT
─────────────────────────────────────────── */
async function submitPrediction() {
  if (!validateStep(2)) return;

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Analyzing…';

  const payload = {};
  for (const id of ['Age','RestingBP','Cholesterol','MaxHR','Oldpeak']) {
    payload[id] = parseFloat(document.getElementById(id).value);
  }
  for (const id of ['Sex','ChestPainType','FastingBS','RestingECG','ExerciseAngina','ST_Slope']) {
    payload[id] = document.getElementById(id).value;
  }

  try {
    const res  = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');
    showResult(data, payload);
  } catch (err) {
    showToast(err.message);
    btn.disabled = false;
    btn.innerHTML = '🔬 Analyze Risk';
  }
}

/* ───────────────────────────────────────────
   SHOW RESULT
─────────────────────────────────────────── */
function showResult(data, payload) {
  const positive = data.prediction === 1;

  // Circle icon
  const circle = document.getElementById('resultCircle');
  circle.textContent = positive ? '⚠️' : '✅';
  circle.className   = 'result-circle ' + (positive ? 'positive' : 'negative');

  // Title & description
  const title = document.getElementById('resultTitle');
  const desc  = document.getElementById('resultDesc');
  title.className   = 'result-title ' + (positive ? 'positive' : 'negative');
  title.textContent = positive ? 'Elevated Cardiac Risk Detected' : 'Low Cardiac Risk';
  desc.textContent  = positive
    ? 'The model identified indicators associated with heart disease. Please consult a cardiologist for a thorough evaluation.'
    : 'Based on the provided clinical data, the model predicts a low cardiovascular risk profile at this time.';

  // Confidence bar
  const confBox = document.getElementById('confBox');
  if (data.probability !== null && data.probability !== undefined) {
    const pct = Math.round(data.probability * 100);
    document.getElementById('confValue').textContent = pct + '%';
    const fill = document.getElementById('confFill');
    fill.className = 'conf-fill ' + (positive ? 'positive' : 'negative');
    confBox.style.display = '';
    setTimeout(() => { fill.style.width = pct + '%'; }, 100);
  } else {
    confBox.style.display = 'none';
  }

  // Summary grid
  const sg = document.getElementById('summaryGrid');
  const summaryData = [
    { key: 'Age',         val: payload.Age + ' yrs' },
    { key: 'Sex',         val: payload.Sex === 'M' ? '♂ Male' : '♀ Female' },
    { key: 'Resting BP',  val: payload.RestingBP + ' mmHg' },
    { key: 'Cholesterol', val: payload.Cholesterol + ' mg/dL' },
    { key: 'Max HR',      val: payload.MaxHR + ' bpm' },
    { key: 'ST Depr.',    val: payload.Oldpeak },
  ];
  sg.innerHTML = summaryData.map(s =>
    `<div class="summary-item"><div class="si-val">${s.val}</div><div class="si-key">${s.key}</div></div>`
  ).join('');

  // Show result panel
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-result').classList.add('active');

  // Update step nav to all done
  for (let i = 0; i < totalSteps; i++) {
    const ind = document.getElementById('step-ind-' + i);
    const dot = document.getElementById('sd-' + i);
    if (ind) { ind.className = 'step done'; dot.textContent = '✓'; }
    const line = document.getElementById('sl-' + i);
    if (line) line.className = 'step-line done';
  }
  document.getElementById('step-ind-3').classList.add('done');
  document.getElementById('sd-3').textContent = '✓';
}

/* ───────────────────────────────────────────
   RESET
─────────────────────────────────────────── */
function resetForm() {
  // Reset numeric inputs
  ['Age','RestingBP','Cholesterol','MaxHR','Oldpeak'].forEach(id => {
    const el = document.getElementById(id);
    el.value = ''; el.className = '';
    const wrap = document.getElementById('wrap-' + id);
    if (wrap) wrap.className = 'input-wrap';
    const vi = document.getElementById('vi-' + id);
    if (vi) vi.textContent = '';
    const rb = document.getElementById('rb-' + id);
    if (rb) rb.style.width = '0%';
    const err = document.getElementById('err-' + id);
    if (err) err.classList.remove('show');
  });

  // Reset selects
  ['ChestPainType','FastingBS','RestingECG','ST_Slope'].forEach(id => {
    document.getElementById(id).value = '';
    const err = document.getElementById('err-' + id);
    if (err) err.classList.remove('show');
  });

  // Reset option cards
  document.getElementById('Sex').value = 'M';
  document.querySelectorAll('#oc-M, #oc-F').forEach((c, i) => c.classList.toggle('selected', i === 0));
  document.getElementById('ExerciseAngina').value = 'N';
  document.querySelectorAll('#oc-N, #oc-Y').forEach((c, i) => c.classList.toggle('selected', i === 0));

  // Go back to step 0
  currentStep = 0;
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-0').classList.add('active');

  // Reset step nav
  for (let i = 0; i < totalSteps; i++) {
    const ind  = document.getElementById('step-ind-' + i);
    const dot  = document.getElementById('sd-' + i);
    const line = document.getElementById('sl-' + i);
    if (ind)  ind.className  = 'step' + (i === 0 ? ' active' : '');
    if (dot)  dot.textContent = i + 1;
    if (line) line.className  = 'step-line';
  }
  const rs = document.getElementById('step-ind-3');
  if (rs) rs.className = 'step';
  document.getElementById('sd-3').textContent = '✓';

  // Reset submit button
  const btn = document.getElementById('submitBtn');
  btn.disabled = false;
  btn.innerHTML = '🔬 Analyze Risk';
}