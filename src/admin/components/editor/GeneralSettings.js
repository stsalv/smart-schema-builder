/**
 * Editor tab: general schema settings.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
import { useState } from '@wordpress/element';
import {
	CheckboxControl,
	RadioControl,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import IconPicker from './IconPicker';
import ColorField from './ColorField';
import { limitWords } from '../../utils/schema-helpers';

/**
 * Downloadable formats available on the front end.
 *
 * @since 1.0.0
 * @type {Array<{key: string, label: string}>}
 */
const DOWNLOAD_FORMATS = [
	{ key: 'pdf', label: 'PDF' },
	{ key: 'png', label: 'PNG' },
	{ key: 'json', label: 'JSON' },
];

/**
 * Size presets.
 *
 * @since 1.0.0
 * @type {Array<{value: string, label: string}>}
 */
const SIZE_OPTIONS = [
	{ value: 'small', label: __('Small', 'stsalv-smart-schema-builder') },
	{ value: 'standard', label: __('Standard', 'stsalv-smart-schema-builder') },
	{ value: 'large', label: __('Large', 'stsalv-smart-schema-builder') },
];

/**
 * Cut input after the N-th word without touching in-progress whitespace.
 *
 * limitWords() trims and collapses spaces, which fights the caret in a
 * controlled input: trailing spaces vanish and double spaces collapse,
 * jumping the caret to the end. cutWords() only removes whole words beyond
 * the limit, so typing feels natural; final cleanup runs on blur.
 *
 * @since 1.0.0
 * @param {string} str   Raw field value.
 * @param {number} limit Maximum word count.
 * @return {string} Value truncated after the limit-th word.
 */
const cutWords = ( str, limit ) => {
	const value = String( str || '' );
	const re = /\S+/g;
	let match = null;
	let count = 0;
	while ( ( match = re.exec( value ) ) ) {
		count += 1;
		if ( count > limit ) {
			return value.slice( 0, match.index );
		}
	}
	return value;
};



/**
 * General settings form.
 *
 * @since 1.0.0
 * @param {Object}   props         Component props.
 * @param {Object}   props.config  Current schema config.
 * @param {Function} props.onPatch Patch callback (partial config).
 * @return {Element} Form element.
 */
