/* Universal IDE — рендерер */
let editor = null;
let dark = true;
let fontSize = 14;
let wordWrapOn = true;
let minimapOn = false;

const LANG_BY_EXT = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript',
  py: 'python', pyw: 'python', ipynb: 'json',
  html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less',
  json: 'json', md: 'markdown', markdown: 'markdown',
  rs: 'rust', go: 'go', java: 'java', c: 'cpp', h: 'cpp', cc: 'cpp', cpp: 'cpp', hpp: 'cpp',
  cs: 'csharp', rb: 'ruby', php: 'php', sh: 'shell', bash: 'shell', zsh: 'shell',
  yml: 'yaml', yaml: 'yaml', xml: 'xml', sql: 'sql', kt: 'kotlin', swift: 'swift',
  ps1: 'powershell', lua: 'lua', r: 'r', scala: 'scala', dart: 'dart', clj: 'clojure',
  fs: 'fsharp', ex: 'elixir', erl: 'erlang', pl: 'perl', vb: 'vb',
  toml: 'ini', ini: 'ini', dockerfile: 'dockerfile', makefile: 'makefile',
  vue: 'html', svelte: 'html', astro: 'html',
};

const EXT_DEFAULT = {
  python: 'py', javascript: 'js', typescript: 'ts', html: 'html', cpp: 'cpp',
  css: 'css', json: 'json', markdown: 'md', yaml: 'yml', xml: 'xml', shell: 'sh',
};

let files = [];
let activeIndex = -1;

const $ = (id) => document.getElementById(id);
const basename = (p) => p.split(/[\\/]/).pop();
const extOf = (n) => (n.match(/\.([^.]+)$/) || [])[1]?.toLowerCase();
const langOf = (n) => (extOf(n) && LANG_BY_EXT[extOf(n)]) || 'plaintext';
const F = () => files[activeIndex];

/* ===== ВКЛАДКИ ===== */
function renderTabs() {
  const bar = $('tabbar');
  bar.innerHTML = '';
  files.forEach((f, i) => {
    const b = document.createElement('button');
    b.className = 'tab' + (i === activeIndex ? ' active' : '');
    b.title = f.path || 'новий файл';
    b.onclick = () => activate(i);
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.cssText = f.dirty
      ? 'width:8px;height:8px;border-radius:50%;background:var(--primary);flex:none'
      : 'width:0;height:0;flex:none';
    b.appendChild(dot);
    const label = document.createElement('span');
    label.textContent = f.title;
    b.appendChild(label);
    if (files.length > 1) {
      const x = document.createElement('span');
      x.className = 'close material-symbols-outlined';
      x.textContent = 'close';
      x.title = 'Закрити (Ctrl+W)';
      x.onclick = (ev) => { ev.stopPropagation(); closeTab(i); };
      b.appendChild(x);
    }
    bar.appendChild(b);
  });
  bar.scrollLeft = bar.scrollWidth;
}

function activate(i) {
  activeIndex = i;
  editor.setModel(F().model);
  setStatus(); renderTabs(); title(); editor.focus();
}

function addFile(content, name, path) {
  const f = { title: basename(name) || 'новий файл', path: path || null, model: monaco.editor.createModel(content ?? '', langOf(name)), dirty: false };
  files.push(f);
  activate(files.length - 1);
  return f;
}

function closeTab(i) {
  if (files.length <= 1) return;
  const wasActive = i === activeIndex;
  files[i].model.dispose();
  files.splice(i, 1);
  if (wasActive) { activeIndex = Math.min(i, files.length - 1); editor.setModel(F().model); }
  else if (i < activeIndex) activeIndex--;
  setStatus(); renderTabs(); title();
}

function title() {
  const f = F();
  document.title = (f ? (f.dirty ? '● ' : '') + f.title : 'Universal IDE') + ' — Universal IDE';
}

function setDirty(v) {
  const f = F(); if (!f) return;
  f.dirty = v;
  $('stDirty').textContent = v ? '  ●  не збережено' : '';
  renderTabs(); title();
}

