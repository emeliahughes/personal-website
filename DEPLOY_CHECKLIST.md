# Website update and deployment checklist

## Edit source content

- Update academic content in `src/html/data/`; see README.md for each file's purpose.
- Publications are rendered at build time from JSON. The site no longer uses Mavo login or browser-based GitHub storage.
- Keep publication IDs stable: each generates `publications/<id>.html`. Existing query-string detail links redirect to these pages.
- Use `publication_format` for labels such as `Poster` or `Extended abstract`, and `is_preprint` for preprint status.
- Keep the web CV and `src/html/data/pdfs/Emelia-Hughes-CV.pdf` synchronized. Regenerate the PDF with `python3 scripts/build-cv.py` after installing ReportLab, and update `cvLastUpdated` only when both are ready.

## Build and preview

- Run `npm ci` when dependencies need installation, then `npm run build` (Node.js 22 or later).
- Preview `dist/` with `npm run dev`, or serve it with `python3 -m http.server 8765 --directory dist`.
- Check Home, Publications, Research, About, Teaching, CV, and publication detail pages.
- Test mobile and desktop layouts, menu navigation, keyboard focus, and dialog opening/closing.
- Verify publication categories, citations, images, links, and the downloaded PDF.
- Inspect the PDF visually after regeneration. Do not edit generated HTML in `dist/`.
- Run `npm run test:discovery`; verify the generated sitemap, citation metadata, and paper exports. See RESEARCH_DISCOVERABILITY.md for summary provenance and evidence gaps.

## Deploy when authorized

- Review the source diff and build output before committing.
- Pushes to `master` trigger `.github/workflows/publish.yml`.
- That workflow runs `npm ci` and `npm run build`, then publishes `dist/` to the `main` branch of `emeliahughes/emeliahughes.github.io`.
- Deployment requires the configured `PERSONAL_TOKEN` repository secret.

## Verify after deployment

- Confirm the live site displays the new content and loads its assets.
- Test existing publication URLs and the CV download.
- Fetch `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/research-index.json`, and a paper’s `.md`, `.json`, and `.bib` files. Submit the sitemap through Search Console when available.
- Check mobile navigation, publication labels, and CV dates again on the deployed site.
