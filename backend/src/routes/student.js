import express from "express";
import { randomUUID } from "crypto";
import { Roles } from "../constants.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../http.js";
import { getStudentById } from "../repos/students.js";
import { getClassById } from "../repos/classes.js";
import { listSubjects, getSubjectById } from "../repos/subjects.js";
import { getSchoolSettings } from "../repos/config.js";
import { getUserByUsername, updateUser } from "../repos/users.js";
import { hashPassword, verifyPassword } from "../security.js";
import { SafeDatabase } from "../firestore-utils/index.js";
import { normalizeLevel } from "../subjectAliases.js";

export const studentRouter = express.Router();

studentRouter.use(authRequired, requireRole(Roles.STUDENT));

studentRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const student = await getStudentById(req.user.studentId);
    if (!student) return res.status(404).json({ error: "Student record not found." });
    const cls = await getClassById(student.classId);
    if (!cls) return res.status(404).json({ error: "Student class could not be found." });

    const allSubjects = await listSubjects();
    const assignedIds = Array.isArray(student.subjectIds) && student.subjectIds.length
      ? student.subjectIds
      : Array.isArray(cls.subjectIds) && cls.subjectIds.length
        ? cls.subjectIds
        : null;
    const subjects = (assignedIds
      ? await Promise.all(assignedIds.map((id) => getSubjectById(id)))
      : allSubjects.filter((subject) => {
          const level = normalizeLevel(cls.level);
          const subjectLevel = normalizeLevel(subject.level);
        const levelMatches = subjectLevel === level || (level === "Nursery" && subjectLevel === "Primary");
        return levelMatches && (level === "SSS"
            ? !cls.track || !subject.track || subject.track === "General" || subject.track === cls.track
            : true);
        }))
      .filter(Boolean)
      .map((subject) => ({ id: subject.id, name: subject.name, level: subject.level }));

    const [{ data: activities }, { data: submissions }, settings] = await Promise.all([
      SafeDatabase.query("learningActivities", [["classId", "==", student.classId], ["published", "==", true]], { pageSize: 1000 }),
      SafeDatabase.query("activitySubmissions", [["studentId", "==", student.studentId]], { pageSize: 1000 }),
      getSchoolSettings()
    ]);
    const submissionByActivity = new Map(submissions.map((submission) => [submission.activityId, submission]));
    const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
    const studentActivities = activities.map((activity) => {
      const submission = submissionByActivity.get(activity.id);
      const questions = activity.type === "TEST"
        ? (activity.questions || []).map(({ correctAnswer, ...question }) => question)
        : [];
      return {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        description: activity.description || "",
        dueAt: activity.dueAt || null,
        maxScore: activity.maxScore,
        classId: activity.classId,
        subjectId: activity.subjectId,
        subjectName: subjectById.get(activity.subjectId)?.name || activity.subjectId,
        questions,
        submission: submission ? {
          status: submission.status,
          submittedAt: submission.submittedAt,
          score: submission.status === "GRADED" ? submission.score : null,
          feedback: submission.status === "GRADED" ? submission.feedback || "" : null
        } : null
      };
    }).sort((a, b) => {
      const dueA = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const dueB = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return dueA - dueB;
    });

    return res.json({
      student: {
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        classId: cls.id,
        className: cls.name,
        classLevel: cls.level
      },
      subjects,
      activities: studentActivities,
      school: {
        currentSession: settings.currentSession || "",
        currentTerm: settings.currentTerm || ""
      }
    });
  })
);

