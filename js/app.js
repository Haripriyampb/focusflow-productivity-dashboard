import { createSampleTasks, readTasks, saveTasks, STORAGE_KEY } from "./storage.js";

const state = {
  tasks: [],
  editingTaskId: null,
  lastFocusedElement: null,
  isModalOpen: false,
  filters: {
    search: "",
    status: "all",
    priority: "all",
  },
};

const elements = {};

function initializeApp() {
  cacheElements();
  bindEvents();
  const storedTasks = readTasks();
  const hasStoredData = hasTaskStorageEntry();

  if (!hasStoredData && storedTasks.length === 0 && canUseStorage()) {
    state.tasks = createSampleTasks();
    const saved = saveTasks(state.tasks);

    if (!saved) {
      console.warn("Sample tasks could not be saved. The app will continue without persisting them.");
    }
  } else {
    state.tasks = storedTasks;
  }

  render();
}

function canUseStorage() {
  try {
    const probeKey = "focusflow.storage.test";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    console.warn("localStorage is unavailable. Task data will not persist in this browser.", error);
    return false;
  }
}

function hasTaskStorageEntry() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}

function cacheElements() {
  elements.searchInput = document.querySelector("#search-input");
  elements.statusFilter = document.querySelector("#status-filter");
  elements.priorityFilter = document.querySelector("#priority-filter");
  elements.resetFiltersButton = document.querySelector("#reset-filters");
  elements.taskList = document.querySelector("#task-list");
  elements.emptyState = document.querySelector("#empty-state");
  elements.emptyStateButton = document.querySelector("#empty-state-button");
  elements.taskCount = document.querySelector("#task-count");
  elements.statTotal = document.querySelector("#stat-total");
  elements.statCompleted = document.querySelector("#stat-completed");
  elements.statPending = document.querySelector("#stat-pending");
  elements.statOverdue = document.querySelector("#stat-overdue");
  elements.progressValue = document.querySelector("#progress-value");
  elements.progressFill = document.querySelector("#progress-fill");
  elements.taskModalBackdrop = document.querySelector("#task-modal-backdrop");
  elements.taskForm = document.querySelector("#task-form");
  elements.taskModalTitle = document.querySelector("#task-modal-title");
  elements.taskTitleInput = document.querySelector("#task-title");
  elements.taskPriorityInput = document.querySelector("#task-priority");
  elements.taskDeadlineInput = document.querySelector("#task-deadline");
  elements.taskCompletedInput = document.querySelector("#task-completed");
  elements.taskIdInput = document.querySelector("#task-id");
  elements.formError = document.querySelector("#form-error");
  elements.openTaskModalButton = document.querySelector("#open-task-modal");
  elements.closeTaskModalButton = document.querySelector("#close-task-modal");
  elements.cancelTaskModalButton = document.querySelector("#cancel-task-modal");
  elements.menuToggle = document.querySelector("#menu-toggle");
  elements.sidebar = document.querySelector("#sidebar");
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderTaskList();
  });

  elements.statusFilter.addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    renderTaskList();
  });

  elements.priorityFilter.addEventListener("change", (event) => {
    state.filters.priority = event.target.value;
    renderTaskList();
  });

  elements.resetFiltersButton.addEventListener("click", () => {
    state.filters = { search: "", status: "all", priority: "all" };
    elements.searchInput.value = "";
    elements.statusFilter.value = "all";
    elements.priorityFilter.value = "all";
    renderTaskList();
  });

  elements.openTaskModalButton.addEventListener("click", (event) => {
    openTaskModal(null, event.currentTarget);
  });

  elements.emptyStateButton.addEventListener("click", (event) => {
    openTaskModal(null, event.currentTarget);
  });

  elements.closeTaskModalButton.addEventListener("click", closeTaskModal);
  elements.cancelTaskModalButton.addEventListener("click", closeTaskModal);

  elements.taskModalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.taskModalBackdrop) {
      closeTaskModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!state.isModalOpen) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeTaskModal();
      return;
    }

    if (event.key === "Tab") {
      trapModalFocus(event);
    }
  });

  elements.taskForm.addEventListener("submit", handleTaskFormSubmit);
  elements.taskList.addEventListener("click", handleTaskListClick);
  elements.taskList.addEventListener("change", handleTaskListChange);

  elements.menuToggle.addEventListener("click", () => {
    elements.sidebar.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    const isSidebarClick = event.target.closest("#sidebar");
    const isToggleClick = event.target.closest("#menu-toggle");

    if (!isSidebarClick && !isToggleClick && window.innerWidth <= 820) {
      elements.sidebar.classList.remove("open");
    }
  });
}

