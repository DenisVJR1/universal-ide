# Universal IDE

![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Electron](https://img.shields.io/badge/Electron-31-blueviolet)
![Monaco](https://img.shields.io/badge/Monaco-Editor-0e639c)

Красива, легка, кросплатформна IDE для **всіх мов програмування** — з редактором Monaco (як у VS Code), підсвіткою 30+ мов, і виконанням JS, HTML і Python прямо в програмі.

---

## Запуск

```bash
git clone https://github.com/YOU/universal-ide.git
cd universal-ide
npm install
npm start
```

---

## Можливості

| Можливість | Опис |
|---|---|
| **Підсвітка 30+ мов** | Python, JS, TS, HTML, CSS, Rust, Go, Java, C/C++, Ruby, PHP, SQL, Kotlin, Swift, Dart, Lua, R, Scala, PowerShell і ще понад 10 |
| **Дизайн Material 3** | Тональні поверхні, топ-апбар, плаваюча кнопка «Запуск» (FAB), сегментовані вкладки, іконки Material Symbols |
| **Запуск Python** | Через Pyodide прямо в браузері — ніяких встановлень. Перший запуск завантажує Python, далі — миттєво |
| **Запуск JS** | Класичний eval з перехопленням `console.log` — результат у консолі |
| **HTML-прев'ю** | Відкрийте `.html` файл і натисніть «Запуск» — побачите результат в iframe |
| **Темна / світла тема** | Одна кнопка — переключити між `vs-dark` і `light` |
| **Збереження файлів** | `Ctrl+S` / «Зберегти» — зберігає у файл, `Ctrl+Shift+S` — «Зберегти як» |
| **Drag & drop** | Перетягніть будь-який файл у вікно — він відкриється з підсвіткою |
| **Ресайзер панелі** | Потягніть розділювач між редактором і консольлю |
| **Статус-бар** | Назва файлу, мова, стан, позиція курсору (рядок, стовпчик) |

---

## Клавіші

| Комбінація | Дія |
|---|---|
| `F5` / `Ctrl+Enter` | Запуск поточного файлу |
| `Ctrl+S` | Зберегти |
| `Ctrl+Shift+S` | Зберегти як |
| `Ctrl+O` | Відкрити файл |
| `Ctrl+N` | Новий файл |

---

## Як визначається мова

Мова для підсвітки визначається за розширенням файлу:

`.py` → Python · `.js` → JavaScript · `.ts` → TypeScript · `.html` → HTML · `.css` → CSS · `.rs` → Rust · `.go` → Go · `.java` → Java · `.cpp/.c/.h` → C/C++ · `.cs` → C# · `.rb` → Ruby · `.php` → PHP · `.sql` → SQL · `.yml/.yaml` → YAML · `.md` → Markdown · `.json` → JSON · `.xml` → XML · `.sh` → Shell · `.kt` → Kotlin · `.swift` → Swift

Повний список — у файлі `renderer/app.js` (об'єкт `LANG_BY_EXT`).

---

## Технології

- **Electron 31** — десктопний контейнер
- **Monaco Editor 0.52** — той самий редактор, що у VS Code
- **Pyodide 0.26** — Python, що працює в WebAssembly прямо в браузері
- Нуль власних збіркових інструментів — ніякого Vite/Webpack

---

## Структура

```
universal-ide/
├── main.js              # Electron main process
├── preload.js           # Безпечний бридж IPC
├── package.json
└── renderer/
    ├── index.html       # Точка входу
    ├── style.css        # Теми (dark / light)
    └── app.js           # Логіка: Monaco, запуск, консоль
```

---

## Roadmap

- [ ] Вкладки (multi-tab)
- [ ] Дерево файлів проєкту (file tree)
- [ ] Inline REPL для Python (змінні зберігаються між запусками)
- [ ] Запуск C/C++, Rust, Go через WASM-субprocess
- [ ] Автозбереження
- [ ] Встановлення як пакет (`.exe` / `.dmg` / `.AppImage` через `electron-builder`)

---

## Ліцензія

MIT