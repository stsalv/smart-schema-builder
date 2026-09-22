/**
 * Lazy download bundle: PNG capture and PDF composition.
 *
 * Capture compositions use fixed widths per orientation so the result never
 * depends on the on-screen container. Every PDF page is created with an
 * explicit orientation (jsPDF addPage does not inherit it).
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { __ } from '@wordpress/i18n';

/**
 * Page geometry in millimeters per orientation.
 *
 * @since 1.0.0
 * @type {Object<string,{w: number, h: number}>}
 */
const PAGES = {
	landscape: { w: 297, h: 210 },
	portrait: { w: 210, h: 297 },
};
const MARGIN = 10;

/**
 * Composition widths in pixels per orientation.
 *
 * @since 1.0.0
 * @type {Object<string,number>}
 */
const CAPTURE_WIDTH = { landscape: 1600, portrait: 900 };

/**
 * Load an image element from a data URL.
 *
 * @since 1.0.0
 * @param {string} src Image source.
 * @return {Promise<HTMLImageElement>} Loaded image.
 */
const loadImg = ( src ) =>
	new Promise( ( resolve, reject ) => {
		const img = new Image();
		img.onload = () => resolve( img );
		img.onerror = reject;
		img.src = src;
	} );

/**
 * Trigger a file download from a data URL.
 *
 * @since 1.0.0
 * @param {string} url  Data URL.
 * @param {string} name File name.
 * @return {void}
 */
const save = ( url, name ) => {
	const a = document.createElement( 'a' );
	a.href = url;
	a.download = name;
	document.body.appendChild( a );
	a.click();
	a.remove();
};

/**
 * Capture a node to a PNG data URL.
 *
 * @since 1.0.0
 * @param {Element} node Target node.
 * @param {Object}  opts html-to-image options.
 * @return {Promise<string>} PNG data URL.
 */
const capture = ( node, opts ) =>
	toPng( node, Object.assign( { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true }, opts ) );

/**
 * Build colored tag pills for a set of tag ids.
 *
 * @since 1.0.0
 * @param {Element}       root Schema root element.
 * @param {Array<string>} ids  Tag ids.
 * @return {Element} Pills container.
 */
function tagPills( root, ids ) {
	const wrap = document.createElement( 'div' );
	wrap.className = 'stssb-modal-tags';
	ids.forEach( ( id ) => {
		const btn = root.querySelector( '.stssb-tag[data-tag="' + id + '"]' );
		if ( ! btn ) {
			return;
		}
		const span = document.createElement( 'span' );
		span.className = 'stssb-modal-tag';
		span.style.setProperty( '--stssb-tag-color', btn.style.getPropertyValue( '--stssb-tag-color' ) || '#0f172a' );
		span.textContent = btn.textContent.trim();
		wrap.appendChild( span );
	} );
	return wrap;
}

/**
 * Build the offscreen capture composition.
 *
 * @since 1.0.0
 * @param {Element} root            Schema root element.
 * @param {Object}  opts            Options.
 * @param {boolean} opts.withHeader Include header and meta line.
 * @param {number}  opts.width      Composition width in pixels.
 * @return {Element} Offscreen wrapper element.
 */
