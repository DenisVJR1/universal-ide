# Universal IDE

![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Electron](https://img.shields.io/badge/Electron-31-blueviolet)
![Monaco](https://img.shields.io/badge/Monaco-Editor-0e639c)
![Python](https://img.shields.io/badge/Python-WASM-3776AB)

Красива, легка, кросплатформна IDE для **всіх мов програмування** — з редактором Monaco (як у VS Code), підсвіткою 30+ мов, дизайном Material 3 і виконанням JS, HTML і Python прямо в програмі.

---

## Запуск

```bash
git clone https://github.com/DenisVJR1/universal-ide.git
cd universal-ide
npm install
npm start
```

---

## Можливості

| Можливість | Опис |
|---|---|
| **Вкладки (multi-tab)** | відкривайте скільки завгодно файлів, перемикайтесь мишею або `Ctrl+Tab`-стилем кліку, закривайте `Ctrl+W` |
| **Підсвітка 30+ мов** | Python, JS, TS, HTML, CSS, Rust, Go, Java, C/C++, Ruby, PHP, SQL, Kotlin, Swift, Dart, Lua, R, Scala, PowerShell і ще понад 10 |
| **Дизайн Material 3** | тональні поверхні, топ-апбар, плаваюча кнопка «Запуск» (FAB), сегментовані вкладки, іконки Material Symbols |
| **Запуск Python** | через Pyodide (WebAssembly) прямо в програмі — ніяких встановлень. Змінні зберігаються між запусками |
| **Запуск JS** | з перехопленням `console.log` — результат у консолі |
| **HTML-прев'ю** | відкрийте `.html` файл і натисніть «Запуск» — сторінка рендериться в iframe |
| **Час виконання** | консоль показує, скільки секунд працював скрипт |
| **Темна / світла тема** | одна кнопка — переключити між `vs-dark` і `light` |
| **Збереження файлів** | `Ctrl+S` — зберегти, `Ctrl+Shift+S` — зберегти як |
| **Drag & drop** | перетягніть будь-який файл у вікно — він відкриється з підсвіткою |
| **Захист від втрати** | при закритті з незбереженими змінами — попередження |
| **Ресайзер панелі** | потягніть розділювач між редактором і консольлю |
| **Статус-бар** | назва файлу, мова, стан, позиція курсору + рядок/стовпчик |
| **Пошук у файлі** | вбудований пошук Monaco — `Ctrl+F`, заміна — `Ctrl+H` |

---

## Клавіші

| Комбінація | Дія |
|---|---|
| `F5` / `Ctrl+Enter` | Запуск поточного файлу |
| `Ctrl+S` | Зберегти |
| `Ctrl+Shift+S` | Зберегти як |
| `Ctrl+O` | Відкрити файл |
| `Ctrl+N` | Новий файл |
| `Ctrl+W` | Закрити вкладку |
| `Ctrl+F` / `Ctrl+H` | Пошук / заміна у файлі |

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
- **Material Symbols + Roboto** — іконки та типографіка Material 3
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
    ├── style.css        # Теми Material 3 (dark / light)
    └── app.js           # Логіка: Monaco, вкладки, запуск, консоль
```

---

## Roadmap

- [x] Вкладки (multi-tab)
- [ ] Дерево файлів проєкту (file tree)
- [ ] Inline REPL для Python з окремим станом на вкладку
- [ ] Запуск C/C++, Rust, Go через WASM-субпроцес
- [ ] Автозбереження
- [ ] Встановлення як пакет (`.exe` / `.dmg` / `.AppImage` через `electron-builder`)

---

## Ліцензія

MIT