function handleTaskFormSubmit(event) {
  event.preventDefault();

  const title = elements.taskTitleInput.value.trim();
  const priority = elements.taskPriorityInput.value;
  const deadline = elements.taskDeadlineInput.value;
  const completed = elements.taskCompletedInput.checked;

  if (!title) {
    showFormError("Task title is required.");
    return;
  }

  if (!deadline) {
    showFormError("Please choose a deadline.");
    return;
  }

  const timestamp = new Date().toISOString();

  const newTask = {
    id: state.editingTaskId || createTaskId(),
    title,
    priority,
    deadline,
    completed,
    createdAt: state.editingTaskId
      ? state.tasks.find((task) => task.id === state.editingTaskId)?.createdAt || timestamp
      : timestamp,
    updatedAt: timestamp,
  };

  const nextTasks = state.editingTaskId
    ? state.tasks.map((task) => (task.id === state.editingTaskId ? newTask : task))
    : [newTask, ...state.tasks];

  const saved = saveTasks(nextTasks);

  if (!saved) {
    showFormError("Unable to save changes. Your browser storage may be unavailable or full.");
    return;
  }

  state.tasks = nextTasks;
  closeTaskModal();
  render();
}

function handleTaskListClick(event) {
  const actionTarget = event.target.closest("[data-action]");

  if (!actionTarget) {
    return;
  }

  const { action, id } = actionTarget.dataset;

  if (action === "edit") {
    const task = state.tasks.find((item) => item.id === id);
    if (task) {
      openTaskModal(task, actionTarget);
    }
    return;
  }

  if (action === "delete") {
    const isConfirmed = window.confirm("Delete this task? This action cannot be undone.");
    if (!isConfirmed) {
      return;
    }

    const nextTasks = state.tasks.filter((task) => task.id !== id);
    const saved = saveTasks(nextTasks);

    if (!saved) {
      window.alert("This task could not be deleted because the browser storage is unavailable.");
      return;
    }

    state.tasks = nextTasks;
    render();
  }
}

function handleTaskListChange(event) {
  const toggle = event.target.closest("[data-action='toggle-complete']");

  if (!toggle) {
    return;
  }

  const { id } = toggle.dataset;
  const nextTasks = state.tasks.map((task) => {
    if (task.id !== id) {
      return task;
    }

    return {
      ...task,
      completed: toggle.checked,
      updatedAt: new Date().toISOString(),
    };
  });

  const saved = saveTasks(nextTasks);

  if (!saved) {
    toggle.checked = !toggle.checked;
    window.alert("Task status could not be saved. Your browser storage may be unavailable.");
    return;
  }

  state.tasks = nextTasks;
  render();
}

