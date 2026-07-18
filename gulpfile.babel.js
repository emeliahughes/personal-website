const format = require( 'string-template' );
const del = require( 'del' );
const path = require( 'path' );
const fs = require( 'fs' );
const browserSync = require( 'browser-sync' );
const named = require( 'vinyl-named' );
const webpack = require( 'webpack-stream' );
const gulp = require( 'gulp' );
const autoprefixer = require('autoprefixer');
const CleanCSS = require('clean-css');
const sass = require( 'gulp-sass' )( require( 'sass' ) );
const $ = require( 'gulp-load-plugins' )();

const pkg = require( './package.json' );
const { loadSiteData, getAllPapers, registerNunjucksFilters, formatAuthors } = require( './scripts/site-data' );

const assetVersion = ( process.env.GITHUB_SHA || pkg.version ).slice( 0, 12 );

const gulpConfig = ( () => {
    // template variable
    function template( variable, vars ) {
        if ( null !== variable && 'object' === typeof variable || Array.isArray( variable ) ) {
            for ( const k in variable ) {
                variable[k] = template( variable[k], vars );
            }
        }
        if ( 'string' === typeof variable ) {
            variable = format( variable, vars );
        }
        return variable;
    }
    return template( pkg.gulp_config, pkg.gulp_config.variables );
} )();

/**
 * Error Handler for gulp-plumber
 */
function errorHandler( err ) {
    console.error( err );
    this.emit( 'end' );
}


/**
 * Clean Task
 */
gulp.task( 'clean', ( cb ) => {
    del( gulpConfig.variables.dist ).then( () => {
        cb();
    } );
} );


/**
 * BrowserSync Task
 */
gulp.task( 'browserSyncTask', () => {
    browserSync.init( gulpConfig.browserSync );
} );


/**
 * HTML Task
 */
function getTemplateData( file ) {
    const data = loadSiteData();
    data.file = file;
    data.filename = path.basename( file.path );

    data.isActiveMenuItem = function ( navFile, item, filename ) {
        if ( navFile === filename || ( item.sub && item.sub[filename] ) ) {
            return true;
        }

        if ( item.sub ) {
            for ( const fileSub in item.sub ) {
                const itemSub = item.sub[fileSub];

                if ( fileSub === filename || ( itemSub.sub && itemSub.sub[filename] ) ) {
                    return true;
                }
            }
        }

        return false;
    };

    return data;
}

function nunjucksRenderOptions() {
    return {
        path: gulpConfig.html.renderPath,
        envOptions: {
            watch: false,
        },
        manageEnv: ( env ) => {
            registerNunjucksFilters( env );
        },
    };
}

gulp.task( 'html', () => gulp.src( [
    gulpConfig.html.from,
    `!${ gulpConfig.variables.src }/html/_templates/**`,
    `!${ gulpConfig.variables.src }/html/layouts/**`,
    `!${ gulpConfig.variables.src }/html/macros/**`,
    `!${ gulpConfig.variables.src }/html/shared/**`,
] )
    .pipe( $.plumber( { errorHandler } ) )
    .pipe( $.data( getTemplateData ) )
    .pipe( $.nunjucksRender( nunjucksRenderOptions() ) )
    .pipe( $.prettify( { indent_size: 4, unformatted: ['pre', 'code'] } ) )
    .pipe( gulp.dest( gulpConfig.html.to ) )
    .on( 'end', () => {
        browserSync.reload();
    } ) );


gulp.task( 'publication-pages', ( cb ) => {
    const papers = getAllPapers();
    const nunjucks = require( 'nunjucks' );
    const env = nunjucks.configure( gulpConfig.html.renderPath, { autoescape: true, noCache: true } );
    registerNunjucksFilters( env );

    const outDir = path.join( gulpConfig.variables.dist, 'publications' );
    fs.mkdirSync( outDir, { recursive: true } );

    papers.forEach( ( paper ) => {
        const data = getTemplateData( { path: path.join( outDir, `${ paper.id }.html` ) } );
        data.paper = paper;
        data.page_title = paper.title;
        data.meta_description = paper.short_abstract || paper.abstract || `${ paper.title } — ${ formatAuthors( paper.author ) }`;
        data.canonical_path = `publications/${ paper.id }.html`;
        const html = env.render( '_templates/publication-detail.html', data );
        fs.writeFileSync( path.join( outDir, `${ paper.id }.html` ), html );
    } );

    cb();
} );


