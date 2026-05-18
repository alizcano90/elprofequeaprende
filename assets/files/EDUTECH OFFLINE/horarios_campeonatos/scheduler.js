import { byThenBy, buildPairKey, groupBy, toIntSafe } from "./utils.js";

function indexBy(items, key) {
  const map = new Map();
  items.forEach((item) => map.set(item[key], item));
  return map;
}

export function validateWorkbookData(data) {
  const errors = [];
  const warnings = [];

  const categoriasById = indexBy(data.categorias, "categoria_id");
  const tecnicosById = indexBy(data.tecnicos, "tecnico_id");
  const equiposById = indexBy(data.equipos, "equipo_id");

  if (categoriasById.size !== data.categorias.length) errors.push("Hay categorías repetidas por ID.");
  if (tecnicosById.size !== data.tecnicos.length) errors.push("Hay técnicos repetidos por ID.");
  if (equiposById.size !== data.equipos.length) errors.push("Hay equipos repetidos por ID.");

  data.equipos.forEach((team) => {
    if (!team.categoria_id || !categoriasById.has(team.categoria_id)) {
      errors.push(`Equipo ${team.equipo_id} no tiene categoría válida.`);
    }
    if (!team.tecnico_id || !tecnicosById.has(team.tecnico_id)) {
      errors.push(`Equipo ${team.equipo_id} no tiene técnico válido.`);
    }
  });

  data.horarios.forEach((slot) => {
    if (!slot.slot_id) errors.push("Existe un horario sin slot_id.");
    if (!slot.hora || !/^\d{2}:\d{2}$/.test(slot.hora)) {
      errors.push(`Horario inválido en slot ${slot.slot_id || "(sin ID)"}.`);
    }
    if (!slot.cancha) errors.push(`Horario ${slot.slot_id || "(sin ID)"} no tiene cancha.`);
  });

  const teamsByCategory = groupBy(data.equipos, "categoria_id");
  data.categorias.forEach((cat) => {
    const count = (teamsByCategory.get(cat.categoria_id) || []).length;
    if (count < 2) {
      warnings.push(`La categoría ${cat.categoria_nombre} tiene menos de 2 equipos.`);
    }
  });

  return { errors, warnings };
}

export function buildRelations(data) {
  return {
    categoriasById: indexBy(data.categorias, "categoria_id"),
    tecnicosById: indexBy(data.tecnicos, "tecnico_id"),
    equiposById: indexBy(data.equipos, "equipo_id"),
    teamsByCategory: groupBy(data.equipos, "categoria_id")
  };
}

export function generateRoundRobinMatches(teamsByCategory) {
  const matches = [];
  for (const [categoriaId, teams] of teamsByCategory.entries()) {
    const ordered = [...teams].sort((a, b) => a.equipo_nombre.localeCompare(b.equipo_nombre));
    for (let i = 0; i < ordered.length; i += 1) {
      for (let j = i + 1; j < ordered.length; j += 1) {
        matches.push({
          categoria_id: categoriaId,
          equipo_local_id: ordered[i].equipo_id,
          equipo_visitante_id: ordered[j].equipo_id,
          key: buildPairKey(ordered[i].equipo_id, ordered[j].equipo_id)
        });
      }
    }
  }
  return matches;
}

export function filterPlayedMatches(matches, playedMatches) {
  const playedKeys = new Set(playedMatches.map((m) => buildPairKey(m.equipo_local_id, m.equipo_visitante_id)));
  return matches.filter((m) => !playedKeys.has(m.key));
}

function sortSlots(slots) {
  return [...slots]
    .filter((slot) => slot.disponible)
    .sort(byThenBy((s) => toIntSafe(s.hora.replace(":", "")), (s) => s.cancha.toLowerCase(), (s) => s.slot_id));
}

function buildMatchContext(match, relations) {
  const localTeam = relations.equiposById.get(match.equipo_local_id);
  const awayTeam = relations.equiposById.get(match.equipo_visitante_id);
  return {
    ...match,
    equipoLocal: localTeam,
    equipoVisitante: awayTeam,
    tecnicoLocalId: localTeam?.tecnico_id || "",
    tecnicoVisitanteId: awayTeam?.tecnico_id || ""
  };
}

