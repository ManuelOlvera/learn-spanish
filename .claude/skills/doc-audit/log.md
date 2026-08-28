# Doc audit log

One line per `/doc-audit` run, newest first. The sha is HEAD at audit time, and
it is what the next run diffs against — so an audit that found nothing still
gets a line.

Format: `- YYYY-MM-DD  <sha>  <one sentence>`

- 2026-08-29  cbab794  First run. Five localStorage keys were missing from the inventory (wallet.v1, boost.v1, challenge.v1, daily-gift.v1, letter-case.v1) — added, with a note saying error-reloaded is sessionStorage and deliberately outside the table. 589 tests green, 98.21% coverage, links and index clean.
