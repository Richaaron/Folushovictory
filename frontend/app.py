import os
from functools import wraps

import requests
from dotenv import load_dotenv
from flask import Flask, redirect, render_template, request, session, url_for, flash

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000").rstrip("/")

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change_me")


def api_request(method, path, token=None, payload=None, params=None):
    url = f"{BACKEND_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = requests.request(method, url, headers=headers, json=payload, params=params, timeout=20)
    if resp.status_code >= 400:
        try:
            data = resp.json()
            msg = data.get("error") or resp.text
        except Exception:
            msg = resp.text
        raise RuntimeError(f"{resp.status_code}: {msg}")
    if resp.content:
        return resp.json()
    return None


def current_user():
    return session.get("user")


def require_portal(portal):
    def decorator(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            user = current_user()
            if not user or user.get("portal") != portal:
                return redirect(url_for("login", portal=portal.lower()))
            return fn(*args, **kwargs)

        return wrapped

    return decorator


@app.get("/")
def landing():
    return render_template("landing.html")


@app.get("/logout")
def logout():
    session.clear()
    return redirect(url_for("landing"))


@app.route("/<portal>/login", methods=["GET", "POST"])
def login(portal):
    portal_upper = portal.upper()
    if portal_upper not in ("ADMIN", "TEACHER", "PARENT"):
        return redirect(url_for("landing"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        try:
            data = api_request(
                "POST",
                "/api/auth/login",
                payload={"portal": portal_upper, "username": username, "password": password},
            )
            session["token"] = data["token"]
            session["user"] = data["user"]
            return redirect(url_for(f"{portal}_dashboard"))
        except Exception as e:
            flash(str(e))

    return render_template("login.html", portal=portal_upper)


@app.get("/admin")
@require_portal("ADMIN")
def admin_dashboard():
    token = session.get("token")
    session_name = request.args.get("session", "")
    term = request.args.get("term", "")
    params = {"session": session_name, "term": term} if session_name and term else None
    data = api_request("GET", "/api/admin/dashboard", token=token, params=params)
    return render_template("admin/dashboard.html", data=data, session_name=session_name, term=term)


@app.route("/admin/teachers", methods=["GET", "POST"])
@require_portal("ADMIN")
def admin_teachers():
    token = session.get("token")
    created = None
    if request.method == "POST":
        display_name = request.form.get("displayName", "").strip()
        if display_name:
            try:
                created = api_request("POST", "/api/admin/teachers", token=token, payload={"displayName": display_name})
            except Exception as e:
                flash(str(e))
        else:
            flash("Display name is required")

    teachers = api_request("GET", "/api/admin/teachers", token=token).get("teachers", [])
    classes = api_request("GET", "/api/admin/classes", token=token).get("classes", [])
    subjects = api_request("GET", "/api/admin/subjects", token=token).get("subjects", [])
    return render_template("admin/teachers.html", teachers=teachers, classes=classes, subjects=subjects, created=created)


@app.route("/admin/classes", methods=["GET", "POST"])
@require_portal("ADMIN")
def admin_classes():
    token = session.get("token")
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        level = request.form.get("level", "").strip()
        track = request.form.get("track", "").strip() or None
        form_teacher = request.form.get("formTeacherUsername", "").strip() or None
        try:
            api_request("POST", "/api/admin/classes", token=token, payload={"name": name, "level": level, "track": track, "formTeacherUsername": form_teacher})
            return redirect(url_for("admin_classes"))
        except Exception as e:
            flash(str(e))

    classes = api_request("GET", "/api/admin/classes", token=token).get("classes", [])
    subjects = api_request("GET", "/api/admin/subjects", token=token).get("subjects", [])
    teachers = api_request("GET", "/api/admin/teachers", token=token).get("teachers", [])
    return render_template("admin/classes.html", classes=classes, subjects=subjects, teachers=teachers)


@app.post("/admin/classes/<class_id>/update")
@require_portal("ADMIN")
def admin_update_class(class_id):
    token = session.get("token")
    subject_ids = request.form.getlist("subjectIds")
    form_teacher = request.form.get("formTeacherUsername", "").strip() or None
    try:
        api_request("PUT", f"/api/admin/classes/{class_id}/subjects", token=token, payload={"subjectIds": subject_ids, "formTeacherUsername": form_teacher})
    except Exception as e:
        flash(str(e))
    return redirect(url_for("admin_classes"))


@app.post("/admin/classes/assign-form-teacher")
@require_portal("ADMIN")
def admin_assign_form_teacher():
    token = session.get("token")
    class_id = request.form.get("classId")
    form_teacher = request.form.get("formTeacherUsername")
    try:
        api_request("PUT", f"/api/admin/classes/{class_id}/subjects", token=token, payload={"formTeacherUsername": form_teacher})
        flash("Form Teacher assigned successfully")
    except Exception as e:
        flash(str(e))
    return redirect(url_for("admin_teachers"))


@app.route("/settings", methods=["GET", "POST"])
def settings():
    token = session.get("token")
    if not token:
        return redirect(url_for("login"))
    
    user_role = session.get("user", {}).get("role")
    
    if request.method == "POST":
        action = request.form.get("action")
        if action == "change_password":
            old_pass = request.form.get("oldPassword")
            new_pass = request.form.get("newPassword")
            try:
                api_request("POST", "/api/change-password", token=token, payload={"oldPassword": old_pass, "newPassword": new_pass})
                flash("Password updated successfully")
            except Exception as e:
                flash(f"Error: {str(e)}")
        
        elif action == "school_settings" and user_role == "ADMIN":
            payload = {
                "name": request.form.get("name"),
                "motto": request.form.get("motto"),
                "address": request.form.get("address"),
                "phone": request.form.get("phone"),
                "email": request.form.get("email"),
                "principalName": request.form.get("principalName"),
                "principalSignatureUrl": request.form.get("principalSignatureUrl")
            }
            try:
                api_request("POST", "/api/admin/school-settings", token=token, payload=payload)
                flash("School settings updated")
            except Exception as e:
                flash(str(e))

    school_settings = None
    if user_role == "ADMIN":
        try:
            school_settings = api_request("GET", "/api/admin/school-settings", token=token)
        except Exception:
            pass

    return render_template("settings.html", school_settings=school_settings)


@app.route("/admin/students", methods=["GET", "POST"])
@require_portal("ADMIN")
def admin_students():
    token = session.get("token")
    created = None
    classes = api_request("GET", "/api/admin/classes", token=token).get("classes", [])
    class_id = request.args.get("classId") or (classes[0]["id"] if classes else "")

    if request.method == "POST":
        first_name = request.form.get("firstName", "").strip()
        last_name = request.form.get("lastName", "").strip()
        gender = request.form.get("gender", "").strip()
        parent_name = request.form.get("parentName", "").strip()
        class_id_post = request.form.get("classId", "").strip()
        try:
            created = api_request(
                "POST",
                "/api/admin/students",
                token=token,
                payload={
                    "firstName": first_name,
                    "lastName": last_name,
                    "gender": gender,
                    "parentName": parent_name,
                    "classId": class_id_post,
                },
            )
        except Exception as e:
            flash(str(e))

    students = []
    if class_id:
        students = api_request("GET", "/api/admin/students", token=token, params={"classId": class_id}).get("students", [])
    return render_template("admin/students.html", classes=classes, students=students, class_id=class_id, created=created)


@app.route("/admin/assignments", methods=["GET", "POST"])
@require_portal("ADMIN")
def admin_assignments():
    token = session.get("token")
    if request.method == "POST":
        teacher_username = request.form.get("teacherUsername", "").strip()
        class_id = request.form.get("classId", "").strip()
        subject_id = request.form.get("subjectId", "").strip()
        try:
            api_request(
                "POST",
                "/api/admin/assignments",
                token=token,
                payload={"teacherUsername": teacher_username, "classId": class_id, "subjectId": subject_id},
            )
            flash("Assignment created")
        except Exception as e:
            flash(str(e))

    classes = api_request("GET", "/api/admin/classes", token=token).get("classes", [])
    subjects = api_request("GET", "/api/admin/subjects", token=token).get("subjects", [])
    teachers = api_request("GET", "/api/admin/teachers", token=token).get("teachers", [])
    return render_template("admin/assignments.html", classes=classes, subjects=subjects, teachers=teachers)


@app.route("/admin/grading", methods=["GET", "POST"])
@require_portal("ADMIN")
def admin_grading():
    token = session.get("token")
    scale = None
    try:
        scale = api_request("GET", "/api/admin/grading-scale", token=token)
    except Exception:
        pass

    if request.method == "POST":
        count = int(request.form.get("count", 5))
        grades = []
        for i in range(count):
            letter = request.form.get(f"letter_{i}", "").strip()
            min_v = request.form.get(f"min_{i}", "0").strip()
            max_v = request.form.get(f"max_{i}", "0").strip()
            remark = request.form.get(f"remark_{i}", "").strip()
            if letter:
                grades.append({"letter": letter, "min": int(min_v), "max": int(max_v), "remark": remark})
        try:
            api_request("POST", "/api/admin/grading-scale", token=token, payload={"grades": grades})
            flash("Grading scale saved")
            return redirect(url_for("admin_grading"))
        except Exception as e:
            flash(str(e))

    return render_template("admin/grading.html", scale=scale)


@app.route("/admin/term-meta", methods=["GET", "POST"])
@require_portal("ADMIN")
def admin_term_meta():
    token = session.get("token")
    meta = None
    if request.method == "POST":
        sess = request.form.get("session", "").strip()
        term = request.form.get("term", "").strip()
        resumption_date = request.form.get("resumptionDate", "").strip()
        try:
            api_request(
                "POST", "/api/admin/term-meta", token=token,
                payload={"session": sess, "term": term, "resumptionDate": resumption_date},
            )
            flash("Term settings saved")
            return redirect(url_for("admin_term_meta"))
        except Exception as e:
            flash(str(e))
    return render_template("admin/term_meta.html", meta=meta)


@app.post("/admin/remarks/principal")
@require_portal("ADMIN")
def admin_principal_remark():
    token = session.get("token")
    sess = request.form.get("session", "").strip()
    term = request.form.get("term", "").strip()
    student_id = request.form.get("studentId", "").strip()
    principal_remark = request.form.get("principalRemark", "").strip()
    try:
        api_request(
            "POST", "/api/admin/remarks/principal", token=token,
            payload={"session": sess, "term": term, "studentId": student_id, "principalRemark": principal_remark},
        )
        flash("Principal remark saved")
    except Exception as e:
        flash(str(e))
    return redirect(url_for("admin_term_meta"))


@app.route("/admin/broadsheet", methods=["GET", "POST"])
@require_portal("ADMIN")
def admin_broadsheet():
    token = session.get("token")
    classes = api_request("GET", "/api/admin/classes", token=token).get("classes", [])
    class_id = request.args.get("classId") or (classes[0]["id"] if classes else "")
    session_name = request.args.get("session", "")
    term = request.args.get("term", "")
    sheet = None
    if class_id and session_name and term:
        try:
            sheet = api_request(
                "GET", f"/api/results/class/{class_id}/broadsheet", token=token, params={"session": session_name, "term": term}
            )
        except Exception as e:
            flash(str(e))

    if request.method == "POST":
        class_id_post = request.form.get("classId", "").strip()
        session_post = request.form.get("session", "").strip()
        term_post = request.form.get("term", "").strip()
        try:
            api_request(
                "POST",
                "/api/admin/publish-results",
                token=token,
                payload={"classId": class_id_post, "session": session_post, "term": term_post},
            )
            return redirect(url_for("admin_broadsheet", classId=class_id_post, session=session_post, term=term_post))
        except Exception as e:
            flash(str(e))

    return render_template(
        "admin/broadsheet.html",
        classes=classes,
        class_id=class_id,
        session_name=session_name,
        term=term,
        sheet=sheet,
    )


@app.post("/admin/results/release")
@require_portal("ADMIN")
def admin_release_result():
    token = session.get("token")
    sess = request.form.get("session", "").strip()
    term = request.form.get("term", "").strip()
    student_id = request.form.get("studentId", "").strip()
    released = request.form.get("released") == "true"
    try:
        api_request(
            "POST", "/api/admin/results/release", token=token,
            payload={"session": sess, "term": term, "studentId": student_id, "released": released},
        )
        flash("Result " + ("released" if released else "withheld"))
    except Exception as e:
        flash(str(e))
    return redirect(request.referrer or url_for("admin_broadsheet"))


@app.route("/admin/master-broadsheet")
@require_portal("ADMIN")
def admin_master_broadsheet():
    token = session.get("token")
    classes = api_request("GET", "/api/admin/classes", token=token).get("classes", [])
    class_id = request.args.get("classId") or (classes[0]["id"] if classes else "")
    session_name = request.args.get("session", "")
    term = request.args.get("term", "")
    sheet = None
    if class_id and session_name and term:
        try:
            sheet = api_request(
                "GET", f"/api/results/class/{class_id}/broadsheet", token=token, params={"session": session_name, "term": term}
            )
        except Exception as e:
            flash(str(e))
    return render_template("admin/master_broadsheet.html", classes=classes, class_id=class_id, session_name=session_name, term=term, sheet=sheet)


@app.get("/teacher")
@require_portal("TEACHER")
def teacher_dashboard():
    token = session.get("token")
    data = api_request("GET", "/api/teacher/assignments", token=token)
    return render_template("teacher/dashboard.html", assignments=data.get("assignments", []))


@app.route("/teacher/remarks/<class_id>", methods=["GET", "POST"])
@require_portal("TEACHER")
def teacher_remarks(class_id):
    token = session.get("token")
    students = []
    try:
        students = api_request("GET", f"/api/teacher/classes/{class_id}/students", token=token).get("students", [])
    except Exception as e:
        flash(str(e))
    if request.method == "POST":
        # Handled by POST to /teacher/remarks directly
        pass
    return render_template("teacher/remarks.html", students=students, class_id=class_id)


@app.post("/teacher/remarks")
@require_portal("TEACHER")
def teacher_save_remark():
    token = session.get("token")
    sess = request.form.get("session", "").strip()
    term = request.form.get("term", "").strip()
    student_id = request.form.get("studentId", "").strip()
    teacher_remark = request.form.get("teacherRemark", "").strip()
    try:
        api_request(
            "POST", "/api/teacher/remarks", token=token,
            payload={"session": sess, "term": term, "studentId": student_id, "teacherRemark": teacher_remark},
        )
        flash("Remark saved")
    except Exception as e:
        flash(str(e))
    # Redirect back — need classId from student record; use referer or fallback
    return redirect(url_for("teacher_dashboard"))


@app.post("/teacher/release-result")
@require_portal("TEACHER")
def teacher_release_result():
    token = session.get("token")
    sess = request.form.get("session", "").strip()
    term = request.form.get("term", "").strip()
    student_id = request.form.get("studentId", "").strip()
    released = request.form.get("released") == "true"
    try:
        api_request(
            "POST", "/api/teacher/results/release", token=token,
            payload={"session": sess, "term": term, "studentId": student_id, "released": released},
        )
        flash("Result " + ("released" if released else "withheld"))
    except Exception as e:
        flash(str(e))
    return redirect(request.referrer or url_for("teacher_dashboard"))


@app.route("/teacher/enter-scores/<assignment_id>", methods=["GET", "POST"])
@require_portal("TEACHER")
def teacher_enter_scores(assignment_id):
    token = session.get("token")
    assignments = api_request("GET", "/api/teacher/assignments", token=token).get("assignments", [])
    assignment = next((a for a in assignments if a.get("id") == assignment_id), None)
    if not assignment:
        flash("Assignment not found")
        return redirect(url_for("teacher_dashboard"))

    class_id = assignment["classId"]
    students = api_request("GET", f"/api/teacher/classes/{class_id}/students", token=token).get("students", [])

    if request.method == "POST":
        session_name = request.form.get("session", "").strip()
        term = request.form.get("term", "").strip()
        mode = request.form.get("mode", "NUMERIC")
        try:
            if mode == "TRAIT":
                ratings = []
                for st in students:
                    rating = request.form.get(f"rating_{st['studentId']}", "").strip()
                    ratings.append({"studentId": st["studentId"], "rating": rating})
                api_request(
                    "POST",
                    "/api/teacher/traits",
                    token=token,
                    payload={
                        "session": session_name,
                        "term": term,
                        "classId": class_id,
                        "subjectId": assignment["subjectId"],
                        "ratings": ratings,
                    },
                )
            else:
                scores = []
                for st in students:
                    ca1 = request.form.get(f"ca1_{st['studentId']}", "0").strip()
                    ca2 = request.form.get(f"ca2_{st['studentId']}", "0").strip()
                    exam = request.form.get(f"exam_{st['studentId']}", "0").strip()
                    scores.append({
                        "studentId": st["studentId"], 
                        "ca1": float(ca1 or 0), 
                        "ca2": float(ca2 or 0), 
                        "exam": float(exam or 0)
                    })
                api_request(
                    "POST",
                    "/api/teacher/scores",
                    token=token,
                    payload={
                        "session": session_name,
                        "term": term,
                        "classId": class_id,
                        "subjectId": assignment["subjectId"],
                        "scores": scores,
                    },
                )
            flash("Submitted")
        except Exception as e:
            flash(str(e))

    return render_template("teacher/enter_scores.html", assignment=assignment, students=students)


@app.get("/parent")
@require_portal("PARENT")
def parent_dashboard():
    token = session.get("token")
    student = api_request("GET", "/api/parent/student", token=token)
    return render_template("parent/dashboard.html", student=student)


@app.get("/parent/report")
@require_portal("PARENT")
def parent_report():
    token = session.get("token")
    student_id = session.get("user", {}).get("studentId")
    session_name = request.args.get("session", "")
    term = request.args.get("term", "")
    if not session_name or not term:
        flash("Select session and term")
        return redirect(url_for("parent_dashboard"))
    try:
        report = api_request(
            "GET",
            f"/api/results/student/{student_id}/report",
            token=token,
            params={"session": session_name, "term": term},
        )
    except Exception as e:
        flash(str(e))
        return redirect(url_for("parent_dashboard"))
    return render_template("parent/report.html", report=report)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)

