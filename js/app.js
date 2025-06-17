/**
 * Główny plik aplikacji - inicjalizuje wszystkie komponenty i zarządza aplikacją
 * Uruchamia się po załadowaniu wszystkich skryptów
 */
class TodoApp {
  constructor() {
    console.log('TodoApp constructor called.');
    this.storage = null;
    this.taskManager = null;
    this.userManager = null;
    this.dragDrop = null;
    this.taskComponent = null;
    this.userComponent = null;
    this.isInitialized = false;
  }

  /**
   * Inicjalizuje aplikację
   */
  async init() {
    console.log('TodoApp init() called.');
    try {
      this.checkDependencies();
      console.log("🚀 Inicjalizacja aplikacji Lista Zadań...");

      // Inicjalizuj komponenty w odpowiedniej kolejności
      this.initializeStorage();
      this.initializeManagers();
      this.initializeComponents();
      this.initializeDragDrop();

      // Ustaw globalne referencje dla łatwiejszego debugowania i dostępu
      this.setGlobalReferences();

      // Załaduj dane i renderuj interfejs
      await this.loadInitialData();

      // Bind dodatkowych event listenerów
      this.bindGlobalEvents();

      this.isInitialized = true;
      console.log("✅ Aplikacja została zainicjalizowana pomyślnie");

      // Pokaż komunikat powitalny
      this.showWelcomeMessage();
    } catch (error) {
      console.error("❌ Błąd podczas inicjalizacji aplikacji:", error);
      this.showError(
        "Błąd podczas uruchamiania aplikacji. Sprawdź konsolę dla szczegółów."
      );
    }
  }

  /**
   * Sprawdza czy wszystkie wymagane klasy są dostępne
   */
  checkDependencies() {
    const requiredClasses = [
      "Storage",
      "Task",
      "User",
      "TaskManager",
      "UserManager",
      "TaskComponent",
      "UserComponent",
      "DragDrop",
    ];

    const missingClasses = requiredClasses.filter((className) => {
      try {
        return (
          typeof window[className] === "undefined" || window[className] === null
        );
      } catch (e) {
        return true;
      }
    });

    if (missingClasses.length > 0) {
      throw new Error(`Brakujące klasy: ${missingClasses.join(", ")}`);
    }

    console.log("✅ Wszystkie wymagane klasy są dostępne");
  }

  /**
   * Inicjalizuje storage
   */
  initializeStorage() {
    this.storage = new Storage();
    console.log("📦 Storage zainicjalizowany");
  }

  /**
   * Inicjalizuje managery
   */
  initializeManagers() {
    this.taskManager = new TaskManager(this.storage);
    this.userManager = new UserManager(this.storage, this.taskManager);
    console.log("🔧 Managery zainicjalizowane");
  }

  /**
   * Inicjalizuje komponenty UI
   */
  initializeComponents() {
    this.userComponent = new UserComponent(this.userManager, this.taskManager);
    this.taskComponent = new TaskComponent(
      this.taskManager,
      this.userManager,
      null
    ); // dragDrop zostanie dodany później
    console.log("🎨 Komponenty UI zainicjalizowane");
  }

  /**
   * Inicjalizuje drag & drop
   */
  initializeDragDrop() {
    this.dragDrop = new DragDrop(this.taskManager, this.taskComponent);
    // Aktualizuj referencję w taskComponent
    this.taskComponent.dragDrop = this.dragDrop;
    console.log("🖱️ Drag & Drop zainicjalizowany");
  }

  /**
   * Ustawia globalne referencje
   */
  setGlobalReferences() {
    // Globalne referencje dla łatwiejszego dostępu z HTML i debugowania
    window.app = this;
    window.storage = this.storage;
    window.taskManager = this.taskManager;
    window.userManager = this.userManager;
    window.taskComponent = this.taskComponent;
    window.userComponent = this.userComponent;
    window.dragDrop = this.dragDrop;

    console.log("🌍 Globalne referencje ustawione");
  }

  /**
   * Ładuje początkowe dane
   */
  async loadInitialData() {
    try {
      // Sprawdź czy to pierwsze uruchomienie
      const users = this.userManager.getAllUsers();
      const tasks = this.taskManager.getAllTasks();

      if (users.length === 0 && tasks.length === 0) {
        console.log(
          "👋 Pierwsze uruchomienie - tworzenie przykładowych danych"
        );
        this.createSampleData();
      }

      // Renderuj komponenty
      this.userComponent.renderUsers();
      this.taskComponent.renderTasks();

      console.log("📊 Dane początkowe załadowane");
    } catch (error) {
      console.error("Błąd podczas ładowania danych:", error);
    }
  }

