How to run the unit tests

This repository does not declare a JS test framework (no package.json or existing test setup was found), so these tests run in a plain browser without any external dependencies.

Steps:
1) Open tests/test-runner.html in a modern desktop browser.
2) The page loads script.js and executes the test suite automatically.
3) Results are printed on the page with PASS/FAIL and a summary.

What is covered:
- URL param handling added in the current branch:
  • Search tab: reads query and page from the URL, mirrors query into the input, uses filterAppsByQuery(searchTerm), sets or clears the page param, and renders results for the right page.
  • Categories tab: reads category from the URL; renders that category grid when present, otherwise shows the category list.
- Pure function behavior of filterAppsByQuery including developer:"…" and category:"…" filters and combined queries.
- setUrlParam/getUrlParam behavior.
- Modal open behavior from a Search result ("View Details") updates the URL param app.

Notes:
- These tests provide a minimal DOM that script.js expects and exercise the behavior by simulating user clicks on the Search and Categories tabs.
- No external libraries are added, per project constraints. If a standardized framework (e.g., Jest + jsdom) is later introduced to the repo, these tests can be ported accordingly.