# Local-only vendor invoice

No dependencies, network calls, persistence, uploads or form submissions. All entered data is held in page memory. There is no homepage link: vendors receive the direct `/invoice/` URL.

Run rule tests: `node --test invoice/model.test.mjs`. Serve the repository with a static HTTP server to preview `/invoice/` (ES modules require HTTP).

## PDF and privacy notes

The Download PDF action validates first, prepares measured Letter pages, then opens the browser print dialog. Choose Save as PDF, Letter, 100% scale and disable browser headers/footers. The document title supplies the suggested filename; the user controls the final filename and save location. Cancelling the dialog does not save a file. The page cannot confirm a successful save and never emails automatically.

The button uses `aria-disabled` while invalid, with a guarded click that explains errors and focuses the first field. This resolves the brief's request for both a disabled download and clickable validation feedback. No PDF is prepared while invalid.

The browser may keep a downloaded PDF or print-job history outside this page. Full payment details are deliberately included in the PDF; protect the downloaded file. A fresh page or reload starts empty. Language and form data are not saved. Do not add analytics, remote fonts or scripts to this route.

Payee-name differences remain warnings, not download blockers. A visible warning containing the payee name is printed inside the payment block for both ACH and Zelle; case-only and surrounding-space differences are ignored. Optional US country prefix `1` is accepted for Zelle mobile numbers and the PDF shows the normalized 10-digit number. Table PDFs include total row/unit counts; statement PDFs use a dedicated heading and labeled description.

## Review gates

Owner/CPA review is required before merging. Merging to the Pages source branch publishes the page. Review certification language and payment instructions before publication. Sample QA data must remain fictitious.