const GeneralSettings = ( { config, onPatch } ) => {
	const download = config.download || {};
	const footer = config.footer || {};
	const [ customFontOpen, setCustomFontOpen ] = useState( false );

	const themeFonts = window.ssbAdmin?.themeFonts || [];
	const fontOptions = [
		{ value: '', label: __('Default (theme font)', 'stsalv-smart-schema-builder') },
		...themeFonts.map( ( f ) => ( { value: f.value, label: f.label } ) ),
		{ value: '__custom__', label: __('Custom font family…', 'stsalv-smart-schema-builder') },
	];
	const currentFont = config.titleFont || '';
	const isCustom =
		customFontOpen || ( '' !== currentFont && ! fontOptions.some( ( o ) => o.value === currentFont ) );
	const fontSelectValue = isCustom ? '__custom__' : currentFont;

	/**
	 * Patch settings of a single download format.
	 *
	 * @since 1.0.0
	 * @param {string} key   Format key: pdf, png or json.
	 * @param {Object} patch Partial format settings.
	 * @return {void}
	 */
	const patchFormat = ( key, patch ) =>
		onPatch( {
			download: { ...download, [ key ]: { ...download[ key ], ...patch } },
		} );

	return (
		<div className="ssb-general">
			<TextControl
				label={ __('Eyebrow (short line above the title)', 'stsalv-smart-schema-builder') }
				help={ __('Example: Logistics · Transport · Foreign trade', 'stsalv-smart-schema-builder') }
				value={ config.eyebrow || '' }
				onChange={ ( next ) => onPatch( { eyebrow: next } ) }
			/>
			<TextareaControl
				label={ __('Schema description', 'stsalv-smart-schema-builder') }
				value={ config.description || '' }
				onChange={ ( next ) => onPatch( { description: next } ) }
			/>

			<fieldset className="ssb-fieldset">
				<legend>{ __('Logo', 'stsalv-smart-schema-builder') }</legend>
				<div className="ssb-admin-row">
					<RadioControl
						label={ __('Logo size', 'stsalv-smart-schema-builder') }
						selected={ config.logoSize || 'standard' }
						options={ SIZE_OPTIONS }
						onChange={ ( next ) => onPatch( { logoSize: next } ) }
					/>
					<ColorField
						label={ __('Logo color', 'stsalv-smart-schema-builder') }
						value={ config.logoColor || '#1a4fa0' }
						onChange={ ( next ) => onPatch( { logoColor: next } ) }
					/>
				</div>
				<ToggleControl
					className="ssb-general__toggle"
					label={ __('Show schema icon in the page header', 'stsalv-smart-schema-builder') }
					help={ __('Icon set + toggle on: shown on the page and in print forms. Toggle off: used in print forms only. No icon: nothing is shown.', 'stsalv-smart-schema-builder') }
					checked={ !! config.showIcon }
					onChange={ ( next ) => onPatch( { showIcon: next } ) }
				/>
				<IconPicker
					label={ __('Schema icon', 'stsalv-smart-schema-builder') }
					value={ config.icon }
					onChange={ ( next ) => onPatch( { icon: next } ) }
				/>
			</fieldset>

			<fieldset className="ssb-fieldset">
				<legend>{ __('Title appearance', 'stsalv-smart-schema-builder') }</legend>
				<div className="ssb-admin-row">
					<RadioControl
						label={ __('Title size', 'stsalv-smart-schema-builder') }
						selected={ config.titleSize || 'standard' }
						options={ SIZE_OPTIONS }
						onChange={ ( next ) => onPatch( { titleSize: next } ) }
					/>
					<SelectControl
						label={ __('Title font', 'stsalv-smart-schema-builder') }
						help={ __('If the font is not available on the site, the default font is used.', 'stsalv-smart-schema-builder') }
						value={ fontSelectValue }
						options={ fontOptions }
						onChange={ ( next ) => {
							if ( '__custom__' === next ) {
								setCustomFontOpen( true );
								return;
							}
							setCustomFontOpen( false );
							onPatch( { titleFont: next } );
						} }
					/>
				</div>
				{ isCustom && (
					<TextControl
						label={ __('Custom font family', 'stsalv-smart-schema-builder') }
						help={ __('CSS font-family value, e.g. "PT Sans", sans-serif', 'stsalv-smart-schema-builder') }
						value={ currentFont }
						onChange={ ( next ) => onPatch( { titleFont: next } ) }
					/>
				) }
			</fieldset>

			<CheckboxControl
				label={ __('Automatic numbering of items', 'stsalv-smart-schema-builder') }
				checked={ !! config.numbering }
				onChange={ ( next ) => onPatch( { numbering: next } ) }
			/>

			<fieldset className="ssb-fieldset">
				<legend>{ __('Download buttons', 'stsalv-smart-schema-builder') }</legend>
				<p className="description">
					{ __('Each format is configured independently. Button label is limited to three words.', 'stsalv-smart-schema-builder') }
				</p>
				<RadioControl
					label={ __('Orientation (PDF/PNG)', 'stsalv-smart-schema-builder') }
					help={ __('Landscape renders a wide composition (1600px), portrait a narrow one (900px).', 'stsalv-smart-schema-builder') }
					selected={ download.orientation || 'landscape' }
					options={ [
						{ label: __('Landscape', 'stsalv-smart-schema-builder'), value: 'landscape' },
						{ label: __('Portrait', 'stsalv-smart-schema-builder'), value: 'portrait' },
					] }
					onChange={ ( next ) => onPatch( { download: { ...download, orientation: next } } ) }
				/>
				<CheckboxControl
					label={ __('Multi-page for tall schemas (PDF)', 'stsalv-smart-schema-builder') }
					help={ __('On: full-width pages sliced by height. Off: the whole schema shrunk onto a single page (small for tall schemas).', 'stsalv-smart-schema-builder') }
					checked={ false !== download.multipage }
					onChange={ ( next ) => onPatch( { download: { ...download, multipage: next } } ) }
				/>
				{ DOWNLOAD_FORMATS.map( ( format ) => {
					const row = download[ format.key ] || {};
					return (
						<div className="ssb-dl-row" key={ format.key }>
							<CheckboxControl
								className="ssb-dl-row__enable"
								label={ format.label }
								checked={ !! row.enabled }
								onChange={ ( next ) => patchFormat( format.key, { enabled: next } ) }
							/>
							{ !! row.enabled && (
								<>
									<TextControl
										className="ssb-dl-row__label"
										label={ __('Button label', 'stsalv-smart-schema-builder') }
										value={ row.label || '' }
										onChange={ ( next ) =>
											patchFormat( format.key, { label: cutWords( next, 3 ) } )
										}
										onBlur={ () => {
											const cleaned = limitWords( row.label || '', 3 );
											if ( cleaned !== ( row.label || '' ) ) {
												patchFormat( format.key, { label: cleaned } );
											}
										} }
									/>
									<IconPicker
										label={ __('Button icon', 'stsalv-smart-schema-builder') }
										value={ row.icon }
										onChange={ ( next ) => patchFormat( format.key, { icon: next } ) }
									/>
									<RadioControl
										className="ssb-dl-row__size"
										label={ __('Icon size', 'stsalv-smart-schema-builder') }
										selected={ row.iconSize || 'standard' }
										options={ [
											{ label: __('Standard', 'stsalv-smart-schema-builder'), value: 'standard' },
											{ label: __('Large', 'stsalv-smart-schema-builder'), value: 'large' },
										] }
										onChange={ ( next ) => patchFormat( format.key, { iconSize: next } ) }
									/>
									<div className="ssb-dl-colors">
										<ColorField
											label={ __('Color', 'stsalv-smart-schema-builder') }
											value={ row.color || '#1a4fa0' }
											onChange={ ( next ) => patchFormat( format.key, { color: next } ) }
										/>
										<ColorField
											label={ __('Hover color', 'stsalv-smart-schema-builder') }
											value={ row.hoverColor || row.color || '#1a4fa0' }
											onChange={ ( next ) => patchFormat( format.key, { hoverColor: next } ) }
										/>
									</div>
								</>
							) }
						</div>
					);
				} ) }
			</fieldset>

			<fieldset className="ssb-fieldset">
				<legend>{ __('Schema signature (footer)', 'stsalv-smart-schema-builder') }</legend>
				<p className="description">
					
					{
						// translators: %1$dd, %mm, %yyyy, %yy, %2$cnt and %title are literal placeholders for the schema footer signature, substituted on the front end (not sprintf specifiers). Keep them verbatim in translations.
						 __('Variables: %1$dd - day, %mm - month, %yyyy - year (4 digits), %yy - year (2 digits), %2$cnt - item count, %title - schema title. Variables are substituted when the schema is rendered.', 'stsalv-smart-schema-builder')
					}
				</p>
				<TextControl
					label={ __('Left text', 'stsalv-smart-schema-builder') }
					value={ footer.left || '' }
					onChange={ ( next ) => onPatch( { footer: { ...footer, left: next } } ) }
				/>
				<TextControl
					label={ __('Right text', 'stsalv-smart-schema-builder') }
					value={ footer.right || '' }
					onChange={ ( next ) => onPatch( { footer: { ...footer, right: next } } ) }
				/>
			</fieldset>
		</div>
	);
};

export default GeneralSettings;