/* ===== КОНСОЛЬ ===== */
function outClear() { $('console').innerHTML = ''; }
function out(kind, text) {
  const d = document.createElement('div');
  d.className = kind;
  d.textContent = text;
  $('console').appendChild(d);
  $('console').scrollTop = $('console').scrollHeight;
}
const fmt = (a) => a.map((v) => {
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}).join(' ');
function fmtTime(ms) { return ms < 1000 ? ms.toFixed(0) + ' мс' : (ms / 1000).toFixed(2) + ' с'; }

/* ===== ВИКОНАННЯ: JS ===== */
function runJS() {
  const text = F().model.getValue();
  const real = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  console.log = (...a) => out('out', fmt(a));
  console.warn = (...a) => out('info', '⚠ ' + fmt(a));
  console.error = (...a) => out('err', '✕ ' + fmt(a));
  console.info = (...a) => out('out', 'ℹ ' + fmt(a));
  showPanelTab('console');
  out('cmd', '▸ ' + (text.split('\n')[0] || '') + (text.includes('\n') ? ' …' : ''));
  const t0 = performance.now();
  try { (0, eval)(text); } catch (ex) { out('err', String(ex && ex.stack || ex)); }
  out('info', '⏱ ' + fmtTime(performance.now() - t0));
  Object.assign(console, real);
}

/* ===== ВИКОНАННЯ: PYTHON ===== */
let pyPromise = null;
function loadPy() {
  if (!pyPromise) {
    pyPromise = (async () => {
      showPanelTab('console');
      out('info', '⏳ Завантаження Python (Pyodide)… перший запуск повільніший');
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        s.onload = res;
        s.onerror = () => rej(new Error('Немає доступу до CDN'));
        document.head.appendChild(s);
      });
      const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
      py.setStdout({ batched: (t) => out('out', t) });
      py.setStderr({ batched: (t) => out('err', t) });
      out('info', '✅ Python готовий');
      return py;
    })();
  }
  return pyPromise;
}

async function runPy() {
  try {
    const py = await loadPy();
    showPanelTab('console');
    out('cmd', '▸ python');
    const t0 = performance.now();
    await py.runPythonAsync(F().model.getValue());
    out('info', '⏱ ' + fmtTime(performance.now() - t0));
  } catch (ex) { out('err', String(ex && ex.message || ex)); }
}

/* ===== ВИКОНАННЯ: HTML ===== */
function runHtml() {
  $('preview').srcdoc = F().model.getValue();
  showPanelTab('preview');
}

function run() {
  const f = F(); if (!f) return;
  outClear();
  const lang = f.model.getLanguageId();
  if (lang === 'python') runPy();
  else if (lang === 'html') runHtml();
  else { showPanelTab('console'); runJS(); }
}

/* ===== ФАЙЛИ ===== */
async function openFile() {
  const r = await window.uni.openFile();
  if (!r || r.error) return;
  addFile(r.content, r.path, r.path);
}

async function save() {
  const f = F(); if (!f) return;
  const content = f.model.getValue();
  if (f.path) { f.path = await window.uni.saveTo({ path: f.path, content }); }
  else {
    const p = await window.uni.saveDialog({ content, defaultPath: 'untitled.' + (EXT_DEFAULT[f.model.getLanguageId()] || 'txt') });
    if (!p) return; f.path = p; f.title = basename(p);
  }
  setDirty(false); setStatus();
}

async function saveAs() {
  const f = F(); if (!f) return;
  const p = await window.uni.saveDialog({ content: f.model.getValue(), defaultPath: f.path || 'untitled.' + (EXT_DEFAULT[f.model.getLanguageId()] || 'txt') });
  if (!p) return; f.path = p; f.title = basename(p);
  setDirty(false); setStatus();
}

function newFile() {
  const lang = F() ? F().model.getLanguageId() : 'python';
  addFile('', 'новий.' + (EXT_DEFAULT[lang] || 'txt'), null);
}

