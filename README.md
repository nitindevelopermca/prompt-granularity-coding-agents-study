# Prompt Grain Size Study — Coding Agents

This repository is the data and materials archive for an exploratory controlled study of **prompt grain size** when using coding agents to implement the same application. It accompanies the IEEE Software article *"How Finely Should You Prompt a Coding Agent? Evidence from 36 Controlled Builds."*

If you only want the headline numbers, start with [`result.xlsx`](result.xlsx). If you want to reproduce or extend the study, start with [`experiment/PROTOCOL.md`](experiment/PROTOCOL.md).

## What this study does

Three coding-agent configurations each implement the same minimum e-commerce storefront (login, product catalog with lazy load, search, reviews, comments, cart, checkout) against a live backend ([DummyJSON](https://dummyjson.com)). The only thing that changes across conditions is how finely the same ten work units are packaged into operator prompts:

| Condition | Implementation prompts | Meaning |
|---|---|---|
| **P1** | 1 | All ten work units in a single prompt |
| **P3** | 3 | Three coarse batches |
| **P6** | 6 | Six nested batches |
| **P10** | 10 | One work unit per prompt |

Every condition ends with the same validation prompt (`V`), and every condition is repeated three times (`R1`–`R3`) for each of three agents, giving a balanced 3 (model) × 4 (prompt grain) × 3 (repetition) = **36-run matrix**.

## Repository layout

```
.
├── result.xlsx                 # Primary results workbook (one sheet per agent)
├── experiment/                 # Operator-only protocol and instruments
│   ├── PROTOCOL.md             # How a run is executed end to end
│   ├── STARTER.md              # Frozen starter/toolchain record
│   ├── spec/
│   │   └── SPEC_FREEZE.md      # Canonical application requirements
│   ├── prompts/                # The 22 canonical prompt files (P1/P3/P6/P10 + prefix + validation)
│   │   ├── 00_RUN_PREFIX.txt
│   │   ├── V_VALIDATION.txt
│   │   ├── P1/, P3/, P6/, P10/
│   │   └── README.md           # Explains work-unit grouping per condition
│   └── evaluation/
│       ├── SCORING_SHEET.md    # Full scoring rubric (functional, API, UX, a11y, perf, code)
│       ├── SCORECARD.md        # Abbreviated per-run scorecard
├── starter/                     # Frozen Vite + React + TypeScript starter (no feature code)
└── agents/                      # Archived application snapshots, one subtree per run
    ├── claude sonnet 5 high/
    │   └── r1/ r2/ r3/          # Repetitions
    │       └── P1/ P3/ P6/ P10/ # Prompt conditions
    │           └── starter/    # Final application source for that run
    ├── cursor grok 4.6 high fast/
    │   └── ... (same structure)
    └── gpt 5.6 sol medium/
        └── ... (same structure)
```

## Where to find things

- **Final results used in the article** → [`result.xlsx`](result.xlsx) (sheets: `cursor grok 4.6 high fast`, `claude sonnet 5 high`, `gpt 5.6 sol medium`). Columns include tokens, legacy Functional/12 checklist, per-page Lighthouse scores (login/product/cart), and production JS bundle size.
- **How each run was executed** → [`experiment/PROTOCOL.md`](experiment/PROTOCOL.md).
- **Exact operator prompts sent to the agent** → [`experiment/prompts/`](experiment/prompts/), with grouping logic explained in [`experiment/prompts/README.md`](experiment/prompts/README.md).
- **What the agent was asked to build** → [`experiment/spec/SPEC_FREEZE.md`](experiment/spec/SPEC_FREEZE.md) and [`starter/spec/`](starter/spec/) inside the frozen starter.
- **Scoring instrument** (fuller than what is in `result.xlsx` today) → [`experiment/evaluation/SCORING_SHEET.md`](experiment/evaluation/SCORING_SHEET.md).
- **Generated application code for any specific run** → `agents/<model>/r<N>/<condition>/starter/`, e.g. `agents/claude sonnet 5 high/r2/P6/starter/`.
- **Analysis scripts, cleaned CSV/JSON, and figures used in the paper** → see the analysis and figure-generation artifacts linked from this repository and the supplementary-material index.

## Reproducing or extending a run

1. Copy `starter/` to a new directory (do not open this `experiment/` folder as the agent's workspace — see [`experiment/PROTOCOL.md`](experiment/PROTOCOL.md) for why).
2. `npm ci` inside the copy.
3. Open a new agent session on that directory only.
4. Send `experiment/prompts/00_RUN_PREFIX.txt` + a blank line + the first phase file for your chosen condition (`P1-01`, `P3-01`, `P6-01`, or `P10-01`).
5. Send subsequent phase files one at a time, waiting for the agent to stop each time. Finish with `experiment/prompts/V_VALIDATION.txt`.
6. Score the result with [`experiment/evaluation/SCORING_SHEET.md`](experiment/evaluation/SCORING_SHEET.md) and log it.

## Evidence posture / known limitations

`result.xlsx` logs a **legacy 12-item functional checklist**, not the fuller 16-item instrument and full NFR bundle described in `experiment/evaluation/SCORING_SHEET.md`. Token notation in the workbook is mixed (K/M/"million"); one GPT cell is unitless and was excluded from analysis rather than guessed. Product/Cart Lighthouse scores are missing for some runs where navigation failed (not missing at random). The accompanying article treats all results as **exploratory**, not confirmatory. See the article's "Limits You Should Know" section for the full list.

## Citation

If you use this archive before the accompanying article is formally published, please cite the manuscript and this repository. After publication, replace this placeholder with the final IEEE Software bibliographic citation and DOI.

> N. Kumar and R. Guliani, "How Finely Should You Prompt a Coding Agent? Evidence from 36 Controlled Builds," manuscript submitted to *IEEE Software*, 2026.
