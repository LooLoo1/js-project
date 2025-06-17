# Lista Zadań - Menedżer Zadań

Nowoczesna aplikacja do zarządzania zadaniami napisana w czystym JavaScript z wykorzystaniem programowania obiektowego (OOP). Projekt realizuje wszystkie wymagania zaliczeniowe oraz dodatkowe funkcjonalności.

## 🎯 Funkcjonalności

### Podstawowe
- ✅ **CRUD zadań** - dodawanie, edytowanie, usuwanie, oznaczanie jako ukończone
- ✅ **System użytkowników** - proste zarządzanie użytkownikami bez logowania
- ✅ **Struktura OOP** - klasy Task i TaskManager zgodnie z wymaganiami
- ✅ **Interaktywny interfejs** - czysty JavaScript z event listenerami

### Dodatkowe funkcjonalności
- ✅ **Priorytety zadań** - niski, średni, wysoki
- ✅ **Kategorie zadań** - praca, nauka, hobby, osobiste
- ✅ **localStorage** - trwałe przechowywanie danych
- ✅ **Drag & Drop** - zmiana kolejności zadań
- ✅ **Animacje CSS** - płynne przejścia i efekty
- ✅ **Filtrowanie i sortowanie** - zaawansowane opcje wyszukiwania
- ✅ **Import/Export** - kopia zapasowa danych
- ✅ **Responsywny design** - działanie na urządzeniach mobilnych
- ✅ **Skróty klawiszowe** - szybsze zarządzanie
- ✅ **Statystyki** - analiza produktywności

## 🛠️ Technologie

- **JavaScript ES6+** - czysty JavaScript bez frameworków
- **HTML5** - semantyczna struktura
- **Tailwind CSS** - nowoczesne stylowanie
- **CSS3** - animacje i efekty
- **localStorage API** - przechowywanie danych
- **Drag & Drop API** - interakcja użytkownika

## 📁 Struktura Projektu

```
todo-app/
├── index.html              # Główny plik HTML
├── css/
│   └── styles.css          # Dodatkowe style i animacje
├── js/
│   ├── models/             # Modele danych
│   │   ├── Task.js         # Klasa Task
│   │   └── User.js         # Klasa User
│   ├── managers/           # Managery logiki biznesowej
│   │   ├── TaskManager.js  # Zarządzanie zadaniami
│   │   └── UserManager.js  # Zarządzanie użytkownikami
│   ├── components/         # Komponenty UI
│   │   ├── TaskComponent.js # Renderowanie zadań
│   │   └── UserComponent.js # Renderowanie użytkowników
│   ├── utils/              # Narzędzia pomocnicze
│   │   ├── Storage.js      # Zarządzanie localStorage
│   │   └── DragDrop.js     # Obsługa przeciągania
│   └── app.js              # Główna aplikacja
└── README.md               # Dokumentacja
```

## 🚀 Instalacja i Uruchomienie

### Metoda 1: Bezpośrednie otwarcie
1. Pobierz wszystkie pliki projektu
2. Zachowaj dokładną strukturę folderów (bardzo ważne!)
3. Otwórz `index.html` w przeglądarce
4. ⚠️ **Ważne**: Jeśli widzisz błąd "Brakujące klasy", odśwież stronę - to problem z kolejnością ładowania skryptów

### Metoda 2: Lokalny serwer (zalecane)
```bash
# Przejdź do folderu projektu
cd todo-app

# Node.js (jeśli zainstalowany)
npx serve .

# Live Server w VS Code
# Prawdy przycisk na index.html -> "Open with Live Server"

# Otwórz http://localhost:8000 w przeglądarce
```

### 🔧 Rozwiązywanie problemów z uruchomieniem

#### Błąd "Brakujące klasy"
```
❌ Błąd: Brakujące klasy: Task, User, TaskManager...
```
**Rozwiązanie:**
1. Odśwież stronę (F5)
2. Sprawdź czy wszystkie pliki JS są w odpowiednich folderach
3. Użyj lokalnego serwera zamiast bezpośredniego otwarcia pliku
4. Sprawdź konsolę przeglądarki dla szczegółów

#### Struktura folderów musi być dokładna:
```
✅ Poprawne:
todo-app/index.html
todo-app/js/models/Task.js

❌ Błędne:
todo-app/Task.js
todo-app/js/Task.js
```

## 👥 Instrukcja Użytkownika

### Rozpoczęcie pracy
1. **Dodaj użytkownika** - wpisz nazwę w polu "Nazwa użytkownika" i kliknij "Dodaj Użytkownika"
2. **Wybierz aktywnego użytkownika** - kliknij na badge użytkownika
3. **Dodaj zadanie** - wypełnij formularz i kliknij "Dodaj Zadanie"

### Zarządzanie zadaniami
- **Oznacz jako ukończone** - kliknij checkbox przy zadaniu
- **Edytuj zadanie** - kliknij ikonę ołówka
- **Usuń zadanie** - kliknij ikonę kosza
- **Zmień kolejność** - przeciągnij zadanie na nową pozycję (drag & drop)

### Filtrowanie i sortowanie
- **Filtruj użytkowników** - wybierz użytkownika z listy rozwijanej
- **Filtruj status** - oczekujące lub ukończone
- **Filtruj kategorie** - praca, nauka, hobby, osobiste
- **Sortuj** - według daty utworzenia, priorytetu lub alfabetycznie

