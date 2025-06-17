/**
 * Klasa TaskComponent odpowiada za renderowanie i obsługę zadań w interfejsie
 * Zarządza wyświetlaniem listy zadań, formularzami i interakcjami użytkownika
 */
class TaskComponent {
  constructor(taskManager, userManager, dragDrop) {
    this.taskManager = taskManager;
    this.userManager = userManager;
    this.dragDrop = dragDrop;
    this.isEditModalOpen = false;
    this.currentEditingTaskId = null;

    this.initializeElements();
    this.bindEvents();
    this.subscribeToEvents();
  }

  /**
   * Inicjalizuje elementy DOM
   */
  initializeElements() {
    // Główne elementy
    this.tasksContainer = document.getElementById("tasksList");
    this.emptyState = document.getElementById("emptyState");
    this.taskCount = document.getElementById("taskCount");

    // Formularz dodawania zadania
    this.taskForm = document.getElementById("taskForm");
    this.taskContentInput = document.getElementById("taskContent");
    this.taskUserSelect = document.getElementById("taskUser");
    this.taskPrioritySelect = document.getElementById("taskPriority");
    this.taskCategorySelect = document.getElementById("taskCategory");

    // Filtry
    this.filterUserSelect = document.getElementById("filterUser");
    this.filterStatusSelect = document.getElementById("filterStatus");
    this.filterCategorySelect = document.getElementById("filterCategory");
    this.sortBySelect = document.getElementById("sortBy");

    // Modal edycji
    this.editModal = document.getElementById("editModal");
    this.editForm = document.getElementById("editForm");
    this.editTaskIdInput = document.getElementById("editTaskId");
    this.editTaskContentInput = document.getElementById("editTaskContent");
    this.editTaskPrioritySelect = document.getElementById("editTaskPriority");
    this.editTaskCategorySelect = document.getElementById("editTaskCategory");
    this.cancelEditBtn = document.getElementById("cancelEdit");
  }

