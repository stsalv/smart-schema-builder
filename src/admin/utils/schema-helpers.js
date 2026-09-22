/**
 * Schema helpers: unique IDs, icon set, palettes, layout presets,
 * reorder utilities, download normalization and entity factories.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */

import { __ } from '@wordpress/i18n';

/**
 * Default signature (footer) texts.
 * Variables (%dd, %mm, %yyyy, %yy, %cnt, %title) are substituted at render time.
 *
 * @since 1.0.0
 * @type {Object<string,string>}
 */
export const DEFAULT_FOOTER = {
	left: __( '%title · %cnt roles', 'stsalv-smart-schema-builder' ),
	right: __( 'Edition %yyyy.', 'stsalv-smart-schema-builder' ),
};

export const uid = ( prefix = 'id' ) =>
	`${ prefix }-${ Date.now().toString( 36 ) }${ Math.random().toString( 36 ).slice( 2, 8 ) }`;

/**
 * Limit a string to a maximum number of words.
 *
 * @since 1.0.0
 * @param {string} value Raw string.
 * @param {number} max   Maximum words to keep.
 * @return {string} Trimmed string.
 */
export const limitWords = ( value, max ) => {
	const words = String( value ).trim().split( /\s+/ ).filter( Boolean );
	return words.slice( 0, max ).join( ' ' );
};

/**
 * Built-in icon set. Keys are icon names, values are inner SVG markup
 * for a 24x24 stroke-based viewBox.
 *
 * @since 1.0.0
 * @type {Object<string,string>}
 */
export const BUILTIN_ICONS = {
	truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
	train: '<rect x="4" y="3" width="16" height="13" rx="3"/><path d="M4 10h16"/><circle cx="8.5" cy="13" r="1"/><circle cx="15.5" cy="13" r="1"/><path d="m7 16-2 5"/><path d="m17 16 2 5"/>',
	ship: '<path d="M12 10.2V14"/><path d="M12 2v3"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M19.4 20A11.6 11.6 0 0 0 21 14l-8.2-3.6a2 2 0 0 0-1.6 0L3 14a11.6 11.6 0 0 0 1.6 6"/><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
	plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
	anchor: '<circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
	container: '<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M7 7v10M12 7v10M17 7v10"/>',
	warehouse: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M7 22v-6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6"/><path d="M7 11h10"/>',
	route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
	package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4Z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
	shield: '<path d="M20 13c0 5-3.5 7.5-7.7 8.8a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
	file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
	users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
	download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
	arrowRight: '<path d="m9 18 6-6-6-6"/>',
	dots: '<path d="M6 12h.01" stroke-width="3"/><path d="M18 12h.01" stroke-width="3"/>',
	dashes: '<path d="M4 12h16"/>',
	dotDash: '<path d="M4 12h.01" stroke-width="3"/><path d="M10 12h12"/>',
	dashesSparse: '<path d="M8 12h8"/>',
};

/**
 * Palette presets. Only the accent color is stored; light shades are
 * generated from it at render time.
 *
 * @since 1.0.0
 * @type {Array<{name: string, color: string}>}
 */
export const PALETTES = [
	{ name: 'Slate', color: '#475569' },
	{ name: 'Amber', color: '#d97706' },
	{ name: 'Violet', color: '#7c3aed' },
	{ name: 'Blue', color: '#2563eb' },
	{ name: 'Cyan', color: '#0891b2' },
	{ name: 'Teal', color: '#0d9488' },
	{ name: 'Indigo', color: '#4f46e5' },
	{ name: 'Green', color: '#16a34a' },
	{ name: 'White', color: '#ffffff' },
	{ name: 'Mist', color: '#F8FAFC' },
	{ name: 'Rose', color: '#be123c' },
	{ name: 'Brand blue', color: '#1a4fa0' },
	{ name: 'Pale blue', color: '#dbeafe' },
];

/**
 * Block layout presets.
 *
 * @since 1.0.0
 * @type {Array<{value: string, label: string}>}
 */
export const LAYOUTS = [
	{ value: 'sequence', label: __('Sequence (row with arrows)', 'stsalv-smart-schema-builder') },
	{ value: 'columns', label: __('Columns (groups as columns)', 'stsalv-smart-schema-builder') },
	{ value: 'hub', label: __('Hub (stack, accent first card)', 'stsalv-smart-schema-builder') },
	{ value: 'panel', label: __('Panel (compact vertical list)', 'stsalv-smart-schema-builder') },
	{ value: 'separator', label: __('Separator (repeating divider)', 'stsalv-smart-schema-builder') },
];

/**
 * Move an element inside an array without mutation.
 *
 * @since 1.0.0
 * @param {Array}  list  Source array.
 * @param {number} index Current element index.
 * @param {number} dir   Direction: -1 for up, 1 for down.
 * @return {Array} Reordered array.
 */
export const move = ( list, index, dir ) => {
	const next = [ ...list ];
	const target = index + dir;
	if ( target < 0 || target >= next.length ) {
		return next;
	}
	[ next[ index ], next[ target ] ] = [ next[ target ], next[ index ] ];
	return next;
};

/**
 * Normalize an icon value to the object shape { type, value, url }.
 * Accepts legacy string values (built-in icon keys).
 *
 * @since 1.0.0
 * @param {Object|string|null} icon Raw icon value.
 * @return {Object|null} Normalized icon or null.
 */
export const normalizeIcon = ( icon ) => {
	if ( ! icon ) {
		return null;
	}
	if ( 'string' === typeof icon ) {
		return { type: 'builtin', value: icon };
	}
	return icon;
};

