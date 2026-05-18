const teams = [];
let schedule = [];

const teamForm = document.getElementById("teamForm");
const teamName = document.getElementById("teamName");
const teamCoach = document.getElementById("teamCoach");
const teamTime = document.getElementById("teamTime");
const teamCategory = document.getElementById("teamCategory");
const categoryAlternate = document.getElementById("categoryAlternate");
const generateBtn = document.getElementById("generateBtn");
const teamsTableBody = document.getElementById("teamsTableBody");
const scheduleTableBody = document.getElementById("scheduleTableBody");
const teamsEmpty = document.getElementById("teamsEmpty");
const scheduleEmpty = document.getElementById("scheduleEmpty");
const message = document.getElementById("message");

function normalizeText(value) {
  return String(value || "").trim();
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#9b2d2d" : "#356644";
}

function renderTeams() {
  teamsTableBody.innerHTML = "";
  teamsEmpty.style.display = teams.length ? "none" : "block";

  teams.forEach((team, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${team.name}</td>
      <td>${team.coach}</td>
      <td>${team.time}</td>
      <td>${team.category}</td>
      <td>${team.alternate ? "Si" : "No"}</td>
      <td><button type="button" class="btn" data-delete="${index}">Eliminar</button></td>
    `;
    teamsTableBody.appendChild(tr);
  });
}

function renderSchedule() {
  scheduleTableBody.innerHTML = "";
  scheduleEmpty.style.display = schedule.length ? "none" : "block";

  schedule.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.time}</td>
      <td>${item.category}</td>
      <td>${item.teamA}</td>
      <td>${item.teamB}</td>
      <td>${item.detail}</td>
    `;
    scheduleTableBody.appendChild(tr);
  });
}

function buildSchedule() {
  const byCategory = new Map();

  teams.forEach((team) => {
    const list = byCategory.get(team.category) || [];
    list.push(team);
    byCategory.set(team.category, list);
  });

  const output = [];

  for (const [category, categoryTeams] of byCategory.entries()) {
    const sorted = [...categoryTeams].sort((a, b) => a.time.localeCompare(b.time));

    for (let i = 0; i < sorted.length; i += 2) {
      const teamA = sorted[i];
      const teamB = sorted[i + 1];
      const hour = teamA?.time || "--:--";

      if (teamB) {
        output.push({
          time: hour,
          category,
          teamA: `${teamA.name} (${teamA.coach})`,
          teamB: `${teamB.name} (${teamB.coach})`,
          detail: "Partido"
        });
      } else {
        output.push({
          time: hour,
          category,
          teamA: `${teamA.name} (${teamA.coach})`,
          teamB: "Libre",
          detail: teamA.alternate ? "Alternativo habilitado" : "Sin rival"
        });
      }
    }
  }

  return output.sort((a, b) => a.time.localeCompare(b.time) || a.category.localeCompare(b.category));
}

teamForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = normalizeText(teamName.value);
  const coach = normalizeText(teamCoach.value);
  const time = normalizeText(teamTime.value);
  const category = normalizeText(teamCategory.value);
  const alternate = categoryAlternate.checked;

  if (!name || !coach || !time || !category) {
    setMessage("Completa todos los campos.", true);
    return;
  }

  const existingCategory = teams.find((team) => team.category.toLowerCase() === category.toLowerCase());
  const categoryAlternateValue = existingCategory ? existingCategory.alternate : alternate;

  if (existingCategory && alternate !== existingCategory.alternate) {
    setMessage("La categoria ya tenia configurado alternativo; se mantuvo ese valor.");
  } else {
    setMessage("Equipo agregado.");
  }

  teams.push({ name, coach, time, category, alternate: categoryAlternateValue });
  schedule = [];

  renderTeams();
  renderSchedule();

  teamForm.reset();
});

teamsTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-delete]");
  if (!button) return;

  const index = Number(button.dataset.delete);
  if (!Number.isInteger(index)) return;

  teams.splice(index, 1);
  schedule = [];
  renderTeams();
  renderSchedule();
  setMessage("Equipo eliminado.");
});

generateBtn.addEventListener("click", () => {
  if (teams.length < 2) {
    setMessage("Debes registrar al menos 2 equipos para generar horario.", true);
    return;
  }

  schedule = buildSchedule();
  renderSchedule();
  setMessage(`Horario generado con ${schedule.length} bloque(s).`);
});

renderTeams();
renderSchedule();