  /**
   * Wiąże zdarzenia z elementami DOM
   */
  bindEvents() {
    // Formularz dodawania zadania
    if (this.taskForm) {
      this.taskForm.addEventListener("submit", this.handleAddTask.bind(this));
    }

    // Filtry i sortowanie
    if (this.filterUserSelect) {
      this.filterUserSelect.addEventListener(
        "change",
        this.handleFilterChange.bind(this)
      );
    }
    if (this.filterStatusSelect) {
      this.filterStatusSelect.addEventListener(
        "change",
        this.handleFilterChange.bind(this)
      );
    }
    if (this.filterCategorySelect) {
      this.filterCategorySelect.addEventListener(
        "change",
        this.handleFilterChange.bind(this)
      );
    }
    if (this.sortBySelect) {
      this.sortBySelect.addEventListener(
        "change",
        this.handleSortChange.bind(this)
      );
    }

    // Modal edycji
    if (this.editForm) {
      this.editForm.addEventListener("submit", this.handleEditTask.bind(this));
    }
    if (this.cancelEditBtn) {
      this.cancelEditBtn.addEventListener(
        "click",
        this.closeEditModal.bind(this)
      );
    }
    if (this.editModal) {
      this.editModal.addEventListener(
        "click",
        this.handleModalClick.bind(this)
      );
    }

    // Klawisze ESC do zamykania modala
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isEditModalOpen) {
        this.closeEditModal();
      }
    });
  }

  /**
   * Subskrybuje zdarzenia z managerów
   */
  subscribeToEvents() {
    // Nasłuchuj zmian w zadaniach
    this.taskManager.addObserver((event, data) => {
      switch (event) {
        case "taskAdded":
        case "taskDeleted":
        case "taskUpdated":
        case "taskStatusToggled":
        case "taskMoved":
        case "filtersChanged":
        case "sortChanged":
          this.renderTasks();
          break;
        case "tasksLoaded":
          this.renderTasks();
          this.updateUserSelects();
          break;
      }
    });

    // Nasłuchuj zmian w użytkownikach
    this.userManager.addObserver((event, data) => {
      switch (event) {
        case "userAdded":
        case "userDeleted":
        case "usersLoaded":
          this.updateUserSelects();
          this.renderTasks();
          break;
        case "activeUserChanged":
          this.updateActiveUserInForm();
          this.updateUserSelects();
          this.renderTasks();
          break;
      }
    });
  }

  /**
   * Obsługuje dodawanie nowego zadania
   * @param {Event} e - Zdarzenie submit
   */
  handleAddTask(e) {
    e.preventDefault();

    const content = this.taskContentInput.value.trim();
    const userId = this.taskUserSelect.value;
    const priority = this.taskPrioritySelect.value;
    const category = this.taskCategorySelect.value;

    if (!content) {
      this.showError("Treść zadania nie może być pusta");
      return;
    }

    if (!userId) {
      this.showError("Wybierz użytkownika");
      return;
    }

    const task = this.taskManager.addTask(content, userId, priority, category);

    if (task) {
      this.taskForm.reset();
      this.taskPrioritySelect.value = "medium"; // Reset do wartości domyślnej
      this.taskCategorySelect.value = "osobiste";
      this.showSuccess("Zadanie zostało dodane pomyślnie");

      // Przewiń do nowo dodanego zadania
      setTimeout(() => {
        this.scrollToTask(task.id);
      }, 300);
    } else {
      this.showError("Błąd podczas dodawania zadania");
    }
  }

  /**
   * Obsługuje zmiany filtrów
   */
  handleFilterChange() {
    const filters = {
      userId: this.filterUserSelect.value || null,
      status: this.filterStatusSelect.value || null,
      category: this.filterCategorySelect.value || null,
    };

    this.taskManager.setFilters(filters);
  }

  /**
   * Obsługuje zmianę sortowania
   */
  handleSortChange() {
    const sortBy = this.sortBySelect.value;
    this.taskManager.setSortBy(sortBy);
  }

  /**
   * Renderuje listę zadań
   */
  renderTasks() {
    if (!this.tasksContainer) return;

    const tasks = this.taskManager.getFilteredTasks();

    // Aktualizuj licznik zadań
    this.updateTaskCount(tasks.length);

    // Wyczyść kontener
    this.tasksContainer.innerHTML = "";

    if (tasks.length === 0) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();

    // Renderuj każde zadanie
    tasks.forEach((task) => {
      const taskElement = this.createTaskElement(task);
      this.tasksContainer.appendChild(taskElement);

      // Dodaj obsługę drag & drop
      if (this.dragDrop) {
        this.dragDrop.makeDraggable(taskElement, task.id);
      }
    });

    // Dodaj animację fade-in
    this.tasksContainer.classList.add("animate-fade-in");
    setTimeout(() => {
      this.tasksContainer.classList.remove("animate-fade-in");
    }, 300);
  }

  /**
   * Tworzy element DOM dla zadania
   * @param {Task} task - Zadanie
   * @returns {HTMLElement} Element DOM zadania
   */
  createTaskElement(task) {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task-item bg-white rounded-lg p-4 shadow-sm border-l-4 transition-all duration-200 hover:shadow-md`;
    taskDiv.dataset.taskId = task.id;

    // Dodaj klasy CSS na podstawie priorytetu
    taskDiv.classList.add(`task-priority-${task.priority}`);

    // Dodaj klasę dla ukończonych zadań
    if (task.status === "done") {
      taskDiv.classList.add("completed");
    }

    const user = this.userManager.getUserById(task.userId);
    const userName = user ? user.name : "Nieznany użytkownik";

    taskDiv.innerHTML = `
          <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 flex-1">
                  <input type="checkbox" 
                         ${task.status === "done" ? "checked" : ""} 
                         class="custom-checkbox mt-1 flex-shrink-0"
                         onchange="taskComponent.toggleTaskStatus('${
                           task.id
                         }')">
                  
                  <div class="flex-1 min-w-0">
                      <p class="task-content text-gray-800 font-medium break-words ${
                        task.status === "done"
                          ? "line-through text-gray-500"
                          : ""
                      }">${this.escapeHtml(task.content)}</p>
                      
                      <div class="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ${userName}
                          </span>
                          
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getPriorityColorClasses(
                            task.priority
                          )}">
                              ${task.getPriorityLabel()}
                          </span>
                          
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              ${task.getCategoryLabel()}
                          </span>
                          
                          <span class="text-xs text-gray-500">
                              ${task.getFormattedCreatedDate()}
                          </span>
                          
                          ${
                            task.status === "done" && task.completedAt
                              ? `
                              <span class="text-xs text-green-600">
                                  Ukończono: ${task.getFormattedCompletedDate()}
                              </span>
                          `
                              : ""
                          }
                      </div>
                  </div>
              </div>
              
              <div class="flex items-center gap-2 flex-shrink-0">
                  <button onclick="taskComponent.openEditModal('${task.id}')" 
                          class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                          data-tooltip="Edytuj zadanie"
                          aria-label="Edytuj zadanie">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                  </button>
                  
                  <button onclick="taskComponent.deleteTask('${task.id}')" 
                          class="delete-btn p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                          data-tooltip="Usuń zadanie"
                          aria-label="Usuń zadanie">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                  </button>
              </div>
          </div>
      `;

    return taskDiv;
  }

  /**
   * Zwraca klasy CSS dla kolorów priorytetów
   * @param {string} priority - Priorytet zadania
   * @returns {string} Klasy CSS
   */
  getPriorityColorClasses(priority) {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  /**
   * Przełącza status zadania
   * @param {string} taskId - ID zadania
   */
  toggleTaskStatus(taskId) {
    const success = this.taskManager.toggleTaskStatus(taskId);
    if (success) {
      const task = this.taskManager.getTaskById(taskId);
      if (task) {
        const message =
          task.status === "done"
            ? "Zadanie zostało ukończone"
            : "Zadanie zostało oznaczone jako oczekujące";
        this.showSuccess(message);
      }
    } else {
      this.showError("Błąd podczas zmiany statusu zadania");
    }
  }

  /**
   * Usuwa zadanie
   * @param {string} taskId - ID zadania
   */
  deleteTask(taskId) {
    const task = this.taskManager.getTaskById(taskId);
    if (!task) {
      this.showError("Zadanie nie zostało znalezione");
      return;
    }

    if (confirm(`Czy na pewno chcesz usunąć zadanie "${task.content}"?`)) {
      const success = this.taskManager.deleteTask(taskId);
      if (success) {
        this.showSuccess("Zadanie zostało usunięte");
      } else {
        this.showError("Błąd podczas usuwania zadania");
      }
    }
  }

  /**
   * Otwiera modal edycji zadania
   * @param {string} taskId - ID zadania
   */
  openEditModal(taskId) {
    const task = this.taskManager.getTaskById(taskId);
    if (!task) {
      this.showError("Zadanie nie zostało znalezione");
      return;
    }

    this.currentEditingTaskId = taskId;

    // Wypełnij formularz edycji
    this.editTaskIdInput.value = taskId;
    this.editTaskContentInput.value = task.content;
    this.editTaskPrioritySelect.value = task.priority;
    this.editTaskCategorySelect.value = task.category;

    // Pokaż modal
    this.editModal.classList.remove("hidden");
    this.editModal.classList.add("flex");
    this.isEditModalOpen = true;

    // Focus na polu treści
    setTimeout(() => {
      this.editTaskContentInput.focus();
      this.editTaskContentInput.select();
    }, 100);

    // Dodaj animację
    setTimeout(() => {
      this.editModal
        .querySelector(".bg-white")
        .classList.add("animate-fade-in");
    }, 50);
  }

  /**
   * Zamyka modal edycji
   */
  closeEditModal() {
    this.editModal.classList.add("hidden");
    this.editModal.classList.remove("flex");
    this.isEditModalOpen = false;
    this.currentEditingTaskId = null;
    this.editForm.reset();
  }

  /**
   * Obsługuje kliknięcie w modal (zamknięcie przy kliknięciu w tło)
   * @param {Event} e - Zdarzenie click
   */
  handleModalClick(e) {
    if (e.target === this.editModal) {
      this.closeEditModal();
    }
  }

  /**
   * Obsługuje edycję zadania
   * @param {Event} e - Zdarzenie submit
   */
  handleEditTask(e) {
    e.preventDefault();

    if (!this.currentEditingTaskId) {
      this.showError("Błąd: Brak ID zadania do edycji");
      return;
    }

    const content = this.editTaskContentInput.value.trim();
    const priority = this.editTaskPrioritySelect.value;
    const category = this.editTaskCategorySelect.value;

    if (!content) {
      this.showError("Treść zadania nie może być pusta");
      return;
    }

    const updates = {
      content: content,
      priority: priority,
      category: category,
    };

    const success = this.taskManager.updateTask(
      this.currentEditingTaskId,
      updates
    );

    if (success) {
      this.closeEditModal();
      this.showSuccess("Zadanie zostało zaktualizowane");
    } else {
      this.showError("Błąd podczas aktualizacji zadania");
    }
  }

  /**
   * Aktualizuje selektory użytkowników
   */
  updateUserSelects() {
    console.log("TaskComponent.updateUserSelects called.");
    const users = this.userManager.getAllUsers();
    console.log("TaskComponent.updateUserSelects: Users from UserManager:", users);

    // Aktualizuj selektor w formularzu dodawania
    if (this.taskUserSelect) {
      const currentValue = this.taskUserSelect.value;
      console.log("TaskComponent.updateUserSelects: Task User Select - Current value:", currentValue);
      this.taskUserSelect.innerHTML =
        '<option value="">Wybierz użytkownika</option>';

      users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;
        if (user.id === currentValue) {
          option.selected = true;
        }
        this.taskUserSelect.appendChild(option);
      });
    }

    // Aktualizuj selektor w filtrach
    if (this.filterUserSelect) {
      const currentValue = this.filterUserSelect.value;
      console.log("TaskComponent.updateUserSelects: Filter User Select - Current value:", currentValue);
      this.filterUserSelect.innerHTML =
        '<option value="">Wszyscy użytkownicy</option>';

      users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;
        if (user.id === currentValue) {
          option.selected = true;
        }
        this.filterUserSelect.appendChild(option);
      });
    }
  }

  /**
   * Aktualizuje aktywnego użytkownika w formularzu
   */
  updateActiveUserInForm() {
    const activeUser = this.userManager.getActiveUser();
    console.log("TaskComponent.updateActiveUserInForm: Active user:", activeUser);
    if (activeUser && this.taskUserSelect) {
      this.taskUserSelect.value = activeUser.id;
    }
  }

  /**
   * Aktualizuje licznik zadań
   * @param {number} count - Liczba zadań
   */
  updateTaskCount(count) {
    if (this.taskCount) {
      const text =
        count === 1
          ? "1 zadanie"
          : count < 5
          ? `${count} zadania`
          : `${count} zadań`;
      this.taskCount.textContent = text;
    }
  }

  /**
   * Pokazuje stan pusty (brak zadań)
   */
  showEmptyState() {
    if (this.emptyState) {
      this.emptyState.classList.remove("hidden");
    }
  }

  /**
   * Ukrywa stan pusty
   */
  hideEmptyState() {
    if (this.emptyState) {
      this.emptyState.classList.add("hidden");
    }
  }

  /**
   * Przewija do zadania
   * @param {string} taskId - ID zadania
   */
  scrollToTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
      taskElement.classList.add("animate-bounce-hover");
      setTimeout(() => {
        taskElement.classList.remove("animate-bounce-hover");
      }, 600);
    }
  }

  /**
   * Escapuje HTML w tekście
   * @param {string} text - Tekst do escapowania
   * @returns {string} Escapowany tekst
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Pokazuje komunikat sukcesu
   * @param {string} message - Wiadomość
   */
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  /**
   * Pokazuje komunikat błędu
   * @param {string} message - Wiadomość
   */
  showError(message) {
    this.showNotification(message, "error");
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
      // Fallback alert
      alert(message);
    }
  }

  /**
   * Czyści wszystkie zadania (z potwierdzeniem)
   */
  clearAllTasks() {
    const count = this.taskManager.getAllTasks().length;
    if (count === 0) {
      this.showError("Brak zadań do usunięcia");
      return;
    }

    if (confirm(`Czy na pewno chcesz usunąć wszystkie zadania (${count})?`)) {
      const success = this.taskManager.clearAllTasks();
      if (success) {
        this.showSuccess("Wszystkie zadania zostały usunięte");
      } else {
        this.showError("Błąd podczas usuwania zadań");
      }
    }
  }

  /**
   * Eksportuje zadania do pliku JSON
   */
  exportTasks() {
    try {
      const jsonData = this.taskManager.exportTasks();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `zadania_${new Date().toISOString().split("T")[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.showSuccess("Zadania zostały wyeksportowane");
    } catch (error) {
      console.error("Błąd podczas eksportu:", error);
      this.showError("Błąd podczas eksportu zadań");
    }
  }

  /**
   * Importuje zadania z pliku JSON
   * @param {File} file - Plik do importu
   */
  async importTasks(file) {
    try {
      const text = await file.text();
      const success = this.taskManager.importTasks(text);

      if (success) {
        this.showSuccess("Zadania zostały zaimportowane");
      } else {
        this.showError("Błąd podczas importu zadań");
      }
    } catch (error) {
      console.error("Błąd podczas importu:", error);
      this.showError("Błąd podczas importu zadań");
    }
  }
}

// Eksportuj klasę do globalnego scope
window.TaskComponent = TaskComponent;
