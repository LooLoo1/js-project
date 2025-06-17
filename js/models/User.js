/**
 * Klasa User reprezentuje użytkownika w aplikacji
 * Zawiera podstawowe informacje o użytkowniku
 */
class User {
  constructor(name) {
    this.id = this.generateId();
    this.name = name.trim();
    this.createdAt = new Date();
    this.isActive = false; // czy użytkownik jest aktualnie wybrany
    this.taskCount = 0; // liczba zadań użytkownika
    this.completedTaskCount = 0; // liczba ukończonych zadań
  }

  /**
   * Generuje unikalny identyfikator dla użytkownika
   * @returns {string} Unikalny ID
   */
  generateId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Aktualizuje nazwę użytkownika
   * @param {string} newName - Nowa nazwa użytkownika
   */
  updateName(newName) {
    if (newName && newName.trim() !== "") {
      this.name = newName.trim();
    }
  }

  /**
   * Ustawia użytkownika jako aktywnego
   */
  setActive() {
    this.isActive = true;
  }

  /**
   * Ustawia użytkownika jako nieaktywnego
   */
  setInactive() {
    this.isActive = false;
  }

  /**
   * Aktualizuje licznik zadań użytkownika
   * @param {number} totalTasks - Całkowita liczba zadań
   * @param {number} completedTasks - Liczba ukończonych zadań
   */
  updateTaskCounts(totalTasks, completedTasks) {
    this.taskCount = totalTasks || 0;
    this.completedTaskCount = completedTasks || 0;
  }

  /**
   * Zwraca procent ukończonych zadań
   * @returns {number} Procent ukończenia (0-100)
   */
  getCompletionPercentage() {
    if (this.taskCount === 0) {
      return 0;
    }
    return Math.round((this.completedTaskCount / this.taskCount) * 100);
  }

  /**
   * Zwraca status produktywności użytkownika
   * @returns {string} Status produktywności
   */
  getProductivityStatus() {
    const percentage = this.getCompletionPercentage();
    if (percentage >= 80) {
      return "Bardzo produktywny";
    } else if (percentage >= 60) {
      return "Produktywny";
    } else if (percentage >= 40) {
      return "Umiarkowanie produktywny";
    } else if (percentage > 0) {
      return "Mało produktywny";
    } else {
      return "Brak ukończonych zadań";
    }
  }

  /**
   * Zwraca kolor badge'a na podstawie produktywności
   * @returns {string} Klasy CSS dla koloru
   */
  getBadgeColor() {
    const percentage = this.getCompletionPercentage();
    if (percentage >= 80) {
      return "bg-green-500 text-white";
    } else if (percentage >= 60) {
      return "bg-blue-500 text-white";
    } else if (percentage >= 40) {
      return "bg-yellow-500 text-white";
    } else if (percentage > 0) {
      return "bg-orange-500 text-white";
    } else {
      return "bg-gray-500 text-white";
    }
  }

  /**
   * Sprawdza czy nazwa użytkownika jest prawidłowa
   * @param {string} name - Nazwa do sprawdzenia
   * @returns {boolean} True jeśli nazwa jest prawidłowa
   */
  static isValidName(name) {
    return (
      name &&
      typeof name === "string" &&
      name.trim().length >= 2 &&
      name.trim().length <= 50 &&
      /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s0-9]+$/.test(name.trim())
    );
  }

  /**
   * Zwraca sformatowaną datę utworzenia
   * @returns {string} Sformatowana data
   */
  getFormattedCreatedDate() {
    return this.createdAt.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Zwraca inicjały użytkownika
   * @returns {string} Inicjały (maksymalnie 2 znaki)
   */
  getInitials() {
    const words = this.name.split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  /**
   * Zwraca podsumowanie statystyk użytkownika
   * @returns {Object} Obiekt ze statystykami
   */
  getStats() {
    return {
      totalTasks: this.taskCount,
      completedTasks: this.completedTaskCount,
      pendingTasks: this.taskCount - this.completedTaskCount,
      completionPercentage: this.getCompletionPercentage(),
      productivityStatus: this.getProductivityStatus(),
    };
  }

  /**
   * Konwertuje użytkownika do obiektu JSON
   * @returns {Object} Obiekt JSON reprezentujący użytkownika
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      isActive: this.isActive,
      taskCount: this.taskCount,
      completedTaskCount: this.completedTaskCount,
    };
  }

  /**
   * Tworzy użytkownika z obiektu JSON
   * @param {Object} jsonData - Dane JSON
   * @returns {User} Nowy użytkownik
   */
  static fromJSON(jsonData) {
    const user = new User(jsonData.name);
    user.id = jsonData.id;
    user.createdAt = new Date(jsonData.createdAt);
    user.isActive = jsonData.isActive || false;
    user.taskCount = jsonData.taskCount || 0;
    user.completedTaskCount = jsonData.completedTaskCount || 0;
    return user;
  }

  /**
   * Porównuje użytkowników do sortowania
   * @param {User} otherUser - Drugi użytkownik do porównania
   * @param {string} sortBy - Kryterium sortowania ('name', 'created', 'productivity')
   * @returns {number} Wartość dla sortowania
   */
  compareTo(otherUser, sortBy = "name") {
    switch (sortBy) {
      case "name":
        return this.name.localeCompare(otherUser.name, "pl");
      case "created":
        return this.createdAt - otherUser.createdAt;
      case "productivity":
        return (
          otherUser.getCompletionPercentage() - this.getCompletionPercentage()
        );
      case "taskCount":
        return otherUser.taskCount - this.taskCount;
      default:
        return this.name.localeCompare(otherUser.name, "pl");
    }
  }

  /**
   * Klonuje użytkownika
   * @returns {User} Sklonowany użytkownik
   */
  clone() {
    return User.fromJSON(this.toJSON());
  }
}

window.User = User;