function trapModalFocus(event) {
  const focusableElements = getFocusableModalElements();

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function getFocusableModalElements() {
  const selector = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(", ");

  return [...elements.taskModalBackdrop.querySelectorAll(selector)].filter((element) => {
    return !element.hasAttribute("hidden") && element.offsetParent !== null;
  });
}

function openTaskModal(task = null, triggerElement = document.activeElement) {
  state.editingTaskId = task ? task.id : null;
  state.lastFocusedElement =
    triggerElement && typeof triggerElement.focus === "function"
      ? triggerElement
      : elements.openTaskModalButton;
  state.isModalOpen = true;
  elements.taskModalBackdrop.classList.remove("hidden");
  elements.taskModalBackdrop.setAttribute("aria-hidden", "false");
  elements.taskModalTitle.textContent = task ? "Edit task" : "Add task";

  if (task) {
    elements.taskIdInput.value = task.id;
    elements.taskTitleInput.value = task.title;
    elements.taskPriorityInput.value = task.priority;
    elements.taskDeadlineInput.value = task.deadline;
    elements.taskCompletedInput.checked = task.completed;
  } else {
    elements.taskForm.reset();
    elements.taskPriorityInput.value = "medium";
    elements.taskDeadlineInput.value = "";
    elements.taskCompletedInput.checked = false;
  }

  elements.formError.textContent = "";
  window.requestAnimationFrame(() => {
    elements.taskTitleInput.focus();
  });
}

function closeTaskModal() {
  if (!state.isModalOpen && elements.taskModalBackdrop.classList.contains("hidden")) {
    return;
  }

  state.editingTaskId = null;
  state.isModalOpen = false;
  elements.taskModalBackdrop.classList.add("hidden");
  elements.taskModalBackdrop.setAttribute("aria-hidden", "true");
  elements.taskForm.reset();
  elements.formError.textContent = "";

  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
    state.lastFocusedElement.focus();
  }

  state.lastFocusedElement = null;
}

function render() {
  renderStats();
  renderTaskList();
}

function renderStats() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = state.tasks.filter((task) => !task.completed && isOverdue(task.deadline)).length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  elements.statTotal.textContent = String(totalTasks);
  elements.statCompleted.textContent = String(completedTasks);
  elements.statPending.textContent = String(pendingTasks);
  elements.statOverdue.textContent = String(overdueTasks);
  elements.progressValue.textContent = `${completionRate}%`;
  elements.progressFill.style.width = `${completionRate}%`;
}

function renderTaskList() {
  const filteredTasks = getFilteredTasks();

  elements.taskCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? "task" : "tasks"}`;
  elements.emptyState.hidden = filteredTasks.length !== 0;

  if (filteredTasks.length === 0) {
    elements.taskList.innerHTML = "";
    return;
  }

  const markup = filteredTasks
    .map((task) => {
      const status = task.completed ? "completed" : isOverdue(task.deadline) ? "overdue" : "pending";
      const label = task.completed ? "Completed" : isOverdue(task.deadline) ? "Overdue" : "Pending";
      const formattedDate = formatDeadline(task.deadline);

      return `
        <li class="task-card ${task.completed ? "is-complete" : ""} ${!task.completed && isOverdue(task.deadline) ? "is-overdue" : ""}">
          <label class="task-check" aria-label="Toggle task status for ${escapeHtml(task.title)}">
            <input
              type="checkbox"
              data-action="toggle-complete"
              data-id="${task.id}"
              ${task.completed ? "checked" : ""}
            />
          </label>

          <div class="task-main">
            <div class="task-header">
              <h3>${escapeHtml(task.title)}</h3>
              <span class="priority-badge priority-${task.priority}">${capitalize(task.priority)}</span>
            </div>

            <div class="task-meta">
              <span>Due ${formattedDate}</span>
              <span class="task-status ${status}">${label}</span>
            </div>
          </div>

          <div class="task-actions">
            <button class="task-action" type="button" data-action="edit" data-id="${task.id}">
              Edit
            </button>
            <button class="task-action delete" type="button" data-action="delete" data-id="${task.id}">
              Delete
            </button>
          </div>
        </li>
      `;
    })
    .join("");

  elements.taskList.innerHTML = markup;
}

function getFilteredTasks() {
  return state.tasks.filter((task) => {
    const matchesSearch = !state.filters.search || task.title.toLowerCase().includes(state.filters.search);
    const matchesStatus =
      state.filters.status === "all" ||
      (state.filters.status === "completed" && task.completed) ||
      (state.filters.status === "pending" && !task.completed);
    const matchesPriority =
      state.filters.priority === "all" ||
      task.priority === state.filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
}

function isOverdue(deadline) {
  if (!deadline) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${deadline}T00:00:00`);
  return dueDate < today;
}

function formatDeadline(dateValue) {
  if (!dateValue) {
    return "No deadline";
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function createTaskId() {
  return window.crypto && typeof window.crypto.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showFormError(message) {
  elements.formError.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

initializeApp();
