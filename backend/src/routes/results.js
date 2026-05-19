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
import { sendResultReleasedEmail } from "../services/email.js";

export const resultsRouter = express.Router();

resultsRouter.use(authRequired);

async function subjectsForClass(cls) {
  if (Array.isArray(cls.subjectIds) && cls.subjectIds.length) {
    const subjectIds = cls.subjectIds.map((id) => String(id || "").trim()).filter(Boolean);
    const subs = await Promise.all(subjectIds.map(async (id) => {
      try {
        return await getSubjectById(id);
      } catch (error) {
        console.error(`Failed to load subject ${id}:`, error?.message || error);
        return null;
      }
    }));
    return subs.filter(Boolean).map((s) => ({ id: s.id, name: s.name }));
  }

  let all = [];
  try {
    all = await listSubjects();
  } catch (error) {
    console.error("Failed to list subjects for class:", error?.message || error);
  }
  let levelFilter = cls.level;
  if (levelFilter === "PRY") levelFilter = "Primary";

  let filtered = all.filter((s) => s.level === levelFilter);

  if (levelFilter === "SSS" && cls.track) {
    filtered = filtered.filter((s) => s.track === "General" || s.track === cls.track);
  }

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

function feeStatusForStudent(student) {
  const rawStatus = String(student.feeStatus || student.paymentStatus || "").trim().toLowerCase();
  const balance = Number(
    student.feeBalance ??
    student.balanceDue ??
    student.outstandingBalance ??
    student.amountOwed ??
    0
  );
  const explicitlyOwing =
    student.owesFees === true ||
    student.feesOwed === true ||
    student.feesCleared === false ||
    ["owing", "owed", "unpaid", "pending", "outstanding", "balance"].includes(rawStatus);
  const owesFees = explicitlyOwing || (Number.isFinite(balance) && balance > 0);

  return {
    owesFees,
    label: owesFees ? "Owing Fees" : "Fees Cleared",
    amount: Number.isFinite(balance) ? balance : 0
  };
}

async function canAccessClassReports(req, cls) {
  if (req.user.role === Roles.ADMIN) return true;
  if (req.user.role !== Roles.TEACHER) return false;
  return cls.formTeacherUsername === req.user.username;
}

async function optionalResult(label, loader, fallback = null) {
  try {
    return await loader();
  } catch (error) {
    console.error(`${label} failed:`, error?.message || error);
    return fallback;
  }
}

async function buildStudentReport({ student, cls, session, term }) {
  const [subjects, scale, remarks, meta, publish, school, release] = await Promise.all([
    optionalResult(`Report subjects load for ${student.studentId}`, () => subjectsForClass(cls), []),
    optionalResult(`Report grading scale load for ${student.studentId}`, () => getGradingScale(), null),
    optionalResult(`Report remarks load for ${student.studentId}`, () => getRemarks({ session, term, studentId: student.studentId }), null),
    optionalResult(`Report term metadata load for ${student.studentId}`, () => getTermMeta({ session, term }), null),
    optionalResult(`Report publish status load for ${student.studentId}`, () => getPublish({ classId: student.classId, session, term }), null),
    optionalResult(`Report school settings load for ${student.studentId}`, () => getSchoolSettings(), {}),
    optionalResult(`Report release status load for ${student.studentId}`, () => getReleaseStatus({ session, term, studentId: student.studentId }), { released: false })
  ]);

  let formTeacher = null;
  if (cls.formTeacherUsername) {
    formTeacher = await optionalResult(
      `Form teacher lookup for ${cls.formTeacherUsername}`,
      () => getUserByUsername(cls.formTeacherUsername),
      null
    );
  }

  let row;
  let cumulative = null;

  if (String(cls.assessmentType).toUpperCase() === "TRAIT") {
    const scores = await optionalResult(
      `Trait scores load for ${student.studentId}`,
      () => listScoresForStudent({ session, term, studentId: student.studentId }),
      []
    );
    const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
    row = traitSheet({ students: [student], subjects, scoresByKey }).students[0];
  } else {
    const scores = await optionalResult(
      `Numeric scores load for ${student.studentId}`,
      () => listScoresForClass({ session, term, classId: student.classId }),
      []
    );
    const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
    const studentsInClass = await optionalResult(
      `Class students load for report ${student.studentId}`,
      () => listStudentsByClass(student.classId),
      [student]
    );
    const sheet = numericBroadsheet({ students: studentsInClass, subjects, scoresByKey, scale, level: cls.level });
    row = sheet.students.find((s) => s.studentId === student.studentId);

    if (row) {
      const overall = gradeForTotal(Number(row.average || 0), scale);
      row.overallGrade = overall.letter || "";
      row.overallGradeRemark = overall.remark || "";
    }

    if (term === "2nd" || term === "3rd") {
      const termsToFetch = term === "2nd" ? ["1st"] : ["1st", "2nd"];
      const prevResults = await Promise.all(termsToFetch.map(async (previousTerm) => {
        const pScores = await optionalResult(
          `Previous term ${previousTerm} scores load for ${student.studentId}`,
          () => listScoresForClass({ session, term: previousTerm, classId: student.classId }),
          []
        );
        const pScoresByKey = new Map(pScores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
        const pSheet = numericBroadsheet({ students: studentsInClass, subjects, scoresByKey: pScoresByKey, scale, level: cls.level });
        return { term: previousTerm, result: pSheet.students.find((s) => s.studentId === student.studentId) };
      }));

      cumulative = {
        previousTerms: prevResults.filter((r) => !!r.result).map((r) => ({
          term: r.term,
          total: r.result.total,
          average: r.result.average
        }))
      };

      if (cumulative.previousTerms.length > 0 && row) {
        const allTotals = [...cumulative.previousTerms.filter((r) => r.total !== undefined).map((r) => r.total), row.total];
        if (allTotals.length > 0) {
          cumulative.sessionTotal = allTotals.reduce((a, b) => a + b, 0);
          cumulative.sessionAverage = (cumulative.sessionTotal / allTotals.length).toFixed(2);
        }
      }
    }
  }

  const autoRemarks = generatedPerformanceRemarks(row);
  const feeStatus = feeStatusForStudent(student);

  return {
    school,
    formTeacher: formTeacher ? { displayName: formTeacher.displayName || formTeacher.username } : null,
    released: release.released,
    cumulative,
    feeStatus,
    class: { id: cls.id, name: cls.name, level: cls.level, track: cls.track || null, assessmentType: cls.assessmentType },
    student: {
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender || "",
      feeStatus
    },
    session,
    term,
    published: Boolean(publish),
    resumptionDate: meta?.resumptionDate || "",
    teacherRemark: remarks?.teacherRemark || autoRemarks.teacherRemark,
    principalRemark: remarks?.principalRemark || autoRemarks.principalRemark,
    result: row
  };
}

resultsRouter.get(
  "/class/:classId/broadsheet",
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { session, term } = req.query;
    if (!session || !term) return res.status(400).json({ error: "Missing session/term" });

    const cls = await getClassById(classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });
    if (req.user.role !== Roles.ADMIN) {
      if (req.user.role !== Roles.TEACHER) return res.status(403).json({ error: "Forbidden" });
      const assignments = await listAssignmentsByTeacher(req.user.username);
      const isSubjectTeacher = assignments.some((a) => a.classId === classId);
      const isFormTeacher = cls.formTeacherUsername === req.user.username;
      if (!isSubjectTeacher && !isFormTeacher) return res.status(403).json({ error: "Forbidden" });
    }

    const [students, subjects, scores, scale, publish, school] = await Promise.all([
      optionalResult("Broadsheet students load", () => listStudentsByClass(classId), []),
      optionalResult("Broadsheet subjects load", () => subjectsForClass(cls), []),
      optionalResult("Broadsheet scores load", () => listScoresForClass({ session: String(session), term: String(term), classId }), []),
      optionalResult("Broadsheet grading scale load", () => getGradingScale(), null),
      optionalResult("Broadsheet publish status load", () => getPublish({ classId, session: String(session), term: String(term) }), null),
      optionalResult("Broadsheet school settings load", () => getSchoolSettings(), {})
    ]);

    const scoresByKey = new Map(scores.map((s) => [`${s.studentId}_${s.subjectId}`, s]));
    const sheet =
      String(cls.assessmentType).toUpperCase() === "TRAIT"
        ? traitSheet({ students, subjects, scoresByKey })
        : numericBroadsheet({ students, subjects, scoresByKey, scale, level: cls.level });

    return res.json({
      school,
      class: { id: cls.id, name: cls.name, level: cls.level, track: cls.track || null, assessmentType: cls.assessmentType },
      session: String(session),
      term: String(term),
      published: Boolean(publish),
      ...sheet
    });
  })
);

