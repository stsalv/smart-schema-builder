/**
 * Color field: palette presets plus the native browser color dialog.
 *
 * The native input[type=color] opens the browser color dialog which
 * includes an eyedropper tool in Chromium-based browsers.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
import { __ } from '@wordpress/i18n';
import { PALETTES } from '../../utils/schema-helpers';

/**
 * Normalize any stored color to the #rrggbb format required by
 * the native color input.
 *
 * @since 1.0.0
 * @param {string} value Stored color value.
 * @return {string} Hex color safe for input[type=color].
 */
const toInputHex = ( value ) => {
	let hex = String( value || '' ).trim();
	if ( /^#[0-9a-fA-F]{3}$/.test( hex ) ) {
		hex = '#' + hex[ 1 ] + hex[ 1 ] + hex[ 2 ] + hex[ 2 ] + hex[ 3 ] + hex[ 3 ];
	}
	return /^#[0-9a-fA-F]{6}$/.test( hex ) ? hex : '#000000';
};

/**
 * Color selector with preset swatches and a native picker.
 *
 * @since 1.0.0
 * @param {Object}   props          Component props.
 * @param {string}   props.value    Current hex color.
 * @param {Function} props.onChange Change callback (hex string).
 * @param {string}   props.label    Field label.
 * @return {Element} Field element.
 */
const ColorField = ( { value, onChange, label } ) => (
	<div className="ssb-color-field">
		<span className="ssb-color-field__label">{ label }</span>
		<div className="ssb-color-field__swatches">
			{ PALETTES.map( ( palette ) => (
				<button
					key={ palette.color }
					type="button"
					title={ palette.name }
					style={ { background: palette.color } }
					className={ value === palette.color ? 'is-active' : '' }
					onClick={ () => onChange( palette.color ) }
				/>
			) ) }
			<input
				type="color"
				className="ssb-color-field__custom"
				title={ __('Custom color (eyedropper in the browser dialog)', 'stsalv-smart-schema-builder') }
				value={ toInputHex( value ) }
				onChange={ ( event ) => onChange( event.target.value ) }
			/>
		</div>
	</div>
);

export default ColorField;