  /**
   * Tworzy przykładowe dane dla pierwszego uruchomienia
   */
  createSampleData() {
    // Dodaj przykładowych użytkowników
    const user1 = this.userManager.addUser("Jan Kowalski");
    const user2 = this.userManager.addUser("Anna Nowak");

    if (user1 && user2) {
      // Ustaw pierwszego użytkownika jako aktywnego
      this.userManager.setActiveUser(user1.id);

      // Dodaj przykładowe zadania
      this.taskManager.addTask(
        "Przygotować prezentację na spotkanie",
        user1.id,
        "high",
        "praca"
      );
      this.taskManager.addTask(
        "Kupić produkty spożywcze",
        user1.id,
        "medium",
        "osobiste"
      );
      this.taskManager.addTask(
        "Przeczytać książkę o JavaScript",
        user2.id,
        "low",
        "nauka"
      );
      this.taskManager.addTask(
        "Zorganizować biurko",
        user2.id,
        "medium",
        "osobiste"
      );
      this.taskManager.addTask(
        "Napisać raport miesięczny",
        user1.id,
        "high",
        "praca"
      );

      // Oznacz jedno zadanie jako ukończone
      const tasks = this.taskManager.getAllTasks();
      if (tasks.length > 0) {
        this.taskManager.toggleTaskStatus(tasks[2].id); // Trzecie zadanie
      }

      console.log("📝 Przykładowe dane utworzone");
    }
  }

  /**
   * Wiąże globalne event listenery
   */
  bindGlobalEvents() {
    // Autozapis co 30 sekund
    setInterval(() => {
      if (this.isInitialized) {
        this.autoSave();
      }
    }, 30000);

    // Zapisz przed zamknięciem strony
    window.addEventListener("beforeunload", () => {
      this.autoSave();
    });

    // Obsługa skrótów klawiszowych
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Obsługa resize okna
    window.addEventListener("resize", () => {
      this.handleWindowResize();
    });

    // Obsługa stanu online/offline
    window.addEventListener("online", () => {
      this.showSuccess("Połączenie internetowe zostało przywrócone");
    });

    window.addEventListener("offline", () => {
      this.showInfo("Aplikacja działa w trybie offline");
    });

    console.log("⌨️ Globalne event listenery dodane");
  }

  /**
   * Obsługuje skróty klawiszowe
   * @param {KeyboardEvent} e - Zdarzenie klawiatury
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S - zapisz dane
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      this.saveAllData();
      this.showSuccess("Dane zostały zapisane");
    }

    // Ctrl/Cmd + N - nowe zadanie (focus na input)
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      const taskInput = document.getElementById("taskContent");
      if (taskInput) {
        taskInput.focus();
      }
    }

    // Ctrl/Cmd + U - nowy użytkownik (focus na input)
    if ((e.ctrlKey || e.metaKey) && e.key === "u") {
      e.preventDefault();
      const userInput = document.getElementById("newUserInput");
      if (userInput) {
        userInput.focus();
      }
    }

    // Escape - zamknij modalne okna
    if (e.key === "Escape") {
      const modal = document.getElementById("editModal");
      if (modal && !modal.classList.contains("hidden")) {
        this.taskComponent.closeEditModal();
      }
    }
  }

  /**
   * Obsługuje zmianę rozmiaru okna
   */
  handleWindowResize() {
    // Dostosuj layout dla urządzeń mobilnych
    const isMobile = window.innerWidth < 768;

    if (isMobile && this.dragDrop) {
      // Wyłącz drag & drop na urządzeniach dotykowych
      this.dragDrop.disableDragDrop();
    } else if (this.dragDrop) {
      // Włącz drag & drop na desktopie
      this.dragDrop.enableDragDrop();
    }
  }

  /**
   * Automatyczne zapisywanie danych
   */
  autoSave() {
    try {
      this.saveAllData();
      console.log("💾 Autozapis wykonany");
    } catch (error) {
      console.error("Błąd podczas autozapisu:", error);
    }
  }

  /**
   * Zapisuje wszystkie dane
   */
  saveAllData() {
    this.taskManager.saveTasks();
    this.userManager.saveUsers();
    this.userManager.saveActiveUser();
  }

