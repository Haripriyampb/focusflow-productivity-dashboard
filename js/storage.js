export const STORAGE_KEY = "focusflow.tasks.v1";

function normalizePriority(priority) {
  return ["high", "medium", "low"].includes(priority) ? priority : "medium";
}

function createSafeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeTask(task) {
  if (!task || typeof task !== "object") {
    return null;
  }

  const title = typeof task.title === "string" ? task.title.trim() : "";
  const deadline = typeof task.deadline === "string" ? task.deadline : "";

  if (!title || !deadline) {
    return null;
  }

  return {
    id: typeof task.id === "string" && task.id.trim() ? task.id : createSafeId(),
    title,
    priority: normalizePriority(task.priority),
    deadline,
    completed: Boolean(task.completed),
    createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString(),
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : new Date().toISOString(),
  };
}

export function readTasks() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);

    if (rawValue === null || rawValue === "") {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      throw new Error("Stored data is not an array.");
    }

    const validTasks = parsedValue
      .map((task) => normalizeTask(task))
      .filter(Boolean);

    return validTasks;
  } catch (error) {
    console.warn("Stored tasks could not be loaded without crashing the app.", error);
    return [];
  }
}

export function saveTasks(tasks) {
  try {
    if (!Array.isArray(tasks)) {
      throw new Error("Tasks must be stored as an array.");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Task data could not be saved.", error);
    return false;
  }
}

export function createSampleTasks() {
  const today = new Date();

  const dateFromNow = (days) => {
    const date = new Date(today);
    date.setDate(today.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  return [
    {
      id: "sample-1",
      title: "Sketch the landing page layout",
      priority: "high",
      deadline: dateFromNow(0),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sample-2",
      title: "Review JavaScript modules and task logic",
      priority: "medium",
      deadline: dateFromNow(2),
      completed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sample-3",
      title: "Practice interview questions",
      priority: "low",
      deadline: dateFromNow(-1),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