/* ===== РЕДАГУВАННЯ: утиліти ===== */
function duplicateLine() {
  const s = editor.getSelection();
  const line = editor.getLine(s.startLineNumber);
  editor.executeEdits('dup', [{ range: { startLineNumber: s.startLineNumber, startColumn: 1, endLineNumber: s.startLineNumber, endColumn: 1 }, text: line + '\n' }]);
}

function deleteLine() {
  const s = editor.getSelection();
  const m = editor.getModel();
  const endCol = s.endLineNumber < m.getLineCount() ? m.getLineMaxColumn(s.endLineNumber + 1) : m.getLineMaxColumn(s.endLineNumber);
  editor.executeEdits('del', [{ range: { startLineNumber: s.startLineNumber, startColumn: 1, endLineNumber: s.endLineNumber, endColumn: endCol }, text: '' }]);
}

function moveLineUp() {
  const s = editor.getSelection();
  if (s.startLineNumber <= 1) return;
  const m = editor.getModel();
  const ln = s.startLineNumber;
  const above = m.getLineContent(ln - 1);
  const cur = m.getLineContent(ln);
  editor.executeEdits('mv', [{ range: { startLineNumber: ln - 1, startColumn: 1, endLineNumber: ln, endColumn: 1 }, text: cur + '\n' + above + '\n' }]);
  editor.setPosition({ lineNumber: ln - 1, column: s.startColumn });
}

function moveLineDown() {
  const s = editor.getSelection();
  const m = editor.getModel();
  if (s.startLineNumber >= m.getLineCount()) return;
  const ln = s.startLineNumber;
  const cur = m.getLineContent(ln);
  const below = m.getLineContent(ln + 1);
  editor.executeEdits('mv', [{ range: { startLineNumber: ln, startColumn: 1, endLineNumber: ln + 1, endColumn: 1 }, text: below + '\n' + cur + '\n' }]);
  editor.setPosition({ lineNumber: ln + 1, column: s.startColumn });
}

const LINE_COMMENT = { javascript: '//', typescript: '//', python: '#', rust: '//', go: '//', java: '//', cpp: '//', csharp: '//', ruby: '#', php: '#', sql: '--', yaml: '#', markdown: '#', shell: '#', kotlin: '//', swift: '//', lua: '--', r: '#', scala: '//', dart: '//', toml: '#', ini: '#' };

function commentToggle() {
  const p = LINE_COMMENT[editor.getModel().getLanguageId()] || '//';
  const s = editor.getSelection();
  const ops = [];
  for (let ln = s.startLineNumber; ln <= s.endLineNumber; ln++) {
    const line = editor.getModel().getLineContent(ln);
    const trimmed = line.trimStart();
    const indented = line.slice(0, line.length - trimmed.length);
    if (trimmed.startsWith(p + ' ') || trimmed.startsWith(p)) {
      const stripped = trimmed.startsWith(p + ' ') ? trimmed.slice(p.length + 1) : trimmed.slice(p.length);
      ops.push({ range: { startLineNumber: ln, startColumn: 1, endLineNumber: ln, endColumn: line.length + 1 }, text: indented + stripped });
    } else {
      ops.push({ range: { startLineNumber: ln, startColumn: 1, endLineNumber: ln, endColumn: 1 }, text: p + ' ' });
    }
  }
  if (ops.length) editor.executeEdits('cm', ops);
}

function sortLines() {
  const s = editor.getSelection();
  const m = editor.getModel();
  const lines = [];
  for (let ln = s.startLineNumber; ln <= s.endLineNumber; ln++) lines.push(m.getLineContent(ln));
  const sorted = [...lines].sort((a, b) => a.localeCompare(b));
  if (lines.join('\n') === sorted.join('\n')) sorted.reverse();
  editor.executeEdits('sort', [{ range: { startLineNumber: s.startLineNumber, startColumn: 1, endLineNumber: s.endLineNumber, endColumn: m.getLineMaxColumn(s.endLineNumber) }, text: sorted.join('\n') }]);
}

