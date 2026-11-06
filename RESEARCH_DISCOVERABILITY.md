# Research discovery and citation exports

The existing HTML pages keep their visible content and layout. The Gulp build adds scholarly metadata to the HTML head and generates public research exports. No database, API server, bot-specific rendering, or new runtime dependency is required.

## Sources of truth

- The four existing publication JSON files remain authoritative for titles, author order, year, venue, abstract, displayed status, and BibTeX.
- `src/html/data/research-summaries.json` adds verified identifiers, topics, related paper IDs, source versions, and editorial research summaries. It does not override visible page content.
- `site.json` defines the canonical base URL, currently `https://emeliahughes.com`.
- `research.json` supplies research-area relationships through each project's publication ID.

Each summary statement must have `text`, a `sourceId` matching one of the paper's `sources`, and a human-readable `locator` (section or page). Sources identify the exact version read. Summaries are paraphrases, not quotations. Preserve uncertainty and limitations. Do not copy private review correspondence or treat proposals and preprints as completed peer-reviewed studies.

## Generated files

For every existing `/publications/<id>.html`, the build creates:

- `/publications/<id>.md`: citation, full author-written abstract when available, sourced summaries, limitations, versions, and related papers.
- `/publications/<id>.json`: the same information with `schemaVersion: 1`.
- `/publications/<id>.bib`: existing BibTeX, or a minimal citation using only established catalog facts.

The root `/research-index.json` includes all publication records. `/llms.txt` provides a concise guide and links to the Markdown files. These are public documents anyone can read, not a private interface or a guarantee of AI citations.

Paper HTML heads advertise the exports using alternate links. All main pages link to the research index and `llms.txt` through head metadata. Paper heads include Google Scholar citation tags and Schema.org ScholarlyArticle JSON-LD. The homepage includes a Person record linked to the paper authors through a stable identifier.

Structured data on the existing HTML describes only its visible bibliographic content and abstract. Additional questions, findings, and limitations are published in the separate Markdown/JSON documents, not hidden in the HTML body or stuffed into its JSON-LD.

## Citation and version rules

- Prefer a verified published DOI for published work; retain arXiv as a separately identified manuscript version.
- Keep preprints, posters, extended abstracts, workshop papers, and doctoral colloquium contributions distinct.
- Never turn a DOI landing page into a PDF URL. External PDF URLs are exported as available full-text links, not as locally hosted files.
- Emit `citation_pdf_url` only when its actual PDF URL shares the origin and directory of the HTML page, as required by Google Scholar. Current PDFs are external or in a separate local directory, so none qualify.
- Dates use only the catalog's known year; no first-of-month/day publication dates are invented.
- Do not invent a DOI, journal acceptance, pagination, license, affiliation, ORCID, or completed finding.
- Keep the displayed author names intact; no guessed name expansion or author identity merging is performed except linking the site's owner's name to her own Person identifier.

## Build, verify, and update

1. Update the publication record and its research summary together when new evidence or a revised version is available. A new ID must be unique; keep existing IDs stable.
2. Run `npm run build`, then `npm run test:discovery`.
3. Inspect a generated paper head and its Markdown/JSON/BibTeX exports. Check summary claims against source sections, especially after paper revisions.
4. Preview mobile and desktop pages to ensure appearance remains unchanged. Restart `npm run dev` after editing JavaScript build helpers; JSON/template edits regenerate HTML, paper pages, and discovery files automatically.
5. Review before committing and publishing. After deployment, fetch the files without JavaScript and verify the canonical URLs, robots policy, and sitemap. Submit `/sitemap.xml` through Search Console when account access is available.

`research-discovery` runs after static copying in production and development. It generates `robots.txt` with the existing permissive policy and a sitemap containing the six main pages plus every paper. The old static copies were removed to prevent overwriting generated outputs. Redirect utilities receive `noindex, follow` and stay out of the sitemap. Last-modified dates are omitted until real per-record change dates are maintained. Deleted papers' generated exports and detail pages are removed on regeneration.

## Current evidence gaps

- **Youth online safety:** verified against the author-supplied six-page published PDF (printed pp. 349-354). Public source references use its DOI, not a private local file path. The full PDF is not republished. No separate limitations section exists; its summary labels the scope of the study without inventing author-stated limitations.
- **2024 RushTok colloquium:** the local PDF's first page displays October 7, 2025, while its statement of interest and existing catalog identify AoIR 2024. The catalog year remains 2024; no exact publication date or DOI is invented. This file is summarized as a research proposal, separate from the 2026 empirical preprint.
- **AoIR 2021 extended abstract:** no separate author-stated limitations section was identified; its scope and format are stated without manufacturing one.

## References

- [Google Scholar inclusion and citation metadata](https://scholar.google.com/intl/en/scholar/inclusion.html)
- [Schema.org ScholarlyArticle](https://schema.org/ScholarlyArticle)
- [Google structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google Search AI feature guidance](https://developers.google.com/search/docs/appearance/ai-features)
- [llms.txt proposal](https://llmstxt.org/)
