const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const { loadSiteData } = require( './site-data' );
const { normalizeResearch, scholarlySchema, citationTags, safeJson, writeDiscoveryFiles } = require( './research-discovery' );

const data = loadSiteData();
const records = data.researchRecords;
const get = ( id ) => records.find( ( r ) => r.id === id );
const fixture = () => ( {
    papers: [ { id: 'test-paper', title: 'A "paper" <with> & symbols', year: '2026', author: [ { author_name: 'First Author' }, { author_name: 'Second Author' } ],
        conference_full_name: 'Test Conference', abstract: 'An abstract.', links: { pdf_url: 'https://doi.org/10.1234/test' } } ],
    summaries: { schemaVersion: 1, papers: { 'test-paper': { topics: [], sources: [ { id: 'paper', url: 'https://example.org/paper', version: 'v1' } ],
        findings: [ { text: 'A bounded finding.', sourceId: 'paper', locator: 'Section 4' } ] } } },
} );
const normalize = ( f ) => normalizeResearch( f.papers, data.site, { clusters: [] }, f.summaries );

test( 'published and preprint versions retain separate citation and evidence identities', () => {
    const truth = get( 'echo-chambers-information-brokers-truth-social' );
    assert.equal( truth.preferredCitationUrl, 'https://doi.org/10.1145/3715070.3749241' );
    assert.equal( truth.publicationType, 'poster' );
    assert.equal( truth.summary.sources[0].url, 'https://arxiv.org/html/2509.08676v2' );
    for ( const id of [ 'ephemeral-feeds-and-enduring-rituals', 'echoes-in-the-algorithm' ] ) {
        const record = get( id );
        assert.equal( record.status, 'preprint' );
        assert.equal( record.doi, null );
        assert.equal( scholarlySchema( record, data.site ).isPartOf, undefined );
        assert( !citationTags( record ).some( ( tag ) => tag.name === 'citation_conference_title' ) );
    }
} );

test( 'landing pages cannot be advertised as PDFs or Scholar-local PDFs', () => {
    const f = fixture();
    assert.equal( normalize( f )[0].pdfUrl, null );
    for ( const url of [ 'https://arxiv.org/pdf/2609.09331', 'https://dl.acm.org/doi/pdf/10.1234/test', 'https://example.org/paper.pdf' ] ) {
        f.papers[0].links.pdf_url = url;
        const record = normalize( f )[0];
        assert.equal( record.pdfUrl, url );
        assert( !citationTags( record ).some( ( tag ) => tag.name === 'citation_pdf_url' ) );
    }
    f.papers[0].links.pdf_url = 'publications/test-paper.pdf';
    assert.equal( citationTags( normalize( f )[0] ).find( ( tag ) => tag.name === 'citation_pdf_url' ).content,
        'https://emeliahughes.com/publications/test-paper.pdf' );
} );

test( 'summary-only findings do not leak into unchanged page structured data', () => {
    const f = fixture();
    const schema = scholarlySchema( normalize( f )[0], data.site );
    assert.equal( schema.abstract, 'An abstract.' );
    assert( !JSON.stringify( schema ).includes( 'A bounded finding.' ) );
} );

test( 'missing abstract, DOI, and day precision remain absent instead of fabricated', () => {
    const f = fixture();
    delete f.papers[0].abstract;
    const record = normalize( f )[0];
    const schema = scholarlySchema( record, data.site );
    assert.equal( schema.abstract, undefined );
    assert.equal( schema.identifier, undefined );
    assert.equal( schema.datePublished, '2026' );
    assert.equal( record.doi, null );
} );

test( 'JSON-LD safely round-trips hostile strings without ending its script element', () => {
    const payload = { title: '</script><script>alert("x")</script> & \u2028 \u2029' };
    const serialized = safeJson( payload );
    assert( !serialized.includes( '<' ) );
    assert.deepEqual( JSON.parse( serialized ), payload );
} );

test( 'duplicate IDs, orphan summaries, missing author facts, and invalid DOI fail the build', () => {
    let f = fixture(); f.papers.push( { ...f.papers[0] } ); assert.throws( () => normalize( f ), /duplicate/ );
    f = fixture(); f.summaries.papers.unknown = {}; assert.throws( () => normalize( f ), /Orphan/ );
    f = fixture(); f.papers[0].author = []; assert.throws( () => normalize( f ), /citation facts/ );
    f = fixture(); f.summaries.papers['test-paper'].doi = 'not-a-doi'; assert.throws( () => normalize( f ), /DOI/ );
} );

test( 'every summary claim requires a source and locator and every related ID must resolve', () => {
    let f = fixture(); f.summaries.papers['test-paper'].findings[0].sourceId = 'missing'; assert.throws( () => normalize( f ), /Unsourced/ );
    f = fixture(); delete f.summaries.papers['test-paper'].findings[0].locator; assert.throws( () => normalize( f ), /Unsourced/ );
    f = fixture(); f.summaries.papers['test-paper'].relatedPaperIds = [ 'missing' ]; assert.throws( () => normalize( f ), /related/ );
} );

