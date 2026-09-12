/* Universal IDE — рендерер */
let editor = null;
let dark = true;

/* Підтримувані мови: розширення -> monaco language id */
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
};

const EXT_DEFAULT = {
  python: 'py', javascript: 'js', typescript: 'ts', html: 'html', cpp: 'cpp',
  css: 'css', json: 'json', markdown: 'md', yaml: 'yml', xml: 'xml', shell: 'sh',
};

/* Відкриті файли: { title, path, model, dirty } */
let files = [];
let activeIndex = -1;

const $ = (id) => document.getElementById(id);
const basename = (p) => p.split(/[\\/]/).pop();
const extOf = (name) => (name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase();
const langOf = (name) => (extOf(name) && LANG_BY_EXT[extOf(name)]) || 'plaintext';
const entry = () => files[activeIndex];

/* ---------- вкладки ---------- */
function renderTabs() {
  const bar = $('tabbar');
  bar.innerHTML = '';
  files.forEach((f, i) => {
    const b = document.createElement('button');
    b.className = 'tab' + (i === activeIndex ? ' active' : '');
    b.title = f.path || 'новий файл';
    b.onclick = () => activate(i);
    const label = document.createElement('span');
    label.textContent = (f.dirty ? '● ' : '') + f.title;
    b.appendChild(label);
    if (files.length > 1) {
      const x = document.createElement('span');
      x.className = 'close material-symbols-outlined';
      x.textContent = 'close';
      x.title = 'Закрити (Ctrl+W)';
      x.onclick = (e) => { e.stopPropagation(); closeTab(i); };
      b.appendChild(x);
    }
    bar.appendChild(b);
  });
  bar.scrollLeft = bar.scrollWidth;
}

function activate(i) {
  activeIndex = i;
  editor.setModel(entry().model);
  setStatus();
  renderTabs();
  title();
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
  const f = files[i];
  f.model.dispose();
  files.splice(i, 1);
  if (wasActive) {
    activeIndex = Math.min(i, files.length - 1);
    editor.setModel(entry().model);
  } else if (i < activeIndex) activeIndex--;
  setStatus();
  renderTabs();
  title();
}

function title() {
  const e = entry();
  document.title = (e ? (e.dirty ? '● ' : '') + e.title : 'Universal IDE') + ' — Universal IDE';
}

function setDirty(v) {
  const e = entry();
  if (!e) return;
  e.dirty = v;
  $('stDirty').textContent = v ? 'не збережено' : '';
  renderTabs();
  title();
}

/* ---------- консоль ---------- */
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
  try { return JSON.stringify(v); } catch { return String(v); }
}).join(' ');

function runJS() {
  const text = entry().model.getValue();
  const real = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  console.log = (...a) => out('out', fmt(a));
  console.warn = (...a) => out('info', fmt(a));
  console.error = (...a) => out('err', fmt(a));
  console.info = (...a) => out('out', fmt(a));
  out('cmd', '> ' + (text.split('\n')[0] || '') + (text.includes('\n') ? ' …' : ''));
  const t0 = performance.now();
  try { (0, eval)(text); } // indirect eval: без витоку локальних змінних
  catch (e) { out('err', String(e && e.stack || e)); }
  out('info', `⏱ ${((performance.now() - t0) / 1000).toFixed(2)} с`);
  console.log = real.log; console.warn = real.warn; console.error = real.error; console.info = real.info;
}

/* ---------- python (pyodide) ---------- */
let pyPromise = null;
function loadPy() {
  if (!pyPromise) {
    pyPromise = (async () => {
      out('info', 'Завантаження Python (Pyodide)… перший запуск повільніший');
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        s.onload = res; s.onerror = () => rej(new Error('Немає доступу до CDN'));
        document.head.appendChild(s);
      });
      const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
      py.setStdout({ batched: (s) => out('out', s) });
      py.setStderr({ batched: (s) => out('err', s) });
      return py;
    })();
  }
  return pyPromise;
}

async function runPy() {
  try {
    const py = await loadPy();
    out('cmd', '> python');
    const t0 = performance.now();
    await py.runPythonAsync(entry().model.getValue());
    out('info', `⏱ ${((performance.now() - t0) / 1000).toFixed(2)} с`);
  } catch (e) { out('err', String(e && e.message || e)); }
}

