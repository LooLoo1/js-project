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
    if (!this.isLocalStorageAvailable()) {
      return false;
    }
    try {
      localStorage.removeItem(this.TASKS_KEY);
      localStorage.removeItem(this.USERS_KEY);
      localStorage.removeItem(this.ACTIVE_USER_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
      console.log("Wyczyszczono wszystkie dane z localStorage.");
      return true;
    } catch (e) {
      console.error("Błąd podczas czyszczenia localStorage:", e);
      return false;
    }
  }

  /**
   * Zwraca informacje o użyciu pamięci localStorage
   * @returns {Object} Informacje o użyciu pamięci
   */
  getStorageInfo() {
    if (!this.isLocalStorageAvailable()) {
      return {
        totalSize: "N/A",
        tasksSize: "N/A",
        usersSize: "N/A",
        settingsSize: "N/A",
        itemsCount: 0,
      };
    }

    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      totalBytes += (key.length + value.length) * 2; // 2 bajty na znak
    }

    const tasksBytes =
      (localStorage.getItem(this.TASKS_KEY)?.length || 0) * 2;
    const usersBytes =
      (localStorage.getItem(this.USERS_KEY)?.length || 0) * 2;
    const settingsBytes =
      (localStorage.getItem(this.SETTINGS_KEY)?.length || 0) * 2;

    return {
      totalSize: this.formatBytes(totalBytes),
      tasksSize: this.formatBytes(tasksBytes),
      usersSize: this.formatBytes(usersBytes),
      settingsSize: this.formatBytes(settingsBytes),
      itemsCount: localStorage.length,
    };
  }

  /**
   * Formatuje bajty na czytelny format
   * @param {number} bytes - Liczba bajtów
   * @param {number} decimals - Liczba miejsc po przecinku
   * @returns {string} Sformatowany rozmiar
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  /**
   * Tworzy kopię zapasową wszystkich danych do pliku JSON
   */
  createBackup() {
    const data = this.exportAllData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todo_app_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Utworzono kopię zapasową danych.");
    alert("Kopia zapasowa danych została utworzona i pobrana.");
  }

  /**
   * Przywraca dane z pliku kopii zapasowej
   * @param {File} backupFile - Plik kopii zapasowej
   */
  restoreFromBackup(backupFile) {
    if (!backupFile) {
      alert("Wybierz plik kopii zapasowej.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.tasks && data.users && data.settings && data.version) {
          this.importAllData(data);
          alert("Dane zostały pomyślnie przywrócone!");
          // Opcjonalnie: odśwież aplikację po imporcie
          window.location.reload();
        } else {
          throw new Error("Nieprawidłowy format pliku kopii zapasowej.");
        }
      } catch (error) {
        console.error("Błąd podczas wczytywania kopii zapasowej:", error);
        alert(
          "Błąd podczas wczytywania kopii zapasowej: " + error.message
        );
      }
    };
    reader.readAsText(backupFile);
  }
}

window.Storage = Storage;
