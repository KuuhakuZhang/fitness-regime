"use strict";

const STORAGE_KEY = "xunlian-state-v1";

const workoutPlans = [
  {
    id: "push",
    kind: "strength",
    tag: "力量训练",
    short: "胸",
    name: "胸 + 中束",
    subtitle: "胸部、三角肌中束、核心",
    duration: 90,
    sections: [
      { title: "动态热身与拉伸", items: [
        ["肩胛绕环与弹力带拉伸", "2 × 12"],
        ["胸椎旋转与扩胸", "每侧 45 秒"],
        ["空杆卧推热身", "2 组"]
      ]},
      { title: "力量训练", items: [
        ["杠铃 / 哑铃卧推", "4 × 8"],
        ["上斜卧推", "4 × 10"],
        ["绳索夹胸 / 双杠臂屈伸", "4 × 12"],
        ["Y 字侧平举", "4 × 12"],
        ["绳索直臂下压", "4 × 10"],
        ["仰卧举腿", "4 × 15"]
      ]}
    ]
  },
  {
    id: "pull",
    kind: "strength",
    tag: "力量训练",
    short: "背",
    name: "背 + 后束",
    subtitle: "背部、三角肌后束、核心",
    duration: 90,
    sections: [
      { title: "动态热身与拉伸", items: [
        ["猫牛式与胸椎旋转", "各 60 秒"],
        ["弹力带直臂下压", "2 × 15"],
        ["轻重量划船热身", "2 组"]
      ]},
      { title: "力量训练", items: [
        ["单手钢线下拉", "4 × 12"],
        ["单手器械划船", "4 × 12"],
        ["对握下压", "4 × 10"],
        ["开肘拉", "4 × 12"],
        ["弯举", "4 × 10"],
        ["仰卧举腿", "4 × 15"]
      ]}
    ]
  },
  {
    id: "shoulders",
    kind: "strength",
    tag: "力量训练",
    short: "肩",
    name: "肩部",
    subtitle: "肩部、下背部",
    duration: 75,
    sections: [
      { title: "动态热身与拉伸", items: [
        ["肩胛绕环与弹力带拉伸", "2 × 12"],
        ["胸椎旋转与扩胸", "每侧 45 秒"],
        ["空杆卧推热身", "2 组"]
      ]},
      { title: "力量训练", items: [
        ["实力推", "4 × 10"],
        ["侧平举", "4 × 12"],
        ["开肘拉", "4 × 12"],
        ["反向山羊挺身", "4 × 15"]
      ]}
    ]
  },
  {
    id: "legs",
    kind: "strength",
    tag: "力量训练",
    short: "腿",
    name: "腿部",
    subtitle: "股四头、臀腿后侧、下背部",
    duration: 90,
    sections: [
      { title: "动态热身与拉伸", items: [
        ["髋关节环绕与腿摆动", "每侧 45 秒"],
        ["深蹲停留与踝关节活动", "2 × 30 秒"],
        ["徒手深蹲激活", "2 × 12"]
      ]},
      { title: "力量训练", items: [
        ["单腿硬拉", "4 × 12"],
        ["保加利亚深蹲", "4 × 10"],
        ["颈前深蹲 / 哈克深蹲", "4 × 10"],
        ["罗马尼亚硬拉", "3 × 12"],
        ["山羊挺身", "3 × 10"]
      ]}
    ]
  },
  {
    id: "flex",
    kind: "flex",
    tag: "自由活动 · 可选",
    short: "趣",
    name: "自由活动日",
    subtitle: "课程、游泳、攀岩或户外",
    duration: 60,
    activities: ["健身房团课", "游泳", "水中行走", "攀岩", "徒步", "轻松恢复"]
  }
];

const cardioChoices = ["爬坡", "游泳", "水中行走", "椭圆机"];
const customPlanTemplate = {
  id: "custom",
  kind: "strength",
  tag: "自由编排",
  short: "写",
  name: "今日自定义训练",
  subtitle: "自己填写运动项目、动作细节和时长",
  duration: 75,
  sections: []
};
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

function customWorkout() {
  return { ...customPlanTemplate, sections: [] };
}

function workoutById(planId) {
  return planId === "custom" ? customWorkout() : workoutPlans.find((item) => item.id === planId);
}

