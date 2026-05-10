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

export function computeSubjectPositions(items) {
  const sorted = [...items].sort((a, b) => b.total - a.total);
  let lastTotal = null;
  let lastPos = 0;
  return sorted.map((x, idx) => {
    if (lastTotal === null || x.total !== lastTotal) {
      lastPos = idx + 1;
      lastTotal = x.total;
    }
    return { ...x, subjectPosition: lastPos };
  });
}

export function numericBroadsheet({ students, subjects, scoresByKey, scale, level }) {
  const subjectIds = subjects.map((s) => s.id);
  const l = String(level || "").toUpperCase();
  const isSSS = l.includes("SSS");
  const isSecondary = l.includes("JSS") || l.includes("SSS");

  // Step 1: Compute basic rows with totals and averages
  const rows = students.map((st) => {
    const perSubject = subjectIds.map((subjectId) => {
      const key = `${st.studentId}_${subjectId}`;
      const sc = scoresByKey.get(key);
      const ca1 = Number(sc?.ca1 || 0);
      const ca2 = Number(sc?.ca2 || 0);
      const ca = Number(sc?.ca || (ca1 + ca2));
      const exam = Number(sc?.exam || 0);
      const total = ca + exam;
      const g = gradeForTotal(total, scale);

      let automatedComment = "";
      if (!isSecondary && total > 0) {
        if (total >= 80) automatedComment = "Outstanding performance, keep it up!";
        else if (total >= 70) automatedComment = "Excellent result, very impressive.";
        else if (total >= 60) automatedComment = "Very good performance, good job.";
        else if (total >= 50) automatedComment = "Good result, can be better.";
        else if (total >= 40) automatedComment = "Fair performance, needs improvement.";
        else automatedComment = "Poor performance, requires urgent attention.";
      }

      return {
        subjectId,
        subjectName: subjects.find((s) => s.id === subjectId)?.name || subjectId,
        ca1,
        ca2,
        ca,
        exam,
        total,
        grade: g.letter,
        remark: isSecondary ? g.remark : automatedComment
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

  // Step 2: Compute Position in Subject for Secondary (JSS & SSS)
  if (isSecondary) {
    subjectIds.forEach(subId => {
      const subjectScores = rows.map(r => ({ 
        studentId: r.studentId, 
        total: r.perSubject.find(ps => ps.subjectId === subId).total 
      }));
      const rankedSub = computeSubjectPositions(subjectScores);
      const posMap = new Map(rankedSub.map(rs => [rs.studentId, rs.subjectPosition]));
      
      rows.forEach(r => {
        const ps = r.perSubject.find(ps => ps.subjectId === subId);
        ps.subjectPosition = posMap.get(r.studentId);
      });
    });
  }

  // Step 3: Compute Overall Positions (Pre-Nursery to JSS 3)
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

