# Pre-Deployment Checklist

Before deploying to GitHub Pages, complete these steps:

## ✅ Switch Mavo Storage to Production

### Files to Update:

- [ ] **src/html/index.html** - Change 4 mv-storage attributes (publications + preprints + news + travel)
- [ ] **src/html/publications.html** - Change 4 mv-storage attributes (publications + preprints + workshop papers + doctoral consortium)
- [ ] **src/html/preprint-details.html** - Change 1 mv-storage attribute (preprints)

### Quick Find & Replace:

1. **Publications Storage:**
   - Find: `mv-storage="data/publications.json"`
   - Replace: `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"`

2. **Preprints Storage:**
   - Find: `mv-storage="data/preprints.json"`
   - Replace: `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"`

3. **Workshop Papers Storage:**
   - Find: `mv-storage="data/workshop-papers.json"`
   - Replace: `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"`

4. **Doctoral Consortium Storage:**
   - Find: `mv-storage="data/doctoral-consortium.json"`
   - Replace: `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"`

5. **News Storage:**
   - Find: `mv-storage="data/news.json"`
   - Replace: `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"`

6. **Travel Storage:**
   - Find: `mv-storage="data/travel.json"`
   - Replace: `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"`

3. **Update Comments:**
   - Change `LOCAL (currently active)` to `LOCAL`
   - Change `PRODUCTION` to `PRODUCTION (currently active)`

## ✅ Build & Test

- [ ] Run production build (if you have one) or `npm run dev`
- [ ] Verify all pages load correctly in the `dist/` folder
- [ ] Check that all images are present
- [ ] Test navigation links

## ✅ Commit & Push

- [ ] Stage changes: `git add .`
- [ ] Commit: `git commit -m "Deploy: Switch to production Mavo storage"`
- [ ] Push: `git push origin master`

## ✅ Verify Live Site

After deployment:
- [ ] Visit your live site
- [ ] Test Mavo login functionality
- [ ] Try editing a news item or publication
- [ ] Verify changes save to GitHub

---

## To Switch Back to Local (after deployment):

Just reverse the process:
1. Find: `mv-storage="https://github.com/emeliahughes/personal-website/src/html/data"`
2. Replace back to local paths:
   - `mv-storage="data/publications.json"`
   - `mv-storage="data/preprints.json"`
   - `mv-storage="data/workshop-papers.json"`
   - `mv-storage="data/doctoral-consortium.json"`
   - `mv-storage="data/news.json"`
   - `mv-storage="data/travel.json"`
3. Update comment markers
4. Rebuild

---

**Current Status:** 🏠 LOCAL MODE (for testing)

**Last Updated:** October 7, 2025

