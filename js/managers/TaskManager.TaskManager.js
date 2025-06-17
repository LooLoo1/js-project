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

    console.log("TaskManager: Tasks array after move:", this.tasks);

    this.applyFiltersAndSort();
    this.saveTasks();
    this.notifyObservers("taskMoved", {
      task,
      fromIndex: currentIndex,
      toIndex: newIndex,
    });

    console.log(
      "Przeniesiono zadanie:",
      taskId,
      "z pozycji",
      currentIndex,
      "na pozycję",
      newIndex
    );
    return true;
  } catch (error) {
    console.error("Błąd podczas przenoszenia zadania:", error);
    return false;
  }
} 