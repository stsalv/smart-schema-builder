/**
 * Smart Schema Builder front-end interactivity: tag filters with AND logic,
 * URL state, accessible modal and JSON download.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import './frontend.scss';

/**
 * Registry of initialized schema roots for cross-instance sync.
 *
 * @since 1.0.0
 * @type {Array<Object>}
 */
const registry = [];

/**
 * Parse tag ids from a card data attribute.
 *
 * @since 1.0.0
 * @param {Element} card Card element.
 * @return {Array<string>} Tag ids.
 */
const cardTags = ( card ) => ( card.dataset.tags || '' ).split( /\s+/ ).filter( Boolean );

/**
 * Read active tags for a schema from the URL.
 *
 * @since 1.0.0
 * @param {string} param Query parameter name.
 * @return {Array<string>} Active tag ids.
 */
const readUrlState = ( param ) => {
	try {
		const url = new URL( window.location.href );
		const raw = url.searchParams.get( param );
		return raw ? raw.split( ',' ).filter( Boolean ) : [];
	} catch ( error ) {
		return [];
	}
};

/**
 * Persist active tags into the URL without a page reload.
 *
 * @since 1.0.0
 * @param {string}       param Query parameter name.
 * @param {Array<string>} tags Active tag ids.
 * @return {void}
 */
const writeUrlState = ( param, tags ) => {
	try {
		const url = new URL( window.location.href );
		if ( tags.length ) {
			url.searchParams.set( param, tags.join( ',' ) );
		} else {
			url.searchParams.delete( param );
		}
		window.history.replaceState( window.history.state, '', url.toString() );
	} catch ( error ) {
		/* URL updates are best-effort only. */
	}
};

/**
 * Send a public stats hit via REST. Fire-and-forget with best-effort
 * delivery; failures are logged but never shown to the user.
 *
 * @since 1.0.0
 * @param {Element|null} root  Schema root element (for the id).
 * @param {string}       event Event key (modal_open, download_pdf, ...).
 * @return {void}
 */
const recordHit = ( root, event ) => {
	const front = window.ssbFront || {};
	if ( ! front.restUrl || ! root ) {
		return;
	}
	const id = root.dataset.schemaId;
	if ( ! id ) {
		return;
	}
	const headers = { 'Content-Type': 'application/json' };
	if ( front.restNonce ) {
		headers[ 'X-WP-Nonce' ] = front.restNonce;
	}
	fetch( front.restUrl + 'stats-hit', {
		method: 'POST',
		credentials: 'same-origin',
		headers,
		body: JSON.stringify( { schema_id: parseInt( id, 10 ), event } ),
	} ).catch( ( err ) => console.error( '[SSB] stats-hit failed:', err ) );
};

/**
 * Download the published schema config as a JSON file.
 *
 * Tries the public REST endpoint first and falls back to admin-ajax when
 * the REST call fails, so the button works on hosts that block anonymous
 * admin-ajax but allow REST.
 *
 * @since 1.0.0
 * @param {string} schemaId Schema post ID.
 * @return {void}
 */
