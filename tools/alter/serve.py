#!/usr/bin/env python3
"""ALTER: change the actor, outfit, product or look of a finished video.

Local only. Serves index.html and a small JSON API on 127.0.0.1, and holds the
fal.ai key (FAL_KEY) so it never reaches the page.

    pip install -r requirements.txt
    FAL_KEY=... python3 serve.py            # http://127.0.0.1:8765
"""
import json
import mimetypes
import os
import re
import sys
import threading
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import media

HERE = Path(__file__).resolve().parent
WORK = HERE / "work"
APP = "bytedance/seedance-2.5/reference-to-video"
PORT = int(os.environ.get("PORT", "8765"))

KEEP = ("Keep the acting, lip sync, camera movement, timing, framing and "
        "everything else in @Video1 exactly as it is.")

LOCK = threading.Lock()
FILES = {}   # id -> {"path", "url", "kind", "name"}
JOBS = {}    # id -> job dict


def fal():
    import fal_client
    if not os.environ.get("FAL_KEY"):
        raise RuntimeError("FAL_KEY is not set")
    return fal_client


def safe_name(name):
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)[-80:] or "file"


def build_input(job, final):
    """Map a job onto the Seedance 2.5 reference-to-video input."""
    prompt = job["prompt"].strip()
    if prompt[-1] not in ".!?":
        prompt += "."
    refs = [FILES[i] for i in job["image_ids"]]
    if refs and "@Image" not in prompt:
        prompt += " Use " + ", ".join(
            "@Image%d" % (n + 1) for n in range(len(refs))) + " as the reference for the change."
    if "@Video1" not in prompt:
        prompt = "In @Video1: " + prompt
    prompt += " " + KEEP

    body = {
        "prompt": prompt,
        "task": job["task"],
        "video_urls": [FILES[job["video_id"]]["url"]],
        # the original soundtrack is put back afterwards, so don't pay for new
        "generate_audio": not job["keep_audio"],
    }
    if refs:
        body["image_urls"] = [r["url"] for r in refs]
    if job["task"] != "editing":   # editing locks both to the source
        body["duration"] = job["duration"]
        body["aspect_ratio"] = job["aspect_ratio"]
    if final:
        body["resolution"] = "1080p"
        body["draft"] = False
        if job.get("seed") is not None:
            body["seed"] = job["seed"]
    else:
        body["draft"] = True
    return body


def submit(job, final):
    body = build_input(job, final)
    handle = fal().submit(APP, arguments=body)
    job.update(state="queued", request_id=handle.request_id, final=final,
               input=body, error=None, log=[])


def finish(job):
    """Download the take, put the original sound back, and check for drift."""
    c = fal()
    res = c.result(APP, job["request_id"])
    url = res["video"]["url"]
    job["seed"] = res.get("seed")
    job["draft_id"] = res.get("draft_id")

    tag = "final" if job["final"] else "draft"
    raw = WORK / ("%s_%s_raw.mp4" % (job["id"], tag))
    with urllib.request.urlopen(url) as r, open(raw, "wb") as f:
        f.write(r.read())

    src = Path(FILES[job["video_id"]]["path"])
    out = raw
    if job["keep_audio"] and media.probe(src)["has_audio"]:
        out = WORK / ("%s_%s.mp4" % (job["id"], tag))
        media.restore_audio(raw, src, out)

    report = media.drift_report(src, out)
    sheet = WORK / ("%s_%s_sheet.png" % (job["id"], tag))
    media.contact_sheet(src, out, sheet)

    key = "final" if job["final"] else "draft"
    job[key] = {"video": "/work/" + out.name, "sheet": "/work/" + sheet.name,
                "report": report}
    job["state"] = "done"


def poll(job):
    with LOCK:
        if job["state"] != "queued":
            return
        c = fal()
        st = c.status(APP, job["request_id"], with_logs=True)
        if isinstance(st, c.Completed):
            try:
                finish(job)
            except Exception as e:   # surface it rather than hang the poll
                job.update(state="error", error=str(e))
        else:
            logs = getattr(st, "logs", None) or []
            job["log"] = [l.get("message", "") for l in logs][-5:]
            job["position"] = getattr(st, "position", None)


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, obj, ctype="application/json"):
        data = obj if isinstance(obj, bytes) else json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def body(self):
        return self.rfile.read(int(self.headers.get("Content-Length", 0)))

    def serve_file(self, path):
        if not path.is_file():
            return self.send(404, {"error": "not found"})
        ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self.send(200, path.read_bytes(), ctype)

    def do_GET(self):
        p = urlparse(self.path).path
        if p in ("/", "/index.html"):
            return self.serve_file(HERE / "index.html")
        if p.startswith("/work/"):
            name = Path(p).name   # no path components, so no traversal
            return self.serve_file(WORK / name)
        m = re.fullmatch(r"/api/job/(\w+)", p)
        if m and m.group(1) in JOBS:
            job = JOBS[m.group(1)]
            try:
                poll(job)
            except Exception as e:
                job.update(state="error", error=str(e))
            return self.send(200, {k: v for k, v in job.items() if k != "input"})
        self.send(404, {"error": "not found"})

    def do_POST(self):
        u = urlparse(self.path)
        try:
            if u.path == "/api/upload":
                return self.upload(parse_qs(u.query))
            if u.path == "/api/run":
                return self.run(json.loads(self.body() or b"{}"), final=False)
            if u.path == "/api/finish":
                return self.run(json.loads(self.body() or b"{}"), final=True)
        except Exception as e:
            return self.send(400, {"error": str(e)})
        self.send(404, {"error": "not found"})

    def upload(self, q):
        name = safe_name(q.get("name", ["file"])[0])
        kind = "video" if q.get("kind", [""])[0] == "video" else "image"
        fid = uuid.uuid4().hex[:10]
        path = WORK / ("%s_%s" % (fid, name))
        path.write_bytes(self.body())
        entry = {"path": str(path), "kind": kind, "name": name,
                 "url": fal().upload_file(str(path))}
        FILES[fid] = entry
        info = media.probe(path) if kind == "video" else None
        self.send(200, {"id": fid, "name": name, "kind": kind,
                        "local": "/work/" + path.name, "info": info})

    def run(self, req, final):
        if final:
            job = JOBS[req["job_id"]]
            if not job.get("draft"):
                raise ValueError("make a draft first")
            submit(job, final=True)
        else:
            if req.get("video_id") not in FILES:
                raise ValueError("upload a source video first")
            if not req.get("prompt", "").strip():
                raise ValueError("say what to change")
            job = {
                "id": uuid.uuid4().hex[:10],
                "video_id": req["video_id"],
                "image_ids": [i for i in req.get("image_ids", []) if i in FILES],
                "prompt": req["prompt"],
                "task": req.get("task", "editing"),
                "keep_audio": bool(req.get("keep_audio", True)),
                "duration": req.get("duration", "auto"),
                "aspect_ratio": req.get("aspect_ratio", "auto"),
                "state": "new",
            }
            JOBS[job["id"]] = job
            submit(job, final=False)
        self.send(200, {"id": job["id"]})


if __name__ == "__main__":
    WORK.mkdir(exist_ok=True)
    if not os.environ.get("FAL_KEY"):
        print("FAL_KEY is not set; the page will load but runs will fail.", file=sys.stderr)
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    print("ALTER on http://127.0.0.1:%d" % PORT)
    srv.serve_forever()
