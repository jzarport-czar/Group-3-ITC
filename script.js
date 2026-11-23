// Save tasks in the browser
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let nextId = 1;
let currentView = "active";

// Get an element by its ID
function get(id) {
  return document.getElementById(id);
}

// Make a date a few days from today
function getDate(days) {
  let date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

// Save tasks
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Show all tasks
function showTasks() {
  let list = get(currentView === "completed" ? "completedTaskList" : "taskList");
  list.innerHTML = "";

  let search = currentView === "completed" ? "" : get("search").value.toLowerCase();
  let filter = get("filter").value;

  let unfinished = tasks.filter(task => !task.done);
  let completed = tasks.filter(task => task.done);
  get("totalCount").textContent = unfinished.length;
  get("weekCount").textContent = unfinished.filter(task =>
    task.due >= getDate(0) && task.due <= getDate(7)
  ).length;
  get("doneCount").textContent = completed.length;
  get("completedNavCount").textContent = completed.length;

  let shownTasks = (currentView === "completed" ? completed : unfinished.filter(task =>
    filter === "all" || task.priority.toLowerCase() === filter
  )).filter(task =>
    (task.title + task.subject).toLowerCase().includes(search)
  );

  if (currentView === "active" && get("sort").value === "farthest") {
    shownTasks.sort((a, b) => b.due.localeCompare(a.due));
  } else {
    shownTasks.sort((a, b) => a.due.localeCompare(b.due));
  }

  if (shownTasks.length === 0) {
    list.innerHTML = currentView === "completed"
      ? '<p class="empty">No completed tasks yet. Mark a task as complete to see it here.</p>'
      : '<p class="empty">No active tasks found. Completed tasks are on the Completed tasks page.</p>';
  }

  shownTasks.forEach(task => {
    let card = document.createElement("article");
    card.className = "task";

    let dateText = task.done ? "Completed" :
      task.due < getDate(0) ? "Overdue" :
      "Due " + new Date(task.due + "T12:00:00").toDateString();

    card.innerHTML = `
      <div class="task-top">
        <div>
          <h3>${task.title}</h3>
          <p>${task.subject || "No subject"} · ${task.type}</p>
        </div>
        <div class="task-actions">
          ${task.done
            ? `<button class="icon-btn" onclick="deleteTask(${task.id})">Remove</button>
               <button class="icon-btn" onclick="toggleTask(${task.id})">Continue</button>`
            : `<button class="icon-btn" aria-label="Mark task complete" onclick="toggleTask(${task.id})">✓</button>
               <button class="icon-btn" aria-label="Delete task" onclick="deleteTask(${task.id})">×</button>`}
        </div>
      </div>
      <div class="task-meta">
        <span class="pill ${task.done ? "done" : task.priority.toLowerCase()}">
          ${task.done ? "Completed" : task.priority + " priority"}
        </span>
        <span class="pill">${dateText}</span>
        ${task.plannedDate
          ? `<span class="pill">Plan to work on ${new Date(task.plannedDate + "T12:00:00").toDateString()}</span>`
          : ""}
      </div>
      ${task.notes ? `<p>${task.notes}</p>` : ""}
      ${!task.done ? `
        <div class="calendar-actions">
          ${task.plannedDate
            ? `<a class="calendar-btn" target="_blank" rel="noopener" href="${calendarLink(task, "planned")}">Add work-date reminder</a>`
            : ""}
          <a class="calendar-btn" target="_blank" rel="noopener" href="${calendarLink(task, "due")}">Add due-date reminder</a>
        </div>
      ` : ""}
    `;

    list.appendChild(card);
  });
}

function showView(view) {
  currentView = view;
  let completed = view === "completed";
  get("activeTasksView").hidden = completed;
  get("addTaskPanel").hidden = completed;
  get("completedTasksView").hidden = !completed;
  get("activeTasksNav").classList.toggle("active", !completed);
  get("completedTasksNav").classList.toggle("active", completed);
  if (completed) {
    get("activeTasksNav").removeAttribute("aria-current");
    get("completedTasksNav").setAttribute("aria-current", "page");
  } else {
    get("activeTasksNav").setAttribute("aria-current", "page");
    get("completedTasksNav").removeAttribute("aria-current");
  }
  showTasks();
}

get("activeTasksNav").addEventListener("click", function() {
  showView("active");
});

get("completedTasksNav").addEventListener("click", function() {
  showView("completed");
});

get("search").addEventListener("input", showTasks);
get("filter").addEventListener("change", showTasks);
get("sort").addEventListener("change", showTasks);

// Set priority automatically based on task type
function setSuggestedPriority() {
  let type = get("type").value;

  if (type === "Assignment") {
    get("priority").value = "Low";
  } else if (type === "Activities") {
    get("priority").value = "Medium";
  } else if (type === "Performance Task" || type === "Exam") {
    get("priority").value = "High";
  }
  else if (type === "Project" || type === "Presentation") {
    get("priority").value = "High";
  }
}

get("type").addEventListener("change", setSuggestedPriority);

// Dark mode toggle (remember the choice in this browser)
function setTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);
  get("themeToggle").textContent = isDark ? "Light mode" : "Dark mode";
  get("themeToggle").setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );
  localStorage.setItem("darkMode", isDark ? "on" : "off");
}

get("themeToggle").addEventListener("click", function() {
  setTheme(!document.body.classList.contains("dark-mode"));
});

setTheme(localStorage.getItem("darkMode") === "on");
setSuggestedPriority();

// Add a new task
get("taskForm").addEventListener("submit", function(event) {
  event.preventDefault();

  tasks.push({
    id: nextId++,
    title: get("title").value,
    subject: get("subject").value,
    type: get("type").value,
    due: get("due").value,
    plannedDate: get("plannedDate").value,
    priority: get("priority").value,
    notes: get("notes").value,
    done: false
  });

  saveTasks();
  get("taskForm").reset();
  get("due").value = getDate(3);
  showTasks();
});

// Mark a task as complete
function toggleTask(id) {
  let task = tasks.find(task => task.id === id);
  task.done = !task.done;
  saveTasks();
  showTasks();
}

// Delete a task
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  showTasks();
}

// Make a Google Calendar event link
function calendarLink(task, dateType) {
  let eventDate = dateType === "planned" ? task.plannedDate : task.due;
  let date = eventDate.replaceAll("-", "");
  let endDate = new Date(eventDate + "T12:00:00");
  endDate.setDate(endDate.getDate() + 1);
  let end = endDate.toISOString().split("T")[0].replaceAll("-", "");

  let reminderType = dateType === "planned" ? "Planned work date" : "Due date";
  let details = "Reminder: " + reminderType +
    "\nSubject: " + task.subject +
    "\nType: " + task.type +
    "\nPriority: " + task.priority +
    "\nDue date: " + task.due +
    (task.plannedDate ? "\nPlanned work date: " + task.plannedDate : "") +
    "\n" + task.notes;

  let link = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  link += "&text=" + encodeURIComponent(task.title + " - " + reminderType);
  link += "&dates=" + date + "/" + end;
  link += "&details=" + encodeURIComponent(details);

  return link;
}

showTasks();