const downloadJson = ( schemaId ) => {
	const front = window.ssbFront || {};
	const restUrl = front.restUrl ? front.restUrl + 'download-json/' + encodeURIComponent( schemaId ) : '';
	const ajaxUrl = front.ajaxUrl
		? front.ajaxUrl + '?action=ssb_download_json&nonce=' + encodeURIComponent( front.nonce || '' )
			+ '&schema_id=' + encodeURIComponent( schemaId )
		: '';

	/**
	 * Fetch a payload and save it as a JSON file.
	 *
	 * @since 1.0.0
	 * @param {string}  url    Endpoint URL.
	 * @param {boolean} isRest Whether the payload is a raw REST response.
	 * @return {Promise<void>} Completion promise.
	 */
	const tryDownload = ( url, isRest ) => {
		const headers = {};
		if ( isRest && front.restNonce ) {
			headers[ 'X-WP-Nonce' ] = front.restNonce;
		}
		return fetch( url, { credentials: 'same-origin', headers } )
			.then( ( response ) => {
				if ( ! response.ok ) {
					throw new Error( 'HTTP ' + response.status );
				}
				return response.json();
			} )
			.then( ( json ) => {
				const payload = isRest ? json : json && json.data;
				if ( ! payload ) {
					throw new Error( 'Empty payload.' );
				}
				const blob = new Blob( [ JSON.stringify( payload, null, 2 ) ], { type: 'application/json' } );
				const objectUrl = URL.createObjectURL( blob );
				const link = document.createElement( 'a' );
				link.href = objectUrl;
				link.download = 'schema-' + schemaId + '.json';
				document.body.appendChild( link );
				link.click();
				link.remove();
				setTimeout( () => URL.revokeObjectURL( objectUrl ), 1000 );
			} );
	};

	if ( restUrl ) {
		tryDownload( restUrl, true ).catch( ( error ) => {
			console.error( '[SSB] REST JSON export failed, falling back to ajax:', error );
			if ( ajaxUrl ) {
				tryDownload( ajaxUrl, false ).catch( ( fallbackError ) =>
					console.error( '[SSB] JSON export failed:', fallbackError )
				);
			}
		} );
		return;
	}
	if ( ajaxUrl ) {
		tryDownload( ajaxUrl, false ).catch( ( error ) =>
			console.error( '[SSB] JSON export failed:', error )
		);
		return;
	}
	console.error( '[SSB] No download endpoint available.' );
};

/**
 * Promise of the lazy download bundle loading.
 *
 * @since 1.0.0
 * @type {Promise|null}
 */
let downloadPromise = null;

/**
 * Load the download bundle on first use.
 *
 * @since 1.0.0
 * @return {Promise<Object>} The window.ssbDownload API.
 */
const ensureDownloadLib = () => {
	if ( window.ssbDownload ) {
		return Promise.resolve( window.ssbDownload );
	}
	if ( downloadPromise ) {
		return downloadPromise;
	}
	downloadPromise = new Promise( ( resolve, reject ) => {
		const script = document.createElement( 'script' );
		script.src = ( window.ssbFront && window.ssbFront.downloadUrl ) || '/wp-content/plugins/stsalv-smart-schema-builder/build/download.js';
		script.onload = () => resolve( window.ssbDownload );
		script.onerror = reject;
		document.head.appendChild( script );
	} );
	return downloadPromise;
};

/**
 * Accessible modal dialog for full item descriptions.
 *
 * @since 1.0.0
 * @type {Object}
 */
