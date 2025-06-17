/**
 * Klasa Task reprezentuje pojedyncze zadanie w aplikacji
 * Zawiera wszystkie właściwości i metody związane z zadaniem
 */
class Task {
  constructor(content, userId, priority = "medium", category = "osobiste") {
    this.id = this.generateId();
    this.content = content;
    this.userId = userId;
    this.status = "pending"; // 'pending' lub 'done'
    this.priority = priority; // 'low', 'medium', 'high'
    this.category = category; // 'praca', 'nauka', 'hobby', 'osobiste'
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.completedAt = null;
  }

  /**
   * Generuje unikalny identyfikator dla zadania
   * @returns {string} Unikalny ID
   */
  generateId() {
    return "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Oznacza zadanie jako ukończone
   */
  markAsCompleted() {
    this.status = "done";
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Oznacza zadanie jako oczekujące
   */
  markAsPending() {
    this.status = "pending";
    this.completedAt = null;
    this.updatedAt = new Date();
  }

  /**
   * Przełącza status zadania
   */
  toggleStatus() {
    if (this.status === "pending") {
      this.markAsCompleted();
    } else {
      this.markAsPending();
    }
  }

  /**
   * Aktualizuje treść zadania
   * @param {string} newContent - Nowa treść zadania
   */
  updateContent(newContent) {
    if (newContent && newContent.trim() !== "") {
      this.content = newContent.trim();
      this.updatedAt = new Date();
    }
  }

  /**
   * Aktualizuje priorytet zadania
   * @param {string} newPriority - Nowy priorytet ('low', 'medium', 'high')
   */
  updatePriority(newPriority) {
    const validPriorities = ["low", "medium", "high"];
    if (validPriorities.includes(newPriority)) {
      this.priority = newPriority;
      this.updatedAt = new Date();
    }
  }

  /**
   * Aktualizuje kategorię zadania
   * @param {string} newCategory - Nowa kategoria
   */
  updateCategory(newCategory) {
    const validCategories = ["praca", "nauka", "hobby", "osobiste"];
    if (validCategories.includes(newCategory)) {
      this.category = newCategory;
      this.updatedAt = new Date();
    }
  }

  /**
   * Zwraca czytelną nazwę priorytetu
   * @returns {string} Nazwa priorytetu po polsku
   */
  getPriorityLabel() {
    const priorityLabels = {
      low: "Niski",
      medium: "Średni",
      high: "Wysoki",
    };
    return priorityLabels[this.priority] || "Średni";
  }

  /**
   * Zwraca czytelną nazwę kategorii
   * @returns {string} Nazwa kategorii po polsku
   */
  getCategoryLabel() {
    const categoryLabels = {
      praca: "Praca",
      nauka: "Nauka",
      hobby: "Hobby",
      osobiste: "Osobiste",
    };
    return categoryLabels[this.category] || "Osobiste";
  }

  /**
   * Zwraca czytelną nazwę statusu
   * @returns {string} Nazwa statusu po polsku
   */
  getStatusLabel() {
    return this.status === "done" ? "Ukończone" : "Oczekujące";
  }

  /**
   * Zwraca sformatowaną datę utworzenia
   * @returns {string} Sformatowana data
   */
  getFormattedCreatedDate() {
    return this.createdAt.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Zwraca sformatowaną datę ukończenia (jeśli istnieje)
   * @returns {string|null} Sformatowana data lub null
   */
  getFormattedCompletedDate() {
    if (this.completedAt) {
      return this.completedAt.toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return null;
  }

  /**
   * Zwraca liczbę priorytetową dla sortowania
   * @returns {number} Wartość numeryczna priorytetu
   */
  getPriorityValue() {
    const priorityValues = {
      high: 3,
      medium: 2,
      low: 1,
    };
    return priorityValues[this.priority] || 2;
  }

  /**
   * Sprawdza czy zadanie spełnia kryteria filtrowania
   * @param {Object} filters - Obiekt z filtrami
   * @returns {boolean} True jeśli zadanie spełnia kryteria
   */
  matchesFilters(filters) {
    // Filtr użytkownika
    if (filters.userId && this.userId !== filters.userId) {
      return false;
    }

    // Filtr statusu
    if (filters.status && this.status !== filters.status) {
      return false;
    }

    // Filtr kategorii
    if (filters.category && this.category !== filters.category) {
      return false;
    }

    // Filtr priorytetów
    if (filters.priority && this.priority !== filters.priority) {
      return false;
    }

    // Filtr tekstowy (wyszukiwanie w treści)
    if (filters.searchText) {
      const searchText = filters.searchText.toLowerCase();
      if (!this.content.toLowerCase().includes(searchText)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Konwertuje zadanie do obiektu JSON
   * @returns {Object} Obiekt JSON reprezentujący zadanie
   */
  toJSON() {
    return {
      id: this.id,
      content: this.content,
      userId: this.userId,
      status: this.status,
      priority: this.priority,
      category: this.category,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    };
  }

  /**
   * Tworzy zadanie z obiektu JSON
   * @param {Object} jsonData - Dane JSON
   * @returns {Task} Nowe zadanie
   */
  static fromJSON(jsonData) {
    const task = new Task(
      jsonData.content,
      jsonData.userId,
      jsonData.priority,
      jsonData.category
    );
    task.id = jsonData.id;
    task.status = jsonData.status;
    task.createdAt = new Date(jsonData.createdAt);
    task.updatedAt = new Date(jsonData.updatedAt);
    if (jsonData.completedAt) {
      task.completedAt = new Date(jsonData.completedAt);
    }
    return task;
  }

  /**
   * Sprawdza czy zadanie jest przeterminowane (dla przyszłych funkcjonalności)
   * @param {Date} dueDate - Data wykonania
   * @returns {boolean} True jeśli przeterminowane
   */
  isOverdue(dueDate) {
    if (!dueDate || this.status === "done") {
      return false;
    }
    return new Date() > new Date(dueDate);
  }

  /**
   * Klonuje zadanie (przydatne przy edycji)
   * @returns {Task} Sklonowane zadanie
   */
  clone() {
    return Task.fromJSON(this.toJSON());
  }
}

window.Task = Task;