function planExerciseItems(plan) {
  if (plan.id === "custom") return [{ name: "", detail: "", done: false }];
  if (plan.kind === "flex") {
    return [{ name: plan.activities?.[0] || "", detail: "自由安排", done: false }];
  }
  return plan.sections.flatMap((section) => (
    section.items.map(([name, detail]) => ({ name, detail, done: false, group: section.title }))
  ));
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
  const flows = plan.id === "custom"
    ? [["计划", "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"], ["填写", "m4 16-.8 4 4-.8L18 8.4 15.6 6 4 16Z"], ["打卡", "m5 12 4 4L19 6"]]
    : plan.kind === "flex"
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
  const weekRecords = recordsThisWeek();
  const completedSessions = Math.min(weekRecords.length, 4);
  const name = state.profile?.name?.trim() || "训练者";
  const todayPlan = customWorkout();

  document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(now);
  document.querySelector("#greeting").textContent = hours < 11 ? "早上好" : hours < 18 ? "下午好" : "晚上好";
  document.querySelector("#displayName").textContent = name;
  document.querySelector("#avatarInitial").textContent = name.slice(0, 1);
  document.querySelector("#weekDone").textContent = completedSessions;
  document.querySelector("#weekRing").style.strokeDashoffset = 239 - completedSessions / 4 * 239;
  document.querySelector("#nextSessionTag").textContent = completedSessions >= 4 ? "本周已达标" : todayPlan.tag;
  document.querySelector("#nextSessionName").textContent = completedSessions >= 4 ? "继续记录恢复或加练" : "填写今天的训练计划";
  document.querySelector("#nextSessionDuration").textContent = "自定时长";
  document.querySelector("#nextSessionFlow").innerHTML = flowMarkup(todayPlan);
  document.querySelector("#startNextWorkout").innerHTML = `${completedSessions >= 4 ? "继续记录" : "填写今日计划"}<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>`;
  document.querySelector("#startNextWorkout").dataset.planId = "custom";

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

function recordSymbol(record) {
  const plan = workoutPlans.find((item) => item.id === record.planId);
  if (plan) return plan.short;
  return (record.name || "练").trim().slice(0, 1) || "练";
}

function renderRecentRecords() {
  const container = document.querySelector("#recentRecords");
  const records = [...state.records].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  if (!records.length) {
    container.innerHTML = `<div class="empty-state"><strong>还没有训练记录</strong><p>第一次打卡会出现在这里。</p></div>`;
    return;
  }
  container.innerHTML = records.map((record) => {
    return `<article class="record-row">
      <span class="record-symbol">${escapeHtml(recordSymbol(record))}</span>
      <div class="record-main"><strong>${escapeHtml(record.name)}</strong><span>${formatDate(record.date)}</span></div>
      <span class="record-duration">${record.duration} 分钟</span>
    </article>`;
  }).join("");
}

function renderPlanList() {
  const completed = new Set(recordsThisWeek().map((record) => record.planId));
  const customCard = `<article class="plan-card custom-plan-card open" data-plan-card="custom">
    <div class="plan-card-top">
      <span class="plan-index">${customPlanTemplate.short}</span>
      <div><h2>自定义今日计划</h2><p>不限定部位，自己填写运动项目、动作细节和时长</p></div>
      <button class="expand-button" type="button" aria-label="展开训练详情" aria-expanded="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
    </div>
    <div class="plan-details">
      <div class="detail-section"><h3>可填写内容</h3>
        <div class="detail-line"><span>当天训练主题</span><span>例如 推、拉、游泳</span></div>
        <div class="detail-line"><span>运动项目 / 动作</span><span>可新增多项</span></div>
        <div class="detail-line"><span>具体动作细节</span><span>组次、重量、备注</span></div>
      </div>
      <button class="primary-button plan-action" type="button" data-start-plan="custom">从空白开始填写</button>
    </div>
  </article>`;
  const templateCards = workoutPlans.map((plan, index) => {
    const details = plan.kind === "flex"
      ? `<div class="detail-section"><h3>常用灵感</h3>${plan.activities.map((item) => `<div class="detail-line"><span>${item}</span><span>打开后可改</span></div>`).join("")}</div>`
      : plan.sections.map((section) => `<div class="detail-section"><h3>${section.title}</h3>${section.items.map(([name, dose]) => `<div class="detail-line"><span>${name}</span><span>${dose}</span></div>`).join("")}</div>`).join("") + `<div class="detail-section"><h3>练后有氧</h3><div class="detail-line"><span>爬坡 / 游泳 / 水中行走等</span><span>可改可删</span></div></div>`;
    return `<article class="plan-card ${completed.has(plan.id) ? "complete" : ""}" data-plan-card="${plan.id}">
      <div class="plan-card-top">
        <span class="plan-index">${String(index + 1).padStart(2, "0")}</span>
        <div><h2>${plan.name}</h2><p>${completed.has(plan.id) ? "本周已记录过" : plan.subtitle} · 打开后可编辑</p></div>
        <button class="expand-button" type="button" aria-label="展开训练详情" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
      </div>
      <div class="plan-details">${details}<button class="primary-button plan-action" type="button" data-start-plan="${plan.id}">${completed.has(plan.id) ? "再次套用" : "套用并编辑"}</button></div>
    </article>`;
  }).join("");
  document.querySelector("#planList").innerHTML = customCard + templateCards;
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
  const plan = workoutById(planId);
  if (!plan) return;
  activeWorkout = plan;
  document.querySelector("#workoutTag").textContent = plan.tag;
  document.querySelector("#workoutTitle").textContent = plan.id === "custom" ? "填写今日计划" : "编辑今日计划";
  document.querySelector("#workoutNote").value = "";
  const checklist = document.querySelector("#workoutChecklist");
  const items = planExerciseItems(plan);
  const title = plan.id === "custom" ? "今日训练" : plan.name;
  checklist.innerHTML = `
    <section class="check-section plan-editor">
      <h3>当天计划</h3>
      <div class="editor-grid">
        <label class="editor-field full">
          <span>计划名称</span>
          <input type="text" id="sessionNameInput" maxlength="24" value="${escapeHtml(title)}" placeholder="例如 胸肩、游泳、攀岩">
        </label>
        <label class="editor-field">
          <span>训练类型</span>
          <select id="sessionKindInput">
            <option value="strength" ${plan.kind !== "flex" ? "selected" : ""}>力量训练</option>
            <option value="flex" ${plan.kind === "flex" ? "selected" : ""}>自由活动</option>
          </select>
        </label>
        <label class="editor-field">
          <span>总时长</span>
          <div class="input-unit compact"><input type="number" id="sessionDurationInput" min="5" max="480" value="${plan.duration}" inputmode="numeric"><em>分钟</em></div>
        </label>
      </div>
    </section>
    <section class="check-section">
      <div class="section-title-row">
        <h3>运动项目 / 动作</h3>
        <button class="text-button add-exercise-button" type="button" data-add-exercise>+ 添加动作</button>
      </div>
      <div class="exercise-list" id="exerciseList">
        ${items.map((item, index) => exerciseRowMarkup(item, index)).join("")}
      </div>
    </section>
    ${plan.kind === "flex" ? "" : cardioEditorMarkup()}
  `;
  document.querySelector("#workoutModal").hidden = false;
  document.body.style.overflow = "hidden";
  updateSessionProgress();
}

function cardioEditorMarkup() {
  return `<section class="check-section cardio-editor">
    <h3>练后有氧 <small>可选</small></h3>
    <div class="editor-grid">
      <label class="editor-field">
        <span>有氧项目</span>
        <input type="text" id="cardioName" list="cardioChoiceList" maxlength="16" value="${cardioChoices[0]}" placeholder="爬坡 / 游泳">
        <datalist id="cardioChoiceList">${cardioChoices.map((choice) => `<option value="${choice}"></option>`).join("")}</datalist>
      </label>
      <label class="editor-field">
        <span>有氧时长</span>
        <div class="input-unit compact"><input type="number" id="cardioDuration" min="0" max="180" value="30" inputmode="numeric"><em>分钟</em></div>
      </label>
    </div>
  </section>`;
}

function exerciseRowMarkup(item = {}, index = Date.now()) {
  return `<div class="exercise-row" data-exercise-row>
    <label class="exercise-check" aria-label="标记完成">
      <input type="checkbox" class="exercise-done" ${item.done ? "checked" : ""}>
      <span class="check-mark"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span>
    </label>
    <label class="exercise-input">
      <span>运动项目</span>
      <input type="text" data-exercise-name maxlength="32" value="${escapeHtml(item.name || "")}" placeholder="${index === 0 ? "例如 杠铃卧推" : "运动项目"}">
    </label>
    <label class="exercise-input detail">
      <span>具体动作 / 组次</span>
      <input type="text" data-exercise-detail maxlength="60" value="${escapeHtml(item.detail || "")}" placeholder="例如 4×8 / 60kg / RPE 8">
    </label>
    <button class="icon-button row-delete" type="button" data-remove-exercise aria-label="删除动作">
      <svg viewBox="0 0 24 24"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-3h4l1 3M8 7v13h8V7"/></svg>
    </button>
  </div>`;
}

function addExerciseRow() {
  document.querySelector("#exerciseList")?.insertAdjacentHTML("beforeend", exerciseRowMarkup({ name: "", detail: "", done: false }));
  updateSessionProgress();
}

function removeExerciseRow(button) {
  const list = document.querySelector("#exerciseList");
  const rows = [...list.querySelectorAll("[data-exercise-row]")];
  const row = button.closest("[data-exercise-row]");
  if (rows.length <= 1) {
    row.querySelectorAll("input[type='text']").forEach((input) => { input.value = ""; });
    row.querySelector(".exercise-done").checked = false;
  } else {
    row.remove();
  }
  updateSessionProgress();
}

function updateSessionProgress() {
  if (!activeWorkout) return;
  const rows = [...document.querySelectorAll("[data-exercise-row]")];
  const filledRows = rows.filter((row) => row.querySelector("[data-exercise-name]").value.trim());
  const total = filledRows.length || rows.length;
  const done = filledRows.filter((row) => row.querySelector(".exercise-done").checked).length;
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
  const name = document.querySelector("#sessionNameInput").value.trim();
  const kind = document.querySelector("#sessionKindInput").value;
  const duration = Number(document.querySelector("#sessionDurationInput").value);
  const items = [...document.querySelectorAll("[data-exercise-row]")].map((row) => ({
    name: row.querySelector("[data-exercise-name]").value.trim(),
    detail: row.querySelector("[data-exercise-detail]").value.trim(),
    done: row.querySelector(".exercise-done").checked
  })).filter((item) => item.name);
  const completedItems = items.filter((item) => item.done);
  if (!name) {
    showToast("先给今天的计划起个名字");
    return;
  }
  if (!duration || duration < 5) {
    showToast("请填写至少 5 分钟的训练时长");
    return;
  }
  if (!items.length) {
    showToast("至少填写一个运动项目");
    return;
  }
  const cardioName = document.querySelector("#cardioName")?.value.trim();
  const cardioMinutes = Math.max(0, Number(document.querySelector("#cardioDuration")?.value) || 0);
  const details = [`${completedItems.length}/${items.length} 项已完成`];
  if (kind === "strength" && cardioName && cardioMinutes > 0) details.push(`${cardioName} ${cardioMinutes} 分钟`);
  state.records.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    planId: activeWorkout.id,
    kind,
    date: localDateKey(),
    createdAt: Date.now(),
    name,
    duration,
    details: details.join(" · "),
    items,
    cardio: kind === "strength" && cardioName && cardioMinutes > 0 ? { name: cardioName, minutes: cardioMinutes } : null,
    sourceName: activeWorkout.id === "custom" ? null : activeWorkout.name,
    note: document.querySelector("#workoutNote").value.trim(),
  });
  saveState();
  closeWorkout();
  renderAll();
  showToast("打卡成功，今天的努力已记录");
}