function toggleCase() {
  const s = editor.getSelection();
  const sel = editor.getModel().getValueInRange(s);
  editor.executeEdits('case', [{ range: s, text: sel === sel.toUpperCase() ? sel.toLowerCase() : sel.toUpperCase() }]);
}

function removeEmptyLines() {
  const m = editor.getModel();
  const lines = [];
  for (let i = 1; i <= m.getLineCount(); i++) { const c = m.getLineContent(i).trim(); if (c) lines.push(c); }
  editor.setValue(lines.join('\n'));
}

function goToLine() {
  const input = prompt('Перейти до рядка:');
  if (!input) return;
  const ln = parseInt(input, 10);
  if (ln > 0 && ln <= editor.getModel().getLineCount()) {
    editor.revealLineInCenter(ln);
    editor.setPosition({ lineNumber: ln, column: 1 });
    editor.focus();
  }
}

function toggleWordWrap() {
  wordWrapOn = !wordWrapOn;
  editor.updateOptions({ wordWrap: wordWrapOn ? 'on' : 'off' });
  $('btnWrap').classList.toggle('active-btn', wordWrapOn);
}

function toggleMinimap() {
  minimapOn = !minimapOn;
  editor.updateOptions({ minimap: { enabled: minimapOn } });
  $('btnMinimap').classList.toggle('active-btn', minimapOn);
}

function changeFontSize(d) {
  fontSize = Math.max(10, Math.min(30, fontSize + d));
  editor.updateOptions({ fontSize });
}

/* ===== ПАНЕЛЬ ===== */
function showPanelTab(tab) {
  $('tabConsole').classList.toggle('active', tab === 'console');
  $('tabPreview').classList.toggle('active', tab === 'preview');
  $('tabProblems').classList.toggle('active', tab === 'problems');
  $('console').hidden = tab !== 'console';
  $('preview').hidden = tab !== 'preview';
  $('problems').hidden = tab !== 'problems';
}

/* ===== СТАТУС-БАР ===== */
function statusPos() {
  const c = editor.getPosition();
  $('stPos').textContent = `Ln ${c.lineNumber}, Col ${c.column}`;
}

function setStatus() {
  const f = F(); if (!f) return;
  $('stFile').textContent = f.title;
  $('stTabSize').textContent = `spaces: ${editor.getModel().getOptions().tabSize}`;
  title();
}