function buildWrap( root, { withHeader, width } ) {
	const clone = root.cloneNode( true );
	clone.removeAttribute( 'id' );
	clone.querySelectorAll( '.stssb-download, .stssb-tags' ).forEach( ( n ) => n.remove() );
	const oldMeta = clone.querySelector( '.stssb-print-meta' );
	if ( oldMeta ) {
		oldMeta.remove();
	}

	if ( withHeader ) {
		const logo = clone.querySelector( '.stssb-logo' );
		if ( logo ) {
			logo.classList.remove( 'stssb-logo--screen-off' );
		}
		// Meta line: publication date on the left, colored pills of the
		// active filters on the right (only when filters are active).
		const meta = document.createElement( 'div' );
		meta.className = 'stssb-print-meta';
		const dateSpan = document.createElement( 'span' );
		dateSpan.className = 'stssb-print-meta-date';
		dateSpan.textContent = root.dataset.pubDate || '';
		meta.appendChild( dateSpan );
		const ids = Array.from( root.querySelectorAll( '.stssb-tag[aria-pressed="true"]' ) ).map(
			( b ) => b.dataset.tag
		);
		if ( ids.length ) {
			const pills = tagPills( root, ids );
			pills.classList.add( 'stssb-print-meta-pills' );
			meta.appendChild( pills );
		}
		const header = clone.querySelector( '.stssb-header' );
		if ( header ) {
			header.insertAdjacentElement( 'afterend', meta );
		} else {
			clone.prepend( meta );
		}
	} else {
		const header = clone.querySelector( '.stssb-header' );
		if ( header ) {
			header.remove();
		}
	}

	const wrap = document.createElement( 'div' );
	wrap.className = 'stssb-print stssb-root';
	wrap.style.width = width + 'px';
	wrap.appendChild( clone );
	document.body.appendChild( wrap );
	return wrap;
}

/**
 * Build the appendix composition with role descriptions.
 *
 * @since 1.0.0
 * @param {Element} root  Schema root element.
 * @param {number}  width Composition width in pixels.
 * @return {Element|null} Offscreen wrapper or null when nothing to print.
 */
function buildAppendixWrap( root, width ) {
	const items = Array.from( root.querySelectorAll( '.stssb-card--clickable' ) );
	if ( ! items.length ) {
		return null;
	}
	const wrap = document.createElement( 'div' );
	wrap.className = 'stssb-print stssb-root';
	wrap.style.width = width + 'px';
	const box = document.createElement( 'div' );
	box.className = 'stssb-print-appendix';
	const heading = document.createElement( 'h3' );
	heading.className = 'stssb-appendix-title';
	heading.textContent = __('Role descriptions', 'stsalv-smart-schema-builder');
	box.appendChild( heading );
	items.forEach( ( card ) => {
		const item = document.createElement( 'div' );
		item.className = 'stssb-appendix-item';
		const title = document.createElement( 'h4' );
		const titleSrc = card.querySelector( '.stssb-card-title' );
		title.textContent = titleSrc ? titleSrc.textContent : '';
		item.appendChild( title );
		const ids = ( card.dataset.tags || '' ).split( /\s+/ ).filter( Boolean );
		if ( ids.length ) {
			item.appendChild( tagPills( root, ids ) );
		}
		const full = card.querySelector( '.stssb-card-full' );
		if ( full ) {
			const body = document.createElement( 'div' );
			body.className = 'stssb-appendix-body';
			body.innerHTML = full.innerHTML;
			item.appendChild( body );
		}
		box.appendChild( item );
	} );
	wrap.appendChild( box );
	document.body.appendChild( wrap );
	return wrap;
}

/**
 * Add a captured image to the PDF, slicing into pages when needed.
 *
 * @since 1.0.0
 * @param {jsPDF}  pdf         Document.
 * @param {string} url         Image data URL.
 * @param {HTMLImageElement} img Loaded image.
 * @param {number} cw          Content width in mm.
 * @param {number} ch          Content height in mm.
 * @param {boolean} multipage  Allow slicing into several pages.
 * @param {boolean} isFirst    Whether the first slice goes on the current page.
 * @param {string} orientation Page orientation for added pages.
 * @return {void}
 */
