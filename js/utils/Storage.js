/**
 * Klasa Storage zarządza przechowywaniem danych w localStorage
 * Obsługuje zadania, użytkowników i ustawienia aplikacji
 */
class Storage {
  constructor() {
    this.TASKS_KEY = "todoApp_tasks";
    this.USERS_KEY = "todoApp_users";
    this.SETTINGS_KEY = "todoApp_settings";
    this.ACTIVE_USER_KEY = "todoApp_activeUser";
  }

  /**
   * Sprawdza czy localStorage jest dostępny
   * @returns {boolean} True jeśli localStorage jest dostępny
   */
  isLocalStorageAvailable() {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn("LocalStorage nie jest dostępny:", e);
      return false;
    }
  }

  /**
   * Zapisuje dane do localStorage z obsługą błędów
   * @param {string} key - Klucz
   * @param {*} data - Dane do zapisania
   * @returns {boolean} True jeśli zapisano pomyślnie
   */
  setItem(key, data) {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(key, jsonData);
      return true;
    } catch (e) {
      console.error("Błąd podczas zapisywania do localStorage:", e);
      return false;
    }
  }

  /**
   * Odczytuje dane z localStorage
   * @param {string} key - Klucz
   * @param {*} defaultValue - Wartość domyślna
   * @returns {*} Odczytane dane lub wartość domyślna
   */
  getItem(key, defaultValue = null) {
    if (!this.isLocalStorageAvailable()) {
      return defaultValue;
    }

    try {
      const jsonData = localStorage.getItem(key);
      if (jsonData === null) {
        return defaultValue;
      }
      return JSON.parse(jsonData);
    } catch (e) {
      console.error("Błąd podczas odczytywania z localStorage:", e);
      return defaultValue;
    }
  }

  /**
   * Usuwa element z localStorage
   * @param {string} key - Klucz do usunięcia
   * @returns {boolean} True jeśli usunięto pomyślnie
   */
  removeItem(key) {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error("Błąd podczas usuwania z localStorage:", e);
      return false;
    }
  }

  /**
   * Zapisuje listę zadań
   * @param {Task[]} tasks - Lista zadań
   * @returns {boolean} True jeśli zapisano pomyślnie
   */
  saveTasks(tasks) {
    const tasksData = tasks.map((task) => task.toJSON());
    const saved = this.setItem(this.TASKS_KEY, tasksData);

    if (saved) {
      console.log(
        "Zapisano zadania do localStorage:",
        tasksData.length,
        "zadań"
      );
    }

    return saved;
  }

  /**
   * Wczytuje listę zadań
   * @returns {Task[]} Lista zadań
   */
  loadTasks() {
    const tasksData = this.getItem(this.TASKS_KEY, []);
    const tasks = tasksData.map((taskData) => Task.fromJSON(taskData));

    console.log("Wczytano zadania z localStorage:", tasks.length, "zadań");

    return tasks;
  }

  /**
   * Zapisuje listę użytkowników
   * @param {User[]} users - Lista użytkowników
   * @returns {boolean} True jeśli zapisano pomyślnie
   */
  saveUsers(users) {
    const usersData = users.map((user) => user.toJSON());
    const saved = this.setItem(this.USERS_KEY, usersData);

    if (saved) {
      console.log(
        "Zapisano użytkowników do localStorage:",
        usersData.length,
        "użytkowników"
      );
    }

    return saved;
  }

  /**
   * Wczytuje listę użytkowników
   * @returns {User[]} Lista użytkowników
   */
  loadUsers() {
    const usersData = this.getItem(this.USERS_KEY, []);
    const users = usersData.map((userData) => User.fromJSON(userData));

    console.log(
      "Wczytano użytkowników z localStorage:",
      users.length,
      "użytkowników"
    );

    return users;
  }

  /**
   * Zapisuje ID aktywnego użytkownika
   * @param {string} userId - ID użytkownika
   * @returns {boolean} True jeśli zapisano pomyślnie
   */
  saveActiveUser(userId) {
    return this.setItem(this.ACTIVE_USER_KEY, userId);
  }

  /**
   * Wczytuje ID aktywnego użytkownika
   * @returns {string|null} ID aktywnego użytkownika
   */
  loadActiveUser() {
    return this.getItem(this.ACTIVE_USER_KEY, null);
  }

  /**
   * Zapisuje ustawienia aplikacji
   * @param {Object} settings - Ustawienia
   * @returns {boolean} True jeśli zapisano pomyślnie
   */
  saveSettings(settings) {
    return this.setItem(this.SETTINGS_KEY, settings);
  }

  /**
   * Wczytuje ustawienia aplikacji
   * @returns {Object} Ustawienia aplikacji
   */
  loadSettings() {
    return this.getItem(this.SETTINGS_KEY, {
      theme: "light",
      language: "pl",
      autoSave: true,
      showCompletedTasks: true,
      defaultCategory: "osobiste",
      defaultPriority: "medium",
      sortBy: "created",
      groupBy: "none",
    });
  }

  /**
   * Eksportuje wszystkie dane do obiektu JSON
   * @returns {Object} Wszystkie dane aplikacji
   */
  exportAllData() {
    return {
      tasks: this.getItem(this.TASKS_KEY, []),
      users: this.getItem(this.USERS_KEY, []),
      activeUser: this.getItem(this.ACTIVE_USER_KEY, null),
      settings: this.loadSettings(),
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
  }

  /**
   * Importuje dane z obiektu JSON
   * @param {Object} data - Dane do importu
   * @returns {boolean} True jeśli zaimportowano pomyślnie
   */
  importAllData(data) {
    try {
      if (data.tasks) {
        this.setItem(this.TASKS_KEY, data.tasks);
      }
      if (data.users) {
        this.setItem(this.USERS_KEY, data.users);
      }
      if (data.activeUser) {
        this.setItem(this.ACTIVE_USER_KEY, data.activeUser);
      }
      if (data.settings) {
        this.setItem(this.SETTINGS_KEY, data.settings);
      }

      console.log("Zaimportowano dane pomyślnie");
      return true;
    } catch (e) {
      console.error("Błąd podczas importu danych:", e);
      return false;
    }
  }

  /**
   * Czyści wszystkie dane aplikacji
   * @returns {boolean} True jeśli wyczyszczono pomyślnie
   */
  clearAllData() {
    try {
      this.removeItem(this.TASKS_KEY);
      this.removeItem(this.USERS_KEY);
      this.removeItem(this.ACTIVE_USER_KEY);
      this.removeItem(this.SETTINGS_KEY);

      console.log("Wyczyszczono wszystkie dane");
      return true;
    } catch (e) {
      console.error("Błąd podczas czyszczenia danych:", e);
      return false;
    }
  }

  /**
   * Zwraca informacje o wykorzystaniu localStorage
   * @returns {Object} Informacje o storage
   */
  getStorageInfo() {
    if (!this.isLocalStorageAvailable()) {
      return {
        available: false,
        used: 0,
        total: 0,
        percentage: 0,
      };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Przybliżona całkowita pojemność localStorage (zwykle 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB w bajtach
      const percentage = (used / total) * 100;

      return {
        available: true,
        used: used,
        total: total,
        percentage: Math.round(percentage * 100) / 100,
        usedFormatted: this.formatBytes(used),
        totalFormatted: this.formatBytes(total),
      };
    } catch (e) {
      console.error("Błąd podczas sprawdzania informacji o storage:", e);
      return {
        available: false,
        used: 0,
        total: 0,
        percentage: 0,
      };
    }
  }

  /**
   * Formatuje bajty do czytelnej postaci
   * @param {number} bytes - Liczba bajtów
   * @returns {string} Sformatowana wielkość
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Tworzy kopię zapasową danych
   * @returns {string} JSON string z danymi
   */
  createBackup() {
    const data = this.exportAllData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Przywraca dane z kopii zapasowej
   * @param {string} backupJson - JSON string z danymi
   * @returns {boolean} True jeśli przywrócono pomyślnie
   */
  restoreFromBackup(backupJson) {
    try {
      const data = JSON.parse(backupJson);
      return this.importAllData(data);
    } catch (e) {
      console.error("Błąd podczas przywracania kopii zapasowej:", e);
      return false;
    }
  }
}

// Eksportuj klasę do globalnego scope
window.Storage = Storage;
window.Storage = Storage;
