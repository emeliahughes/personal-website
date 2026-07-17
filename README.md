## Requirements

| Prerequisite      | How to check | How to install                    |
| ----------------- | ------------ | --------------------------------- |
| Node.js >= 16.x.x | `node -v`    | [nodejs.org](https://nodejs.org/) |

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