test( 'the catalog covers every paper, separating proposals from full-paper evidence', () => {
    assert.equal( records.length, data.allPapers.length );
    assert.equal( new Set( records.map( ( r ) => r.id ) ).size, records.length );
    const proposal = get( 'rushtok-an-evaluation-of-event-based-communities-on-tiktok' );
    assert.equal( proposal.publicationType, 'doctoral-colloquium' );
    assert.equal( proposal.summary.findings.length, 0 );
    assert.match( proposal.summary.coverageNote, /proposal/ );
    const youth = get( 'examining-mainstream-news-media-narratives-youth-online-safety' );
    assert.match( youth.summary.coverageNote, /full paper supplied by the author/ );
    assert.equal( youth.summary.sources[0].url, 'https://doi.org/10.1145/3678884.3681874' );
    assert.equal( youth.summary.findings.length, 3 );
    assert.match( youth.summary.limitations[0].text, /^Scope of evidence:/ );
    assert( !JSON.stringify( youth ).includes( '/Users/' ) );
    assert.equal( get( 'misinformation-or-activism-mapping-networked-moral-panic-savethechildren' ).publicationType, 'extended-abstract' );
} );

test( 'exports are deterministic, source-linked, and stale exports are removed', () => {
    const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'research-discovery-' ) );
    try {
        fs.mkdirSync( path.join( dir, 'publications' ) );
        fs.writeFileSync( path.join( dir, 'publications/deleted-paper.md' ), 'stale' );
        writeDiscoveryFiles( data, dir );
        assert( !fs.existsSync( path.join( dir, 'publications/deleted-paper.md' ) ) );
        const before = fs.readFileSync( path.join( dir, 'research-index.json' ), 'utf8' );
        writeDiscoveryFiles( data, dir );
        assert.equal( fs.readFileSync( path.join( dir, 'research-index.json' ), 'utf8' ), before );
        for ( const record of records ) {
            const md = fs.readFileSync( path.join( dir, `publications/${ record.id }.md` ), 'utf8' );
            assert( md.includes( record.preferredCitationUrl ) );
            for ( const claim of record.summary.findings ) assert( md.includes( claim.locator ) );
            assert.equal( JSON.parse( fs.readFileSync( path.join( dir, `publications/${ record.id }.json` ) ) ).title, record.title );
            assert.match( fs.readFileSync( path.join( dir, `publications/${ record.id }.bib` ), 'utf8' ), /^@/ );
        }
    } finally { fs.rmSync( dir, { recursive: true, force: true } ); }
} );

test( 'built paper heads actually include metadata, ordered authors, and alternate links', () => {
    for ( const record of records ) {
        const html = fs.readFileSync( path.join( __dirname, `../dist/publications/${ record.id }.html` ), 'utf8' );
        const head = html.split( '</head>' )[0];
        assert( head.includes( 'name="citation_title"' ), record.id );
        assert.equal( [ ...head.matchAll( /name="citation_author"/g ) ].length, record.authors.length );
        const json = JSON.parse( head.match( /<script type="application\/ld\+json">([\s\S]*?)<\/script>/ )[1] );
        assert.equal( json['@type'], 'ScholarlyArticle' );
        assert.deepEqual( json.author.map( ( a ) => a.name ), record.authors );
        assert.equal( json.url, record.url );
        for ( const url of Object.values( record.exports ) ) assert( head.includes( url ) );
    }
} );

test( 'sitemap and robots use the canonical host and exclude redirect utilities', () => {
    const dist = path.join( __dirname, '../dist' );
    const sitemap = fs.readFileSync( path.join( dist, 'sitemap.xml' ), 'utf8' );
    const urls = [ ...sitemap.matchAll( /<loc>(.*?)<\/loc>/g ) ].map( ( m ) => m[1] );
    assert.equal( urls.length, records.length + 6 );
    assert( urls.every( ( url ) => url.startsWith( 'https://emeliahughes.com/' ) ) );
    for ( const record of records ) assert( urls.includes( record.url ) );
    assert( !/details\.html|resume\.html|archive\//.test( sitemap ) );
    assert.match( fs.readFileSync( path.join( dist, 'robots.txt' ), 'utf8' ), /Allow: \/\nSitemap: https:\/\/emeliahughes.com\/sitemap.xml/ );
    for ( const file of [ 'pub-details.html', 'preprint-details.html', 'workshop-details.html', 'doctoral-consortium-details.html', 'resume.html', 'projects.html' ] ) {
        assert.match( fs.readFileSync( path.join( dist, file ), 'utf8' ), /name="robots" content="noindex, follow"/ );
    }
    const home = fs.readFileSync( path.join( dist, 'index.html' ), 'utf8' );
    const person = JSON.parse( home.match( /<script type="application\/ld\+json">([\s\S]*?)<\/script>/ )[1] );
    assert.equal( person['@id'], 'https://emeliahughes.com/#person' );
} );

test( 'metadata template escapes HTML attributes while keeping JSON-LD parseable', () => {
    const nunjucks = require( 'nunjucks' );
    const env = nunjucks.configure( path.join( __dirname, '../src/html' ), { autoescape: true } );
    const f = fixture();
    f.papers[0].title = '</script><img src=x onerror=alert(1)> " &';
    const record = normalize( f )[0];
    const html = env.render( 'shared/research-metadata.html', {
        filename: 'test-paper.html', researchRecord: record,
        citationTags: citationTags( record ), scholarlyJson: safeJson( scholarlySchema( record, data.site ) ),
    } );
    assert( !html.includes( '<img' ) );
    assert( html.includes( '&quot;' ) );
    assert.equal( [ ...html.matchAll( /<script /g ) ].length, 1 );
    const schema = JSON.parse( html.match( /<script type="application\/ld\+json">([\s\S]*?)<\/script>/ )[1] );
    assert.equal( schema.name, record.title );
} );
