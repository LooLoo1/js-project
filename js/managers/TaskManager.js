/**
 * Klasa TaskManager zarządza wszystkimi zadaniami w aplikacji
 * Obsługuje CRUD operacje, filtrowanie, sortowanie i persist danych
 */
class TaskManager {
  constructor(storage) {
    this.storage = storage;
    this.tasks = [];
    this.filteredTasks = [];
    this.currentFilters = {
      userId: null,
      status: null,
      category: null,
      priority: null,
      searchText: null,
    };
    this.currentSort = "created";
    this.observers = [];

    this.loadTasks();
  }

  /**
   * Wczytuje zadania z storage
   */
  loadTasks() {
    try {
      this.tasks = this.storage.loadTasks();
      this.applyFiltersAndSort();
      this.notifyObservers("tasksLoaded");
      console.log("Wczytano zadania:", this.tasks.length);
    } catch (error) {
      console.error("Błąd podczas wczytywania zadań:", error);
      this.tasks = [];
    }
  }

  /**
   * Zapisuje zadania do storage
   */
  saveTasks() {
    try {
      this.storage.saveTasks(this.tasks);
      this.notifyObservers("tasksSaved");
    } catch (error) {
      console.error("Błąd podczas zapisywania zadań:", error);
    }
  }

  /**
   * Dodaje nowe zadanie
   * @param {string} content - Treść zadania
   * @param {string} userId - ID użytkownika
   * @param {string} priority - Priorytet zadania
   * @param {string} category - Kategoria zadania
   * @returns {Task|null} Nowe zadanie lub null w przypadku błędu
   */
  addTask(content, userId, priority = "medium", category = "osobiste") {
    try {
      // Walidacja danych wejściowych
      if (!content || !content.trim()) {
        throw new Error("Treść zadania nie może być pusta");
      }
      if (!userId) {
        throw new Error("ID użytkownika jest wymagane");
      }

      const task = new Task(content.trim(), userId, priority, category);
      this.tasks.push(task);

      this.applyFiltersAndSort();
      this.saveTasks();
      this.notifyObservers("taskAdded", task);

      console.log("Dodano nowe zadanie:", task.id);
      return task;
    } catch (error) {
      console.error("Błąd podczas dodawania zadania:", error);
      return null;
    }
  }