studentRouter.post(
  "/activities/:activityId/submit",
  asyncHandler(async (req, res) => {
    const student = await getStudentById(req.user.studentId);
    if (!student) return res.status(404).json({ error: "Student record not found." });
    const activity = await SafeDatabase.getById("learningActivities", req.params.activityId);
    if (activity.type !== "ASSIGNMENT" || !activity.published || activity.classId !== student.classId) {
      return res.status(404).json({ error: "Assignment not found." });
    }
    if (activity.dueAt && new Date(activity.dueAt).getTime() < Date.now()) {
      return res.status(400).json({ error: "The deadline for this assignment has passed." });
    }
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text || text.length > 10000) {
      return res.status(400).json({ error: "Enter an assignment response of 1 to 10,000 characters." });
    }

    const { data: existing } = await SafeDatabase.query(
      "activitySubmissions",
      [["activityId", "==", activity.id], ["studentId", "==", student.studentId]],
      { pageSize: 1 }
    );
    if (existing[0]?.status === "GRADED") {
      return res.status(409).json({ error: "This assignment has already been graded and cannot be changed." });
    }
    const submissionId = existing[0]?.id || randomUUID();
    const submission = {
      activityId: activity.id,
      studentId: student.studentId,
      response: { text },
      status: "SUBMITTED",
      submittedAt: new Date().toISOString()
    };
    const saved = existing[0]
      ? await SafeDatabase.upsert("activitySubmissions", submissionId, submission)
      : await SafeDatabase.createWithValidation("activitySubmissions", submission, "activitySubmission", { docId: submissionId });

    return res.status(201).json({
      success: true,
      submission: { status: saved.status, submittedAt: saved.submittedAt }
    });
  })
);

studentRouter.post(
  "/tests/:activityId/submit",
  asyncHandler(async (req, res) => {
    const student = await getStudentById(req.user.studentId);
    if (!student) return res.status(404).json({ error: "Student record not found." });
    const activity = await SafeDatabase.getById("learningActivities", req.params.activityId);
    if (activity.type !== "TEST" || !activity.published || activity.classId !== student.classId) {
      return res.status(404).json({ error: "Test not found." });
    }
    if (activity.dueAt && new Date(activity.dueAt).getTime() < Date.now()) {
      return res.status(400).json({ error: "The deadline for this test has passed." });
    }
    const { data: existing } = await SafeDatabase.query(
      "activitySubmissions",
      [["activityId", "==", activity.id], ["studentId", "==", student.studentId]],
      { pageSize: 1 }
    );
    if (existing.length) return res.status(409).json({ error: "You have already submitted this test." });

    const answers = req.body?.answers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ error: "Test answers are required." });
    }
    const questions = activity.questions || [];
    const expectedQuestionIds = new Set(questions.map((question) => question.id));
    const answerIds = Object.keys(answers);
    if (answerIds.length !== questions.length || answerIds.some((id) => !expectedQuestionIds.has(id))) {
      return res.status(400).json({ error: "Answer every test question before submitting." });
    }
    let correctCount = 0;
    const safeAnswers = {};
    for (const question of questions) {
      const answer = answers[question.id];
      if (typeof answer !== "string" || !question.options.includes(answer)) {
        return res.status(400).json({ error: "One or more selected answers are invalid." });
      }
      safeAnswers[question.id] = answer;
      if (answer !== undefined && String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase()) {
        correctCount += 1;
      }
    }
    const questionCount = questions.length;
    const score = questionCount ? Math.round((correctCount / questionCount) * Number(activity.maxScore)) : 0;
    const submission = {
      activityId: activity.id,
      studentId: student.studentId,
      response: { answers: safeAnswers },
      score,
      feedback: `${correctCount} of ${questionCount} questions correct.`,
      status: "GRADED",
      submittedAt: new Date().toISOString(),
      gradedAt: new Date().toISOString()
    };
    const saved = await SafeDatabase.createWithValidation(
      "activitySubmissions",
      submission,
      "activitySubmission",
      { docId: randomUUID() }
    );
    return res.status(201).json({
      success: true,
      submission: { status: saved.status, score: saved.score, maxScore: activity.maxScore, feedback: saved.feedback }
    });
  })
);

studentRouter.post(
  "/change-pin",
  asyncHandler(async (req, res) => {
    const currentPin = String(req.body?.currentPin || "");
    const newPin = String(req.body?.newPin || "");
    if (!/^\d{8}$/.test(newPin)) return res.status(400).json({ error: "Your new PIN must contain exactly 8 digits." });
    const user = await getUserByUsername(req.user.username);
    if (!user || !(await verifyPassword(currentPin, user.passwordHash || ""))) {
      return res.status(400).json({ error: "Current PIN is incorrect." });
    }
    await updateUser(user.username, { passwordHash: await hashPassword(newPin) });
    return res.json({ success: true, message: "Your PIN has been changed." });
  })
);