resultsRouter.get(
  "/class/:classId/report-students",
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const cls = await getClassById(classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });
    if (!(await canAccessClassReports(req, cls))) return res.status(403).json({ error: "Forbidden" });

    const students = await listStudentsByClass(classId);
    return res.json({
      class: { id: cls.id, name: cls.name, level: cls.level, track: cls.track || null, assessmentType: cls.assessmentType },
      students: students.map((student) => ({
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender || "",
        feeStatus: feeStatusForStudent(student)
      }))
    });
  })
);

resultsRouter.post(
  "/class/:classId/bulk-reports",
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { session, term, studentIds } = req.body || {};
    if (!session || !term || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "Missing session, term, or selected students" });
    }

    const cls = await getClassById(classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });
    if (!(await canAccessClassReports(req, cls))) return res.status(403).json({ error: "Forbidden" });

    const selectedIds = [...new Set(studentIds.map((id) => String(id).trim()).filter(Boolean))];
    const studentsInClass = await optionalResult(
      "Bulk reports class students load",
      () => listStudentsByClass(classId),
      []
    );
    const selectedStudents = studentsInClass.filter((student) => selectedIds.includes(student.studentId));

    const reportResults = await Promise.all(
      selectedStudents.map(async (student) => {
        try {
          return {
            ok: true,
            report: await buildStudentReport({
              student,
              cls,
              session: String(session),
              term: String(term)
            })
          };
        } catch (error) {
          console.error(`Bulk report failed for ${student.studentId}:`, error?.message || error);
          return {
            ok: false,
            error: {
              studentId: student.studentId,
              studentName: `${student.lastName || ""} ${student.firstName || ""}`.trim(),
              error: error?.message || "Failed to build report"
            }
          };
        }
      })
    );

    const reports = reportResults.filter((item) => item.ok).map((item) => item.report);
    const failed = reportResults.filter((item) => !item.ok).map((item) => item.error);

    return res.json({
      class: { id: cls.id, name: cls.name, level: cls.level, track: cls.track || null, assessmentType: cls.assessmentType },
      session: String(session),
      term: String(term),
      reports,
      failed,
      feesCleared: reports.filter((report) => !report.feeStatus?.owesFees),
      feesOwing: reports.filter((report) => report.feeStatus?.owesFees)
    });
  })
);

