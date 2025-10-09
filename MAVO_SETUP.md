# Mavo Storage Configuration

This website uses Mavo for content management. The storage can be configured for either local testing or production (GitHub).

## Storage Modes

### Local Testing Mode
- Uses local JSON files from `dist/data/`
- Good for testing changes without GitHub authentication
- Files are automatically copied from `src/html/data/` during build

### Production Mode (GitHub)
- Uses GitHub as the backend storage
- Allows editing directly on the live site (requires GitHub login)
- Changes are committed directly to the repository

## Files with Mavo Storage

The following files contain Mavo apps with configurable storage:

1. **index.html** (Homepage)
   - Publications app (read-only, shows 3 most recent)
   - Preprints app (read-only, shows all)
   - News app (editable)
   - Travel app (editable)

2. **publications.html** (Publications Page)
   - Publications app (full editing)
   - Preprints app (full editing)
   - Workshop Papers app (full editing)
   - Doctoral Consortium app (full editing)

3. **resume.html** (Resume Page)
   - Resume app (already configured for GitHub)

4. **pub-details.html** (Publication Details)
   - Publications app (already configured for GitHub)

5. **preprint-details.html** (Preprint Details)
   - Preprints app (already configured for GitHub)

6. **workshop-details.html** (Workshop Paper Details)
   - Workshop Papers app (already configured for GitHub)

7. **doctoral-consortium-details.html** (Doctoral Consortium Details)
   - Doctoral Consortium app (already configured for GitHub)

## How to Switch Storage

### ⚠️ Currently Set To: PRODUCTION (GitHub storage)

Each file has comments showing both options:
```html
<!-- LOCAL: mv-storage="data/publications.json" -->
<!-- PRODUCTION (currently active): mv-storage="https://github.com/emeliahughes/personal-website/src/html/data/publications.json" -->
<div mv-app="..." mv-storage="https://github.com/emeliahughes/personal-website/src/html/data/publications.json">
```

**IMPORTANT:** Before deploying to production, you MUST switch all `mv-storage` attributes to use GitHub URLs!

### To Switch to Local Testing:
1. In the source files (src/html/*.html), change the `mv-storage` attribute to use local paths:
   - `mv-storage="data/publications.json"`
   - `mv-storage="data/preprints.json"`
   - `mv-storage="data/workshop-papers.json"`
   - `mv-storage="data/doctoral-consortium.json"`
   - `mv-storage="data/news.json"`
   - `mv-storage="data/travel.json"`
   - `mv-storage="data/resume.json"`
2. Rebuild with `npm run dev`

### To Switch to Production (REQUIRED before deploying):
1. In ALL source files with Mavo apps, swap the commented lines:
   ```html
   <!-- Comment out the LOCAL line and uncomment the PRODUCTION line -->
   <div mv-app="..." mv-storage="https://github.com/emeliahughes/personal-website/src/html/data/FILENAME.json">
   ```
2. Files to update:
   - `src/html/index.html` (4 Mavo apps: publications, preprints, news, and travel)
   - `src/html/publications.html` (4 Mavo apps: publications, preprints, workshop papers, and doctoral consortium)
   - `src/html/preprint-details.html` (1 Mavo app: preprints)
   - `src/html/workshop-details.html` (1 Mavo app: workshop papers)
   - `src/html/doctoral-consortium-details.html` (1 Mavo app: doctoral consortium)
3. Rebuild with `npm run dev` or production build
4. Deploy to GitHub Pages

**TIP:** Use find/replace to change all instances at once:
- Find: `mv-storage="data/`
- Replace: `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"` (then update the filename in the URL)

## Data Files

All data is stored in JSON format:
- `src/html/data/publications.json` - Publication entries
- `src/html/data/preprints.json` - Late breaking work & preprint entries
- `src/html/data/workshop-papers.json` - Lightly refereed workshop papers
- `src/html/data/doctoral-consortium.json` - Doctoral consortium papers
- `src/html/data/news.json` - News items
- `src/html/data/travel.json` - Upcoming travel items
- `src/html/data/project-nav.json` - Project navigation items
- `src/html/data/resume.json` - Resume data
- `src/html/data/global.json` - Global configuration
- `src/html/data/pdfs/**` - PDF files for publications

During build, these files are automatically copied to `dist/data/` for local testing.

## GitHub Authentication

When using GitHub storage on the live site:
1. Click the login button in the Mavo bar
2. Authenticate with GitHub
3. Mavo will request permission to write to the repository
4. After editing, changes are automatically committed to GitHub

## Important Notes

- The production site should ALWAYS use GitHub storage
- Local storage is only for testing during development
- Remember to rebuild (`npm run dev`) after changing storage settings

