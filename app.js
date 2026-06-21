"use strict";

const STORAGE_KEY = "xunlian-state-v1";

const workoutPlans = [
  {
    id: "push",
    kind: "strength",
    tag: "第 1 练",
    short: "推",
    name: "上肢推 · 胸肩三头",
    subtitle: "胸、肩、肱三头肌",
    duration: 95,
    sections: [
      { title: "动态热身与拉伸", items: [
        ["肩胛绕环与弹力带拉伸", "2 × 12"],
        ["胸椎旋转与扩胸", "每侧 45 秒"],
        ["空杆卧推热身", "2 组"]
      ]},
      { title: "力量训练", items: [
        ["杠铃 / 哑铃卧推", "4 × 6–10"],
        ["上斜哑铃卧推", "3 × 8–12"],
        ["坐姿肩推", "3 × 8–12"],
        ["绳索夹胸", "3 × 12–15"],
        ["侧平举", "4 × 12–15"],
        ["绳索下压", "3 × 10–15"]
      ]}
    ]
  },
  {
    id: "pull",
    kind: "strength",
    tag: "第 2 练",
    short: "拉",
    name: "上肢拉 · 背部二头",
    subtitle: "背、后肩、肱二头肌",
    duration: 95,
    sections: [
      { title: "动态热身与拉伸", items: [
        ["猫牛式与胸椎旋转", "各 60 秒"],
        ["弹力带直臂下压", "2 × 15"],
        ["轻重量划船热身", "2 组"]
      ]},
      { title: "力量训练", items: [
        ["高位下拉 / 辅助引体", "4 × 8–12"],
        ["坐姿绳索划船", "4 × 8–12"],
        ["单臂哑铃划船", "3 × 10–12"],
        ["面拉", "3 × 12–15"],
        ["反向飞鸟", "3 × 12–15"],
        ["哑铃弯举", "3 × 10–12"]
      ]}
    ]
  },
  {
    id: "legs",
    kind: "strength",
    tag: "第 3 练",
    short: "腿",
    name: "下肢 · 腿臀核心",
    subtitle: "股四头、臀腿后侧、核心",
    duration: 100,
    sections: [
      { title: "动态热身与拉伸", items: [
        ["髋关节环绕与腿摆动", "每侧 45 秒"],
        ["深蹲停留与踝关节活动", "2 × 30 秒"],
        ["徒手深蹲激活", "2 × 12"]
      ]},
      { title: "力量训练", items: [
        ["深蹲 / 腿举", "4 × 6–10"],
        ["罗马尼亚硬拉", "4 × 8–12"],
        ["保加利亚分腿蹲", "3 × 8–12"],
        ["臀推", "3 × 8–12"],
        ["腿弯举", "3 × 12–15"],
        ["平板支撑", "3 × 40–60 秒"]
      ]}
    ]
  },
  {
    id: "flex",
    kind: "flex",
    tag: "第 4 练 · 可选",
    short: "趣",
    name: "自由活动日",
    subtitle: "课程、游泳、攀岩或户外",
    duration: 60,
    activities: ["健身房团课", "游泳", "水中行走", "攀岩", "徒步", "轻松恢复"]
  }
];

const cardioChoices = ["爬坡", "游泳", "水中行走", "椭圆机"];
const state = loadState();
let activeWorkout = null;
let installPrompt = null;
let toastTimer = null;

function loadState() {
  const fallback = { profile: null, records: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.records)) return fallback;
    return { profile: saved.profile || null, records: saved.records };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day + 1);
  return result;
}

function recordsThisWeek() {
  const monday = startOfWeek();
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return state.records.filter((record) => {
    const date = new Date(`${record.date}T12:00:00`);
    return date >= monday && date < nextMonday;
  });
}

function nextWorkout() {
  const completedIds = new Set(recordsThisWeek().map((record) => record.planId));
  return workoutPlans.find((plan) => !completedIds.has(plan.id)) || workoutPlans[0];
}

function formatDate(dateKey, includeYear = false) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    ...(includeYear ? { year: "numeric" } : {}),
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2500);
}

function navigate(viewName) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.dataset.view === viewName);
  });
  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.navigate === viewName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (viewName === "nutrition") renderNutrition();
  if (viewName === "history") renderHistory();
  if (viewName === "profile") populateProfileForm();
}

