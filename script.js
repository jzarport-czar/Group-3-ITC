// Deadline Detective - simple task planner

const $ = id => document.getElementById(id);
const STORAGE_KEY = "deadlineDetectiveTasks";

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  return [
    { id: 1, title: "Finish GEC 01 activity", subject: "Understanding the Self", type: "Assignment", due: dateAfter(2), priority: "High", notes: "Review all five template questions.", done: false },
    { id: 2, title: "Prepare database project outline", subject: "Programming / IT", type: "Project", due: dateAfter(5), priority: "Medium", notes: "Agree on the project scope with the group.", done: false },
    { id: 3, title: "Review for quiz", subject: "General Education", type: "Exam", due: dateAfter(1), priority: "High", notes: "Review class notes and examples.", done: false }
  ];
}

let tasks = loadTasks();
let nextId = Math.max(0, ...tasks.map(task => task.id)) + 1;

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(date + "T00:00:00") - today) / 86400000);
}

function formatDate(date) {
  return new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric"
  });
}

// Escape text before showing it in HTML.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

// Create a Google Calendar event link for an all-day deadline.
function googleCalendarLink(task) {
  const start = task.due.replaceAll("-", "");
  const endDate = new Date(task.due + "T12:00:00");
  endDate.setDate(endDate.getDate() + 1);
  const end = [
    endDate.getFullYear(),
    String(endDate.getMonth() + 1).padStart(2, "0"),
    String(endDate.getDate()).padStart(2, "0")
  ].join("");

  const details = [
    task.subject ? "Subject: " + task.subject : "",
    "Type: " + task.type,
    "Priority: " + task.priority,
    task.notes
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: task.title,
    dates: `${start}/${end}`,
    details
  });

  return "https://calendar.google.com/calendar/render?" + params.toString();
}

function render() {
  const openTasks = tasks.filter(task => !task.done);
  $("totalCount").textContent = openTasks.length;
  $("weekCount").textContent = openTasks.filter(task => {
    const days = daysUntil(task.due);
    return days >= 0 && days <= 7;
  }).length;
  $("doneCount").textContent = tasks.filter(task => task.done).length;

  const query = $("search").value.toLowerCase();
  const filter = $("filter").value;

  const visibleTasks = tasks
    .filter(task => `${task.title} ${task.subject} ${task.type}`.toLowerCase().includes(query))
    .filter(task => {
      if (filter === "open") return !task.done;
      if (filter === "done") return task.done;
      if (filter === "high") return !task.done && task.priority === "High";
      return true;
    })
    .sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));

  $("taskList").innerHTML = "";

  if (!visibleTasks.length) {
    $("taskList").innerHTML = '<p class="empty">No tasks found. Try another search or add a task.</p>';
    return;
  }

  visibleTasks.forEach(task => {
    const days = daysUntil(task.due);
    let dueLabel = "Due " + formatDate(task.due);
    if (task.done) dueLabel = "Completed";
    else if (days < 0) dueLabel = "Overdue";
    else if (days === 0) dueLabel = "Due today";
    else if (days === 1) dueLabel = "Due tomorrow";

    const card = document.createElement("article");
    card.className = "task";
    card.innerHTML = `
      <div class="task-top">
        <div>
          <h3>${escapeHTML(task.title)}</h3>
          <p>${escapeHTML(task.subject || "No subject")} · ${escapeHTML(task.type)}</p>
        </div>
        <div class="task-actions">
          <button class="icon-btn" data-toggle="${task.id}" aria-label="${task.done ? "Mark incomplete" : "Mark completed"}">${task.done ? "↶" : "✓"}</button>
          <button class="icon-btn" data-delete="${task.id}" aria-label="Delete task">×</button>
        </div>
      </div>
      <div class="task-meta">
        <span class="pill ${task.done ? "done" : task.priority.toLowerCase()}">${task.done ? "Completed" : escapeHTML(task.priority) + " priority"}</span>
        <span class="pill">${dueLabel}</span>
      </div>
      ${task.notes ? `<p class="task-notes">${escapeHTML(task.notes)}</p>` : ""}
      ${!task.done ? `<a class="calendar-btn" href="${googleCalendarLink(task)}" target="_blank" rel="noopener">＋ Add to Google Calendar</a>` : ""}
    `;
    $("taskList").appendChild(card);
  });
}

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();

  tasks.push({
    id: nextId++,
    title: $("title").value.trim(),
    subject: $("subject").value.trim(),
    type: $("type").value,
    due: $("due").value,
    priority: $("priority").value,
    notes: $("notes").value.trim(),
    done: false
  });

  saveTasks();
  $("taskForm").reset();
  $("due").value = dateAfter(3);
  render();
});

$("taskList").addEventListener("click", event => {
  const toggleButton = event.target.closest("[data-toggle]");
  const deleteButton = event.target.closest("[data-delete]");

  if (toggleButton) {
    const task = tasks.find(item => item.id === Number(toggleButton.dataset.toggle));
    if (task) task.done = !task.done;
  }

  if (deleteButton) {
    tasks = tasks.filter(item => item.id !== Number(deleteButton.dataset.delete));
  }

  if (toggleButton || deleteButton) {
    saveTasks();
    render();
  }
});

$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);

$("due").value = dateAfter(3);
render();