function canAssignAtHour(matchCtx, hour, usageByHour) {
  const usage = usageByHour.get(hour);
  if (!usage) return { ok: true, reason: "" };

  if (usage.teams.has(matchCtx.equipo_local_id) || usage.teams.has(matchCtx.equipo_visitante_id)) {
    return { ok: false, reason: "conflicto de equipo" };
  }
  if (
    (matchCtx.tecnicoLocalId && usage.coaches.has(matchCtx.tecnicoLocalId)) ||
    (matchCtx.tecnicoVisitanteId && usage.coaches.has(matchCtx.tecnicoVisitanteId))
  ) {
    return { ok: false, reason: "conflicto de técnico" };
  }
  return { ok: true, reason: "" };
}

function useAtHour(matchCtx, slot, usageByHour) {
  const usage = usageByHour.get(slot.hora) || { teams: new Set(), coaches: new Set() };
  usage.teams.add(matchCtx.equipo_local_id);
  usage.teams.add(matchCtx.equipo_visitante_id);
  if (matchCtx.tecnicoLocalId) usage.coaches.add(matchCtx.tecnicoLocalId);
  if (matchCtx.tecnicoVisitanteId) usage.coaches.add(matchCtx.tecnicoVisitanteId);
  usageByHour.set(slot.hora, usage);
}

export function assignMatchesToSlots(matches, slots, relations) {
  const usableSlots = sortSlots(slots);
  const remainingSlots = [...usableSlots];
  const scheduled = [];
  const unscheduled = [];
  const usageByHour = new Map();

  const withPriority = [...matches]
    .map((match) => buildMatchContext(match, relations))
    .sort(
      byThenBy(
        (m) => m.categoria_id,
        (m) => m.tecnicoLocalId,
        (m) => m.tecnicoVisitanteId,
        (m) => m.equipo_local_id,
        (m) => m.equipo_visitante_id
      )
    );

  for (const match of withPriority) {
    if (!match.equipoLocal || !match.equipoVisitante) {
      unscheduled.push({ ...match, motivo: "datos incompletos" });
      continue;
    }

    let assignedIndex = -1;
    let conflictReason = "sin horario disponible";

    for (let i = 0; i < remainingSlots.length; i += 1) {
      const slot = remainingSlots[i];
      const check = canAssignAtHour(match, slot.hora, usageByHour);
      if (check.ok) {
        assignedIndex = i;
        break;
      }
      conflictReason = check.reason || conflictReason;
    }

    if (assignedIndex >= 0) {
      const slot = remainingSlots.splice(assignedIndex, 1)[0];
      useAtHour(match, slot, usageByHour);
      scheduled.push({ ...match, slot_id: slot.slot_id, hora: slot.hora, cancha: slot.cancha, observaciones: "" });
    } else {
      unscheduled.push({ ...match, motivo: conflictReason || "sin horario disponible" });
    }
  }

  return { scheduled, unscheduled, usedSlotsCount: scheduled.length, totalSlots: usableSlots.length };
}

export function detectConflicts(scheduled) {
  const conflicts = [];
  const teamUsage = new Map();
  const coachUsage = new Map();

  scheduled.forEach((match, idx) => {
    const refs = [
      { key: `${match.hora}::${match.equipo_local_id}`, type: "Equipo", id: match.equipo_local_id },
      { key: `${match.hora}::${match.equipo_visitante_id}`, type: "Equipo", id: match.equipo_visitante_id },
      { key: `${match.hora}::${match.tecnicoLocalId}`, type: "Técnico", id: match.tecnicoLocalId },
      { key: `${match.hora}::${match.tecnicoVisitanteId}`, type: "Técnico", id: match.tecnicoVisitanteId }
    ];

    refs.forEach((entry) => {
      if (!entry.id) return;
      const bucket = entry.type === "Equipo" ? teamUsage : coachUsage;
      const existing = bucket.get(entry.key);
      if (existing != null && existing !== idx) {
        conflicts.push({ tipo: `Conflicto de ${entry.type.toLowerCase()}`, hora: match.hora, entidad: entry.id, partidos: [existing, idx] });
      } else {
        bucket.set(entry.key, idx);
      }
    });
  });

  return conflicts;
}