function flowMarkup(plan) {
  const flows = plan.kind === "flex"
    ? [["选择", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2"], ["畅动", "M7 17 10 7l4 10 3-8"], ["恢复", "M12 20c4-3 7-6 7-11-4 0-6 2-7 4-1-2-3-4-7-4 0 5 3 8 7 11Z"]]
    : [["拉伸", "M5 12h14M8 8l-3 4 3 4m8-8 3 4-3 4"], ["力量", "M7 7v10m10-10v10M4 10v4m16-4v4M7 12h10"], ["有氧", "M4 14h3l2-5 4 9 2-6h5"]];
  return flows.map(([label, path]) => `
    <div class="flow-item">
      <span class="flow-icon"><svg viewBox="0 0 24 24"><path d="${path}"/></svg></span>
      ${label}
    </div>`).join("");
}

function renderDashboard() {
  const now = new Date();
  const hours = now.getHours();
  const plan = nextWorkout();
  const weekRecords = recordsThisWeek();
  const uniqueDone = new Set(weekRecords.map((record) => record.planId)).size;
  const name = state.profile?.name?.trim() || "训练者";

  document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(now);
  document.querySelector("#greeting").textContent = hours < 11 ? "早上好" : hours < 18 ? "下午好" : "晚上好";
  document.querySelector("#displayName").textContent = name;
  document.querySelector("#avatarInitial").textContent = name.slice(0, 1);
  document.querySelector("#weekDone").textContent = uniqueDone;
  document.querySelector("#weekRing").style.strokeDashoffset = 239 - Math.min(uniqueDone, 4) / 4 * 239;
  document.querySelector("#nextSessionTag").textContent = uniqueDone >= 4 ? "本周已完成" : plan.tag;
  document.querySelector("#nextSessionName").textContent = uniqueDone >= 4 ? "做得好，安排一次主动恢复" : plan.name;
  document.querySelector("#nextSessionDuration").textContent = `约 ${uniqueDone >= 4 ? 35 : plan.duration} 分钟`;
  document.querySelector("#nextSessionFlow").innerHTML = flowMarkup(uniqueDone >= 4 ? workoutPlans[3] : plan);
  document.querySelector("#startNextWorkout").innerHTML = `${uniqueDone >= 4 ? "记录一次恢复活动" : "开始今天的训练"}<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>`;
  document.querySelector("#startNextWorkout").dataset.planId = uniqueDone >= 4 ? "flex" : plan.id;

  renderWeekStrip();
  renderRecentRecords();
  const nutrition = calculateNutrition(state.profile);
  document.querySelector("#calorieMini").textContent = nutrition ? nutrition.target : "--";
  document.querySelector("#goalMini").textContent = state.profile ? (state.profile.goal === "cut" ? "当前为减脂期" : "当前为增肌期") : "完善档案后计算";
  const streak = calculateStreak();
  document.querySelector("#streakMini").textContent = streak;
  document.querySelector("#streakText").textContent = streak ? "保持稳定节奏" : "从这一周开始";
}

function renderWeekStrip() {
  const labels = ["一", "二", "三", "四", "五", "六", "日"];
  const monday = startOfWeek();
  const completedDates = new Set(recordsThisWeek().map((record) => record.date));
  const today = localDateKey();
  document.querySelector("#weekStrip").innerHTML = labels.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = localDateKey(date);
    const classes = ["day-cell"];
    if (key === today) classes.push("today");
    if ([0, 2, 4, 6].includes(index)) classes.push("planned");
    if (completedDates.has(key)) classes.push("done");
    return `<div class="${classes.join(" ")}"><span>周${label}</span><strong>${date.getDate()}</strong><i></i></div>`;
  }).join("");
}

function renderRecentRecords() {
  const container = document.querySelector("#recentRecords");
  const records = [...state.records].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  if (!records.length) {
    container.innerHTML = `<div class="empty-state"><strong>还没有训练记录</strong><p>第一次打卡会出现在这里。</p></div>`;
    return;
  }
  container.innerHTML = records.map((record) => {
    const plan = workoutPlans.find((item) => item.id === record.planId) || workoutPlans[3];
    return `<article class="record-row">
      <span class="record-symbol">${plan.short}</span>
      <div class="record-main"><strong>${record.name}</strong><span>${formatDate(record.date)}</span></div>
      <span class="record-duration">${record.duration} 分钟</span>
    </article>`;
  }).join("");
}