/* ---------- html прев'ю ---------- */
function showPanelTab(tab) {
  $('tabConsole').classList.toggle('active', tab === 'console');
  $('tabPreview').classList.toggle('active', tab === 'preview');
  $('console').hidden = tab !== 'console';
  $('preview').hidden = tab !== 'preview';
}
function runHtml() {
  $('preview').srcdoc = entry().model.getValue();
  showPanelTab('preview');
}

function run() {
  const lang = entry().model.getLanguageId();
  if (lang === 'python') runPy();
  else if (lang === 'html') runHtml();
  else { showPanelTab('console'); runJS(); }
}

/* ---------- файли ---------- */
async function openFile() {
  const r = await window.uni.openFile();
  if (!r) return;
  if (r.error) { out('err', 'Не вдалось відкрити: ' + r.error); return; }
  addFile(r.content, r.path, r.path);
}

async function save() {
  const f = entry();
  const content = f.model.getValue();
  if (f.path) { f.path = await window.uni.saveTo({ path: f.path, content }); }
  else {
    const p = await window.uni.saveDialog({ content, defaultPath: 'untitled.' + (EXT_DEFAULT[f.model.getLanguageId()] || 'txt') });
    if (!p) return;
    f.path = p;
    f.title = basename(p);
  }
  setDirty(false);
  setStatus();
}

async function saveAs() {
  const f = entry();
  const p = await window.uni.saveDialog({ content: f.model.getValue(), defaultPath: f.path || 'untitled.' + (EXT_DEFAULT[f.model.getLanguageId()] || 'txt') });
  if (!p) return;
  f.path = p;
  f.title = basename(p);
  setDirty(false);
  setStatus();
}

/* ---------- статус-бар ---------- */
function setStatus() {
  const f = entry();
  if (!f) return;
  $('stFile').textContent = f.title;
  $('stLang').textContent = extOf(f.path || f.title) ? String(extOf(f.path || f.title)).toUpperCase() : f.model.getLanguageId();
  title();
}

/* ---------- ініціалізація ---------- */
window.initApp = function () {
  const SAMPLE = '# Вітаю в Universal IDE!\n# Це Python. Натисни F5 — і він виконається прямо тут.\nprint("Привіт, світе 🚀")\n';
  const m0 = monaco.editor.createModel(SAMPLE, 'python');
  files.push({ title: 'hello.py', path: null, model: m0, dirty: false });
  activeIndex = 0;

  editor = monaco.editor.create($('editorWrap'), {
    model: m0,
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: "Consolas, 'Cascadia Code', monospace",
    minimap: { enabled: false },
    automaticLayout: true,
    tabSize: 4,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
  });

  editor.onDidChangeCursorPosition(statusPos);
  editor.onDidChangeModelContent(() => {
    const now = entry();
    if (now && now.model === editor.getModel() && !now.dirty) setDirty(true);
  });
  statusPos();

  /* клавіші */
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'o') { e.preventDefault(); openFile(); }
    else if (mod && e.key === 's') { e.preventDefault(); e.shiftKey ? saveAs() : save(); }
    else if (mod && e.key === 'n') { e.preventDefault(); newFile(); }
    else if (mod && e.key === 'w') { e.preventDefault(); closeTab(activeIndex); }
    else if (e.key === 'F5' || (mod && e.key === 'Enter')) { e.preventDefault(); run(); }
  });

  /* кнопки */
  $('btnOpen').onclick = openFile;
  $('btnSave').onclick = save;
  $('btnNew').onclick = newFile;
  $('btnRun').onclick = run;
  $('btnTheme').onclick = () => {
    dark = !dark;
    monaco.editor.setTheme(dark ? 'vs-dark' : 'light');
    document.body.classList.toggle('light', !dark);
    $('btnTheme').querySelector('.material-symbols-outlined').textContent = dark ? 'dark_mode' : 'light_mode';
  };
  $('tabConsole').onclick = () => showPanelTab('console');
  $('tabPreview').onclick = () => showPanelTab('preview');

  /* ресайзер панелі */
  const rz = $('resizer');
  let dragging = false;
  rz.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const w = Math.min(Math.max(window.innerWidth - e.clientX, 200), window.innerWidth * 0.7);
    $('panel').style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  /* drag&drop файлу */
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => addFile(rd.result, f.name, null);
    rd.readAsText(f);
  });

  /* попередження при закритті з незбереженими змінами */
  window.onbeforeunload = () => { if (files.some((f) => f.dirty)) return true; };

  setStatus();
  title();
};

function newFile() {
  const lang = entry() ? entry().model.getLanguageId() : 'python';
  addFile('', 'нов.' + (EXT_DEFAULT[lang] || 'txt'), null);
}