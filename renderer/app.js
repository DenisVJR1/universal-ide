/* Universal IDE — рендерер */
let editor = null;
let model = null;
let currentPath = null;
let dirty = false;
let dark = true;

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

const $ = (id) => document.getElementById(id);
const extOf = (name) => (name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase();

function langOf(name) {
  const e = extOf(name);
  return (e && LANG_BY_EXT[e]) || 'plaintext';
}

function setModel(content, name) {
  const lang = langOf(name);
  const m = monaco.editor.createModel(content ?? '', lang);
  editor.setModel(m);
  if (model) model.dispose();
  model = m;
  return lang;
}

function title() { document.title = (dirty ? '● ' : '') + (currentPath ? basename(currentPath) : 'новий файл') + ' — Universal IDE'; }
const basename = (p) => p.split(/[\\/]/).pop();

function setDirty(v) {
  dirty = v;
  $('stDirty').textContent = dirty ? '● не збережено' : '';
  title();
}

function statusPos() {
  const c = editor.getPosition();
  $('stPos').textContent = `Ln ${c.lineNumber}, Col ${c.column}`;
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
  const text = model.getValue();
  const real = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  console.log = (...a) => out('out', fmt(a));
  console.warn = (...a) => out('info', fmt(a));
  console.error = (...a) => out('err', fmt(a));
  console.info = (...a) => out('out', fmt(a));
  out('cmd', '> ' + (text.split('\n')[0] || '') + (text.includes('\n') ? ' …' : ''));
  try { (0, eval)(text); } // indirect eval: без витоку локальних змінних
  catch (e) { out('err', String(e && e.stack || e)); }
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
        s.onload = res; s.onerror = () => rej(new Error('Немає доступу до CDN')),
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
    await py.runPythonAsync(model.getValue());
  } catch (e) { out('err', String(e && e.message || e)); }
}

/* ---------- html прев'ю ---------- */
function showTab(tab) {
  $('tabConsole').classList.toggle('active', tab === 'console');
  $('tabPreview').classList.toggle('active', tab === 'preview');
  $('console').hidden = tab !== 'console';
  $('preview').hidden = tab !== 'preview';
}
function runHtml() {
  $('preview').srcdoc = model.getValue();
  showTab('preview');
}

function run() {
  const lang = model.getLanguageId();
  if (lang === 'python') runPy();
  else if (lang === 'html') runHtml();
  else { showTab('console'); runJS(); }
}

/* ---------- файли ---------- */
async function openFile() {
  const r = await window.uni.openFile();
  if (!r) return;
  if (r.error) { out('err', 'Не вдалось відкрити: ' + r.error); return; }
  setModel(r.content, r.path);
  currentPath = r.path;
  setDirty(false);
  setStatus();
}

function extForSave(lang) {
  if (currentPath) return currentPath;
  return 'untitled.' + (EXT_DEFAULT[lang] || 'txt');
}

async function save() {
  const content = model.getValue();
  if (currentPath) { currentPath = await window.uni.saveTo({ path: currentPath, content }); }
  else {
    const p = await window.uni.saveDialog({ content, defaultPath: extForSave(model.getLanguageId()) });
    if (!p) return;
    currentPath = p;
  }
  setDirty(false);
  setStatus();
}

/* ---------- статус-бар ---------- */
function setStatus() {
  $('stFile').textContent = currentPath ? basename(currentPath) : 'новий файл';
  $('stLang').textContent = extOf(currentPath ? currentPath : '') ? String(extOf(currentPath)).toUpperCase() : model.getLanguageId();
  title();
}

/* ---------- ініціалізація ---------- */
window.initApp = function () {
  editor = monaco.editor.create($('editorWrap'), {
    value: '# Вітаю в Universal IDE!\n# Це Python. Натисни F5 — і він виконається прямо тут.\nprint("Привіт, світе 🚀")\n',
    language: 'python',
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

  model = editor.getModel();

  editor.onDidChangeCursorPosition(statusPos);
  editor.onDidChangeModelContent(() => setDirty(true));
  statusPos();

  /* клавіші */
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'o') { e.preventDefault(); openFile(); }
    else if (mod && e.key === 's') { e.preventDefault(); e.shiftKey ? saveAs() : save(); }
    else if (mod && e.key === 'n') { e.preventDefault(); newFile(); }
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
  $('tabConsole').onclick = () => showTab('console');
  $('tabPreview').onclick = () => showTab('preview');

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
    rd.onload = () => { setModel(rd.result, f.name); currentPath = null; setDirty(false); setStatus(); };
    rd.readAsText(f);
  });

  setStatus();
  title();
};

function newFile() {
  const lang = model ? model.getLanguageId() : 'plaintext';
  setModel('', 'untitled.' + (EXT_DEFAULT[lang] || 'txt'));
  currentPath = null;
  setDirty(false);
  setStatus();
}

/* save as = тимчасово скидаємо шлях */
async function saveAs() {
  const p = await window.uni.saveDialog({ content: model.getValue(), defaultPath: extForSave(model.getLanguageId()) });
  if (!p) return;
  currentPath = p;
  setDirty(false);
  setStatus();
}