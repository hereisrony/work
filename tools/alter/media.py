"""ffmpeg helpers and the drift check. Needs ffmpeg/ffprobe on PATH and numpy."""
import json
import subprocess
from pathlib import Path

import numpy as np

SAMPLE_FPS = 12
W, H = 64, 36


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_streams",
         "-show_format", str(path)],
        capture_output=True, text=True, check=True).stdout
    info = json.loads(out)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    num, den = v["avg_frame_rate"].split("/")
    return {
        "duration": float(info["format"]["duration"]),
        "width": v["width"],
        "height": v["height"],
        "fps": float(num) / float(den) if float(den) else 0.0,
        "has_audio": any(s["codec_type"] == "audio" for s in info["streams"]),
    }


def restore_audio(result_video, source_video, out_path):
    """Copy the picture from the generated take and the sound from the source."""
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(result_video),
         "-i", str(source_video), "-map", "0:v:0", "-map", "1:a:0",
         "-c:v", "copy", "-c:a", "aac", "-shortest", str(out_path)],
        check=True)


def _gray_frames(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-vf",
         "fps=%d,scale=%d:%d,format=gray" % (SAMPLE_FPS, W, H),
         "-f", "rawvideo", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)


def _corr(a, b):
    a, b = a - a.mean(), b - b.mean()
    d = np.sqrt((a * a).sum() * (b * b).sum())
    return float((a * b).sum() / d) if d else 1.0


def contact_sheet(src, out, dest, n=6):
    """Source on the top row, result under it, n evenly spaced frames."""
    dur = min(probe(src)["duration"], probe(out)["duration"])
    step = max(dur / n, 0.1)
    rows = []
    for name, path in (("s", src), ("o", out)):
        png = Path(dest).with_suffix("." + name + ".png")
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(path), "-vf",
             "fps=1/%f,scale=240:-2,tile=%dx1" % (step, n),
             "-frames:v", "1", str(png)], check=True)
        rows.append(png)
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(rows[0]), "-i", str(rows[1]),
         "-filter_complex", "vstack", str(dest)], check=True)
    for r in rows:
        r.unlink(missing_ok=True)


def drift_report(src, out):
    """Compare a generated take against its source.

    The edit is meant to change some pixels, so this does not ask whether the
    frames match. It asks whether what the edit should have left alone moved:
    the length, the timing and camera motion, the overall layout, and cuts.
    """
    a, b = probe(src), probe(out)
    flags = []

    ratio = b["duration"] / a["duration"]
    if abs(ratio - 1) > 0.05:
        flags.append("duration changed %.1fs -> %.1fs" % (a["duration"], b["duration"]))
    if (a["width"] / a["height"] > 1) != (b["width"] / b["height"] > 1):
        flags.append("orientation changed")

    fa, fb = _gray_frames(src), _gray_frames(out)
    n = min(len(fa), len(fb))
    fa, fb = fa[:n], fb[:n]

    # timing and camera: does motion energy rise and fall together?
    ma = np.abs(np.diff(fa, axis=0)).mean(axis=(1, 2))
    mb = np.abs(np.diff(fb, axis=0)).mean(axis=(1, 2))
    motion = _corr(ma, mb) if n > 3 else 1.0
    if motion < 0.6:
        flags.append("motion differs from the source (corr %.2f): timing or camera drifted" % motion)

    # layout: per-frame correlation of the downscaled picture
    layout = np.array([_corr(x, y) for x, y in zip(fa, fb)])
    low = np.where(layout < 0.5)[0]
    spans, start = [], None
    for i in range(n + 1):
        bad = i < n and layout[i] < 0.5
        if bad and start is None:
            start = i
        if not bad and start is not None:
            spans.append((start / SAMPLE_FPS, i / SAMPLE_FPS))
            start = None
    if spans:
        flags.append("layout departs from the source at " +
                     ", ".join("%.1f-%.1fs" % s for s in spans[:6]))

    if a["has_audio"] and not b["has_audio"]:
        flags.append("no audio in the result (restored from source if requested)")

    return {
        "source": a, "result": b,
        "motion_corr": round(motion, 3),
        "layout_corr_mean": round(float(layout.mean()), 3),
        "layout_corr_min": round(float(layout.min()), 3),
        "flagged_spans": spans,
        "flags": flags,
        "ok": not flags,
    }