export function summarizeCategoryStats(data, relations, pending) {
  const pendingByCategory = groupBy(pending, "categoria_id");

  return data.categorias.map((cat) => {
    const teams = relations.teamsByCategory.get(cat.categoria_id) || [];
    const totalPossible = (teams.length * (teams.length - 1)) / 2;
    return {
      ...cat,
      totalEquipos: teams.length,
      totalPartidosPosibles: totalPossible,
      totalPendientes: (pendingByCategory.get(cat.categoria_id) || []).length
    };
  });
}

export function createSchedulerResult(data) {
  const relations = buildRelations(data);
  const allMatches = generateRoundRobinMatches(relations.teamsByCategory);
  const pendingMatches = allMatches;
  const assignment = assignMatchesToSlots(pendingMatches, data.horarios, relations);
  const conflicts = detectConflicts(assignment.scheduled);

  return {
    relations,
    allMatches,
    pendingMatches,
    scheduled: assignment.scheduled,
    unscheduled: assignment.unscheduled,
    conflicts,
    capacity: {
      usedSlots: assignment.usedSlotsCount,
      totalSlots: assignment.totalSlots
    }
  };
}

export function createSchedulerResultFromRequested(data, requestedMatches) {
  const relations = buildRelations(data);
  const dedupe = new Set();

  const normalizedRequested = requestedMatches
    .map((m) => ({
      categoria_id: m.categoria_id,
      equipo_local_id: m.equipo_local_id,
      equipo_visitante_id: m.equipo_visitante_id,
      requested_date: m.requested_date || data.config.fecha || "",
      key: buildPairKey(m.equipo_local_id, m.equipo_visitante_id)
    }))
    .filter((m) => {
      if (!m.categoria_id || !m.equipo_local_id || !m.equipo_visitante_id) return false;
      if (m.equipo_local_id === m.equipo_visitante_id) return false;
      if (dedupe.has(m.key)) return false;
      dedupe.add(m.key);
      return true;
    });

  const pendingMatches = normalizedRequested;
  const assignment = assignMatchesToSlots(pendingMatches, data.horarios, relations);
  const conflicts = detectConflicts(assignment.scheduled);

  return {
    relations,
    allMatches: normalizedRequested,
    pendingMatches,
    scheduled: assignment.scheduled.map((m) => ({ ...m, fecha_programada: m.requested_date || data.config.fecha || "" })),
    unscheduled: assignment.unscheduled,
    conflicts,
    capacity: {
      usedSlots: assignment.usedSlotsCount,
      totalSlots: assignment.totalSlots
    }
  };
}

export function tryManualReassign(scheduleItem, targetSlot, schedule, relations) {
  const withoutCurrent = schedule.filter((s) => s !== scheduleItem);
  const slotAlreadyUsed = withoutCurrent.some((item) => item.slot_id === targetSlot.slot_id);
  if (slotAlreadyUsed) {
    return { ok: false, reason: "slot ya ocupado por otro partido" };
  }

  const checker = assignMatchesToSlots(
    [
      {
        categoria_id: scheduleItem.categoria_id,
        equipo_local_id: scheduleItem.equipo_local_id,
        equipo_visitante_id: scheduleItem.equipo_visitante_id,
        key: buildPairKey(scheduleItem.equipo_local_id, scheduleItem.equipo_visitante_id)
      }
    ],
    [targetSlot],
    relations
  );

  if (!checker.scheduled.length) {
    return { ok: false, reason: checker.unscheduled[0]?.motivo || "conflicto manual al editar" };
  }

  const tentative = [...withoutCurrent, { ...scheduleItem, slot_id: targetSlot.slot_id, hora: targetSlot.hora, cancha: targetSlot.cancha }];
  const conflicts = detectConflicts(tentative);
  if (conflicts.length) {
    return { ok: false, reason: "conflicto manual al editar" };
  }

  return { ok: true, updated: tentative };
}
