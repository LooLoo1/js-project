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
      // Set initial sort to 'position' to maintain drag-and-drop order if no other sort is explicitly set.
      if (this.currentSort === "created") {
        this.currentSort = "position";
      }
      this.applyFiltersAndSort();
      this.notifyObservers("tasksLoaded");
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
   * @param {string} sortBy - Sposób sortowania ('created', 'priority', 'alphabetical', 'position')
   * @returns {boolean} True jeśli sortowanie zmieniono pomyślnie
   */
  setSortBy(sortBy) {
    if (["created", "priority", "alphabetical", "position"].includes(sortBy)) {
      this.currentSort = sortBy;
      this.applyFiltersAndSort();
      this.notifyObservers("sortChanged", this.currentSort);
      return true;
    }
    return false;
  }

  /**
   * Stosuje bieżące filtry i sortowanie do listy zadań
   * Wynik zapisuje do this.filteredTasks
   */
  applyFiltersAndSort() {
    let tasksToFilter = [...this.tasks];

    // Apply filters
    if (this.currentFilters.userId) {
      tasksToFilter = tasksToFilter.filter(
        (task) => task.userId === this.currentFilters.userId
      );
    }
    if (this.currentFilters.status) {
      tasksToFilter = tasksToFilter.filter(
        (task) => task.status === this.currentFilters.status
      );
    }
    if (this.currentFilters.category) {
      tasksToFilter = tasksToFilter.filter(
        (task) => task.category === this.currentFilters.category
      );
    }
    if (this.currentFilters.priority) {
      tasksToFilter = tasksToFilter.filter(
        (task) => task.priority === this.currentFilters.priority
      );
    }
    if (this.currentFilters.searchText) {
      const lowerCaseSearchText = this.currentFilters.searchText.toLowerCase();
      tasksToFilter = tasksToFilter.filter(
        (task) =>
          task.content.toLowerCase().includes(lowerCaseSearchText) ||
          task.category.toLowerCase().includes(lowerCaseSearchText)
      );
    }

    // Apply sort
    tasksToFilter.sort((a, b) => this.compareTasksForSort(a, b));

    this.filteredTasks = tasksToFilter;
  }

  /**
   * Pomocnicza funkcja do sortowania zadań
   * @param {Task} taskA
   * @param {Task} taskB
   * @returns {number}
   */
  compareTasksForSort(taskA, taskB) {
    switch (this.currentSort) {
      case "created":
        return taskA.createdAt - taskB.createdAt;
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[taskB.priority] - priorityOrder[taskA.priority];
      case "alphabetical":
        return taskA.content.localeCompare(taskB.content);
      case "position":
        return taskA.position - taskB.position;
      default:
        return 0;
    }
  }

  /**
   * Przenosi zadanie na nową pozycję w liście
   * @param {string} taskId - ID zadania do przeniesienia
   * @param {number} newIndex - Nowa pozycja (indeks)
   * @returns {boolean} True jeśli przeniesiono pomyślnie
   */
  moveTask(taskId, newIndex) {
    try {
      const task = this.getTaskById(taskId);
      if (!task) {
        throw new Error("Zadanie nie zostało znalezione.");
      }

      const currentIndex = this.tasks.findIndex((t) => t.id === taskId);
      if (currentIndex === -1) {
        throw new Error("Zadanie nie znaleziono w liście zadań.");
      }

      // Usuń zadanie z bieżącej pozycji
      this.tasks.splice(currentIndex, 1);

      // Wstaw zadanie na nową pozycję
      this.tasks.splice(newIndex, 0, task);

      // Update positions after move
      this.tasks.forEach((t, index) => {
        t.position = index;
      });

      this.applyFiltersAndSort();
      this.saveTasks();
      this.notifyObservers("taskMoved", {
        task,
        fromIndex: currentIndex,
        toIndex: newIndex,
      });

      return true;
    } catch (error) {
      console.error("Błąd podczas przenoszenia zadania:", error);
      return false;
    }
  }

  /**
   * Zwraca statystyki zadań
   * @param {string|null} userId - ID użytkownika lub null dla wszystkich zadań
   * @returns {Object} Statystyki zadań
   */
  getTaskStats(userId = null) {
    const tasks = userId
      ? this.tasks.filter((task) => task.userId === userId)
      : this.tasks;

    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "done").length;
    const pending = total - completed;

    const categories = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {});

    const priorities = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    return { total, completed, pending, categories, priorities };
  }

  /**
   * Eksportuje zadania do formatu JSON
   * @param {string|null} userId - ID użytkownika lub null dla wszystkich zadań
   * @returns {string} JSON string z zadaniami
   */
  exportTasks(userId = null) {
    const tasksToExport = userId
      ? this.tasks.filter((task) => task.userId === userId)
      : this.tasks;
    return JSON.stringify(tasksToExport.map((task) => task.toJSON()), null, 2);
  }

  /**
   * Importuje zadania z formatu JSON
   * @param {string} jsonData - JSON string z zadaniami
   * @returns {boolean} True jeśli zaimportowano pomyślnie
   */
  importTasks(jsonData) {
    try {
      const importedTasksData = JSON.parse(jsonData);
      const importedTasks = importedTasksData.map((taskData) =>
        Task.fromJSON(taskData)
      );

      // Dodaj nowe zadania, unikając duplikatów
      importedTasks.forEach((newTask) => {
        if (!this.tasks.some((existingTask) => existingTask.id === newTask.id)) {
          this.tasks.push(newTask);
        }
      });

      this.applyFiltersAndSort();
      this.saveTasks();
      this.notifyObservers("tasksImported");
      return true;
    } catch (error) {
      console.error("Błąd podczas importowania zadań:", error);
      return false;
    }
  }

  /**
   * Usuwa wszystkie zadania dla danego użytkownika
   * @param {string} userId - ID użytkownika
   * @returns {boolean} True jeśli usunięto pomyślnie
   */
  deleteAllUserTasks(userId) {
    try {
      const initialLength = this.tasks.length;
      this.tasks = this.tasks.filter((task) => task.userId !== userId);
      if (this.tasks.length < initialLength) {
        this.applyFiltersAndSort();
        this.saveTasks();
        this.notifyObservers("allUserTasksDeleted", userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Błąd podczas usuwania zadań użytkownika:", error);
      return false;
    }
  }

  /**
   * Wyszukuje zadania
   * @param {string} searchText - Tekst do wyszukania
   */
  searchTasks(searchText) {
    this.setFilters({ searchText });
  }

  /**
   * Dodaje obserwatora do listy
   * @param {Function} callback - Funkcja zwrotna
   */
  addObserver(callback) {
    this.observers.push(callback);
  }

  /**
   * Usuwa obserwatora z listy
   * @param {Function} callback - Funkcja zwrotna
   */
  removeObserver(callback) {
    this.observers = this.observers.filter((obs) => obs !== callback);
  }

  /**
   * Powiadamia wszystkich obserwatorów o zdarzeniu
   * @param {string} event - Nazwa zdarzenia
   * @param {*} data - Dane do przekazania obserwatorom
   */
  notifyObservers(event, data = null) {
    this.observers.forEach((observer) => {
      try {
        observer(event, data);
      } catch (error) {
        console.error("Błąd podczas powiadamiania obserwatora:", error);
      }
    });
  }

  /**
   * Zwraca liczbę przefiltrowanych zadań
   * @returns {number} Liczba zadań
   */
  getFilteredTasksCount() {
    return this.filteredTasks.length;
  }

  /**
   * Zwraca wszystkie zadania
   * @returns {Task[]} Lista zadań
   */
  getAllTasks() {
    return this.tasks;
  }

  /**
   * Zwraca przefiltrowane zadania
   * @returns {Task[]} Lista przefiltrowanych zadań
   */
  getFilteredTasks() {
    return this.filteredTasks;
  }

  /**
   * Czyści wszystkie zadania
   */
  clearAllTasks() {
    this.tasks = [];
    this.applyFiltersAndSort();
    this.saveTasks();
    this.notifyObservers("allTasksCleared");
  }
}

window.TaskManager = TaskManager;
