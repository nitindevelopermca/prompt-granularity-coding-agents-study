# Operator protocol (do not put this file in the agent workspace)

Canonical prompts isolate **implementation grain size**. Information is held constant. Every condition ends with the same validation prompt `V`.

The four conditions are nested aggregations of the same ten work units (login; authenticated shell; catalog/lazy load; product card/gallery; search; reviews modal; add comment; add to cart; cart screen; Place Order). P10 sends one unit per prompt. P6, P3, and P1 concatenate those units without rewriting them. See `experiment/prompts/README.md`.

**Protocol v2:** listing uses lazy load (`limit=10`/`skip`), search, image thumbnails, and add-comment. Treat any scores logged before this freeze, or logged against the previous prompt wording (types-only / shell-only / unstyled-list P10), as a **pilot**, not official matrix data.

## Agent workspace

Each run uses a **copy of `starter/` only**. Do not open the Paper-2 repo (this `experiment/` folder) as the agent workspace.

The frozen starter is already Vite + React + TypeScript on `http://localhost:8080`, with requirements in `starter/spec/` and **no feature code**.

### What is inside `starter/` (agent may see)

- Vite + React + TypeScript toolchain, port **8080**, `strictPort: true`
- Empty `src/App.tsx` (`return null`)
- `spec/SPEC_FREEZE.md`
- `spec/Minimum E-Commerce Application Specification.pdf`
- `spec/ux/` (four images)
- `spec/apis_contract/` (three contracts)

### What the agent must not see

Do **not** copy `experiment/prompts/`, `experiment/evaluation/`, or this protocol into the run copy. Future-phase text would leak and destroy the independent variable.

## Frozen agent settings (fill before run 1)

Record in the run log and do not change mid-study:

- Model name and version
- Agent product (e.g. Cursor) and mode (permissions, auto-run, max mode, MCP servers — ideally none)
- Network: DummyJSON allowed; no search for alternate APIs if you can disable it
- Same starter tree: copy `starter/` then `npm ci`. Record the `starter` git SHA.

## One run

1. Copy `starter/` to a fresh run directory (or reset that directory to the frozen SHA).
2. `npm ci` in the run directory if `node_modules` is not present.
3. Open a **new** agent session **on that run directory only**. No prior chat.
4. First operator message = contents of `experiment/prompts/00_RUN_PREFIX.txt` + a blank line + contents of the first phase file (`P1-01`, `P3-01`, `P6-01`, or `P10-01`).
5. Wait until the agent **stops**. Do not send extra hints. Do not edit code. Keep the **same chat**. Later phases must not start a new session (that would force a fresh repo analysis).
6. Send the next phase file as the entire next message (no prefix). Repeat until the last implementation prompt. Do not paste spec files again.
7. Send `experiment/prompts/V_VALIDATION.txt` as the entire next message.
8. When `V` stops, save: chat log, token/tool stats, git snapshot of the app, screenshots of login/products/reviews/cart, network log if available.
9. Score with `experiment/evaluation/SCORING_SHEET.md`. Append one row to a copy of `experiment/evaluation/run-log-template.csv`.

Confirm `npm run dev` binds **8080**. If the port is taken, the run is invalid until 8080 is free (`strictPort` will fail rather than silently moving).

## Prompt counts (including `V`)

| Condition | Implementation prompts | Validation | Operator messages |
|-----------|------------------------|------------|-------------------|
| P1 | 1 | V | 2 |
| P3 | 3 | V | 4 |
| P6 | 6 | V | 7 |
| P10 | 10 | V | 11 |

## Invalid run (exclude from confirmatory analysis; still archive)

- Any human code edit or extra unplanned prompt
- Wrong model/config
- Spec files missing from `spec/`
- Session reused from another run
- App served on a port other than 8080

Failed builds and failed flows are **valid** runs with low scores.

## Order of official runs

Randomize condition order within each model. Do not run all P1 first. Keep repetition index `R1…Rn` in the log.

## After a pilot (one model × four grains × two reps)

If P3/P6/P10 still look like “more audit,” stop and inspect whether operators accidentally sent extra fixes. Only then start the full 3 × 4 × n matrix.
