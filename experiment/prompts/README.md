# Canonical prompts (operator-only)

Copy-paste these files. Do not paraphrase. Do not create model-specific versions.

The four conditions are nested aggregations of the same ten work units. Grain size changes. The unit text does not.

| Unit | Work |
|------|------|
| 1 | Login & session |
| 2 | Authenticated app shell |
| 3 | Product catalog & lazy loading |
| 4 | Product card & image gallery |
| 5 | Product search |
| 6 | Reviews & review modal |
| 7 | Add comment |
| 8 | Cart integration & header state |
| 9 | Cart screen |
| 10 | Place Order |

| Condition | Work-unit grouping |
|-----------|--------------------|
| P10 | 1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 7 \| 8 \| 9 \| 10 |
| P6 | 1 \| 2+3 \| 4+5 \| 6+7 \| 8 \| 9+10 |
| P3 | 1+2 \| 3+4+5+6+7 \| 8+9+10 |
| P1 | 1 through 10 in one prompt |

## First message of every run

`00_RUN_PREFIX.txt` then a blank line then the first phase file.

## Then

| Condition | Files in order after the prefix |
|-----------|---------------------------------|
| P1 | `P1/P1-01.txt` → `V_VALIDATION.txt` |
| P3 | `P3/P3-01.txt` → `P3-02.txt` → `P3-03.txt` → `V_VALIDATION.txt` |
| P6 | `P6/P6-01.txt` … `P6-06.txt` → `V_VALIDATION.txt` |
| P10 | `P10/P10-01.txt` … `P10-10.txt` → `V_VALIDATION.txt` |

Later messages are the phase file only. Do not re-attach images on later turns (token confound). Artifacts already live in `starter/spec/`.

Open the agent on a **copy of `starter/`**, never on this `experiment/` folder.

`V_VALIDATION.txt` is identical for all four conditions. That is the point: grain size changes; the audit chance does not.
