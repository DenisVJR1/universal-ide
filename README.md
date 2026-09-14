# Universal IDE

![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Electron](https://img.shields.io/badge/Electron-31-blueviolet)
![Monaco](https://img.shields.io/badge/Monaco-Editor-0e639c)
![Python](https://img.shields.io/badge/Python-WASM-3776AB)
![Material3](https://img.shields.io/badge/Material_3-purple)

Красива, легка, кросплатформна IDE для **всіх мов** — Monaco (як у VS Code), 35+ мов підсвітки, Material 3, запуск JS / Python / HTML прямо в програмі.

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

| Категорія | Можливість |
|---|---|
| **Вкладки** | кілька файлів, попередження при закритті незбереженого |
| **35+ мов підсвітки** | Python, JS, TS, HTML, CSS, Rust, Go, Java, C/C++, Ruby, PHP, SQL, Kotlin, Swift, Dart, Lua, R, Scala, PowerShell, TOML, Dockerfile, Vue, Svelte… |
| **Material 3** | тональні поверхні, топ-апбар, FAB «Запуск», Material Symbols |
| **Запуск Python** | Pyodide (WASM), змінні зберігаються між запусками |
| **Запуск JS** | eval + перехоплення `console.log/warn/error` |
| **HTML-прев'ю** | iframe sandbox + srcdoc |
| **⏱ Час виконання** | мілісекунди / секунди |
| **Темна / світла тема** | переключення одним кліком |
| **Undo / Redo** | кнопки в апбарі + Ctrl+Z / Ctrl+Y |
| **Дублювати / видалити** | Ctrl+D / Ctrl+Shift+D |
| **Перемістити рядок** | Ctrl+Shift+↑/↓ |
| **Коментування** | Ctrl+/ для 20+ мов |
| **Сортування** | Ctrl+Shift+F (reverse при повторі) |
| **Toggle Case** | Ctrl+Shift+X |
| **Очистити порожні** | Ctrl+Shift+L |
| **Go to line** | Ctrl+G |
| **Шрифт** | Ctrl+/-, кнопки в апбарі |
| **Word wrap** | кнопка в апбарі |
| **Мінімапа** | кнопка в апбарі |
| **Табуляція** | клік `spaces: N` → 2/4/6/8 |
| **Пошук / заміна** | Ctrl+F / Ctrl+H (Monaco) |
| **Mouse wheel zoom** | Ctrl + колесо |
| **Bracket colorization** | автозакриття дужок |
| **Code folding** | згортання блоків |
| **Drag & drop** | файл → нова вкладка |

---

## Клавіші

| Комбінація | Дія |
|---|---|
| `F5` / `Ctrl+Enter` | Запуск |
| `Ctrl+N` | Новий файл |
| `Ctrl+O` | Відкрити файл |
| `Ctrl+S` / `Ctrl+Shift+S` | Зберегти / Зберегти як |
| `Ctrl+W` | Закрити вкладку |
| `Ctrl+Z` / `Ctrl+Y` | Відміна / Повтор |
| `Ctrl+D` | Дублювати рядок |
| `Ctrl+Shift+D` | Видалити рядок |
| `Ctrl+Shift+↑/↓` | Перемістити рядок |
| `Ctrl+/` | Коментувати |
| `Ctrl+G` | Go to line |
| `Ctrl+F` / `Ctrl+H` | Пошук / Заміна |
| `Ctrl+-` / `Ctrl+=` | Шрифт -/+ |
| `Ctrl+Shift+X` | Toggle Case |
| `Ctrl+Shift+F` | Сортувати |
| `Ctrl+Shift+L` | Видалити порожні рядки |
| `Ctrl + колесо` | Zoom |

---

## Технології

| Залежність | Роль |
|---|---|
| **Electron 31** | Десктопний контейнер |
| **Monaco Editor 0.52** | Редактор (як у VS Code) |
| **Pyodide 0.26** | Python через WebAssembly |
| **Material Symbols + Roboto** | Іконки та типографіка Material 3 |

Нуль збіркових інструментів.

---

## Структура

```
universal-ide/
├── main.js              # Electron main process
├── preload.js           # Безпечний бридж IPC
├── package.json
└── renderer/
    ├── index.html       # Точка входу
    ├── style.css        # Material 3 теми (dark/light)
    └── app.js           # Monaco, вкладки, запуск, утиліти
```

---

## Roadmap

- [x] Вкладки
- [x] Коментування / сортування / Toggle Case / Go to line
- [x] Дублювання / видалення / переміщення рядків
- [x] Шрифт +/-, word wrap, minimap, табуляція
- [ ] Дерево файлів (file tree)
- [ ] Python REPL з окремим станом на вкладку
- [ ] Запуск C/C++, Rust, Go через WASM
- [ ] Автозбереження
- [ ] `.exe` / `.dmg` / `.AppImage` (electron-builder)

---

## Ліцензія

MIT