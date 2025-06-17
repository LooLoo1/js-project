/**
 * Klasa DragDrop obsługuje funkcjonalność przeciągania i upuszczania zadań
 * Umożliwia zmianę kolejności zadań poprzez drag & drop
 */
class DragDrop {
  constructor(taskManager, taskComponent) {
    this.taskManager = taskManager;
    this.taskComponent = taskComponent;
    this.draggedElement = null;
    this.draggedTaskId = null;
    this.placeholder = null;
    this.isDragging = false;

    this.init();
  }

  /**
   * Inicjalizuje obsługę drag & drop
   */
  init() {
    this.createPlaceholder();
    this.bindEvents();
  }

  /**
   * Tworzy element placeholder dla drag & drop
   */
  createPlaceholder() {
    this.placeholder = document.createElement("div");
    this.placeholder.className =
      "drag-placeholder bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg p-4 mb-3 opacity-50";
    this.placeholder.innerHTML =
      '<p class="text-blue-600 text-center">Upuść zadanie tutaj</p>';
    this.placeholder.style.display = "none";
  }

  /**
   * Wiąże zdarzenia drag & drop z kontenerem zadań
   */
  bindEvents() {
    const tasksContainer = document.getElementById("tasksList");

    if (tasksContainer) {
      // Zapobieganie domyślnemu zachowaniu dla drag & drop
      tasksContainer.addEventListener(
        "dragover",
        this.handleDragOver.bind(this)
      );
      tasksContainer.addEventListener("drop", this.handleDrop.bind(this));
      tasksContainer.addEventListener(
        "dragenter",
        this.handleDragEnter.bind(this)
      );
      tasksContainer.addEventListener(
        "dragleave",
        this.handleDragLeave.bind(this)
      );
    }
  }

  /**
   * Dodaje obsługę drag & drop do elementu zadania
   * @param {HTMLElement} taskElement - Element DOM zadania
   * @param {string} taskId - ID zadania
   */
  makeDraggable(taskElement, taskId) {
    taskElement.draggable = true;
    taskElement.dataset.taskId = taskId;

    taskElement.addEventListener("dragstart", (e) =>
      this.handleDragStart(e, taskId)
    );
    taskElement.addEventListener("dragend", this.handleDragEnd.bind(this));

    // Dodanie wizualnych wskazówek
    taskElement.style.cursor = "grab";

    taskElement.addEventListener("mousedown", () => {
      taskElement.style.cursor = "grabbing";
    });

    taskElement.addEventListener("mouseup", () => {
      taskElement.style.cursor = "grab";
    });
  }

  /**
   * Obsługuje rozpoczęcie przeciągania
   * @param {DragEvent} e - Zdarzenie drag
   * @param {string} taskId - ID zadania
   */
  handleDragStart(e, taskId) {
    this.isDragging = true;
    this.draggedElement = e.target.closest(".task-item");
    this.draggedTaskId = taskId;

    if (this.draggedElement) {
      this.draggedElement.classList.add("dragging");

      // Ustawienie danych dla drag & drop
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", this.draggedElement.outerHTML);
      e.dataTransfer.setData("text/plain", taskId);

      // Dodanie placeholder do kontenera
      const tasksContainer = document.getElementById("tasksList");
      if (tasksContainer && !tasksContainer.contains(this.placeholder)) {
        tasksContainer.appendChild(this.placeholder);
      }

      console.log("Rozpoczęto przeciąganie zadania:", taskId);
    }
  }

  /**
   * Obsługuje zakończenie przeciągania
   * @param {DragEvent} e - Zdarzenie drag
   */
  handleDragEnd(e) {
    this.isDragging = false;

    if (this.draggedElement) {
      this.draggedElement.classList.remove("dragging");
      this.draggedElement.style.cursor = "grab";
    }

    // Ukrycie placeholder
    if (this.placeholder) {
      this.placeholder.style.display = "none";
    }

    // Usunięcie klas drag-over z wszystkich elementów
    const allTaskItems = document.querySelectorAll(".task-item");
    allTaskItems.forEach((item) => {
      item.classList.remove("drag-over");
    });

    this.draggedElement = null;
    this.draggedTaskId = null;

    console.log("Zakończono przeciąganie");
  }

  /**
   * Obsługuje przeciąganie nad elementem
   * @param {DragEvent} e - Zdarzenie drag
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!this.isDragging || !this.draggedElement) {
      return;
    }

    const afterElement = this.getDragAfterElement(e.currentTarget, e.clientY);
    const tasksContainer = e.currentTarget;

    if (afterElement == null) {
      // Dodaj na koniec
      if (this.placeholder.style.display === "none") {
        this.placeholder.style.display = "block";
      }
      tasksContainer.appendChild(this.placeholder);
    } else {
      // Wstaw przed elementem
      if (this.placeholder.style.display === "none") {
        this.placeholder.style.display = "block";
      }
      tasksContainer.insertBefore(this.placeholder, afterElement);
    }
  }

  /**
   * Obsługuje wejście elementu przeciąganego
   * @param {DragEvent} e - Zdarzenie drag
   */
  handleDragEnter(e) {
    e.preventDefault();

    const taskItem = e.target.closest(".task-item");
    if (taskItem && taskItem !== this.draggedElement) {
      taskItem.classList.add("drag-over");
    }
  }