resultsRouter.post(
  "/class/:classId/notify-parents",
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { session, term, studentIds } = req.body || {};
    if (!session || !term || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "Missing session, term, or selected students" });
    }

    const cls = await getClassById(classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });
    if (!(await canAccessClassReports(req, cls))) return res.status(403).json({ error: "Forbidden" });

    const selectedIds = [...new Set(studentIds.map((id) => String(id).trim()).filter(Boolean))];
    const studentsInClass = await listStudentsByClass(classId);
    const selectedStudents = studentsInClass.filter((student) => selectedIds.includes(student.studentId));

    const sent = [];
    const skipped = [];
    const failed = [];

    for (const student of selectedStudents) {
      let parentEmail = student.parentEmail || "";
      let parentName = student.parentName || "Parent";

      if (!parentEmail && student.parentUsername) {
        const parent = await optionalResult(
          `Parent lookup for ${student.studentId}`,
          () => getUserByUsername(student.parentUsername),
          null
        );
        parentEmail = parent?.email || "";
        parentName = parent?.displayName || parentName;
      }

      if (!parentEmail) {
        skipped.push({
          studentId: student.studentId,
          studentName: `${student.lastName || ""} ${student.firstName || ""}`.trim(),
          reason: "No parent email found"
        });
        continue;
      }

      try {
        await sendResultReleasedEmail({
          parentEmail,
          parentName,
          studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
          session: String(session),
          term: String(term)
        });
        sent.push({
          studentId: student.studentId,
          studentName: `${student.lastName || ""} ${student.firstName || ""}`.trim(),
          parentEmail
        });
      } catch (error) {
        failed.push({
          studentId: student.studentId,
          studentName: `${student.lastName || ""} ${student.firstName || ""}`.trim(),
          parentEmail,
          error: error?.message || "Failed to send email"
        });
      }
    }

    return res.json({
      ok: failed.length === 0,
      selected: selectedStudents.length,
      sent,
      skipped,
      failed
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

    return res.json(await buildStudentReport({
      student,
      cls,
      session: String(session),
      term: String(term)
    }));
  })
);
