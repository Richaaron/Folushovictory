export function gradeForTotal(total, scale) {
  const grades = Array.isArray(scale?.grades) ? scale.grades : [];
  for (const g of grades) {
    const min = Number(g.min);
    const max = Number(g.max);
    if (Number.isFinite(min) && Number.isFinite(max) && total >= min && total <= max) {
      return { letter: String(g.letter || ""), remark: String(g.remark || "") };
    }
  }
  return { letter: "", remark: "" };
}

export function computePositions(items) {
  const sorted = [...items].sort((a, b) => b.average - a.average);
  let lastAvg = null;
  let lastPos = 0;
  return sorted.map((x, idx) => {
    if (lastAvg === null || x.average !== lastAvg) {
      lastPos = idx + 1;
      lastAvg = x.average;
    }
    return { ...x, position: lastPos };
  });
}

export function numericBroadsheet({ students, subjects, scoresByKey, scale, level }) {
  const subjectIds = subjects.map((s) => s.id);
  const l = String(level || "").toUpperCase();
  const isSSS = l.includes("SSS");

  const rows = students.map((st) => {
    const perSubject = subjectIds.map((subjectId) => {
      const key = `${st.studentId}_${subjectId}`;
      const sc = scoresByKey.get(key);
      const ca = Number(sc?.ca || 0);
      const exam = Number(sc?.exam || 0);
      const total = ca + exam;
      const g = gradeForTotal(total, scale);
      return {
        subjectId,
        subjectName: subjects.find((s) => s.id === subjectId)?.name || subjectId,
        ca,
        exam,
        total,
        grade: g.letter,
        remark: g.remark
      };
    });
    const sum = perSubject.reduce((acc, p) => acc + p.total, 0);
    const average = subjectIds.length ? Number((sum / subjectIds.length).toFixed(2)) : 0;
    
    return {
      studentId: st.studentId,
      firstName: st.firstName,
      lastName: st.lastName,
      perSubject,
      total: sum,
      average: isSSS ? null : average
    };
  });

  if (isSSS) {
    return {
      subjects,
      students: rows.map(r => ({ ...r, position: null }))
    };
  }

  const ranked = computePositions(rows);
  const byId = new Map(ranked.map((r) => [r.studentId, r]));
  return {
    subjects,
    students: students.map((s) => byId.get(s.studentId))
  };
}

export function traitSheet({ students, subjects, scoresByKey }) {
  const subjectIds = subjects.map((s) => s.id);
  const rows = students.map((st) => {
    const perSubject = subjectIds.map((subjectId) => {
      const key = `${st.studentId}_${subjectId}`;
      const sc = scoresByKey.get(key);
      const rating = sc?.rating || "";
      return {
        subjectId,
        subjectName: subjects.find((s) => s.id === subjectId)?.name || subjectId,
        rating
      };
    });
    return {
      studentId: st.studentId,
      firstName: st.firstName,
      lastName: st.lastName,
      perSubject
    };
  });

  return { subjects, students: rows };
}