function renderPlanList() {
  const completed = new Set(recordsThisWeek().map((record) => record.planId));
  document.querySelector("#planList").innerHTML = workoutPlans.map((plan, index) => {
    const details = plan.kind === "flex"
      ? `<div class="detail-section"><h3>任选一种</h3>${plan.activities.map((item) => `<div class="detail-line"><span>${item}</span><span>自由安排</span></div>`).join("")}</div>`
      : plan.sections.map((section) => `<div class="detail-section"><h3>${section.title}</h3>${section.items.map(([name, dose]) => `<div class="detail-line"><span>${name}</span><span>${dose}</span></div>`).join("")}</div>`).join("") + `<div class="detail-section"><h3>练后有氧</h3><div class="detail-line"><span>爬坡 / 游泳 / 水中行走等</span><span>30–60 分钟</span></div></div>`;
    return `<article class="plan-card ${index === 0 ? "open" : ""} ${completed.has(plan.id) ? "complete" : ""}" data-plan-card="${plan.id}">
      <div class="plan-card-top">
        <span class="plan-index">${String(index + 1).padStart(2, "0")}</span>
        <div><h2>${plan.name}</h2><p>${completed.has(plan.id) ? "本周已完成" : plan.subtitle} · ${plan.duration} 分钟</p></div>
        <button class="expand-button" type="button" aria-label="展开训练详情" aria-expanded="${index === 0}"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
      </div>
      <div class="plan-details">${details}<button class="primary-button plan-action" type="button" data-start-plan="${plan.id}">${completed.has(plan.id) ? "再次记录" : "开始训练"}</button></div>
    </article>`;
  }).join("");
}

function calculateNutrition(profile) {
  if (!profile || !profile.age || !profile.height || !profile.weight) return null;
  const weight = Number(profile.weight);
  const height = Number(profile.height);
  const age = Number(profile.age);
  const bodyFat = Number(profile.bodyFat);
  const bmr = bodyFat >= 5 && bodyFat <= 60
    ? 370 + 21.6 * weight * (1 - bodyFat / 100)
    : 10 * weight + 6.25 * height - 5 * age + (profile.sex === "male" ? 5 : -161);
  // Activity level intentionally excludes workouts; 180 kcal/day approximates 3-4 sessions per week.
  const tdee = bmr * Number(profile.activity || 1.35) + 180;
  const adjustment = profile.goal === "gain" ? 250 : -350;
  const floor = profile.sex === "male" ? 1500 : 1200;
  const target = Math.max(floor, Math.round((tdee + adjustment) / 10) * 10);
  const protein = Math.round(weight * (profile.goal === "gain" ? 1.8 : 2));
  const fat = Math.round(weight * (profile.goal === "gain" ? .9 : .8));
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target, protein, fat, carbs, usedBodyFat: Boolean(bodyFat) };
}

function renderNutrition() {
  const profile = state.profile;
  const result = calculateNutrition(profile);
  const goal = profile?.goal || "cut";
  document.querySelectorAll("[data-goal]").forEach((button) => button.classList.toggle("active", button.dataset.goal === goal));
  document.querySelector("#calorieTarget").textContent = result?.target ?? "--";
  document.querySelector("#bmrValue").textContent = result ? `${result.bmr} kcal` : "--";
  document.querySelector("#tdeeValue").textContent = result ? `${result.tdee} kcal` : "--";
  document.querySelector("#proteinValue").textContent = result ? `${result.protein}g` : "--g";
  document.querySelector("#carbValue").textContent = result ? `${result.carbs}g` : "--g";
  document.querySelector("#fatValue").textContent = result ? `${result.fat}g` : "--g";

  const meals = [
    ["早餐", 25], ["午餐", 35], ["训练前后", 15], ["晚餐", 25]
  ];
  document.querySelector("#mealBars").innerHTML = meals.map(([name, percent]) => `<div class="meal-row"><span>${name}</span><span class="meal-bar"><i style="width:${percent / 35 * 100}%"></i></span><strong>${result ? Math.round(result.target * percent / 100) : "--"} kcal</strong></div>`).join("");
  document.querySelector("#nutritionTip").textContent = !result
    ? "完善身体档案后，这里会给出与你目标匹配的建议。"
    : goal === "cut"
      ? `保持约 350 千卡的温和缺口；蛋白质尽量分到 3–4 餐。${result.usedBodyFat ? "本次基础代谢已参考体脂率。" : "记录 2–3 周体重趋势后再微调。"}`
      : "保持约 250 千卡的小幅盈余；训练前后优先安排碳水和蛋白质，体重每周缓慢上升即可。";
}

function populateProfileForm() {
  const form = document.querySelector("#profileForm");
  const profile = state.profile || { name: "", sex: "female", age: "", height: "", weight: "", bodyFat: "", activity: "1.35", goal: "cut" };
  Object.entries(profile).forEach(([key, value]) => {
    const controls = form.elements[key];
    if (!controls) return;
    if (controls instanceof RadioNodeList) controls.value = String(value);
    else controls.value = value;
  });
}

