const fs = require( 'fs' );
const path = require( 'path' );

const SUMMARY_SECTIONS = [ 'questions', 'methods', 'findings', 'contributions', 'limitations' ];
const MAIN_PAGES = [ '', 'research.html', 'publications.html', 'teaching.html', 'cv.html', 'about-me.html' ];

function absoluteUrl( base, relative = '' ) {
    return new URL( relative, `${ base.replace( /\/$/, '' ) }/` ).href;
}

function safeJson( value ) {
    // A script element ends at </script>, even when that text is inside a JSON string.
    return JSON.stringify( value ).replace( /</g, '\\u003c' ).replace( />/g, '\\u003e' )
        .replace( /&/g, '\\u0026' ).replace( /\u2028/g, '\\u2028' ).replace( /\u2029/g, '\\u2029' );
}

function xmlEscape( value ) {
    return String( value ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' )
        .replace( />/g, '&gt;' ).replace( /"/g, '&quot;' ).replace( /'/g, '&apos;' );
}

function publicationType( paper ) {
    if ( paper.is_preprint ) return 'preprint';
    if ( paper._source === 'doctoral-consortium.json' ) return 'doctoral-colloquium';
    if ( paper._source === 'workshop-papers.json' ) return 'workshop-paper';
    if ( paper.publication_format === 'Extended abstract' ) return 'extended-abstract';
    if ( paper.publication_format === 'Poster' ) return 'poster';
    if ( paper._source === 'preprints.json' ) return 'companion-paper';
    return 'conference-paper';
}

function bibliography( paper, record ) {
    if ( paper.bibtex ) return paper.bibtex.replace( /\\n/g, '\n' ).trim() + '\n';
    // Missing citations get only facts already present in the catalog; no invented DOI or pages.
    const field = ( value ) => String( value ).replace( /[{}]/g, '' );
    return `@misc{${ record.id },\n  title = {${ field( record.title ) }},\n  author = {${ record.authors.map( field ).join( ' and ' ) }},\n  year = {${ record.year }},\n  howpublished = {${ field( record.venue ) }},\n  note = {${ record.publicationType }},\n  url = {${ record.url }}\n}\n`;
}

function normalizeResearch( papers, site, research, summaries ) {
    if ( summaries.schemaVersion !== 1 ) throw new Error( 'Unsupported research summary schema' );
    const ids = new Set();
    const records = papers.map( ( paper ) => {
        if ( !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test( paper.id ) || ids.has( paper.id ) ) {
            throw new Error( `Invalid or duplicate publication ID: ${ paper.id }` );
        }
        ids.add( paper.id );
        const extra = summaries.papers[ paper.id ] || {};
        if ( !paper.title || !paper.author?.length || paper.author.some( ( author ) => !author.author_name?.trim() ) || !/^\d{4}$/.test( paper.year ) ) {
            throw new Error( `Missing required citation facts: ${ paper.id }` );
        }
        if ( extra.doi && !/^10\.\d{4,9}\/\S+$/.test( extra.doi ) ) throw new Error( `Invalid DOI: ${ paper.id }` );
        const sources = extra.sources || [];
        for ( const source of sources ) {
            if ( !source.id || !source.version || !/^https:\/\//.test( source.url ) ) throw new Error( `Invalid source: ${ paper.id }` );
        }
        const sections = {};
        for ( const section of SUMMARY_SECTIONS ) {
            sections[ section ] = extra[ section ] || [];
            for ( const claim of sections[ section ] ) {
                if ( !claim.text || !claim.locator || !sources.some( ( source ) => source.id === claim.sourceId ) ) {
                    throw new Error( `Unsourced ${ section }: ${ paper.id }` );
                }
            }
        }
        const url = absoluteUrl( site.url, `publications/${ paper.id }.html` );
        const pdfCandidate = paper.links?.pdf_url && absoluteUrl( site.url, paper.links.pdf_url );
        // DOI landing pages are not PDFs, even when the catalog labels their button PDF.
        const pdfUrl = pdfCandidate && ( /\.pdf$/i.test( new URL( pdfCandidate ).pathname )
            || /^https:\/\/(arxiv\.org|dl\.acm\.org)\/(pdf\/|doi\/pdf\/)/.test( pdfCandidate ) ) ? pdfCandidate : null;
        const type = publicationType( paper );
        const versions = [];
        if ( extra.doi ) versions.push( { role: 'published-record', url: `https://doi.org/${ extra.doi }` } );
        if ( extra.arxivId ) versions.push( { role: paper.is_preprint ? 'preprint' : 'author-manuscript', url: `https://arxiv.org/abs/${ extra.arxivId }` } );
        if ( pdfUrl ) versions.push( { role: 'available-full-text', url: pdfUrl } );
        const record = {
            id: paper.id, url, title: paper.title, authors: paper.author.map( ( a ) => a.author_name ),
            year: String( paper.year ), venue: paper.conference_full_name || paper.conference || null, publicationType: type,
            status: paper.is_preprint ? 'preprint' : ( type === 'doctoral-colloquium' ? 'colloquium' : 'published' ),
            doi: extra.doi || null, arxivId: extra.arxivId || null,
            preferredCitationUrl: extra.doi ? `https://doi.org/${ extra.doi }` : ( extra.arxivId ? `https://arxiv.org/abs/${ extra.arxivId }` : url ),
            abstract: paper.abstract || null, pdfUrl, versions,
            topics: extra.topics || [],
            researchAreas: research.clusters.filter( ( c ) => c.projects.some( ( p ) => p.publicationId === paper.id ) ).map( ( c ) => c.title ),
            relatedPaperIds: extra.relatedPaperIds || [],
            summary: { type: extra.summaryType || 'No additional research summary supplied.', sources, ...sections, coverageNote: extra.coverageNote || null },
            exports: { markdown: url.replace( /\.html$/, '.md' ), json: url.replace( /\.html$/, '.json' ), bibtex: url.replace( /\.html$/, '.bib' ) },
        };
        record.bibtex = bibliography( paper, record );
        return record;
    } );
    for ( const record of records ) {
        for ( const related of record.relatedPaperIds ) {
            if ( related === record.id || !ids.has( related ) ) throw new Error( `Invalid related publication: ${ related }` );
        }
    }
    for ( const id of Object.keys( summaries.papers ) ) {
        if ( !ids.has( id ) ) throw new Error( `Orphan research summary: ${ id }` );
    }
    return records;
}

function personSchema( site ) {
    return {
        '@context': 'https://schema.org', '@type': 'Person', '@id': `${ site.url }/#person`,
        name: site.name, url: `${ site.url }/`, image: absoluteUrl( site.url, site.headshot ),
        email: `mailto:${ site.emailAcademic }`, jobTitle: 'PhD Candidate in Computer Science and Engineering',
        affiliation: { '@type': 'CollegeOrUniversity', name: site.affiliation },
        sameAs: [ site.googleScholar, site.linkedin, site.orcid ].filter( Boolean ),
    };
}

function scholarlySchema( record, site ) {
    // Only facts also represented on the existing visible paper page belong here.
    const schema = {
        '@context': 'https://schema.org', '@type': 'ScholarlyArticle', '@id': `${ record.url }#article`,
        name: record.title, headline: record.title, url: record.url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': record.url },
        author: record.authors.map( ( name ) => ( { '@type': 'Person', name,
            ...( /Emelia.*Hughes/.test( name ) ? { '@id': `${ site.url }/#person` } : {} ) } ) ),
        datePublished: record.year, creativeWorkStatus: record.status,
        genre: record.publicationType,
    };
    if ( record.abstract ) schema.abstract = record.abstract;
    if ( record.status !== 'preprint' && record.venue ) schema.isPartOf = { '@type': 'CreativeWork', name: record.venue };
    const identifiers = [];
    if ( record.doi ) identifiers.push( { '@type': 'PropertyValue', propertyID: 'DOI', value: record.doi } );
    if ( record.arxivId ) identifiers.push( { '@type': 'PropertyValue', propertyID: 'arXiv', value: record.arxivId } );
    if ( identifiers.length ) schema.identifier = identifiers;
    if ( record.doi || record.arxivId ) schema.sameAs = record.preferredCitationUrl;
    if ( record.pdfUrl ) schema.encoding = { '@type': 'MediaObject', encodingFormat: 'application/pdf', contentUrl: record.pdfUrl,
        name: record.arxivId ? 'Available arXiv manuscript PDF' : 'Available full-text PDF' };
    return schema;
}

function citationTags( record ) {
    const tags = [ { name: 'citation_title', content: record.title },
        ...record.authors.map( ( author ) => ( { name: 'citation_author', content: author } ) ),
        { name: 'citation_publication_date', content: record.year } ];
    if ( record.status !== 'preprint' && record.venue ) tags.push( { name: 'citation_conference_title', content: record.venue } );
    if ( record.doi ) tags.push( { name: 'citation_doi', content: record.doi } );
    if ( record.pdfUrl ) {
        const pdf = new URL( record.pdfUrl );
        const html = new URL( record.url );
        if ( pdf.origin === html.origin && path.posix.dirname( pdf.pathname ) === path.posix.dirname( html.pathname ) ) {
            tags.push( { name: 'citation_pdf_url', content: record.pdfUrl } );
        }
    }
    return tags;
}

function markdown( record, allRecords ) {
    const lines = [ `# ${ record.title }`, '', `${ record.authors.join( '; ' ) }. ${ record.year }.`, '',
        ...( record.venue ? [ `Venue: ${ record.venue }` ] : [] ), `Publication type: ${ record.publicationType }`, `Status: ${ record.status }`,
        `Preferred citation: ${ record.preferredCitationUrl }`, `Website record: ${ record.url }`, '' ];
    if ( record.doi ) lines.push( `DOI: ${ record.doi }`, '' );
    if ( record.arxivId ) lines.push( `arXiv: ${ record.arxivId }`, '' );
    if ( record.abstract ) lines.push( '## Author-written abstract', '', record.abstract, '' );
    lines.push( '## Research summary', '', record.summary.type, '' );
    if ( record.summary.coverageNote ) lines.push( record.summary.coverageNote, '' );
    const titles = { questions: 'Research questions', methods: 'Methods', findings: 'Findings', contributions: 'Contributions', limitations: 'Limitations and scope' };
    for ( const section of SUMMARY_SECTIONS ) {
        const claims = record.summary[ section ];
        if ( !claims.length ) continue;
        lines.push( `### ${ titles[ section ] }`, '' );
        for ( const claim of claims ) {
            const source = record.summary.sources.find( ( s ) => s.id === claim.sourceId );
            lines.push( `- ${ claim.text } ([Source](${ source.url }); ${ source.version }; ${ claim.locator })` );
        }
        lines.push( '' );
    }
    lines.push( '## Topics', '', record.topics.join( ', ' ), '', '## Available versions', '' );
    for ( const version of record.versions ) lines.push( `- [${ version.role }](${ version.url })` );
    if ( record.relatedPaperIds.length ) {
        lines.push( '', '## Related research', '' );
        for ( const id of record.relatedPaperIds ) {
            const related = allRecords.find( ( r ) => r.id === id );
            lines.push( `- [${ related.title }](${ related.exports.markdown }) (${ related.publicationType }, ${ related.year })` );
        }
    }
    lines.push( '', '## BibTeX', '', '```bibtex', record.bibtex.trim(), '```', '' );
    return lines.join( '\n' );
}

function writeDiscoveryFiles( data, dist ) {
    const records = data.researchRecords;
    const dir = path.join( dist, 'publications' );
    fs.mkdirSync( dir, { recursive: true } );
    // A deleted paper must not leave a stale machine-readable export behind in dev mode.
    const ids = new Set( records.map( ( r ) => r.id ) );
    for ( const file of fs.readdirSync( dir ) ) {
        if ( /\.(md|json|bib)$/.test( file ) && !ids.has( file.replace( /\.(md|json|bib)$/, '' ) ) ) fs.unlinkSync( path.join( dir, file ) );
    }
    for ( const record of records ) {
        fs.writeFileSync( path.join( dir, `${ record.id }.json` ), JSON.stringify( { schemaVersion: 1, ...record }, null, 2 ) + '\n' );
        fs.writeFileSync( path.join( dir, `${ record.id }.md` ), markdown( record, records ) );
        fs.writeFileSync( path.join( dir, `${ record.id }.bib` ), record.bibtex );
    }
    fs.writeFileSync( path.join( dist, 'research-index.json' ), JSON.stringify( {
        schemaVersion: 1, url: `${ data.site.url }/research-index.json`, author: data.site.name,
        description: 'Public research catalog. Preprints, proposals, and published contributions retain separate status and evidence scope.',
        papers: records,
    }, null, 2 ) + '\n' );
    const llms = [ `# ${ data.site.name } — Research`, '',
        '> Social computing and human-computer interaction research at the University of Notre Dame.', '',
        '## Research catalog', '', `[Structured research index](${ data.site.url }/research-index.json): Bibliographic facts, publication status, topics, source-backed summaries, and citations.`, '',
        '## Papers', '', ...records.map( ( r ) => `- [${ r.title }](${ r.exports.markdown }): ${ r.year }; ${ r.publicationType }.` ), '',
        '## Citation and evidence notes', '',
        'Use the published DOI when supplied; arXiv and published versions are distinguished in each record. Summaries are paraphrases with source locators, not quotations. Research proposals and preprints must not be treated as completed peer-reviewed publications. Abstract-only summaries are marked. These files describe the research and do not grant additional reuse rights.', '' ];
    fs.writeFileSync( path.join( dist, 'llms.txt' ), llms.join( '\n' ) );
    const urls = [ ...MAIN_PAGES.map( ( p ) => absoluteUrl( data.site.url, p ) ), ...records.map( ( r ) => r.url ) ];
    fs.writeFileSync( path.join( dist, 'sitemap.xml' ), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + urls.map( ( url ) => `  <url><loc>${ xmlEscape( url ) }</loc></url>` ).join( '\n' ) + '\n</urlset>\n' );
    fs.writeFileSync( path.join( dist, 'robots.txt' ), `User-agent: *\nAllow: /\nSitemap: ${ data.site.url }/sitemap.xml\n` );
}

module.exports = { SUMMARY_SECTIONS, MAIN_PAGES, safeJson, xmlEscape, absoluteUrl, normalizeResearch, scholarlySchema, personSchema, citationTags, markdown, writeDiscoveryFiles };
