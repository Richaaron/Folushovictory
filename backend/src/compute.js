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
    // For SSS, filter subjects based on the student's stream
    const studentStream = String(st.stream || "").toUpperCase();
    const studentSubjects = subjects.filter((sub) => {
      if (!isSSS) return true;
      
      const subTrack = String(sub.track || "").toUpperCase();
      if (!subTrack || subTrack === "GENERAL") return true;
      
      if (studentStream === "SCIENCE") {
        return subTrack === "SCIENCE" || ["CHEMISTRY", "PHYSICS"].includes(String(sub.name).toUpperCase());
      }
      if (studentStream === "ART") {
        return subTrack === "ART" || ["GOVERNMENT", "LITERATURE IN ENGLISH"].includes(String(sub.name).toUpperCase());
      }
      if (studentStream === "COMMERCIAL") {
        return subTrack === "COMMERCIAL" || ["ACCOUNTING", "FINANCIAL ACCOUNTING", "COMMERCE", "COMMERCIAL"].includes(String(sub.name).toUpperCase());
      }
      
      return false;
    });

    const perSubject = studentSubjects.map((sub) => {
      const subjectId = sub.id;
      const key = `${st.id}_${subjectId}`;
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
        subjectName: sub.name,
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
    const average = studentSubjects.length ? Number((sum / studentSubjects.length).toFixed(2)) : 0;
    
    const scores = {};
    perSubject.forEach(ps => {
      scores[ps.subjectId] = ps;
    });

    return {
      studentId: st.id,
      firstName: st.firstName,
      lastName: st.lastName,
      scores,
      perSubject, // Keep for backward compatibility or other uses
      total: sum,
      average: average
    };
  });

  // Step 2: Compute Position in Subject for JSS, SSS, and Primary levels
  const hasSubjectPositions = isSecondary || l.includes("PRIMARY") || l.includes("PRY");
  if (hasSubjectPositions) {
    subjectIds.forEach(subId => {
      const subjectScores = rows.map(r => {
        const ps = r.perSubject.find(ps => ps.subjectId === subId);
        return { 
          studentId: r.studentId,
          total: ps ? ps.total : 0
        };
      });
      const rankedSub = computeSubjectPositions(subjectScores);
      const posMap = new Map(rankedSub.map(rs => [rs.studentId, rs.subjectPosition]));
      
      rows.forEach(r => {
        const ps = r.perSubject.find(ps => ps.subjectId === subId);
        if (ps) {
          ps.subjectPosition = posMap.get(r.studentId);
        }
      });
    });
  }

  // Step 3: Compute Overall Positions
  const ranked = computePositions(rows);
  const byId = new Map(ranked.map((r) => [r.studentId, r]));
  
  return {
    subjects,
    students: students.map((s) => byId.get(s.id)).filter(Boolean)
  };
}

export function traitSheet({ students, subjects, scoresByKey }) {
  const subjectIds = subjects.map((s) => s.id);
  const rows = students.map((st) => {
    const perSubject = subjectIds.map((subjectId) => {
      const key = `${st.id}_${subjectId}`;
      const sc = scoresByKey.get(key);
      const rating = sc?.rating || "";
      return {
        subjectId,
        subjectName: subjects.find((s) => s.id === subjectId)?.name || subjectId,
        rating
      };
    });
    return {
      studentId: st.id,
      firstName: st.firstName,
      lastName: st.lastName,
      perSubject
    };
  });

  return { subjects, students: rows };
}