function openWorkout(planId) {
  const plan = workoutPlans.find((item) => item.id === planId);
  if (!plan) return;
  activeWorkout = plan;
  document.querySelector("#workoutTag").textContent = plan.tag;
  document.querySelector("#workoutTitle").textContent = plan.name;
  document.querySelector("#workoutNote").value = "";
  const checklist = document.querySelector("#workoutChecklist");

  if (plan.kind === "flex") {
    checklist.innerHTML = `<section class="check-section"><h3>今天想做什么</h3><div class="cardio-options">${plan.activities.map((activity, index) => `<label class="cardio-option"><input type="radio" name="flexActivity" value="${activity}" ${index === 0 ? "checked" : ""}><span>${activity}</span></label>`).join("")}</div></section>
      <section class="check-section"><h3>活动时长</h3><div class="duration-field"><input type="number" id="flexDuration" min="10" max="480" value="60" inputmode="numeric"><span>分钟</span></div></section>`;
  } else {
    checklist.innerHTML = plan.sections.map((section) => `<section class="check-section"><h3>${section.title}</h3>${section.items.map(([name, dose], index) => checkRow(name, dose, `${section.title}-${index}`)).join("")}</section>`).join("") + `
      <section class="check-section"><h3>练后有氧 · 30–60 分钟</h3>
        <div class="cardio-options">${cardioChoices.map((choice, index) => `<label class="cardio-option"><input type="radio" name="cardioChoice" value="${choice}" ${index === 0 ? "checked" : ""}><span>${choice}</span></label>`).join("")}</div>
        <div class="duration-field"><input type="number" id="cardioDuration" min="0" max="180" value="30" inputmode="numeric"><span>分钟</span></div>
      </section>`;
  }
  checklist.querySelectorAll("input").forEach((input) => input.addEventListener("change", updateSessionProgress));
  document.querySelector("#workoutModal").hidden = false;
  document.body.style.overflow = "hidden";
  updateSessionProgress();
}

function checkRow(name, dose, id) {
  return `<label class="check-row"><input type="checkbox" data-session-item="${id}" value="${name}"><span class="check-mark"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span><span class="check-name">${name}</span><span class="check-dose">${dose}</span></label>`;
}

function updateSessionProgress() {
  if (!activeWorkout) return;
  let done;
  let total;
  if (activeWorkout.kind === "flex") {
    done = document.querySelector("input[name='flexActivity']:checked") ? 1 : 0;
    total = 1;
  } else {
    const checks = [...document.querySelectorAll("[data-session-item]")];
    done = checks.filter((check) => check.checked).length;
    total = checks.length;
  }
  document.querySelector("#sessionProgressBar").style.width = `${total ? done / total * 100 : 0}%`;
  document.querySelector("#sessionProgressText").textContent = `${done} / ${total}`;
}

function closeWorkout() {
  document.querySelector("#workoutModal").hidden = true;
  document.body.style.overflow = "";
  activeWorkout = null;
}

function completeWorkout() {
  if (!activeWorkout) return;
  let record;
  if (activeWorkout.kind === "flex") {
    const choice = document.querySelector("input[name='flexActivity']:checked")?.value;
    const duration = Number(document.querySelector("#flexDuration")?.value);
    if (!choice || !duration || duration < 10) {
      showToast("请选择活动，并填写至少 10 分钟");
      return;
    }
    record = { name: choice, duration, details: "自由活动" };
  } else {
    const checks = [...document.querySelectorAll("[data-session-item]")];
    const completed = checks.filter((check) => check.checked);
    if (!completed.length) {
      showToast("至少勾选一个已完成项目");
      return;
    }
    const cardio = document.querySelector("input[name='cardioChoice']:checked")?.value || "未记录";
    const cardioMinutes = Math.max(0, Number(document.querySelector("#cardioDuration")?.value) || 0);
    record = {
      name: activeWorkout.name,
      duration: Math.round(activeWorkout.duration - 30 + cardioMinutes),
      details: `${completed.length}/${checks.length} 项 · ${cardio} ${cardioMinutes} 分钟`
    };
  }
  state.records.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    planId: activeWorkout.id,
    kind: activeWorkout.kind,
    date: localDateKey(),
    createdAt: Date.now(),
    note: document.querySelector("#workoutNote").value.trim(),
    ...record
  });
  saveState();
  closeWorkout();
  renderAll();
  showToast("打卡成功，今天的努力已记录");
}

