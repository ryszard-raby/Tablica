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

## PWA — instalacja i praca offline

Aplikacja ma manifest, ikony instalacyjne i service worker generowany przez `vite-plugin-pwa` podczas `npm run build`.
Konfiguracja bazuje na dokumentacji: https://vite-pwa-org.netlify.app/guide/.

- Po wdrożeniu na GitHub Pages otwórz stronę online i poczekaj na jej pełne załadowanie. Potem tablica oraz konfiguracja działają offline.
- W przeglądarce obsługującej instalację wybierz z menu opcję instalacji aplikacji / dodania do ekranu głównego.
- Na iPadzie w Safari użyj **Udostępnij → Do ekranu początkowego**.
- Zainstalowana aplikacja uruchamia się w osobnym oknie. Przycisk **Pełny ekran** nadal służy do wyświetlenia samej tablicy na urządzeniach obsługujących Fullscreen API.
- Ustawienia pozostają zapisane lokalnie na danym urządzeniu. Zapowiedzi głosowe zależą od dostępnych głosów systemowych.
- Po pobraniu nowej wersji zamknij wszystkie okna i karty aplikacji, a następnie otwórz ją ponownie. Aktualizacja nie wymusza odświeżenia podczas zabawy.

PWA wymaga HTTPS (GitHub Pages zapewnia HTTPS) lub localhost. Do testów użyj `npm run build` i `npm run preview`; service worker jest celowo wyłączony w trybie `npm run dev`.

## Perony i zajętość stacji

W ustawieniach każda stacja ma liczbę peronów (1–99). Domyślnie: Głogów — 1, Lubin — 2, Wrocław Główny — 3. Ustawienia peronów zapisują się razem z siecią.

Rozkład rezerwuje osobny peron dla każdego pociągu. Następny kurs zaczyna się na peronie zakończenia poprzedniego; zajęte stacje docelowe i pośrednie nie są dostępne dla innych pociągów. Kolumna „Perony” pokazuje **odjazd → przyjazd**.

Model zabawy zakłada zakończenie przejazdu przed kolejnym odjazdem. Aplikacja nie wykrywa rzeczywistego położenia pociągów. Po uruchomieniu strony, losowaniu nowego rozkładu lub zapisaniu ustawień ustaw pociągi według sekcji „Ustawienie początkowe pociągów” pod tablicą. W sieci musi być przynajmniej o jeden peron więcej niż pociągów, aby możliwy był ruch.

Przy migracji wcześniejszych ustawień stacje otrzymują domyślne liczby peronów (nowe nazwy — 1). Jeśli stara flota jest większa niż dostępna pojemność, pierwsza stacja otrzymuje dodatkowe perony, aby zachować zapisane pociągi i umożliwić ruch; liczby można następnie zmienić w ustawieniach.
