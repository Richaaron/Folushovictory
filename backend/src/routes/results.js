import express from "express";
import { Roles } from "../constants.js";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { getClassById } from "../repos/classes.js";
import { listStudentsByClass, getStudentById } from "../repos/students.js";
import { listScoresForClass, listScoresForStudent } from "../repos/scores.js";
import { getGradingScale, getTermMeta, getSchoolSettings } from "../repos/config.js";
import { gradeForTotal, numericBroadsheet, traitSheet } from "../compute.js";
import { listSubjects, getSubjectById } from "../repos/subjects.js";
import { getRemarks } from "../repos/remarks.js";
import { getPublish } from "../repos/publishes.js";
import { listAssignmentsByTeacher } from "../repos/assignments.js";
import { getUserByUsername } from "../repos/users.js";
import { getReleaseStatus } from "../repos/releases.js";

export const resultsRouter = express.Router();

resultsRouter.use(authRequired);

async function subjectsForClass(cls) {
  if (Array.isArray(cls.subjectIds) && cls.subjectIds.length) {
    const subs = await Promise.all(cls.subjectIds.map((id) => getSubjectById(id)));
    return subs.filter(Boolean).map((s) => ({ id: s.id, name: s.name }));
  }
  
  const all = await listSubjects();
  // Map class level codes to subject level names
  let levelFilter = cls.level;
  if (levelFilter === 'PRY') levelFilter = 'Primary';
  
  // Filter by level
  let filtered = all.filter(s => s.level === levelFilter);
  
  // For SSS (Senior Secondary), apply track filtering
  if (levelFilter === 'SSS' && cls.track) {
    // Include general subjects and track-specific subjects
    filtered = filtered.filter(s => 
      s.track === 'General' || s.track === cls.track
    );
  }
  
  // If no subjects assigned, return subjects matching the class level (and track if applicable)
  // to avoid showing JSS subjects in SSS sheets and vice versa
  return filtered.map((s) => ({ id: s.id, name: s.name }));
}

function generatedPerformanceRemarks(result) {
  const average = Number(result?.average);

  if (!Number.isFinite(average) || average <= 0) {
    return {
      teacherRemark: "Performance remark will be available when the student's scores have been completed.",
      principalRemark: "Academic performance is awaiting complete score entry and verification."
    };
  }

  if (average >= 90) {
    return {
      teacherRemark: "An outstanding performance. The student has shown excellent mastery and should keep up this exceptional standard.",
      principalRemark: "A distinguished result. The student is highly commended for excellent academic performance."
    };
  }

  if (average >= 80) {
    return {
      teacherRemark: "An excellent result. The student is focused, consistent, and should maintain this impressive performance.",
      principalRemark: "A very commendable performance. The student should continue with the same level of commitment."
    };
  }

  if (average >= 70) {
    return {
      teacherRemark: "A very good performance. The student has done well and can achieve even more with steady effort.",
      principalRemark: "A strong result. The student is encouraged to work harder for greater excellence."
    };
  }

  if (average >= 60) {
    return {
      teacherRemark: "A good performance. The student should pay closer attention to weaker subjects and keep improving.",
      principalRemark: "A good result. More consistent study will help the student reach a higher standard."
    };
  }

  if (average >= 50) {
    return {
      teacherRemark: "A fair performance. The student needs more concentration, regular practice, and closer supervision.",
      principalRemark: "A satisfactory result, but there is clear room for improvement through greater effort."
    };
  }

  if (average >= 40) {
    return {
      teacherRemark: "Performance is below expectation. The student should revise regularly and seek help in difficult subjects.",
      principalRemark: "The student is advised to improve study habits and work closely with teachers for better results."
    };
  }

  return {
    teacherRemark: "Performance requires urgent improvement. The student needs serious attention, guided study, and consistent practice.",
    principalRemark: "This result calls for urgent academic support. The student should be closely guided for improvement."
  };
}

resultsRouter.get(
  "/class/:classId/broadsheet",
  asyncHandler(async (req, res) => {
    if (req.user.role !== Roles.ADMIN) return res.status(403).json({ error: "Forbidden" });
    const { classId } = req.params;
    const { session, term } = req.query;
    if (!session || !term) return res.status(400).json({ error: "Missing session/term" });

    const cls = await getClassById(classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });

    const [students, subjects, scores, scale, publish] = await Promise.all([
      listStudentsByClass(classId),
      subjectsForClass(cls),
      listScoresForClass({ session: String(session), term: String(term), classId }),
      getGradingScale(),
      getPublish({ classId, session: String(session), term: String(term) })
    ]);

    const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));

    const sheet =
      String(cls.assessmentType).toUpperCase() === "TRAIT"
        ? traitSheet({ students, subjects, scoresByKey })
        : numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

    if (row && String(cls.assessmentType).toUpperCase() !== "TRAIT") {
      const overall = gradeForTotal(Number(row.average || 0), scale);
      row.overallGrade = overall.letter || "";
      row.overallGradeRemark = overall.remark || "";
    }

    const autoRemarks = generatedPerformanceRemarks(row);

    return res.json({
      class: { id: cls.id, name: cls.name, level: cls.level, track: cls.track || null, assessmentType: cls.assessmentType },
      session: String(session),
      term: String(term),
      published: Boolean(publish),
      ...sheet
    });
  })
);

