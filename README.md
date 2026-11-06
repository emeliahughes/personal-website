## Requirements

| Prerequisite      | How to check | How to install                    |
| ----------------- | ------------ | --------------------------------- |
| Node.js >= 22.x.x | `node -v`    | [nodejs.org](https://nodejs.org/) |

## Installation

- Run `npm install` in the command line.

## Building

The site uses **Gulp + Nunjucks** to build static HTML from templates and JSON data. Core academic content (publications, CV, research projects) is rendered at **build time**, not via client-side JavaScript.

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Build and start local dev server with file watcher |
| `npx gulp production` | Production build to `./dist` (used by GitHub Actions deploy) |

### Data sources

Edit JSON files in `src/html/data/`:

| File | Content |
| ---- | ------- |
| `publications.json` | Peer-reviewed conference papers |
| `preprints.json` | Companion papers and preprints |
| `workshop-papers.json` | Workshop papers |
| `doctoral-consortium.json` | Doctoral consortium papers |
| `resume.json` | CV / resume entries |
| `research.json` | Research page projects and clusters |
| `teaching.json` | Teaching page content |
| `site.json` | Contact links, selected publications, site metadata |
| `news.json` | Homepage news items |
| `global.json` | Theme config and navigation |

After editing data, rebuild (`npm run dev` or `npx gulp production`). Publication detail pages are generated automatically into `dist/publications/`.

### Deployment

Pushes to `master` run `.github/workflows/publish.yml`, which executes `gulp production` and deploys `./dist` to GitHub Pages.

### Publication labels and CV PDF

Use `publication_format` for a publication's format (for example, `Poster` or `Extended abstract`) and `is_preprint` for its preprint status. The labels appear on publication cards and detail pages.

The web CV and downloadable PDF share `resume.json`. After updating it, install the Python `reportlab` package if needed, run `python3 scripts/build-cv.py --updated "November 2026"` with the appropriate month and year, visually inspect the PDF, then set `cvLastUpdated` in `site.json` to that same date. The PDF stays at its existing download URL. See `DEPLOY_CHECKLIST.md` for preview and deployment checks.

### Research discoverability

The build generates scholarly citation metadata, JSON-LD, per-paper Markdown/JSON/BibTeX exports, `research-index.json`, `llms.txt`, `robots.txt`, and a complete sitemap without changing visible pages. See [RESEARCH_DISCOVERABILITY.md](RESEARCH_DISCOVERABILITY.md) for data fields, source verification, version handling, and current evidence gaps. Run `npm run build` followed by `npm run test:discovery` before publishing these changes.
