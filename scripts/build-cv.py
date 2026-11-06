"""Build the downloadable CV from the same JSON content as the website.

Requires Python 3 and ReportLab. Run from any directory:
    python3 scripts/build-cv.py --updated 'November 2026'
"""
import argparse
import json
import re
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/html/data'


def load(name):
    return json.loads((DATA / name).read_text())


def markup(text):
    # JSON citations contain only intentional emphasis; escape everything else.
    text = escape(text).replace('&lt;strong&gt;', '<b>').replace('&lt;/strong&gt;', '</b>')
    text = text.replace('–', '-').replace('—', '-').replace('‑', '-')
    return re.sub(r'(https://[^\s<]+)', r'<link href="\1" color="#a32121">\1</link>', text)


def build(updated):
    site, resume = load('site.json'), load('resume.json')
    styles = getSampleStyleSheet()
    for name, options in {
        'Name': dict(fontSize=24, leading=29, textColor=colors.HexColor('#a32121'), spaceAfter=7),
        'Contact': dict(fontSize=9, leading=13, spaceAfter=3),
        'Section': dict(fontSize=13, leading=17, textColor=colors.HexColor('#a32121'), spaceBefore=17, spaceAfter=8, keepWithNext=True),
        'Entry': dict(fontSize=10.5, leading=14, fontName='Helvetica-Bold', spaceBefore=7, spaceAfter=2, keepWithNext=True),
        'Role': dict(fontSize=9.5, leading=13, fontName='Helvetica-Oblique', spaceAfter=2, keepWithNext=True),
        'Date': dict(fontSize=9, leading=12, textColor=colors.HexColor('#665d5d'), spaceAfter=4, keepWithNext=True),
        'Item': dict(fontSize=9.5, leading=13, leftIndent=11, firstLineIndent=-8, spaceAfter=3),
        'Citation': dict(fontSize=9.5, leading=13, leftIndent=14, firstLineIndent=-14, spaceAfter=7),
    }.items():
        styles.add(ParagraphStyle(name=name, **options))
    story = [Paragraph('Emelia May Hughes', styles['Name']),
             Paragraph(markup(f'{site["role"]}'), styles['Contact']),
             Paragraph(markup(f'{site["url"]} | {site["emailAcademic"]}'), styles['Contact']),
             Paragraph(markup(site['linkedin']), styles['Contact']),
             Paragraph(f'Last updated {escape(updated)}', styles['Contact']),
             HRFlowable(width='100%', thickness=.7, color=colors.HexColor('#a32121'))]
    for category in resume['resume-category']:
        story.append(Paragraph(escape(category['category']), styles['Section']))
        for column in category['category-item']:
            for item in column:
                if 'publication-item-heading' in item:
                    story.append(Paragraph(markup(item['publication-item-heading']), styles['Entry']))
                    for i, citation in enumerate(item['publication-list'], 1):
                        story.append(Paragraph(f'{i}. {markup(citation)}', styles['Citation']))
                else:
                    if 'item-heading' in item:
                        story.append(Paragraph(markup(item['item-heading']), styles['Entry']))
                    if 'item-role' in item:
                        story.append(Paragraph(markup(item['item-role']), styles['Role']))
                    date = item.get('item-date', item.get('date-list'))
                    if date:
                        story.append(Paragraph(markup(date), styles['Date']))
                    for description in item.get('item-description', []):
                        story.append(Paragraph(f'• {markup(description)}', styles['Item']))
                    story.append(Spacer(1, 3))
    output = DATA / 'pdfs/Emelia-Hughes-CV.pdf'
    doc = SimpleDocTemplate(str(output), pagesize=letter, rightMargin=48, leftMargin=48,
                            topMargin=42, bottomMargin=42, title='Emelia May Hughes - Curriculum Vitae',
                            author='Emelia May Hughes', invariant=True)

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#665d5d'))
        canvas.drawString(48, 24, 'Emelia May Hughes | Curriculum Vitae')
        canvas.drawRightString(letter[0] - 48, 24, str(doc.page))
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(output)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--updated', default=load('site.json')['cvLastUpdated'])
    build(parser.parse_args().updated)