function addSlices( pdf, url, img, cw, ch, multipage, isFirst, orientation ) {
	const scale = cw / img.width;
	const heightMm = img.height * scale;
	if ( ! multipage || heightMm <= ch ) {
		// Single page: shrink to fit both dimensions.
		const fit = Math.min( scale, ch / img.height );
		const w = img.width * fit;
		const h = img.height * fit;
		if ( ! isFirst ) {
			pdf.addPage( 'a4', orientation );
		}
		pdf.addImage( url, 'PNG', MARGIN + ( cw - w ) / 2, MARGIN + ( ch - h ) / 2, w, h );
		return;
	}
	// Multi-page: slice vertically, every page uses the full content width.
	const src = document.createElement( 'canvas' );
	src.width = img.width;
	src.height = img.height;
	src.getContext( '2d' ).drawImage( img, 0, 0 );
	const pagePx = Math.floor( ch / scale );
	let offset = 0;
	let first = isFirst;
	while ( offset < img.height ) {
		const hPx = Math.min( pagePx, img.height - offset );
		const slice = document.createElement( 'canvas' );
		slice.width = img.width;
		slice.height = hPx;
		const ctx = slice.getContext( '2d' );
		ctx.fillStyle = '#ffffff';
		ctx.fillRect( 0, 0, slice.width, slice.height );
		ctx.drawImage( src, 0, offset, img.width, hPx, 0, 0, img.width, hPx );
		if ( ! first ) {
			pdf.addPage( 'a4', orientation );
		}
		pdf.addImage( slice.toDataURL( 'image/png' ), 'PNG', MARGIN, MARGIN, cw, hPx * scale );
		offset += hPx;
		first = false;
	}
}

/**
 * Capture the schema and download it as PNG.
 *
 * @since 1.0.0
 * @param {Element} root     Schema root element.
 * @param {string}  schemaId Schema post ID.
 * @return {Promise<void>} Completion promise.
 */
async function capturePng( root, schemaId ) {
	const orientation = 'portrait' === root.dataset.orientation ? 'portrait' : 'landscape';
	const width = CAPTURE_WIDTH[ orientation ];
	const wrap = buildWrap( root, { withHeader: true, width } );
	try {
		const url = await capture( wrap, {
			width: wrap.offsetWidth,
			height: wrap.offsetHeight,
			style: { position: 'static', left: 'auto', top: 'auto' },
		} );
		save( url, 'schema-' + schemaId + '.png' );
	} finally {
		wrap.remove();
	}
}

/**
 * Compose and download the PDF print form with appendix pages.
 *
 * @since 1.0.0
 * @param {Element} root     Schema root element.
 * @param {string}  schemaId Schema post ID.
 * @return {Promise<void>} Completion promise.
 */
async function downloadPdf( root, schemaId ) {
	const orientation = 'portrait' === root.dataset.orientation ? 'portrait' : 'landscape';
	const multipage = '0' !== root.dataset.multipage;
	const page = PAGES[ orientation ];
	const width = CAPTURE_WIDTH[ orientation ];
	const wrap = buildWrap( root, { withHeader: true, width } );
	try {
		const url = await capture( wrap, {
			width: wrap.offsetWidth,
			height: wrap.offsetHeight,
			style: { position: 'static', left: 'auto', top: 'auto' },
		} );
		const img = await loadImg( url );
		const pdf = new jsPDF( { orientation, unit: 'mm', format: 'a4', compress: true } );
		const cw = page.w - MARGIN * 2;
		const ch = page.h - MARGIN * 2;
		addSlices( pdf, url, img, cw, ch, multipage, true, orientation );

		const appendix = buildAppendixWrap( root, width );
		if ( appendix ) {
			try {
				const aUrl = await capture( appendix, {
					width: appendix.offsetWidth,
					height: appendix.offsetHeight,
					style: { position: 'static', left: 'auto', top: 'auto' },
				} );
				const aImg = await loadImg( aUrl );
				addSlices( pdf, aUrl, aImg, cw, ch, true, false, orientation );
			} finally {
				appendix.remove();
			}
		}
		pdf.save( 'schema-' + schemaId + '.pdf' );
	} finally {
		wrap.remove();
	}
}

window.stssbDownload = { capturePng, downloadPdf };
