# Per-run scorecard (print one)

run_id: ________  model: ________  condition: P1 / P3 / P6 / P10  rep: ________
rater: ________  date: ________  blind to condition? Y / N

## Functional 0/1 (sum / 16)

F1 app ___ F2 login ok ___ F3 bad login ___ F4 first page limit=10 ___
F5 card fields ___ F6 modal ___ F7 reviews ___ F8 add cart ___
F9 badge ___ F10 qty ___ F11 remove ___ F12 place order ___
F13 load more/skip ___ F14 search ___ F15 thumbs ___ F16 add comment ___
**FunctionalScore = ________ / 16**

## API 0/1 (sum / 12)

A1–A8 (login/products/cart as before) ___ / 8
A9 skip increases ___ A10 search URL ___ A11 comments/add ___ A12 postId+userId ___
**ApiScore = ________ / 12**

## UX 0/1/2 (sum / 24) — ignore mock catalog photos

Login U1–U5 ___ / 10
Listing U6–U9 (include search + Load more + thumbs) ___ / 8
Reviews U10–U11 (include add-comment form) ___ / 4
Cart U12–U14 ___ / 6
**UxScore = ________ / 24**

## Lighthouse (do not mix modes)

Perf Login Navigation (0–100): ________
A11y Products Snapshot: ________
Best practices Products Snapshot: ________
SEO Products Snapshot: ________

## Efficiency

total_tokens ________  wall_time ________  console_errors ________

Notes:
________________________________________________________________
invalid_run? Y / N  reason: ____________________________________
