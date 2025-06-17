/**
 * Klasa UserManager zarządza użytkownikami w aplikacji
 * Obsługuje CRUD operacje dla użytkowników i zarządzanie aktywnym użytkownikiem
 */
class UserManager {
  constructor(storage, taskManager) {
    this.storage = storage;
    this.taskManager = taskManager;
    this.users = [];
    this.activeUser = null;
    this.observers = [];

    this.loadUsers();
    this.loadActiveUser();

    // Subskrybuj zmiany w zadaniach aby aktualizować statystyki użytkowników
    this.taskManager.addObserver(this.handleTaskManagerEvents.bind(this));
  }

  /**
   * Wczytuje użytkowników z storage
   */
  loadUsers() {
    try {
      this.users = this.storage.loadUsers();
      console.log("UserManager: Users array after loading:", this.users);
      this.updateUserStats();
      this.notifyObservers("usersLoaded");
      console.log("Wczytano użytkowników:", this.users.length);
    } catch (error) {
      console.error("Błąd podczas wczytywania użytkowników:", error);
      this.users = [];
    }
  }

  /**
   * Zapisuje użytkowników do storage
   */
  saveUsers() {
    try {
      this.storage.saveUsers(this.users);
      this.notifyObservers("usersSaved");
    } catch (error) {
      console.error("Błąd podczas zapisywania użytkowników:", error);
    }
  }

  /**
   * Wczytuje aktywnego użytkownika z storage
   */
  loadActiveUser() {
    try {
      const activeUserId = this.storage.loadActiveUser();
      if (activeUserId) {
        const user = this.getUserById(activeUserId);
        if (user) {
          this.setActiveUser(user.id);
        }
      }
    } catch (error) {
      console.error("Błąd podczas wczytywania aktywnego użytkownika:", error);
    }
  }

  /**
   * Zapisuje aktywnego użytkownika do storage
   */
  saveActiveUser() {
    try {
      const activeUserId = this.activeUser ? this.activeUser.id : null;
      this.storage.saveActiveUser(activeUserId);
    } catch (error) {
      console.error("Błąd podczas zapisywania aktywnego użytkownika:", error);
    }
  }

  /**
   * Dodaje nowego użytkownika
   * @param {string} name - Nazwa użytkownika
   * @returns {User|null} Nowy użytkownik lub null w przypadku błędu
   */
  addUser(name) {
    try {
      // Walidacja nazwy użytkownika
      if (!User.isValidName(name)) {
        throw new Error(
          "Nieprawidłowa nazwa użytkownika. Nazwa musi mieć 2-50 znaków i zawierać tylko litery."
        );
      }

      // Sprawdź czy użytkownik o takiej nazwie już istnieje
      if (this.getUserByName(name.trim())) {
        throw new Error("Użytkownik o takiej nazwie już istnieje");
      }

      const user = new User(name);
      this.users.push(user);

      this.updateUserStats();
      this.saveUsers();
      this.notifyObservers("userAdded", user);

      console.log("Dodano nowego użytkownika:", user.name);
      return user;
    } catch (error) {
      console.error("Błąd podczas dodawania użytkownika:", error);
      return null;
    }
  }

