import { $doc, isMobile } from './_utility';

let rellaxInstance = null;

function initPluginRellax() {
    if ( 'undefined' === typeof Rellax || !$( '.shape' ).length || isMobile ) {
        return;
    }

    // Destroy existing instance if it exists
    if ( rellaxInstance ) {
        rellaxInstance.destroy();
        rellaxInstance = null;
    }

    // Only apply Rellax to shapes that are NOT in the footer
    // The footer shape should remain static with its initial transform
    const selector = '.shape svg[data-rellax-speed]:not(.footer .shape svg)';
    
    if ( !$( selector ).length ) {
        return;
    }

    rellaxInstance = new window.Rellax( selector, {
        center: true,
    } );

    $doc.on( 'images.loaded', () => {
        if ( rellaxInstance ) {
            rellaxInstance.refresh();
        }
    } );
}

export { initPluginRellax };