const modal = {
	el: null,
	panel: null,
	body: null,
	title: null,
	tags: null,
	lastFocused: null,

	/**
	 * Create the modal markup once and wire global handlers.
	 *
	 * @since 1.0.0
	 * @return {Element} Modal element.
	 */
	ensure() {
		if ( this.el ) {
			return this.el;
		}
		const el = document.createElement( 'div' );
		el.className = 'ssb-modal';
		el.setAttribute( 'role', 'dialog' );
		el.setAttribute( 'aria-modal', 'true' );
		el.setAttribute( 'aria-labelledby', 'ssb-modal-title' );
		el.hidden = true;
		el.innerHTML =
			'<div class="ssb-modal__backdrop" data-ssb-close="1"></div>' +
			'<div class="ssb-modal__panel">' +
			'<header class="ssb-modal__head"><div class="ssb-modal__heading"><h3 id="ssb-modal-title"></h3><div class="ssb-modal-tags" hidden></div></div>' +
			'<button type="button" class="ssb-modal__close" data-ssb-close="1" aria-label="' +
			__('Close', 'stsalv-smart-schema-builder') + '">&times;</button></header>' +
			'<div class="ssb-modal__body"></div></div>';
		document.body.appendChild( el );
		this.el = el;
		this.panel = el.querySelector( '.ssb-modal__panel' );
		this.body = el.querySelector( '.ssb-modal__body' );
		this.title = el.querySelector( '#ssb-modal-title' );
		this.tags = el.querySelector( '.ssb-modal-tags' );

		el.addEventListener( 'click', ( event ) => {
			if ( event.target.closest( '[data-ssb-close]' ) ) {
				this.close();
			}
		} );
		document.addEventListener( 'keydown', ( event ) => {
			if ( el.hidden ) {
				return;
			}
			if ( 'Escape' === event.key ) {
				this.close();
				return;
			}
			if ( 'Tab' === event.key ) {
				this.trap( event );
			}
		} );
		/* Stop smooth-scroll hijackers (e.g. Lenis) inside the modal body. */
		this.panel.addEventListener( 'wheel', ( event ) => event.stopPropagation(), { capture: true, passive: true } );
		return el;
	},

	/**
	 * Open the modal for a clickable card.
	 *
	 * @since 1.0.0
	 * @param {Element} card Card element with hidden full description.
	 * @return {void}
	 */
	open( card ) {
		this.ensure();
		this.lastFocused = document.activeElement;
		const title = card.querySelector( '.ssb-card-title' );
		this.title.textContent = title ? title.textContent : '';
		this.tags.innerHTML = '';
		( card.dataset.tags || '' ).split( /\s+/ ).filter( Boolean ).forEach( ( id ) => {
			const btn = card.closest( '.ssb-root' ).querySelector( '.ssb-tag[data-tag="' + id + '"]' );
			if ( ! btn ) {
				return;
			}
			const span = document.createElement( 'span' );
			span.className = 'ssb-modal-tag';
			span.style.setProperty( '--ssb-tag-color', btn.style.getPropertyValue( '--ssb-tag-color' ) || '#0f172a' );
			span.textContent = btn.textContent.trim();
			this.tags.appendChild( span );
		} );
		this.tags.hidden = ! this.tags.childNodes.length;

		const full = card.querySelector( '.ssb-card-full' );
		this.body.innerHTML = full ? full.innerHTML : '';
		recordHit( card.closest( '.ssb-root' ), 'modal_open' );
		this.el.hidden = false;
		document.documentElement.classList.add( 'ssb-modal-open' );
		this.el.querySelector( '.ssb-modal__close' ).focus();
	},

	/**
	 * Close the modal and restore focus.
	 *
	 * @since 1.0.0
	 * @return {void}
	 */
	close() {
		if ( ! this.el || this.el.hidden ) {
			return;
		}
		this.el.hidden = true;
		document.documentElement.classList.remove( 'ssb-modal-open' );
		if ( this.lastFocused ) {
			this.lastFocused.focus();
		}
	},

	/**
	 * Keep Tab focus inside the modal panel.
	 *
	 * @since 1.0.0
	 * @param {KeyboardEvent} event Keydown event.
	 * @return {void}
	 */
	trap( event ) {
		const focusable = this.panel.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		if ( ! focusable.length ) {
			return;
		}
		const first = focusable[ 0 ];
		const last = focusable[ focusable.length - 1 ];
		if ( event.shiftKey && document.activeElement === first ) {
			event.preventDefault();
			last.focus();
		} else if ( ! event.shiftKey && document.activeElement === last ) {
			event.preventDefault();
			first.focus();
		}
	},
};

/**
 * Apply the current filter state to a root: card highlights, group dimming,
 * button states and screen reader announcement.
 *
 * @since 1.0.0
 * @param {Object} ctrl Root controller internals.
 * @return {void}
 */
const applyState = ( ctrl ) => {
	const active = ctrl.state.tags;
	const filtering = active.length > 0;
	ctrl.root.classList.toggle( 'ssb-filtering', filtering );
	let matched = 0;
	ctrl.cards.forEach( ( card ) => {
		const tags = cardTags( card );
		const hit = filtering && active.every( ( id ) => tags.includes( id ) );
		card.classList.toggle( 'ssb-hit', hit );
		card.classList.toggle( 'ssb-dim', filtering && ! hit );
		if ( hit ) {
			matched++;
		}
	} );
	ctrl.groups.forEach( ( group ) => {
		const groupCards = Array.from( group.querySelectorAll( '.ssb-card[data-tags]' ) );
		const allDim = filtering && groupCards.length &&
			groupCards.every( ( card ) => card.classList.contains( 'ssb-dim' ) );
		group.classList.toggle( 'ssb-all-dim', allDim );
	} );
	ctrl.buttons.forEach( ( button ) => {
		button.setAttribute( 'aria-pressed', active.includes( button.dataset.tag ) ? 'true' : 'false' );
	} );
	ctrl.live.textContent = filtering
		
		?
			 // translators: %1$d: count of active filters, %2$d: count of matched items.
			sprintf( __('Active filters: %1$d. Matched items: %2$d.', 'stsalv-smart-schema-builder'), active.length, matched )
		:
			 __('Filters reset.', 'stsalv-smart-schema-builder');
};