resultsRouter.get(
  "/student/:studentId/report",
  asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { session, term } = req.query;
    if (!session || !term) return res.status(400).json({ error: "Missing session/term" });

    const student = await getStudentById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (req.user.role === Roles.PARENT) {
      if (!req.user.studentId || req.user.studentId !== studentId) return res.status(403).json({ error: "Forbidden" });
    }

    const cls = await getClassById(student.classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });

    if (req.user.role === Roles.TEACHER) {
      const assignments = await listAssignmentsByTeacher(req.user.username);
      const assignedToClass = assignments.some((a) => a.classId === student.classId);
      const isFormTeacher = cls.formTeacherUsername === req.user.username;
      if (!assignedToClass && !isFormTeacher) return res.status(403).json({ error: "Forbidden" });
    }

    const [subjects, scale, remarks, meta, publish, school, release] = await Promise.all([
      subjectsForClass(cls),
      getGradingScale(),
      getRemarks({ session: String(session), term: String(term), studentId }),
      getTermMeta({ session: String(session), term: String(term) }),
      getPublish({ classId: student.classId, session: String(session), term: String(term) }),
      getSchoolSettings(),
      getReleaseStatus({ session: String(session), term: String(term), studentId })
    ]);

    const isReleased = release.released;

    let formTeacher = null;
    if (cls.formTeacherUsername) {
      formTeacher = await getUserByUsername(cls.formTeacherUsername);
    }

    let row;
    let cumulative = null;
    
    if (String(cls.assessmentType).toUpperCase() === "TRAIT") {
      const scores = await listScoresForStudent({ session: String(session), term: String(term), studentId });
      const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
      row = traitSheet({ students: [student], subjects, scoresByKey }).students[0];
    } else {
      const scores = await listScoresForClass({ session: String(session), term: String(term), classId: student.classId });
      const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
      const studentsInClass = await listStudentsByClass(student.classId);
      const sheet = numericBroadsheet({ students: studentsInClass, subjects, scoresByKey, scale, level: cls.level });
      row = sheet.students.find((s) => s.studentId === studentId);

      // Cumulative Logic
      if (term === "2nd" || term === "3rd") {
        const termsToFetch = term === "2nd" ? ["1st"] : ["1st", "2nd"];
        const prevResults = await Promise.all(termsToFetch.map(async (t) => {
            const pScores = await listScoresForClass({ session: String(session), term: t, classId: student.classId });
            const pScoresByKey = new Map(pScores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
            const pSheet = numericBroadsheet({ students: studentsInClass, subjects, scoresByKey: pScoresByKey, scale, level: cls.level });
            return { term: t, result: pSheet.students.find((s) => s.studentId === studentId) };
        }));
        
        cumulative = {
            previousTerms: prevResults.filter(r => !!r.result).map(r => ({
                term: r.term,
                total: r.result.total,
                average: r.result.average
            }))
        };
        
        if (cumulative.previousTerms.length > 0 && row) {
            const allTotals = [...cumulative.previousTerms.filter(r => r.total !== undefined).map(r => r.total), row.total];
            if (allTotals.length > 0) {
              cumulative.sessionTotal = allTotals.reduce((a, b) => a + b, 0);
              cumulative.sessionAverage = (cumulative.sessionTotal / allTotals.length).toFixed(2);
            }
        }
      }
    }

    return res.json({
      school,
      formTeacher: formTeacher ? { displayName: formTeacher.displayName || formTeacher.username } : null,
      released: isReleased,
      cumulative,
      class: { id: cls.id, name: cls.name, level: cls.level, track: cls.track || null, assessmentType: cls.assessmentType },
      student: { studentId: student.studentId, firstName: student.firstName, lastName: student.lastName, gender: student.gender || "" },
      session: String(session),
      term: String(term),
      published: Boolean(publish),
      resumptionDate: meta?.resumptionDate || "",
      teacherRemark: remarks?.teacherRemark || autoRemarks.teacherRemark,
      principalRemark: remarks?.principalRemark || autoRemarks.principalRemark,
      result: row
    });
  })
);