  /**
   * Usuwa zadanie
   * @param {string} taskId - ID zadania do usunięcia
   * @returns {boolean} True jeśli usunięto pomyślnie
   */
  deleteTask(taskId) {
    try {
      const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) {
        throw new Error("Zadanie nie zostało znalezione");
      }

      const deletedTask = this.tasks.splice(taskIndex, 1)[0];

      this.applyFiltersAndSort();
      this.saveTasks();
      this.notifyObservers("taskDeleted", deletedTask);

      console.log("Usunięto zadanie:", taskId);
      return true;
    } catch (error) {
      console.error("Błąd podczas usuwania zadania:", error);
      return false;
    }
  }

  /**
   * Aktualizuje zadanie
   * @param {string} taskId - ID zadania
   * @param {Object} updates - Obiekt z aktualizacjami
   * @returns {boolean} True jeśli zaktualizowano pomyślnie
   */
  updateTask(taskId, updates) {
    try {
      const task = this.getTaskById(taskId);
      if (!task) {
        throw new Error("Zadanie nie zostało znalezione");
      }

      // Aktualizuj poszczególne pola
      if (updates.content !== undefined) {
        task.updateContent(updates.content);
      }
      if (updates.priority !== undefined) {
        task.updatePriority(updates.priority);
      }
      if (updates.category !== undefined) {
        task.updateCategory(updates.category);
      }
      if (updates.status !== undefined) {
        if (updates.status === "done") {
          task.markAsCompleted();
        } else if (updates.status === "pending") {
          task.markAsPending();
        }
      }

      this.applyFiltersAndSort();
      this.saveTasks();
      this.notifyObservers("taskUpdated", task);

      console.log("Zaktualizowano zadanie:", taskId);
      return true;
    } catch (error) {
      console.error("Błąd podczas aktualizacji zadania:", error);
      return false;
    }
  }

  /**
   * Przełącza status zadania (pending/done)
   * @param {string} taskId - ID zadania
   * @returns {boolean} True jeśli przełączono pomyślnie
   */
  toggleTaskStatus(taskId) {
    try {
      const task = this.getTaskById(taskId);
      if (!task) {
        throw new Error("Zadanie nie zostało znalezione");
      }

      task.toggleStatus();

      this.applyFiltersAndSort();
      this.saveTasks();
      this.notifyObservers("taskStatusToggled", task);

      console.log("Przełączono status zadania:", taskId, "na:", task.status);
      return true;
    } catch (error) {
      console.error("Błąd podczas przełączania statusu zadania:", error);
      return false;
    }
  }

  /**
   * Znajduje zadanie po ID
   * @param {string} taskId - ID zadania
   * @returns {Task|null} Zadanie lub null jeśli nie znaleziono
   */
  getTaskById(taskId) {
    return this.tasks.find((task) => task.id === taskId) || null;
  }

  /**
   * Zwraca zadania dla określonego użytkownika
   * @param {string} userId - ID użytkownika
   * @returns {Task[]} Lista zadań użytkownika
   */
  getTasksByUser(userId) {
    return this.tasks.filter((task) => task.userId === userId);
  }

  /**
   * Zwraca zadania o określonym statusie
   * @param {string} status - Status zadania ('pending' lub 'done')
   * @returns {Task[]} Lista zadań o danym statusie
   */
  getTasksByStatus(status) {
    return this.tasks.filter((task) => task.status === status);
  }

  /**
   * Zwraca zadania o określonej kategorii
   * @param {string} category - Kategoria zadania
   * @returns {Task[]} Lista zadań w danej kategorii
   */
  getTasksByCategory(category) {
    return this.tasks.filter((task) => task.category === category);
  }

  /**
   * Zwraca zadania o określonym priorytecie
   * @param {string} priority - Priorytet zadania
   * @returns {Task[]} Lista zadań o danym priorytecie
   */
  getTasksByPriority(priority) {
    return this.tasks.filter((task) => task.priority === priority);
  }

  /**
   * Ustawia filtry zadań
   * @param {Object} filters - Obiekt z filtrami
   */
  setFilters(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.applyFiltersAndSort();
    this.notifyObservers("filtersChanged", this.currentFilters);
  }

  /**
   * Czyści wszystkie filtry
   */
  clearFilters() {
    this.currentFilters = {
      userId: null,
      status: null,
      category: null,
      priority: null,
      searchText: null,
    };
    this.applyFiltersAndSort();
    this.notifyObservers("filtersCleared");
  }

  /**
   * Ustawia sposób sortowania
   * @param {string} sortBy - Sposób sortowania ('created', 'priority', 'alphabetical')
   */
  setSortBy(sortBy) {
    this.currentSort = sortBy;
    this.applyFiltersAndSort();
    this.notifyObservers("sortChanged", sortBy);
  }

  /**
   * Stosuje filtry i sortowanie do zadań
   */
  applyFiltersAndSort() {
    // Najpierw filtruj
    this.filteredTasks = this.tasks.filter((task) =>
      task.matchesFilters(this.currentFilters)
    );

    // Następnie sortuj
    this.filteredTasks.sort((a, b) => this.compareTasksForSort(a, b));

    console.log(
      "Zastosowano filtry i sortowanie:",
      this.filteredTasks.length,
      "zadań"
    );
  }

  /**
   * Porównuje zadania do sortowania
   * @param {Task} taskA - Pierwsze zadanie
   * @param {Task} taskB - Drugie zadanie
   * @returns {number} Wartość dla sortowania
   */
  compareTasksForSort(taskA, taskB) {
    switch (this.currentSort) {
      case "priority":
        // Sortuj według priorytetu (wysokie na początku)
        const priorityDiff =
          taskB.getPriorityValue() - taskA.getPriorityValue();
        if (priorityDiff !== 0) return priorityDiff;
        // Jeśli priorytety równe, sortuj według daty utworzenia
        return taskB.createdAt - taskA.createdAt;

      case "alphabetical":
        return taskA.content.localeCompare(taskB.content, "pl");

      case "created":
      default:
        return taskB.createdAt - taskA.createdAt; // Najnowsze na początku
    }
  }

  /**
   * Przesuwa zadanie na nową pozycję (dla drag & drop)
   * @param {string} taskId - ID zadania do przeniesienia
   * @param {number} newIndex - Nowa pozycja
   * @returns {boolean} True jeśli przeniesiono pomyślnie
   */
  moveTask(taskId, newIndex) {
    try {
      const task = this.getTaskById(taskId);
      if (!task) {
        throw new Error("Zadanie nie zostało znalezione");
      }

      const currentIndex = this.tasks.indexOf(task);
      if (currentIndex === -1) {
        throw new Error("Zadanie nie znajduje się w liście");
      }

      // Usuń zadanie z obecnej pozycji
      this.tasks.splice(currentIndex, 1);

      // Wstaw na nową pozycję
      const insertIndex = Math.min(newIndex, this.tasks.length);
      this.tasks.splice(insertIndex, 0, task);

      this.applyFiltersAndSort();
      this.saveTasks();
      this.notifyObservers("taskMoved", {
        task,
        fromIndex: currentIndex,
        toIndex: insertIndex,
      });

      console.log(
        "Przeniesiono zadanie:",
        taskId,
        "z pozycji",
        currentIndex,
        "na pozycję",
        insertIndex
      );
      return true;
    } catch (error) {
      console.error("Błąd podczas przenoszenia zadania:", error);
      return false;
    }
  }

  /**
   * Zwraca statystyki zadań
   * @param {string} userId - ID użytkownika (opcjonalne)
   * @returns {Object} Obiekt ze statystykami
   */
  getTaskStats(userId = null) {
    const tasksToAnalyze = userId ? this.getTasksByUser(userId) : this.tasks;

    const stats = {
      total: tasksToAnalyze.length,
      pending: tasksToAnalyze.filter((task) => task.status === "pending")
        .length,
      completed: tasksToAnalyze.filter((task) => task.status === "done").length,
      byPriority: {
        high: tasksToAnalyze.filter((task) => task.priority === "high").length,
        medium: tasksToAnalyze.filter((task) => task.priority === "medium")
          .length,
        low: tasksToAnalyze.filter((task) => task.priority === "low").length,
      },
      byCategory: {
        praca: tasksToAnalyze.filter((task) => task.category === "praca")
          .length,
        nauka: tasksToAnalyze.filter((task) => task.category === "nauka")
          .length,
        hobby: tasksToAnalyze.filter((task) => task.category === "hobby")
          .length,
        osobiste: tasksToAnalyze.filter((task) => task.category === "osobiste")
          .length,
      },
    };

    stats.completionPercentage =
      stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return stats;
  }

  /**
   * Eksportuje zadania do JSON
   * @param {string} userId - ID użytkownika (opcjonalne)
   * @returns {string} JSON string z zadaniami
   */
  exportTasks(userId = null) {
    const tasksToExport = userId ? this.getTasksByUser(userId) : this.tasks;
    const exportData = {
      tasks: tasksToExport.map((task) => task.toJSON()),
      exportDate: new Date().toISOString(),
      userId: userId,
      totalTasks: tasksToExport.length,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importuje zadania z JSON
   * @param {string} jsonData - JSON string z zadaniami
   * @returns {boolean} True jeśli zaimportowano pomyślnie
   */
  importTasks(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error("Nieprawidłowy format danych");
      }

      const importedTasks = data.tasks.map((taskData) =>
        Task.fromJSON(taskData)
      );
      this.tasks.push(...importedTasks);

      this.applyFiltersAndSort();
      this.saveTasks();
      this.notifyObservers("tasksImported", importedTasks);

      console.log("Zaimportowano zadania:", importedTasks.length);
      return true;
    } catch (error) {
      console.error("Błąd podczas importu zadań:", error);
      return false;
    }
  }

  /**
   * Usuwa wszystkie zadania użytkownika
   * @param {string} userId - ID użytkownika
   * @returns {number} Liczba usuniętych zadań
   */
  deleteAllUserTasks(userId) {
    const userTasks = this.getTasksByUser(userId);
    const deletedCount = userTasks.length;

    this.tasks = this.tasks.filter((task) => task.userId !== userId);

    this.applyFiltersAndSort();
    this.saveTasks();
    this.notifyObservers("userTasksDeleted", { userId, deletedCount });

    console.log(
      "Usunięto wszystkie zadania użytkownika:",
      userId,
      "Liczba:",
      deletedCount
    );
    return deletedCount;
  }

  /**
   * Wyszukuje zadania po tekście
   * @param {string} searchText - Tekst do wyszukania
   * @returns {Task[]} Lista znalezionych zadań
   */
  searchTasks(searchText) {
    if (!searchText || !searchText.trim()) {
      return this.tasks;
    }

    const searchLower = searchText.toLowerCase().trim();
    return this.tasks.filter(
      (task) =>
        task.content.toLowerCase().includes(searchLower) ||
        task.getCategoryLabel().toLowerCase().includes(searchLower) ||
        task.getPriorityLabel().toLowerCase().includes(searchLower)
    );
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
        console.error("Błąd w obserwatorze:", error);
      }
    });
  }

  /**
   * Zwraca liczbę zadań spełniających kryteria
   * @returns {number} Liczba przefiltrowanych zadań
   */
  getFilteredTasksCount() {
    return this.filteredTasks.length;
  }

  /**
   * Zwraca wszystkie zadania (bez filtrów)
   * @returns {Task[]} Wszystkie zadania
   */
  getAllTasks() {
    return [...this.tasks];
  }

  /**
   * Zwraca przefiltrowane zadania
   * @returns {Task[]} Przefiltrowane zadania
   */
  getFilteredTasks() {
    return [...this.filteredTasks];
  }

  /**
   * Czyści wszystkie zadania
   * @returns {boolean} True jeśli wyczyszczono pomyślnie
   */
  clearAllTasks() {
    try {
      const deletedCount = this.tasks.length;
      this.tasks = [];
      this.filteredTasks = [];

      this.saveTasks();
      this.notifyObservers("allTasksCleared", deletedCount);

      console.log("Wyczyszczono wszystkie zadania:", deletedCount);
      return true;
    } catch (error) {
      console.error("Błąd podczas czyszczenia zadań:", error);
      return false;
    }
  }
}

// Eksportuj klasę do globalnego scope
window.TaskManager = TaskManager;
window.TaskManager = TaskManager;
