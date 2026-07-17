const fs = require( 'fs' );
const path = require( 'path' );

const DATA_DIR = path.join( __dirname, '../src/html/data' );

function loadJson( filename ) {
    return JSON.parse( fs.readFileSync( path.join( DATA_DIR, filename ), 'utf8' ) );
}

function formatAuthors( authors ) {
    if ( !authors || !authors.length ) return '';
    return authors.map( ( a ) => a.author_name ).join( ', ' );
}

function getConferenceUrl( paper ) {
    return paper.links?.website_url || paper[ 'conference url' ] || null;
}

function collectPapersFromFile( filename, defaults = {} ) {
    const data = loadJson( filename );
    return ( data.paper || [] ).map( ( paper ) => ( {
        ...paper,
        ...defaults,
        _source: filename,
    } ) );
}

function getAllPapers() {
    const conference = collectPapersFromFile( 'publications.json', { pubType: 'conference' } );
    const preprints = collectPapersFromFile( 'preprints.json', { pubType: 'preprint-mixed' } );
    const workshop = collectPapersFromFile( 'workshop-papers.json', { pubType: 'workshop' } );
    const doctoral = collectPapersFromFile( 'doctoral-consortium.json', { pubType: 'doctoral-consortium' } );

    return [ ...conference, ...preprints, ...workshop, ...doctoral ];
}

function getPaperById( id ) {
    return getAllPapers().find( ( p ) => p.id === id ) || null;
}

function sortByYearDesc( papers ) {
    return [ ...papers ].sort( ( a, b ) => Number( b.year ) - Number( a.year ) );
}

function getPublicationSections() {
    const conference = sortByYearDesc( collectPapersFromFile( 'publications.json' ) );
    const preprintsData = collectPapersFromFile( 'preprints.json' );
    const companion = sortByYearDesc( preprintsData.filter( ( p ) => !p.is_preprint ) );
    const preprints = sortByYearDesc( preprintsData.filter( ( p ) => p.is_preprint ) );
    const workshop = sortByYearDesc( collectPapersFromFile( 'workshop-papers.json' ) );
    const doctoral = sortByYearDesc( collectPapersFromFile( 'doctoral-consortium.json' ) );

    const selectedIds = loadJson( 'site.json' ).selectedPublicationIds;
    const all = getAllPapers();
    const selected = selectedIds
        .map( ( id ) => all.find( ( p ) => p.id === id ) )
        .filter( Boolean );

    return {
        selected,
        conference,
        companion,
        workshop,
        doctoral,
        preprints,
        all: sortByYearDesc( all ),
    };
}

function loadSiteData() {
    const global = loadJson( 'global.json' );
    const site = loadJson( 'site.json' );
    const resume = loadJson( 'resume.json' );
    const news = loadJson( 'news.json' );
    const travel = loadJson( 'travel.json' );
    const research = loadJson( 'research.json' );
    const teaching = loadJson( 'teaching.json' );
    const publications = getPublicationSections();

    return {
        ...global,
        site,
        resume,
        news,
        travel,
        research,
        teaching,
        publications,
        allPapers: publications.all,
        formatAuthors,
        getConferenceUrl,
        getPaperById,
        pubDetailUrl( paper ) {
            return `publications/${ paper.id }.html`;
        },
        legacyPubDetailUrl( paper ) {
            if ( paper.pubType === 'conference' || paper._source === 'publications.json' ) {
                return `pub-details.html?id=${ paper.id }`;
            }
            if ( paper._source === 'doctoral-consortium.json' ) {
                return `doctoral-consortium-details.html?id=${ paper.id }`;
            }
            if ( paper._source === 'workshop-papers.json' ) {
                return `workshop-details.html?id=${ paper.id }`;
            }
            return `preprint-details.html?id=${ paper.id }`;
        },
    };
}

function registerNunjucksFilters( env ) {
    env.addFilter( 'formatAuthors', formatAuthors );
    env.addFilter( 'pubDetailUrl', ( paper ) => `publications/${ paper.id }.html` );
    env.addFilter( 'sortYearDesc', sortByYearDesc );
}

module.exports = {
    loadJson,
    loadSiteData,
    getAllPapers,
    getPaperById,
    getPublicationSections,
    formatAuthors,
    getConferenceUrl,
    registerNunjucksFilters,
    DATA_DIR,
};
