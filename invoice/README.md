# Local-only vendor invoice

No dependencies, network calls, persistence, uploads or form submissions. All entered data is held in page memory. The sole homepage change is a footer link.

Run rule tests: `node --test invoice/model.test.mjs`. Serve the repository with a static HTTP server to preview `/invoice/` (ES modules require HTTP).

## PDF and privacy notes

The Download PDF action validates first, prepares measured Letter pages, then opens the browser print dialog. Choose Save as PDF, Letter, 100% scale and disable browser headers/footers. The document title supplies the suggested filename; the user controls the final filename and save location. Cancelling the dialog does not save a file. The page cannot confirm a successful save and never emails automatically.

The button uses `aria-disabled` while invalid, with a guarded click that explains errors and focuses the first field. This resolves the brief's request for both a disabled download and clickable validation feedback. No PDF is prepared while invalid.

The browser may keep a downloaded PDF or print-job history outside this page. Full payment details are deliberately included in the PDF; protect the downloaded file. A fresh page or reload starts empty. Language and form data are not saved. Do not add analytics, remote fonts or scripts to this route.

## Review gates

Owner/CPA review is required before merging. Merging to the Pages source branch publishes the page. Review certification language and payment instructions before publication. Sample QA data must remain fictitious.