### Zarządzanie użytkownikami
- **Prawdy przycisk myszy** na użytkowniku - menu kontekstowe
- **Podwójne kliknięcie** - edycja nazwy
- **Kliknięcie** - ustawienie jako aktywny

## ⌨️ Skróty Klawiszowe

- `Ctrl + S` - Zapisz dane
- `Ctrl + N` - Focus na pole nowego zadania
- `Ctrl + U` - Focus na pole nowego użytkownika
- `Esc` - Zamknij modal edycji

## 📊 Statystyki i Analityka

Aplikacja automatycznie śledzi:
- Liczbę zadań na użytkownika
- Procent ukończenia
- Produktywność użytkowników
- Statystyki według priorytetów i kategorii

## 💾 Zarządzanie Danymi

### Automatyczne zapisywanie
- Autozapis co 30 sekund
- Zapis przed zamknięciem przeglądarki
- Natychmiastowy zapis po każdej zmianie

### Import/Export
- **Export** - pobierz kopię zapasową w formacie JSON
- **Import** - przywróć dane z pliku kopii zapasowej
- **Reset** - wyczyść wszystkie dane

## 🎨 Design i UX

### Kolory priorytetów
- 🔴 **Wysoki** - czerwony border i tło
- 🟡 **Średni** - żółty border i tło  
- 🟢 **Niski** - zielony border i tło

### Animacje
- Fade-in dla nowych elementów
- Hover efekty na przyciskach
- Smooth scrolling do elementów
- Loading indicators

### Responsywność
- Pełne wsparcie dla urządzeń mobilnych
- Adaptacyjny layout
- Touch-friendly interfejs

## 🔧 Architektura Techniczna

### Wzorce projektowe
- **MVC** - separacja logiki od prezentacji
- **Observer Pattern** - komunikacja między komponentami
- **Strategy Pattern** - różne strategie sortowania/filtrowania

### Klasy główne

#### Task
```javascript
class Task {
    constructor(content, userId, priority, category)
    markAsCompleted()
    toggleStatus()
    updateContent(newContent)
    // ... więcej metod
}
```

#### TaskManager
```javascript
class TaskManager {
    addTask(content, userId, priority, category)
    deleteTask(taskId)
    updateTask(taskId, updates)
    setFilters(filters)
    // ... więcej metod
}
```

### Zarządzanie stanem
- Centralne storage w localStorage
- Obserwatorzy dla synchronizacji UI
- Walidacja danych na każdym poziomie

## 🧪 Testowanie

### Testowanie manualne
1. Sprawdź wszystkie funkcje CRUD
2. Przetestuj filtry i sortowanie
3. Sprawdź drag & drop
4. Przetestuj na różnych urządzeniach

### Dane testowe
Aplikacja automatycznie tworzy przykładowe dane przy pierwszym uruchomieniu.

## 🐛 Debugowanie

### Tryb debugowania
W konsoli przeglądarki:
```javascript
// Włącz tryb debug
app.enableDebugMode()

// Dostępne komendy
DEBUG.logTasks()     // Pokaż wszystkie zadania
DEBUG.logUsers()     // Pokaż wszystkich użytkowników
DEBUG.exportData()   // Eksportuj dane
DEBUG.createDemo()   // Utwórz dane demo
```

### Rozwiązywanie problemów
- **Dane nie zapisują się** - sprawdź czy localStorage jest włączony
- **Drag & drop nie działa** - sprawdź czy jesteś na urządzeniu dotykowym
- **Animacje nie działają** - sprawdź wsparcie CSS w przeglądarce

## 📈 Performance

### Optymalizacje
- Lazy loading komponentów
- Debounced event handlers
- Minimalne DOM manipulations
- Efficient data structures

### Limits
- Zalecane maksimum: 1000 zadań
- localStorage limit: ~5MB
- Optymalne: do 100 użytkowników

## 🔐 Bezpieczeństwo

- Escapowanie HTML w treści zadań
- Walidacja danych wejściowych
- Sanityzacja przed zapisem
- Brak zewnętrznych dependencies (CDN tylko dla Tailwind)

## 🌐 Kompatybilność

### Przeglądarki
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Funkcjonalności
- localStorage support required
- Modern JavaScript (ES6+)
- CSS Grid and Flexbox
- Drag & Drop API

## 📝 Notatki Projektowe

### Wymagania spełnione
- ✅ Programowanie obiektowe (klasy Task, TaskManager)
- ✅ Vanilla JavaScript bez frameworków
- ✅ Event Listeners i interakcja
- ✅ CSS/Bootstrap/Tailwind styling
- ✅ Wszystkie funkcjonalności CRUD

### Dodatkowe osiągnięcia
- ✅ Zaawansowana architektura MVC
- ✅ Kompletny system użytkowników
- ✅ Professional-grade UI/UX
- ✅ Comprehensive error handling
- ✅ Full responsive design
- ✅ Extensive documentation

## 👨‍💻 Autor

Vitalii Petriv - Lista zadań z użytkownikami
Technologie: Vanilla JavaScript, HTML5, Tailwind CSS
Data: Czerwiec 2025

## 📄 Licencja

Ten projekt jest stworzony do celów edukacyjnych w ramach kursu programowania JavaScript.