  /**
   * Pokazuje komunikat powitalny
   */
  showWelcomeMessage() {
    const users = this.userManager.getAllUsers();
    const tasks = this.taskManager.getAllTasks();

    let message = "🎉 Witaj w Menedżerze Zadań!";

    if (users.length === 0) {
      message += "\n\n📝 Rozpocznij od dodania pierwszego użytkownika.";
    } else if (tasks.length === 0) {
      message +=
        "\n\n✨ Dodaj swoje pierwsze zadanie aby zacząć organizować swoją pracę.";
    } else {
      const activeUser = this.userManager.getActiveUser();
      if (activeUser) {
        const userStats = activeUser.getStats();
        message += `\n\n👋 Witaj ponownie, ${activeUser.name}!`;
        message += `\n📊 Masz ${userStats.totalTasks} zadań, z czego ${userStats.completedTasks} ukończonych.`;
      }
    }

    // Pokaż komunikat po krótkiej chwili
    setTimeout(() => {
      this.showInfo(message);
    }, 1000);
  }

  /**
   * Eksportuje wszystkie dane aplikacji
   */
  exportAllData() {
    try {
      const allData = this.storage.exportAllData();
      const jsonString = JSON.stringify(allData, null, 2);

      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `lista_zadan_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.showSuccess("Kopia zapasowa została utworzona");
    } catch (error) {
      console.error("Błąd podczas eksportu:", error);
      this.showError("Błąd podczas tworzenia kopii zapasowej");
    }
  }

  /**
   * Importuje dane z pliku
   * @param {File} file - Plik do importu
   */
  async importAllData(file) {
    try {
      const text = await file.text();
      const success = this.storage.importAllData(JSON.parse(text));

      if (success) {
        // Przeładuj aplikację z nowymi danymi
        await this.reloadApp();
        this.showSuccess("Dane zostały zaimportowane pomyślnie");
      } else {
        this.showError("Błąd podczas importu danych");
      }
    } catch (error) {
      console.error("Błąd podczas importu:", error);
      this.showError("Błąd podczas importu danych. Sprawdź format pliku.");
    }
  }

  /**
   * Przeładowuje aplikację z nowymi danymi
   */
  async reloadApp() {
    try {
      // Przeładuj managery
      this.taskManager.loadTasks();
      this.userManager.loadUsers();
      this.userManager.loadActiveUser();

      // Renderuj komponenty
      this.userComponent.renderUsers();
      this.taskComponent.renderTasks();

      console.log("🔄 Aplikacja przeładowana");
    } catch (error) {
      console.error("Błąd podczas przeładowania aplikacji:", error);
    }
  }

  /**
   * Czyści wszystkie dane aplikacji
   */
  clearAllData() {
    const totalUsers = this.userManager.getAllUsers().length;
    const totalTasks = this.taskManager.getAllTasks().length;

    if (totalUsers === 0 && totalTasks === 0) {
      this.showInfo("Brak danych do wyczyszczenia");
      return;
    }

    const message = `Czy na pewno chcesz wyczyścić wszystkie dane?\n\nZostanie usuniętych:\n• ${totalUsers} użytkowników\n• ${totalTasks} zadań\n\nTej operacji nie można cofnąć!`;

    if (confirm(message)) {
      try {
        this.storage.clearAllData();

        // Przeładuj aplikację
        this.reloadApp();

        this.showSuccess("Wszystkie dane zostały wyczyszczone");

        // Pokaż komunikat dla nowego użytkownika
        setTimeout(() => {
          this.showInfo(
            "Aplikacja została zresetowana. Możesz teraz dodać nowych użytkowników i zadania."
          );
        }, 1500);
      } catch (error) {
        console.error("Błąd podczas czyszczenia danych:", error);
        this.showError("Błąd podczas czyszczenia danych");
      }
    }
  }

  /**
   * Pokazuje informacje o aplikacji
   */
  showAppInfo() {
    const storageInfo = this.storage.getStorageInfo();
    const userStats = this.userManager.getUsersStats();
    const totalTasks = this.taskManager.getAllTasks().length;

    const info = `
📱 Menedżer Zadań - Informacje o aplikacji

📊 Statystyki:
• Użytkownicy: ${userStats.totalUsers}
• Zadania ogółem: ${totalTasks}
• Średnia zadań na użytkownika: ${userStats.averageTasksPerUser}
• Średni procent ukończenia: ${userStats.averageCompletionRate}%

💾 Przechowywanie danych:
• LocalStorage: ${storageInfo.available ? "Dostępny" : "Niedostępny"}
• Wykorzystane miejsce: ${storageInfo.usedFormatted || "N/A"}
• Procent wykorzystania: ${storageInfo.percentage || 0}%

⚡ Funkcjonalności:
• ✅ Zarządzanie zadaniami (CRUD)
• ✅ System użytkowników
• ✅ Priorytety i kategorie
• ✅ Filtrowanie i sortowanie
• ✅ Drag & Drop
• ✅ Autozapis
• ✅ Import/Export
• ✅ Animacje CSS

🔧 Technologie:
• Vanilla JavaScript (ES6+)
• HTML5 & CSS3
• Tailwind CSS
• LocalStorage API
• Drag & Drop API

⌨️ Skróty klawiszowe:
• Ctrl+S - Zapisz dane
• Ctrl+N - Nowe zadanie
• Ctrl+U - Nowy użytkownik
• Esc - Zamknij modal

Wersja: 1.0.0
Data kompilacji: ${new Date().toLocaleDateString("pl-PL")}
      `;

    alert(info);
  }

  /**
   * Pokazuje statystyki aplikacji
   */
  showAppStats() {
    const userStats = this.userManager.getUsersStats();
    const tasks = this.taskManager.getAllTasks();
    const completedTasks = tasks.filter(
      (task) => task.status === "done"
    ).length;
    const pendingTasks = tasks.filter(
      (task) => task.status === "pending"
    ).length;

    // Statystyki priorytetów
    const highPriorityTasks = tasks.filter(
      (task) => task.priority === "high"
    ).length;
    const mediumPriorityTasks = tasks.filter(
      (task) => task.priority === "medium"
    ).length;
    const lowPriorityTasks = tasks.filter(
      (task) => task.priority === "low"
    ).length;

    // Statystyki kategorii
    const workTasks = tasks.filter((task) => task.category === "praca").length;
    const studyTasks = tasks.filter((task) => task.category === "nauka").length;
    const hobbyTasks = tasks.filter((task) => task.category === "hobby").length;
    const personalTasks = tasks.filter(
      (task) => task.category === "osobiste"
    ).length;

    const stats = `
📈 Statystyki Aplikacji

👥 Użytkownicy:
• Łącznie: ${userStats.totalUsers}
• Z zadaniami: ${userStats.usersWithTasks}
• Bez zadań: ${userStats.usersWithoutTasks}
• Najbardziej produktywny: ${userStats.mostProductiveUser || "Brak"}
• Najmniej produktywny: ${userStats.leastProductiveUser || "Brak"}

📋 Zadania - Status:
• Wszystkie: ${tasks.length}
• Ukończone: ${completedTasks} (${
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
    }%)
• Oczekujące: ${pendingTasks} (${
      tasks.length > 0 ? Math.round((pendingTasks / tasks.length) * 100) : 0
    }%)

🎯 Zadania - Priorytet:
• Wysoki: ${highPriorityTasks}
• Średni: ${mediumPriorityTasks}
• Niski: ${lowPriorityTasks}

📂 Zadania - Kategoria:
• Praca: ${workTasks}
• Nauka: ${studyTasks}
• Hobby: ${hobbyTasks}
• Osobiste: ${personalTasks}

💪 Produktywność:
• Średnia zadań/użytkownik: ${userStats.averageTasksPerUser}
• Średni % ukończenia: ${userStats.averageCompletionRate}%
• Aktywny użytkownik: ${userStats.activeUser || "Brak"}
      `;

    alert(stats);
  }

  /**
   * Tworzy demo danych dla prezentacji
   */
  createDemoData() {
    if (
      !confirm(
        "Czy chcesz utworzyć przykładowe dane demonstracyjne? To wyczyści obecne dane."
      )
    ) {
      return;
    }

    try {
      // Wyczyść obecne dane
      this.storage.clearAllData();
      this.reloadApp();

      // Dodaj użytkowników demo
      const users = [
        "Maria Kowalska",
        "Piotr Nowak",
        "Anna Wiśniewska",
        "Tomasz Wójcik",
      ];

      const createdUsers = users
        .map((name) => this.userManager.addUser(name))
        .filter(Boolean);

      if (createdUsers.length > 0) {
        // Ustaw pierwszego jako aktywnego
        this.userManager.setActiveUser(createdUsers[0].id);

        // Dodaj różnorodne zadania
        const demoTasks = [
          {
            content: "Przygotować prezentację quarterly",
            user: 0,
            priority: "high",
            category: "praca",
          },
          {
            content: "Kupić prezent na urodziny mamy",
            user: 0,
            priority: "medium",
            category: "osobiste",
          },
          {
            content: "Przeczytać artykuł o React Hooks",
            user: 1,
            priority: "low",
            category: "nauka",
          },
          {
            content: "Zorganizować spotkanie zespołu",
            user: 1,
            priority: "high",
            category: "praca",
          },
          {
            content: "Naprawić kran w łazience",
            user: 2,
            priority: "medium",
            category: "osobiste",
          },
          {
            content: "Ukończyć kurs JavaScript",
            user: 2,
            priority: "high",
            category: "nauka",
          },
          {
            content: "Zaplanować weekendowy wypad",
            user: 3,
            priority: "low",
            category: "hobby",
          },
          {
            content: "Napisać raport miesięczny",
            user: 3,
            priority: "high",
            category: "praca",
          },
          {
            content: "Posprzątać garaż",
            user: 0,
            priority: "low",
            category: "osobiste",
          },
          {
            content: "Obejrzeć tutorial o CSS Grid",
            user: 1,
            priority: "medium",
            category: "nauka",
          },
        ];

        demoTasks.forEach((task) => {
          if (createdUsers[task.user]) {
            this.taskManager.addTask(
              task.content,
              createdUsers[task.user].id,
              task.priority,
              task.category
            );
          }
        });

        // Oznacz niektóre zadania jako ukończone
        const allTasks = this.taskManager.getAllTasks();
        [0, 2, 4, 7].forEach((index) => {
          if (allTasks[index]) {
            this.taskManager.toggleTaskStatus(allTasks[index].id);
          }
        });

        this.showSuccess("Dane demonstracyjne zostały utworzone!");
      }
    } catch (error) {
      console.error("Błąd podczas tworzenia danych demo:", error);
      this.showError("Błąd podczas tworzenia danych demonstracyjnych");
    }
  }

  /**
   * Pokazuje komunikat błędu
   * @param {string} message - Wiadomość
   */
  showError(message) {
    console.error("ERROR:", message);

    // Spróbuj użyć systemu powiadomień jeśli jest dostępny
    if (this.dragDrop && this.dragDrop.createNotification) {
      this.showNotification(message, "error");
    } else {
      // Fallback - pokaż alert i w konsoli
      alert(message);
    }
  }

  /**
   * Pokazuje komunikat informacyjny
   * @param {string} message - Wiadomość
   */
  showInfo(message) {
    console.info("INFO:", message);

    if (this.dragDrop && this.dragDrop.createNotification) {
      this.showNotification(message, "info");
    } else {
      alert(message);
    }
  }

  /**
   * Pokazuje komunikat sukcesu
   * @param {string} message - Wiadomość
   */
  showSuccess(message) {
    console.log("SUCCESS:", message);

    if (this.dragDrop && this.dragDrop.createNotification) {
      this.showNotification(message, "success");
    } else {
      // Dla sukcesu nie pokazuj alert, tylko w konsoli
      console.log(message);
    }
  }

  /**
   * Pokazuje powiadomienie
   * @param {string} message - Wiadomość
   * @param {string} type - Typ ('success', 'error', 'info')
   */
  showNotification(message, type = "info") {
    if (this.dragDrop && this.dragDrop.createNotification) {
      const notification = this.dragDrop.createNotification(message, type);
      this.dragDrop.showNotification(notification);
    } else {
      // Fallback dla przypadków gdy dragDrop nie jest dostępny
      console.log(`${type.toUpperCase()}: ${message}`);
      alert(message);
    }
  }

  /**
   * Sprawdza czy aplikacja jest w trybie offline
   * @returns {boolean} True jeśli offline
   */
  isOffline() {
    return !navigator.onLine;
  }

  /**
   * Zwraca informacje o aplikacji
   * @returns {Object} Informacje o aplikacji
   */
  getAppInfo() {
    return {
      version: "1.0.0",
      initialized: this.isInitialized,
      users: this.userManager?.getAllUsers().length || 0,
      tasks: this.taskManager?.getAllTasks().length || 0,
      activeUser: this.userManager?.getActiveUser()?.name || null,
      offline: this.isOffline(),
      storageAvailable: this.storage?.isLocalStorageAvailable() || false,
    };
  }

  /**
   * Włącza tryb debugowania
   */
  enableDebugMode() {
    console.warn("🔧 Tryb debugowania WŁĄCZONY.");
    console.log("Dostępne obiekty globalne:");
    console.log("app:", window.app);
    console.log("storage:", window.storage);
    console.log("taskManager:", window.taskManager);
    console.log("userManager:", window.userManager);
    console.log("taskComponent:", window.taskComponent);
    console.log("userComponent:", window.userComponent);
    console.log("dragDrop:", window.dragDrop);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new TodoApp();
  app.init();
});