/**
 * Normalize download settings to the per-format shape.
 *
 * Migrates the legacy shared shape { buttons, label, icon, iconSize, color }
 * to independent per-format settings so each button can be configured
 * on its own.
 *
 * @since 1.0.0
 * @param {Object} download Raw download settings.
 * @return {Object} Normalized per-format settings.
 */
export const normalizeDownload = ( download ) => {
	const safe = download && 'object' === typeof download ? download : {};
	const formats = [ 'pdf', 'png', 'json' ];
	const orientation = 'portrait' === safe.orientation ? 'portrait' : 'landscape';
	let multipage;
	if ( undefined !== safe.multipage ) {
		multipage = !! safe.multipage;
	} else {
		// Legacy configs kept the flag inside the pdf row.
		multipage = ! ( safe.pdf && false === safe.pdf.multipage );
	}
	const row = ( enabled, label, icon, iconSize, color, hoverColor ) => ( {
		enabled, label, icon, iconSize, color, hoverColor,
	} );

	if ( safe.buttons || ( ! safe.pdf && ! safe.png && ! safe.json ) ) {
		const buttons = safe.buttons || {};
		const sharedIcon = normalizeIcon( safe.icon ) || { type: 'builtin', value: 'download' };
		const out = { orientation, multipage };
		formats.forEach( ( key ) => {
			const suffix = key.toUpperCase();
			out[ key ] = row(
				!! buttons[ key ],
				safe.label ? `${ safe.label } ${ suffix }` : `Download ${ suffix }`,
				sharedIcon,
				safe.iconSize || 'standard',
				safe.color || '#1a4fa0',
				''
			);
		} );
		return out;
	}

	const out = { orientation, multipage };
	formats.forEach( ( key ) => {
		const r = safe[ key ] || {};
		const suffix = key.toUpperCase();
		out[ key ] = row(
			!! r.enabled,
			r.label || `Download ${ suffix }`,
			normalizeIcon( r.icon ) || { type: 'builtin', value: 'download' },
			r.iconSize || 'standard',
			r.color || '#1a4fa0',
			'string' === typeof r.hoverColor ? r.hoverColor : ''
		);
	} );
	return out;
};

/**
 * Normalize a raw config object: guarantee arrays, icon shapes and the
 * per-format download settings.
 *
 * @since 1.0.0
 * @param {Object} config Raw config from storage or defaults.
 * @return {Object} Normalized config.
 */
export const normalizeConfig = ( config ) => {
	const safe = config && 'object' === typeof config ? config : {};
	const footer = safe.footer && 'object' === typeof safe.footer ? safe.footer : {};
	const sizes = [ 'small', 'standard', 'large' ];
	return {
		...safe,
		eyebrow: 'string' === typeof safe.eyebrow ? safe.eyebrow : '',
		titleSize: sizes.includes( safe.titleSize ) ? safe.titleSize : 'standard',
		titleFont: 'string' === typeof safe.titleFont ? safe.titleFont : '',
		logoSize: sizes.includes( safe.logoSize ) ? safe.logoSize : 'standard',
		logoColor: 'string' === typeof safe.logoColor && safe.logoColor ? safe.logoColor : '#1a4fa0',
		icon: normalizeIcon( safe.icon ),
		download: normalizeDownload( safe.download ),
		footer: {
			left: 'string' === typeof footer.left ? footer.left : DEFAULT_FOOTER.left,
			right: 'string' === typeof footer.right ? footer.right : DEFAULT_FOOTER.right,
		},
		tags: ( Array.isArray( safe.tags ) ? safe.tags : [] ).map( ( tag ) => ( {
			...tag,
			label: 'string' === typeof tag.label ? tag.label : '',
			color: 'string' === typeof tag.color && tag.color ? tag.color : '#0f172a',
		} ) ),
		blocks: ( Array.isArray( safe.blocks ) ? safe.blocks : [] ).map( ( block ) => ( {
			...block,
			icon: normalizeIcon( block.icon ),
			color: block.color || '#64748b',
			groups: ( Array.isArray( block.groups ) ? block.groups : [] ).map( ( group ) => ( {
				...group,
				icon: normalizeIcon( group.icon ),
				items: ( Array.isArray( group.items ) ? group.items : [] ).map( ( item ) => ( {
					...item,
					icon: normalizeIcon( item.icon ),
					iconSize: sizes.includes( item.iconSize ) ? item.iconSize : 'standard',
					bg: 'string' === typeof item.bg ? item.bg : '',
					fg: 'string' === typeof item.fg ? item.fg : '',
					iconBg: 'string' === typeof item.iconBg ? item.iconBg : '',
				} ) ),
			} ) ),
		} ) ),
	};
};

/**
 * Factory: create an empty item entity.
 *
 * @since 1.0.0
 * @return {Object} Item entity.
 */
export const createItem = () => ( {
	id: uid( 'i' ),
	title: '',
	short: '',
	full: '',
	tags: [],
} );

/**
 * Factory: create an empty group entity.
 *
 * @since 1.0.0
 * @return {Object} Group entity.
 */
export const createGroup = () => ( {
	id: uid( 'g' ),
	title: '',
	icon: { type: 'builtin', value: 'container' },
	color: '#2563eb',
	showShortDesc: true,
	items: [ createItem() ],
} );

/**
 * Factory: create an empty block entity.
 *
 * @since 1.0.0
 * @return {Object} Block entity.
 */
export const createBlock = () => ( {
	id: uid( 'b' ),
	title: '',
	layout: 'columns',
	groups: [ createGroup() ],
} );
