# ALTER

Change the actor, outfit, product or location in a finished video, or restyle
the whole take, by saying what to change. Runs Seedance 2.5 on fal.ai in its
`editing` mode, then checks the result against the source.

**Not published.** The deploy workflow removes `tools/alter/` before it uploads
the site, so it never goes live. It only runs on your machine.

## Run

    pip install -r requirements.txt     # also needs ffmpeg and ffprobe on PATH
    FAL_KEY=... python3 serve.py        # http://127.0.0.1:8765

The key stays in the server process; the page never sees it. Uploads and
results land in `work/` (git-ignored).

## What it does

1. Upload the source video, and optionally reference images (the new actor,
   outfit or product, addressed as `@Image1`, `@Image2`).
2. Say what to change. Presets fill in a starting sentence.
3. **Draft at 480p** first. The source goes in as `@Video1` with `task: editing`,
   which keeps length and framing; the prompt also tells the model to leave
   the acting, lip sync, camera and timing alone.
4. The original soundtrack is put back with ffmpeg (original sound is kept,
   not regenerated).
5. **Drift check** (`media.py`): duration, motion-energy correlation (timing and
   camera), per-frame layout correlation (cuts or a changed shot), orientation.
   Anything off is flagged with timestamps, and a contact sheet puts source
   over result.
6. **Finish at 1080p** only for drafts you like. This re-runs the same inputs
   at 1080p with the draft's seed.

## Limits worth knowing

- The model regenerates the whole take. Pixels outside the change are close,
  not identical. The drift check flags what moved; it can't prove a clean frame.
- fal documents a `draft_id` that can be completed at 1080p within seven days.
  The route for that isn't in the public docs, so Finish re-runs instead.
  Swap it in `serve.py` (`submit(..., final=True)`) once confirmed.
- Not tested against the live API yet; see the test notes in the commit.