function renderHistory() {
  const filter = document.querySelector("#historyFilter").value;
  const records = [...state.records].sort((a, b) => b.createdAt - a.createdAt);
  const filtered = filter === "all" ? records : records.filter((record) => record.kind === filter);
  const now = new Date();
  const monthRecords = records.filter((record) => {
    const date = new Date(`${record.date}T12:00:00`);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  document.querySelector("#totalWorkouts").textContent = records.length;
  document.querySelector("#totalMinutes").textContent = records.reduce((sum, record) => sum + Number(record.duration || 0), 0);
  document.querySelector("#monthWorkouts").textContent = monthRecords.length;
  document.querySelector("#historyRecords").innerHTML = filtered.length ? filtered.map((record) => `<article class="history-item">
    <div class="history-date">${formatDate(record.date, true)}</div>
    <div class="history-item-main"><div><h3>${record.name}</h3><p>${record.details}</p></div><strong>${record.duration} 分钟</strong></div>
    ${record.note ? `<p class="history-note">“${escapeHtml(record.note)}”</p>` : ""}
  </article>`).join("") : `<div class="empty-state"><strong>这里还很安静</strong><p>完成一次训练后，记录会按时间排列。</p></div>`;
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function calculateStreak() {
  if (!state.records.length) return 0;
  const weeklyCounts = new Map();
  state.records.forEach((record) => {
    const monday = localDateKey(startOfWeek(new Date(`${record.date}T12:00:00`)));
    if (!weeklyCounts.has(monday)) weeklyCounts.set(monday, new Set());
    weeklyCounts.get(monday).add(record.planId);
  });
  let streak = 0;
  let cursor = startOfWeek();
  // Current week can count while in progress; past weeks require at least 3 sessions.
  for (let index = 0; index < 52; index += 1) {
    const count = weeklyCounts.get(localDateKey(cursor))?.size || 0;
    if (count >= (index === 0 ? 1 : 3)) streak += 1;
    else if (index > 0 || count === 0) break;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

function renderAll() {
  renderDashboard();
  renderPlanList();
  renderNutrition();
  renderHistory();
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const navButton = event.target.closest("[data-navigate]");
    if (navButton) navigate(navButton.dataset.navigate);

    const startButton = event.target.closest("[data-start-plan]");
    if (startButton) openWorkout(startButton.dataset.startPlan);

    const expandButton = event.target.closest(".expand-button");
    if (expandButton) {
      const card = expandButton.closest(".plan-card");
      card.classList.toggle("open");
      expandButton.setAttribute("aria-expanded", String(card.classList.contains("open")));
    }
    if (event.target.closest("[data-close-modal]")) closeWorkout();
  });

  document.querySelector("#profileShortcut").addEventListener("click", () => navigate("profile"));
  document.querySelector("#editProfileFromNutrition").addEventListener("click", () => navigate("profile"));
  document.querySelector("#startNextWorkout").addEventListener("click", (event) => openWorkout(event.currentTarget.dataset.planId));
  document.querySelector("#completeWorkout").addEventListener("click", completeWorkout);
  document.querySelector("#workoutModal").addEventListener("click", (event) => {
    if (event.target.id === "workoutModal") closeWorkout();
  });

  document.querySelector("#profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.profile = Object.fromEntries(formData.entries());
    saveState();
    renderAll();
    navigate("nutrition");
    showToast("身体档案已保存，饮食目标已更新");
  });

  document.querySelectorAll("[data-goal]").forEach((button) => button.addEventListener("click", () => {
    if (!state.profile) {
      navigate("profile");
      const goalControl = document.querySelector(`#profileForm input[name="goal"][value="${button.dataset.goal}"]`);
      if (goalControl) goalControl.checked = true;
      showToast("先补充身体数据，再为你计算");
      return;
    }
    state.profile.goal = button.dataset.goal;
    saveState();
    renderNutrition();
    renderDashboard();
  }));

  document.querySelector("#historyFilter").addEventListener("change", renderHistory);
  document.querySelector("#exportData").addEventListener("click", exportData);
  document.querySelector("#clearData").addEventListener("click", () => {
    if (!window.confirm("确定清除身体档案和全部训练记录吗？此操作无法撤销。")) return;
    state.profile = null;
    state.records = [];
    saveState();
    populateProfileForm();
    renderAll();
    showToast("本机数据已清除");
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    document.querySelector("#installButton").hidden = false;
  });
  document.querySelector("#installButton").addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    document.querySelector("#installButton").hidden = true;
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `xunlian-backup-${localDateKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("数据备份已导出");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
}

bindEvents();
renderAll();
populateProfileForm();
registerServiceWorker();

if (!state.profile) {
  window.setTimeout(() => showToast("点击右上角头像，先建立你的身体档案"), 600);
}
