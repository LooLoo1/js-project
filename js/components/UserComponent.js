/**
 * Klasa UserComponent odpowiada za renderowanie i obsługę użytkowników w interfejsie
 * Zarządza wyświetlaniem listy użytkowników, formularzami i selekcją aktywnego użytkownika
 */
class UserComponent {
  constructor(userManager, taskManager) {
    this.userManager = userManager;
    this.taskManager = taskManager;

    this.initializeElements();
    this.bindEvents();
    this.subscribeToEvents();
  }

  /**
   * Inicjalizuje elementy DOM
   */
  initializeElements() {
    // Główne elementy
    this.usersContainer = document.getElementById("usersList");
    this.newUserInput = document.getElementById("newUserInput");
    this.addUserBtn = document.getElementById("addUserBtn");
  }

  /**
   * Wiąże zdarzenia z elementami DOM
   */
  bindEvents() {
    // Przycisk dodawania użytkownika
    if (this.addUserBtn) {
      this.addUserBtn.addEventListener("click", this.handleAddUser.bind(this));
    }

    // Enter w polu input dla dodawania użytkownika
    if (this.newUserInput) {
      this.newUserInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.handleAddUser();
        }
      });

      // Walidacja w czasie rzeczywistym
      this.newUserInput.addEventListener(
        "input",
        this.handleInputValidation.bind(this)
      );
    }
  }

  /**
   * Subskrybuje zdarzenia z managerów
   */
  subscribeToEvents() {
    // Nasłuchuj zmian w użytkownikach
    this.userManager.addObserver((event, data) => {
      switch (event) {
        case "userAdded":
        case "userDeleted":
        case "userUpdated":
        case "usersLoaded":
        case "activeUserChanged":
        case "activeUserCleared":
          this.renderUsers();
          break;
      }
    });

    // Nasłuchuj zmian w zadaniach (dla aktualizacji statystyk)
    this.taskManager.addObserver((event, data) => {
      if (
        [
          "taskAdded",
          "taskDeleted",
          "taskStatusToggled",
          "userTasksDeleted",
        ].includes(event)
      ) {
        // Opóźnij renderowanie, aby statystyki zdążyły się zaktualizować
        setTimeout(() => {
          this.renderUsers();
        }, 100);
      }
    });
  }

  /**
   * Obsługuje dodawanie nowego użytkownika
   */
  handleAddUser() {
    const name = this.newUserInput.value.trim();

    if (!name) {
      this.showError("Nazwa użytkownika nie może być pusta");
      this.newUserInput.focus();
      return;
    }

    if (!User.isValidName(name)) {
      this.showError(
        "Nieprawidłowa nazwa użytkownika. Nazwa musi mieć 2-50 znaków i zawierać tylko litery."
      );
      this.newUserInput.focus();
      return;
    }

    // Sprawdź czy użytkownik już istnieje
    if (this.userManager.getUserByName(name)) {
      this.showError("Użytkownik o takiej nazwie już istnieje");
      this.newUserInput.focus();
      this.newUserInput.select();
      return;
    }

    const user = this.userManager.addUser(name);

    if (user) {
      this.newUserInput.value = "";
      this.showSuccess(`Użytkownik "${user.name}" został dodany`);

      // Automatycznie ustaw jako aktywnego jeśli to pierwszy użytkownik
      if (this.userManager.getAllUsers().length === 1) {
        this.userManager.setActiveUser(user.id);
      }
    } else {
      this.showError("Błąd podczas dodawania użytkownika");
    }
  }

  /**
   * Obsługuje walidację input w czasie rzeczywistym
   */
  handleInputValidation() {
    const name = this.newUserInput.value.trim();
    const isValid = name.length >= 2 && User.isValidName(name);

    // Aktualizuj style input
    if (name.length > 0) {
      if (isValid) {
        this.newUserInput.classList.remove(
          "border-red-300",
          "focus:ring-red-500"
        );
        this.newUserInput.classList.add(
          "border-green-300",
          "focus:ring-green-500"
        );
      } else {
        this.newUserInput.classList.remove(
          "border-green-300",
          "focus:ring-green-500"
        );
        this.newUserInput.classList.add("border-red-300", "focus:ring-red-500");
      }
    } else {
      this.newUserInput.classList.remove(
        "border-red-300",
        "focus:ring-red-500",
        "border-green-300",
        "focus:ring-green-500"
      );
    }

    // Aktualizuj stan przycisku
    if (this.addUserBtn) {
      this.addUserBtn.disabled = !isValid || name.length === 0;
      if (this.addUserBtn.disabled) {
        this.addUserBtn.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        this.addUserBtn.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }
  }

  /**
   * Renderuje listę użytkowników
   */
  renderUsers() {
    if (!this.usersContainer) return;

    const users = this.userManager.getAllUsers();

    // Wyczyść kontener
    this.usersContainer.innerHTML = "";

    if (users.length === 0) {
      this.showEmptyUsersState();
      return;
    }

    // Renderuj każdego użytkownika
    users.forEach((user) => {
      const userElement = this.createUserElement(user);
      this.usersContainer.appendChild(userElement);
    });

    // Dodaj animację fade-in
    this.usersContainer.classList.add("animate-fade-in");
    setTimeout(() => {
      this.usersContainer.classList.remove("animate-fade-in");
    }, 300);
  }

  /**
   * Tworzy element DOM dla użytkownika
   * @param {User} user - Użytkownik
   * @returns {HTMLElement} Element DOM użytkownika
   */
  createUserElement(user) {
    const userDiv = document.createElement("div");
    userDiv.className = `user-badge relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 ${user.getBadgeColor()}`;
    userDiv.dataset.userId = user.id;

    // Dodaj klasę active jeśli to aktywny użytkownik
    if (user.isActive) {
      userDiv.classList.add("active", "ring-2", "ring-blue-300");
    }

    const stats = user.getStats();

    userDiv.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xs font-bold">
                    ${user.getInitials()}
                </div>
                <span class="font-medium">${this.escapeHtml(user.name)}</span>
                ${
                  stats.totalTasks > 0
                    ? `
                    <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                        ${stats.completedTasks}/${stats.totalTasks}
                    </span>
                `
                    : ""
                }
            </div>
            
            <!-- Tooltip z dodatkowymi informacjami -->
            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none transition-opacity duration-200 z-20 whitespace-nowrap user-tooltip">
                <div class="text-center">
                    <div class="font-semibold">${this.escapeHtml(
                      user.name
                    )}</div>
                    <div class="mt-1">
                        <div>Zadania: ${stats.totalTasks}</div>
                        <div>Ukończone: ${stats.completedTasks}</div>
                        <div>Postęp: ${stats.completionPercentage}%</div>
                        <div class="text-xs opacity-75 mt-1">${
                          stats.productivityStatus
                        }</div>
                    </div>
                    ${
                      user.isActive
                        ? '<div class="text-xs text-blue-300 mt-1">Aktywny użytkownik</div>'
                        : ""
                    }
                </div>
                <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
            </div>

            <!-- Menu kontekstowe -->
            <div class="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border opacity-0 pointer-events-none transition-opacity duration-200 z-30 user-menu min-w-48">
                <div class="py-1">
                    ${
                      !user.isActive
                        ? `
                        <button onclick="userComponent.setActiveUser('${user.id}')" 
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Ustaw jako aktywny
                        </button>
                    `
                        : `
                        <div class="px-4 py-2 text-sm text-green-600 flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Aktywny użytkownik
                        </div>
                    `
                    }
                    
                    <button onclick="userComponent.editUser('${user.id}')" 
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edytuj nazwę
                    </button>
                    
                    <button onclick="userComponent.showUserStats('${user.id}')" 
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Pokaż statystyki
                    </button>
                    
                    <hr class="my-1">
                    
                    <button onclick="userComponent.deleteUser('${user.id}')" 
                            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Usuń użytkownika
                    </button>
                </div>
            </div>
        `;

    // Dodaj event listenery
    this.addUserEventListeners(userDiv, user);

    return userDiv;
  }

  /**
   * Dodaje event listenery do elementu użytkownika
   * @param {HTMLElement} userElement - Element użytkownika
   * @param {User} user - Użytkownik
   */
  addUserEventListeners(userElement, user) {
    // Kliknięcie - ustawienie jako aktywny
    userElement.addEventListener("click", (e) => {
      if (!e.target.closest(".user-menu")) {
        this.setActiveUser(user.id);
      }
    });

    // Hover - pokaż tooltip
    userElement.addEventListener("mouseenter", () => {
      const tooltip = userElement.querySelector(".user-tooltip");
      if (tooltip) {
        tooltip.classList.remove("opacity-0");
        tooltip.classList.add("opacity-100");
      }
    });

    userElement.addEventListener("mouseleave", () => {
      const tooltip = userElement.querySelector(".user-tooltip");
      if (tooltip) {
        tooltip.classList.remove("opacity-100");
        tooltip.classList.add("opacity-0");
      }
    });

    // Prawy przycisk myszy - pokaż menu kontekstowe
    userElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showUserContextMenu(userElement, e);
    });

    // Kliknięcie podwójne - edytuj nazwę
    userElement.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.editUser(user.id);
    });
  }

  /**
   * Pokazuje menu kontekstowe użytkownika
   * @param {HTMLElement} userElement - Element użytkownika
   * @param {Event} e - Zdarzenie
   */
  showUserContextMenu(userElement, e) {
    // Ukryj wszystkie inne menu
    document.querySelectorAll(".user-menu").forEach((menu) => {
      menu.classList.add("opacity-0", "pointer-events-none");
    });

    const menu = userElement.querySelector(".user-menu");
    if (menu) {
      menu.classList.remove("opacity-0", "pointer-events-none");

      // Zamknij menu po kliknięciu gdzie indziej
      setTimeout(() => {
        const closeMenu = (event) => {
          if (!menu.contains(event.target)) {
            menu.classList.add("opacity-0", "pointer-events-none");
            document.removeEventListener("click", closeMenu);
          }
        };
        document.addEventListener("click", closeMenu);
      }, 100);
    }
  }

  /**
   * Pokazuje stan pusty (brak użytkowników)
   */
  showEmptyUsersState() {
    if (this.usersContainer) {
      this.usersContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p class="text-sm">Brak użytkowników</p>
                    <p class="text-xs">Dodaj pierwszego użytkownika powyżej</p>
                </div>
            `;
    }
  }

  /**
   * Ustawia aktywnego użytkownika
   * @param {string} userId - ID użytkownika
   */
  setActiveUser(userId) {
    const success = this.userManager.setActiveUser(userId);
    if (success) {
      const user = this.userManager.getUserById(userId);
      if (user) {
        this.showSuccess(`Ustawiono aktywnego użytkownika: ${user.name}`);
      }
    } else {
      this.showError("Błąd podczas ustawiania aktywnego użytkownika");
    }
  }

  /**
   * Edytuje użytkownika
   * @param {string} userId - ID użytkownika
   */
  editUser(userId) {
    const user = this.userManager.getUserById(userId);
    if (!user) {
      this.showError("Użytkownik nie został znaleziony");
      return;
    }

    const newName = prompt("Podaj nową nazwę użytkownika:", user.name);
    if (newName === null) {
      return; // Anulowano
    }

    if (!newName.trim()) {
      this.showError("Nazwa użytkownika nie może być pusta");
      return;
    }

    if (!User.isValidName(newName)) {
      this.showError(
        "Nieprawidłowa nazwa użytkownika. Nazwa musi mieć 2-50 znaków i zawierać tylko litery."
      );
      return;
    }

    const success = this.userManager.updateUser(userId, {
      name: newName.trim(),
    });
    if (success) {
      this.showSuccess(
        `Nazwa użytkownika została zmieniona na: ${newName.trim()}`
      );
    } else {
      this.showError("Błąd podczas aktualizacji użytkownika");
    }
  }

  /**
   * Usuwa użytkownika
   * @param {string} userId - ID użytkownika
   */
  deleteUser(userId) {
    const user = this.userManager.getUserById(userId);
    if (!user) {
      this.showError("Użytkownik nie został znaleziony");
      return;
    }

    const userTasks = this.taskManager.getTasksByUser(userId);
    let confirmMessage = `Czy na pewno chcesz usunąć użytkownika "${user.name}"?`;

    if (userTasks.length > 0) {
      confirmMessage += `\n\nUwaga: Użytkownik ma ${userTasks.length} zadań. Czy chcesz je również usunąć?`;

      if (confirm(confirmMessage)) {
        const success = this.userManager.deleteUser(userId, true);
        if (success) {
          this.showSuccess(
            `Użytkownik "${user.name}" i jego zadania zostały usunięte`
          );
        } else {
          this.showError("Błąd podczas usuwania użytkownika");
        }
      }
    } else {
      if (confirm(confirmMessage)) {
        const success = this.userManager.deleteUser(userId, false);
        if (success) {
          this.showSuccess(`Użytkownik "${user.name}" został usunięty`);
        } else {
          this.showError("Błąd podczas usuwania użytkownika");
        }
      }
    }
  }

  /**
   * Pokazuje statystyki użytkownika
   * @param {string} userId - ID użytkownika
   */
  showUserStats(userId) {
    const user = this.userManager.getUserById(userId);
    if (!user) {
      this.showError("Użytkownik nie został znaleziony");
      return;
    }

    const stats = user.getStats();
    const taskStats = this.taskManager.getTaskStats(userId);

    const statsMessage = `
Statystyki użytkownika: ${user.name}

📊 Ogólne:
• Zadania ogółem: ${stats.totalTasks}
• Ukończone: ${stats.completedTasks}
• Oczekujące: ${stats.pendingTasks}
• Procent ukończenia: ${stats.completionPercentage}%

🎯 Według priorytetu:
• Wysoki: ${taskStats.byPriority.high}
• Średni: ${taskStats.byPriority.medium}
• Niski: ${taskStats.byPriority.low}

📂 Według kategorii:
• Praca: ${taskStats.byCategory.praca}
• Nauka: ${taskStats.byCategory.nauka}
• Hobby: ${taskStats.byCategory.hobby}
• Osobiste: ${taskStats.byCategory.osobiste}

💪 Status produktywności: ${stats.productivityStatus}

📅 Użytkownik utworzony: ${user.getFormattedCreatedDate()}
        `;

    alert(statsMessage);
  }

  /**
   * Eksportuje użytkowników do pliku JSON
   */
  exportUsers() {
    try {
      const jsonData = this.userManager.exportUsers();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `uzytkownicy_${new Date().toISOString().split("T")[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.showSuccess("Użytkownicy zostali wyeksportowani");
    } catch (error) {
      console.error("Błąd podczas eksportu:", error);
      this.showError("Błąd podczas eksportu użytkowników");
    }
  }

  /**
   * Importuje użytkowników z pliku JSON
   * @param {File} file - Plik do importu
   */
  async importUsers(file) {
    try {
      const text = await file.text();
      const success = this.userManager.importUsers(text);

      if (success) {
        this.showSuccess("Użytkownicy zostali zaimportowani");
      } else {
        this.showError("Błąd podczas importu użytkowników");
      }
    } catch (error) {
      console.error("Błąd podczas importu:", error);
      this.showError("Błąd podczas importu użytkowników");
    }
  }

  /**
   * Czyści wszystkich użytkowników (z potwierdzeniem)
   */
  clearAllUsers() {
    const count = this.userManager.getAllUsers().length;
    if (count === 0) {
      this.showError("Brak użytkowników do usunięcia");
      return;
    }

    const totalTasks = this.taskManager.getAllTasks().length;
    let message = `Czy na pewno chcesz usunąć wszystkich użytkowników (${count})?`;

    if (totalTasks > 0) {
      message += `\n\nUwaga: Zostanie również usuniętych ${totalTasks} zadań.`;
    }

    if (confirm(message)) {
      const success = this.userManager.clearAllUsers();
      if (success) {
        this.showSuccess("Wszyscy użytkownicy zostali usunięci");
      } else {
        this.showError("Błąd podczas usuwania użytkowników");
      }
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
    // Używa systemu powiadomień z TaskComponent jeśli dostępny
    if (window.taskComponent && window.taskComponent.showNotification) {
      window.taskComponent.showNotification(message, type);
    } else {
      // Fallback alert
      alert(message);
    }
  }

  /**
   * Zwraca liczbę użytkowników
   * @returns {number} Liczba użytkowników
   */
  getUsersCount() {
    return this.userManager.getAllUsers().length;
  }

  /**
   * Zwraca aktywnego użytkownika
   * @returns {User|null} Aktywny użytkownik
   */
  getActiveUser() {
    return this.userManager.getActiveUser();
  }
}
