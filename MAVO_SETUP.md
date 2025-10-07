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
   - News app (editable)

2. **publications.html** (Publications Page)
   - Publications app (full editing)

3. **resume.html** (Resume Page)
   - Resume app (already configured for GitHub)

4. **pub-details.html** (Publication Details)
   - Publications app (already configured for GitHub)

## How to Switch Storage

### Currently Set To: PRODUCTION (GitHub)

Each file has comments showing both options:
```html
<!-- For local testing: mv-storage="data/publications.json" -->
<!-- For production: mv-storage="https://github.com/emeliahughes/personal-website/src/html/data" -->
<div mv-app="..." mv-storage="https://github.com/emeliahughes/personal-website/src/html/data">
```

### To Switch to Local Testing:
1. In the source files (src/html/*.html), change the `mv-storage` attribute to use local paths:
   - `mv-storage="data/publications.json"`
   - `mv-storage="data/news.json"`
   - `mv-storage="data/resume.json"`
2. Rebuild with `npm run dev`

### To Switch to Production:
1. In the source files, change the `mv-storage` attribute to use GitHub:
   - `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"`
2. Rebuild and deploy

## Data Files

All data is stored in JSON format:
- `src/html/data/publications.json` - Publication entries
- `src/html/data/news.json` - News items
- `src/html/data/project-nav.json` - Project navigation items
- `src/html/data/resume.json` - Resume data
- `src/html/data/global.json` - Global configuration

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