  /**
   * Usuwa użytkownika
   * @param {string} userId - ID użytkownika do usunięcia
   * @param {boolean} deleteUserTasks - Czy usunąć także zadania użytkownika
   * @returns {boolean} True jeśli usunięto pomyślnie
   */
  deleteUser(userId, deleteUserTasks = false) {
    try {
      const user = this.getUserById(userId);
      if (!user) {
        throw new Error("Użytkownik nie został znaleziony");
      }

      // Sprawdź czy użytkownik ma zadania
      const userTasks = this.taskManager.getTasksByUser(userId);
      if (userTasks.length > 0 && !deleteUserTasks) {
        throw new Error(
          "Nie można usunąć użytkownika który ma zadania. Usuń najpierw zadania lub zaznacz opcję usunięcia zadań."
        );
      }

      // Usuń zadania użytkownika jeśli wybrano taką opcję
      if (deleteUserTasks && userTasks.length > 0) {
        this.taskManager.deleteAllUserTasks(userId);
      }

      // Usuń użytkownika z listy
      const userIndex = this.users.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        this.users.splice(userIndex, 1);
      }

      // Jeśli to był aktywny użytkownik, wyczyść wybór
      if (this.activeUser && this.activeUser.id === userId) {
        this.clearActiveUser();
      }

      this.updateUserStats();
      this.saveUsers();
      this.notifyObservers("userDeleted", user);

      console.log("Usunięto użytkownika:", user.name);
      return true;
    } catch (error) {
      console.error("Błąd podczas usuwania użytkownika:", error);
      return false;
    }
  }

  /**
   * Aktualizuje użytkownika
   * @param {string} userId - ID użytkownika
   * @param {Object} updates - Obiekt z aktualizacjami
   * @returns {boolean} True jeśli zaktualizowano pomyślnie
   */
  updateUser(userId, updates) {
    try {
      const user = this.getUserById(userId);
      if (!user) {
        throw new Error("Użytkownik nie został znaleziony");
      }

      // Aktualizuj nazwę jeśli podano
      if (updates.name !== undefined) {
        if (!User.isValidName(updates.name)) {
          throw new Error("Nieprawidłowa nazwa użytkownika");
        }

        // Sprawdź czy nazwa nie jest już zajęta przez innego użytkownika
        const existingUser = this.getUserByName(updates.name.trim());
        if (existingUser && existingUser.id !== userId) {
          throw new Error("Użytkownik o takiej nazwie już istnieje");
        }

        user.updateName(updates.name);
      }

      this.saveUsers();
      this.notifyObservers("userUpdated", user);

      console.log("Zaktualizowano użytkownika:", userId);
      return true;
    } catch (error) {
      console.error("Błąd podczas aktualizacji użytkownika:", error);
      return false;
    }
  }

  /**
   * Znajduje użytkownika po ID
   * @param {string} userId - ID użytkownika
   * @returns {User|null} Użytkownik lub null jeśli nie znaleziono
   */
  getUserById(userId) {
    return this.users.find((user) => user.id === userId) || null;
  }

  /**
   * Znajduje użytkownika po nazwie
   * @param {string} name - Nazwa użytkownika
   * @returns {User|null} Użytkownik lub null jeśli nie znaleziono
   */
  getUserByName(name) {
    return (
      this.users.find(
        (user) => user.name.toLowerCase() === name.toLowerCase().trim()
      ) || null
    );
  }

  /**
   * Ustawia aktywnego użytkownika
   * @param {string} userId - ID użytkownika
   * @returns {boolean} True jeśli ustawiono pomyślnie
   */
  setActiveUser(userId) {
    try {
      const user = this.getUserById(userId);
      if (!user) {
        throw new Error("Użytkownik nie został znaleziony");
      }

      // Dezaktywuj poprzedniego aktywnego użytkownika
      if (this.activeUser) {
        this.activeUser.setInactive();
      }

      // Aktywuj nowego użytkownika
      user.setActive();
      this.activeUser = user;

      this.saveActiveUser();
      this.saveUsers();
      this.notifyObservers("activeUserChanged", user);

      console.log("Ustawiono aktywnego użytkownika:", user.name);
      return true;
    } catch (error) {
      console.error("Błąd podczas ustawiania aktywnego użytkownika:", error);
      return false;
    }
  }

  /**
   * Czyści wybór aktywnego użytkownika
   */
  clearActiveUser() {
    if (this.activeUser) {
      this.activeUser.setInactive();
      this.activeUser = null;

      this.saveActiveUser();
      this.saveUsers();
      this.notifyObservers("activeUserCleared");

      console.log("Wyczyszczono aktywnego użytkownika");
    }
  }

  /**
   * Zwraca aktywnego użytkownika
   * @returns {User|null} Aktywny użytkownik lub null
   */
  getActiveUser() {
    return this.activeUser;
  }

  /**
   * Zwraca wszystkich użytkowników
   * @returns {User[]} Lista wszystkich użytkowników
   */
  getAllUsers() {
    return [...this.users];
  }

  /**
   * Aktualizuje statystyki zadań dla wszystkich użytkowników
   */
  updateUserStats() {
    this.users.forEach((user) => {
      const userTasks = this.taskManager.getTasksByUser(user.id);
      const completedTasks = userTasks.filter((task) => task.status === "done");
      user.updateTaskCounts(userTasks.length, completedTasks.length);
    });
  }

  /**
   * Sortuje użytkowników
   * @param {string} sortBy - Sposób sortowania
   * @returns {User[]} Posortowana lista użytkowników
   */
  getSortedUsers(sortBy = "name") {
    const sortedUsers = [...this.users];
    sortedUsers.sort((a, b) => a.compareTo(b, sortBy));
    return sortedUsers;
  }

  /**
   * Zwraca statystyki wszystkich użytkowników
   * @returns {Object} Statystyki użytkowników
   */
  getUsersStats() {
    const stats = {
      totalUsers: this.users.length,
      activeUser: this.activeUser ? this.activeUser.name : null,
      usersWithTasks: 0,
      usersWithoutTasks: 0,
      mostProductiveUser: null,
      leastProductiveUser: null,
      averageTasksPerUser: 0,
      averageCompletionRate: 0,
    };

    if (this.users.length === 0) {
      return stats;
    }

    let totalTasks = 0;
    let totalCompletionRates = 0;
    let mostProductive = this.users[0];
    let leastProductive = this.users[0];

    this.users.forEach((user) => {
      totalTasks += user.taskCount;
      totalCompletionRates += user.getCompletionPercentage();

      if (user.taskCount > 0) {
        stats.usersWithTasks++;
      } else {
        stats.usersWithoutTasks++;
      }

      if (
        user.getCompletionPercentage() >
        mostProductive.getCompletionPercentage()
      ) {
        mostProductive = user;
      }
      if (
        user.getCompletionPercentage() <
        leastProductive.getCompletionPercentage()
      ) {
        leastProductive = user;
      }
    });

    stats.averageTasksPerUser = Math.round(totalTasks / this.users.length);
    stats.averageCompletionRate = Math.round(
      totalCompletionRates / this.users.length
    );
    stats.mostProductiveUser = mostProductive.name;
    stats.leastProductiveUser = leastProductive.name;

    return stats;
  }

  /**
   * Eksportuje użytkowników do JSON
   * @returns {string} JSON string z użytkownikami
   */
  exportUsers() {
    const exportData = {
      users: this.users.map((user) => user.toJSON()),
      activeUser: this.activeUser ? this.activeUser.id : null,
      exportDate: new Date().toISOString(),
      totalUsers: this.users.length,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importuje użytkowników z JSON
   * @param {string} jsonData - JSON string z użytkownikami
   * @returns {boolean} True jeśli zaimportowano pomyślnie
   */
  importUsers(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (!data.users || !Array.isArray(data.users)) {
        throw new Error("Nieprawidłowy format danych");
      }

      const importedUsers = data.users.map((userData) =>
        User.fromJSON(userData)
      );

      // Sprawdź konflikty nazw
      for (const importedUser of importedUsers) {
        if (this.getUserByName(importedUser.name)) {
          throw new Error(
            `Użytkownik o nazwie "${importedUser.name}" już istnieje`
          );
        }
      }

      this.users.push(...importedUsers);
      this.updateUserStats();
      this.saveUsers();
      this.notifyObservers("usersImported", importedUsers);

      console.log("Zaimportowano użytkowników:", importedUsers.length);
      return true;
    } catch (error) {
      console.error("Błąd podczas importu użytkowników:", error);
      return false;
    }
  }

  /**
   * Obsługuje zdarzenia z TaskManager
   * @param {string} event - Typ zdarzenia
   * @param {*} data - Dane zdarzenia
   */
  handleTaskManagerEvents(event, data) {
    // Aktualizuj statystyki użytkowników gdy zmienią się zadania
    if (
      [
        "taskAdded",
        "taskDeleted",
        "taskStatusToggled",
        "userTasksDeleted",
      ].includes(event)
    ) {
      this.updateUserStats();
      this.saveUsers();
    }
  }

  /**
   * Dodaje obserwatora zmian
   * @param {Function} callback - Funkcja callback
   */
  addObserver(callback) {
    this.observers.push(callback);
  }

  /**
   * Usuwa obserwatora zmian
   * @param {Function} callback - Funkcja callback do usunięcia
   */
  removeObserver(callback) {
    this.observers = this.observers.filter((obs) => obs !== callback);
  }

  /**
   * Powiadamia obserwatorów o zmianach
   * @param {string} event - Typ zdarzenia
   * @param {*} data - Dane zdarzenia
   */
  notifyObservers(event, data = null) {
    this.observers.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("Błąd w obserwatorze UserManager:", error);
      }
    });
  }

  /**
   * Czyści wszystkich użytkowników i ich zadania
   * @returns {boolean} True jeśli wyczyszczono pomyślnie
   */
  clearAllUsers() {
    try {
      // Usuń wszystkie zadania
      this.taskManager.clearAllTasks();

      // Usuń wszystkich użytkowników
      const deletedCount = this.users.length;
      this.users = [];
      this.activeUser = null;

      this.saveUsers();
      this.saveActiveUser();
      this.notifyObservers("allUsersCleared", deletedCount);

      console.log("Wyczyszczono wszystkich użytkowników:", deletedCount);
      return true;
    } catch (error) {
      console.error("Błąd podczas czyszczenia użytkowników:", error);
      return false;
    }
  }
}

// Eksportuj klasę do globalnego scope
window.UserManager = UserManager;