/**
 * Sync active tags across all instances of the same schema and the URL.
 *
 * @since 1.0.0
 * @param {string}        schemaId Schema post ID.
 * @param {string}        param    Query parameter name.
 * @param {Array<string>} tags     Active tag ids.
 * @return {void}
 */
const syncAcross = ( schemaId, param, tags ) => {
	writeUrlState( param, tags );
	registry.forEach( ( ctrl ) => {
		if ( ctrl.schemaId === schemaId ) {
			ctrl.state.tags = [ ...tags ];
			applyState( ctrl );
		}
	} );
};

/**
 * Wire a single schema root: filters, modal triggers and downloads.
 *
 * @since 1.0.0
 * @param {Element} root Schema root element.
 * @return {Object} Root controller.
 */
const initRoot = ( root ) => {
	const schemaId = root.dataset.schemaId || '0';
	const param = root.dataset.tagsParam || 'ssb_tags_' + schemaId;
	const ctrl = {
		root,
		schemaId,
		param,
		state: { tags: [] },
		buttons: Array.from( root.querySelectorAll( '.ssb-tag' ) ),
		cards: Array.from( root.querySelectorAll( '.ssb-card[data-tags]' ) ),
		groups: Array.from( root.querySelectorAll( '.ssb-group, .ssb-panel' ) ),
		live: document.createElement( 'span' ),
	};
	ctrl.live.className = 'ssb-sr-only';
	ctrl.live.setAttribute( 'aria-live', 'polite' );
	root.appendChild( ctrl.live );

	ctrl.buttons.forEach( ( button ) => {
		button.addEventListener( 'click', () => {
			const id = button.dataset.tag;
			const next = ctrl.state.tags.includes( id )
				? ctrl.state.tags.filter( ( tag ) => tag !== id )
				: [ ...ctrl.state.tags, id ];
			syncAcross( schemaId, param, next );
		} );
	} );

	ctrl.cards.forEach( ( card ) => {
		if ( ! card.classList.contains( 'ssb-card--clickable' ) ) {
			return;
		}
		card.addEventListener( 'click', () => modal.open( card ) );
		card.addEventListener( 'keydown', ( event ) => {
			if ( 'Enter' === event.key || ' ' === event.key ) {
				event.preventDefault();
				modal.open( card );
			}
		} );
	} );

	root.querySelectorAll( '.ssb-download-btn' ).forEach( ( button ) => {
		button.addEventListener( 'click', async () => {
			const format = button.dataset.format;
			if ( 'json' === format ) {
				downloadJson( schemaId );
				return;
			}
			if ( button.disabled ) {
				return;
			}
			recordHit( root, 'download_' + format );
			button.disabled = true;
			button.classList.add( 'ssb-download-btn--busy' );
			try {
				const api = await ensureDownloadLib();
				if ( 'png' === format ) {
					await api.capturePng( root, schemaId );
				} else {
					await api.downloadPdf( root, schemaId );
				}
			} catch ( error ) {
				/* Button state is restored in the finally block. */
			} finally {
				button.disabled = false;
				button.classList.remove( 'ssb-download-btn--busy' );
			}
		} );
	} );

	/* Restore state from URL, ignoring tags that no longer exist. */
	ctrl.state.tags = readUrlState( param ).filter( ( id ) =>
		ctrl.buttons.some( ( button ) => button.dataset.tag === id )
	);
	applyState( ctrl );
	return ctrl;
};

/**
 * Initialize every schema root on the page.
 *
 * @since 1.0.0
 * @return {void}
 */
const boot = () => {
	document.querySelectorAll( '.ssb-root' ).forEach( ( root ) => {
		registry.push( initRoot( root ) );
	} );
};

if ( 'loading' === document.readyState ) {
	document.addEventListener( 'DOMContentLoaded', boot );
} else {
	boot();
}