function historyItemsMarkup(record) {
  if (!Array.isArray(record.items) || !record.items.length) return "";
  const visible = record.items.slice(0, 6);
  const rows = visible.map((item) => `<li class="${item.done ? "done" : ""}">
    <span>${item.done ? "✓" : "•"}</span>
    <p><strong>${escapeHtml(item.name)}</strong>${item.detail ? `<em>${escapeHtml(item.detail)}</em>` : ""}</p>
  </li>`).join("");
  const more = record.items.length > visible.length
    ? `<li class="more"><span>+</span><p>还有 ${record.items.length - visible.length} 项</p></li>`
    : "";
  return `<ul class="history-items">${rows}${more}</ul>`;
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
    <div class="history-item-main"><div><h3>${escapeHtml(record.name)}</h3><p>${escapeHtml(record.details || "")}</p></div><strong>${record.duration} 分钟</strong></div>
    ${historyItemsMarkup(record)}
    ${record.note ? `<p class="history-note">“${escapeHtml(record.note)}”</p>` : ""}
  </article>`).join("") : `<div class="empty-state"><strong>这里还很安静</strong><p>完成一次训练后，记录会按时间排列。</p></div>`;
}

function escapeHtml(value = "") {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function calculateStreak() {
  if (!state.records.length) return 0;
  const weeklyCounts = new Map();
  state.records.forEach((record) => {
    const monday = localDateKey(startOfWeek(new Date(`${record.date}T12:00:00`)));
    weeklyCounts.set(monday, (weeklyCounts.get(monday) || 0) + 1);
  });
  let streak = 0;
  let cursor = startOfWeek();
  // Current week can count while in progress; past weeks require at least 3 sessions.
  for (let index = 0; index < 52; index += 1) {
    const count = weeklyCounts.get(localDateKey(cursor)) || 0;
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

    const addButton = event.target.closest("[data-add-exercise]");
    if (addButton) addExerciseRow();

    const removeButton = event.target.closest("[data-remove-exercise]");
    if (removeButton) removeExerciseRow(removeButton);

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
  document.querySelector("#workoutChecklist").addEventListener("input", updateSessionProgress);
  document.querySelector("#workoutChecklist").addEventListener("change", updateSessionProgress);

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