/**
 * CSS Task
 */
gulp.task( 'css', () => gulp.src( gulpConfig.css.from )
    .pipe( $.plumber( { errorHandler } ) )
    .pipe( sass( gulpConfig.css.sass ) )
    .pipe($.postcss([autoprefixer]))
    .pipe( browserSync.stream() )
    .on( 'data', ( file ) => {
        const bufferFile = new CleanCSS().minify( file.contents );
        // eslint-disable-next-line no-param-reassign
        file.contents = Buffer.from( bufferFile.styles );

        return file.contents;
    } )
    .pipe( $.rename( {
        extname: '.min.css',
    } ) )
    .pipe( gulp.dest( gulpConfig.css.to ) ) );


/**
 * JS Task
 */
gulp.task( 'js', () => gulp.src( gulpConfig.js.from )
    .pipe( $.plumber( { errorHandler } ) )
    .pipe( named() )
    .pipe( webpack( {
        mode: 'none',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                },
            ],
        },
    } ) )
    .pipe( $.uglify() )
    .pipe( $.if( ( file ) => !file.path.match( /-init.js$/ ), $.rename( {
        extname: '.min.js',
    } ) ) )
    .pipe( gulp.dest( gulpConfig.js.to ) )
    .pipe( browserSync.stream() ) );


/**
 * Static Task
 */
let staticCount = 0;
function staticTask( cb ) {
    const staticArr = gulpConfig.static;
    if ( staticArr.length && 'undefined' !== typeof staticArr[staticCount] ) {
        gulp.src( staticArr[staticCount].from )
            .pipe( $.changed( staticArr[staticCount].to ) ) // Ignore unchanged files
            .pipe( gulp.dest( staticArr[staticCount].to ) )
            .on( 'end', () => {
                staticCount++;
                staticTask( cb );
            } );
    } else {
        staticCount = 0;
        browserSync.reload();
        cb();
    }
}
gulp.task( 'static', staticTask );


/**
 * Images Task
 */
gulp.task( 'images', () => gulp.src( gulpConfig.images.from )
    .pipe( $.plumber( { errorHandler } ) )
    .pipe( $.changed( gulpConfig.images.to ) ) // Ignore unchanged files
    .pipe( gulp.dest( gulpConfig.images.to ) )
    .pipe( browserSync.stream() ) );


/**
 * Give local images a deployment-specific URL so browsers do not retain a
 * cached failed response if GitHub Pages publishes HTML before every asset is
 * available at the edge.
 */
gulp.task( 'version-images', () => gulp.src( `${ gulpConfig.variables.dist }/**/*.html`, { base: gulpConfig.variables.dist } )
    .on( 'data', ( file ) => {
        const html = file.contents.toString().replace(
            /src=(['"])((?:assets|data)\/images\/[^'"?]+)(?:\?v=[^'"]*)?\1/g,
            `src=$1$2?v=${ assetVersion }$1`,
        );
        // eslint-disable-next-line no-param-reassign
        file.contents = Buffer.from( html );
    } )
    .pipe( gulp.dest( gulpConfig.variables.dist ) ) );


/**
 * Default Task
 */
gulp.task( 'default', ( cb ) => {
    gulp.series( 'clean', 'images', 'html', 'publication-pages', 'css', 'js', 'static', 'watch' )( cb );
} );


/**
 * Production Task
 */
gulp.task( 'production', ( cb ) => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    gulp.series( 'clean', 'html', 'publication-pages', 'css', 'js', 'static', 'images', 'version-images' )( cb );
} );


/**
 * Watch Task
 */
gulp.task( 'watch', gulp.parallel( 'browserSyncTask', () => {
    gulpConfig.watch.forEach( ( item ) => {
        $.watch( item.from, gulp.series( item.task ) );
    } );
} ) );
