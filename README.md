# Tablica

Pusty szablon aplikacji **Preact + TypeScript + SCSS** (Vite).

## Wymagania

- Node.js 20+ (testowane na 24)

## Skrypty

```bash
npm install      # instalacja zależności
npm run dev      # serwer deweloperski (http://localhost:5173)
npm run build    # type-check + build produkcyjny do dist/
npm run preview  # podgląd builda produkcyjnego
```

## Struktura

```
index.html               # punkt wejścia HTML (montuje #app)
vite.config.ts           # konfiguracja Vite + SCSS (loadPaths: src/styles)
tsconfig*.json           # konfiguracja TypeScript (project references)
public/                  # pliki statyczne kopiowane 1:1
src/
  main.tsx               # bootstrap: render(<App />, #app)
  app.tsx                # główny komponent
  app.scss               # style komponentu App
  index.scss             # style globalne (reset + zmienne)
  styles/
    _variables.scss      # tokeny designu (kolory, fonty, odstępy)
    _reset.scss          # minimalny reset CSS
```

## Konwencje SCSS

Wszystkie pliki w `src/styles` są dostępne globalnie dzięki `loadPaths`,
więc importujemy je bez ścieżek relatywnych:

```scss
@use 'variables' as *;

.card {
  color: $color-accent;
  padding: $spacing;
}
```

Partiale (pliki pomocnicze) nazywamy z podkreśleniem, np. `_variables.scss` —
Sass nie wygeneruje dla nich osobnego pliku CSS.

## Publikowanie na GitHub Pages

1. W repozytorium otwórz **Settings → Pages → Build and deployment** i ustaw **Source: GitHub Actions**.
2. Wyślij zmiany na gałąź `main`. Workflow `.github/workflows/pages.yml` zbuduje aplikację i opublikuje katalog `dist`.
3. W zakładce **Actions** poczekaj na zakończenie `Build and Deploy`. Workflow można również uruchomić przyciskiem **Run workflow**.
4. Otwórz adres podany w **Settings → Pages**.

Konfiguracja `base: './'` generuje względne ścieżki do JavaScript, CSS i ikony, dzięki czemu aplikacja działa również pod adresem `https://uzytkownik.github.io/nazwa-repozytorium/`.
Nie publikuj plików źródłowych jako gotowej strony — GitHub Pages musi otrzymać zawartość `dist` po wykonaniu `npm run build`.
Workflow korzysta z Node.js 24 oraz `npm ci` (w repozytorium musi być `package-lock.json`).