  /**
   * Obsługuje opuszczenie elementu przez przeciągany element
   * @param {DragEvent} e - Zdarzenie drag
   */
  handleDragLeave(e) {
    const taskItem = e.target.closest(".task-item");
    if (taskItem) {
      taskItem.classList.remove("drag-over");
    }
  }

  /**
   * Obsługuje upuszczenie elementu
   * @param {DragEvent} e - Zdarzenie drop
   */
  handleDrop(e) {
    e.preventDefault();

    if (!this.isDragging || !this.draggedTaskId) {
      return;
    }

    const tasksContainer = e.currentTarget;
    const afterElement = this.getDragAfterElement(tasksContainer, e.clientY);

    // Znajdź nową pozycję w tablicy zadań
    let newIndex = 0;
    const allTaskElements = Array.from(
      tasksContainer.querySelectorAll(".task-item:not(.dragging)")
    );

    if (afterElement) {
      const afterTaskId = afterElement.dataset.taskId;
      const afterTask = this.taskManager.getTaskById(afterTaskId);
      if (afterTask) {
        newIndex = this.taskManager.tasks.indexOf(afterTask);
      }
    } else {
      newIndex = this.taskManager.tasks.length;
    }

    // Przenieś zadanie w tablicy
    const success = this.taskManager.moveTask(this.draggedTaskId, newIndex);

    if (success) {
      console.log("Przeniesiono zadanie na pozycję:", newIndex);
      // Odśwież widok zadań
      this.taskComponent.renderTasks();

      // Pokaż animację sukcesu
      this.showDropSuccess();
    } else {
      console.error("Błąd podczas przenoszenia zadania");
      this.showDropError();
    }

    // Ukryj placeholder
    if (this.placeholder) {
      this.placeholder.style.display = "none";
    }
  }

  /**
   * Znajduje element, po którym należy wstawić przeciągany element
   * @param {HTMLElement} container - Kontener zadań
   * @param {number} y - Pozycja Y myszy
   * @returns {HTMLElement|null} Element, po którym wstawić
   */
  getDragAfterElement(container, y) {
    const draggableElements = Array.from(
      container.querySelectorAll(".task-item:not(.dragging)")
    );

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  /**
   * Pokazuje animację sukcesu po upuszczeniu
   */
  showDropSuccess() {
    const notification = this.createNotification(
      "Przeniesiono zadanie pomyślnie",
      "success"
    );
    this.showNotification(notification);
  }

  /**
   * Pokazuje animację błędu po upuszczeniu
   */
  showDropError() {
    const notification = this.createNotification(
      "Błąd podczas przenoszenia zadania",
      "error"
    );
    this.showNotification(notification);
  }

  /**
   * Tworzy element powiadomienia
   * @param {string} message - Wiadomość
   * @param {string} type - Typ ('success', 'error', 'info')
   * @returns {HTMLElement} Element powiadomienia
   */
  createNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`;

    const colors = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      info: "bg-blue-500 text-white",
    };

    notification.className += ` ${colors[type] || colors.info}`;
    notification.textContent = message;

    return notification;
  }

  /**
   * Pokazuje powiadomienie
   * @param {HTMLElement} notification - Element powiadomienia
   */
  showNotification(notification) {
    document.body.appendChild(notification);

    // Animacja pojawienia się
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

    // Automatyczne ukrycie po 3 sekundach
    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Wyłącza drag & drop dla wszystkich zadań
   */
  disableDragDrop() {
    const allTaskItems = document.querySelectorAll(".task-item");
    allTaskItems.forEach((item) => {
      item.draggable = false;
      item.style.cursor = "default";
    });
  }

  /**
   * Włącza drag & drop dla wszystkich zadań
   */
  enableDragDrop() {
    const allTaskItems = document.querySelectorAll(".task-item");
    allTaskItems.forEach((item) => {
      const taskId = item.dataset.taskId;
      if (taskId) {
        this.makeDraggable(item, taskId);
      }
    });
  }

  /**
   * Sprawdza czy urządzenie obsługuje touch (mobilne)
   * @returns {boolean} True jeśli urządzenie obsługuje touch
   */
  isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Niszczy instancję drag & drop i usuwa event listenery
   */
  destroy() {
    const tasksContainer = document.getElementById("tasksList");

    if (tasksContainer) {
      tasksContainer.removeEventListener("dragover", this.handleDragOver);
      tasksContainer.removeEventListener("drop", this.handleDrop);
      tasksContainer.removeEventListener("dragenter", this.handleDragEnter);
      tasksContainer.removeEventListener("dragleave", this.handleDragLeave);
    }

    this.disableDragDrop();

    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }
  }
}

// Eksportuj klasę do globalnego scope
window.DragDrop = DragDrop;
window.DragDrop = DragDrop;