/* ===== ІНІЦІАЛІЗАЦІЯ ===== */
window.initApp = function () {
  const SAMPLE = '# Вітаю в Universal IDE!\n# Натисни F5 щоб виконати.\nprint("Привіт, світе 🚀")\n';
  const m0 = monaco.editor.createModel(SAMPLE, 'python');
  files.push({ title: 'hello.py', path: null, model: m0, dirty: false });
  activeIndex = 0;

  editor = monaco.editor.create($('editorWrap'), {
    model: m0,
    theme: 'vs-dark',
    fontSize,
    fontFamily: "Consolas, 'Cascadia Code', 'JetBrains Mono', monospace",
    minimap: { enabled: minimapOn },
    automaticLayout: true,
    tabSize: 4,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    formatOnPaste: true,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    mouseWheelZoom: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    folding: true,
    showFoldingControls: 'mouseover',
    renderLineHighlight: 'all',
    roundedSelection: true,
    padding: { top: 8, bottom: 8 },
  });

  editor.onDidChangeCursorPosition(statusPos);
  editor.onDidChangeModelContent(() => { const f = F(); if (f && f.model === editor.getModel() && !f.dirty) setDirty(true); });
  statusPos();

  /* клавіші */
  document.addEventListener('keydown', (ev) => {
    const mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key === 'o') { ev.preventDefault(); openFile(); }
    else if (mod && ev.shiftKey && ev.key === 'S') { ev.preventDefault(); saveAs(); }
    else if (mod && ev.key === 's') { ev.preventDefault(); save(); }
    else if (mod && ev.key === 'n') { ev.preventDefault(); newFile(); }
    else if (mod && ev.key === 'w') { ev.preventDefault(); closeTab(activeIndex); }
    else if (ev.key === 'F5' || (mod && ev.key === 'Enter')) { ev.preventDefault(); run(); }
    else if (mod && ev.key === 'd') { ev.preventDefault(); duplicateLine(); }
    else if (mod && ev.shiftKey && ev.key === 'D') { ev.preventDefault(); deleteLine(); }
    else if (mod && ev.shiftKey && ev.key === 'ArrowUp') { ev.preventDefault(); moveLineUp(); }
    else if (mod && ev.shiftKey && ev.key === 'ArrowDown') { ev.preventDefault(); moveLineDown(); }
    else if (mod && ev.key === '/') { ev.preventDefault(); commentToggle(); }
    else if (mod && ev.key === 'g') { ev.preventDefault(); goToLine(); }
    else if (mod && ev.shiftKey && ev.key === 'L') { ev.preventDefault(); removeEmptyLines(); }
    else if (mod && ev.shiftKey && ev.key === 'F') { ev.preventDefault(); sortLines(); }
    else if (mod && ev.shiftKey && ev.key === 'X') { ev.preventDefault(); toggleCase(); }
    else if (mod && ev.key === '=') { ev.preventDefault(); changeFontSize(1); }
    else if (mod && ev.key === '-') { ev.preventDefault(); changeFontSize(-1); }
  });

  /* кнопки */
  const bind = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  bind('btnNew', newFile);
  bind('btnOpen', openFile);
  bind('btnSave', save);
  bind('btnSaveAs', saveAs);
  bind('btnRun', run);
  bind('btnUndo', () => editor.trigger('btn', 'undo'));
  bind('btnRedo', () => editor.trigger('btn', 'redo'));
  bind('btnFind', () => editor.trigger('btn', 'actions.find'));
  bind('btnWrap', toggleWordWrap);
  bind('btnMinimap', toggleMinimap);
  bind('btnFontDown', () => changeFontSize(-1));
  bind('btnFontUp', () => changeFontSize(1));
  bind('btnTheme', () => {
    dark = !dark;
    monaco.editor.setTheme(dark ? 'vs-dark' : 'light');
    document.body.classList.toggle('light', !dark);
    const icon = $('btnTheme').querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = dark ? 'dark_mode' : 'light_mode';
  });
  bind('tabConsole', () => showPanelTab('console'));
  bind('tabPreview', () => showPanelTab('preview'));
  bind('tabProblems', () => showPanelTab('problems'));

  /* статус-бар: табуляція */
  $('stTabSize').onclick = () => {
    const cur = editor.getModel().getOptions().tabSize;
    const next = cur >= 8 ? 2 : cur + 2;
    editor.getModel().updateOptions({ tabSize: next });
    $('stTabSize').textContent = 'spaces: ' + next;
  };

  /* ресайзер */
  const rz = $('resizer');
  let dragging = false;
  rz.addEventListener('mousedown', (ev) => { dragging = true; ev.preventDefault(); });
  document.addEventListener('mousemove', (ev) => { if (!dragging) return; $('panel').style.width = Math.min(Math.max(window.innerWidth - ev.clientX, 220), window.innerWidth * 0.7) + 'px'; });
  document.addEventListener('mouseup', () => { dragging = false; });

  /* drag&drop */
  document.addEventListener('dragover', (ev) => ev.preventDefault());
  document.addEventListener('drop', (ev) => {
    ev.preventDefault();
    Array.from(ev.dataTransfer.files).forEach((f) => {
      if (f.size > 5 * 1024 * 1024) return;
      const rd = new FileReader();
      rd.onload = () => addFile(rd.result, f.name, null);
      rd.readAsText(f);
    });
  });

  window.onbeforeunload = () => { if (files.some((f) => f.dirty)) return true; };

  $('btnWrap').classList.add('active-btn');
  $('btnMinimap').classList.remove('active-btn');
  showPanelTab('console');
  setStatus();
  title();
};