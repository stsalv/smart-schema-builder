/**
 * Icon picker: built-in SVG set plus WordPress media library (SVG only).
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
import { useState } from '@wordpress/element';
import { Button, Modal, TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BUILTIN_ICONS } from '../../utils/schema-helpers';

/**
 * Render a built-in icon preview.
 *
 * @since 1.0.0
 * @param {Object} props      Component props.
 * @param {string} props.name Built-in icon key.
 * @param {number} props.size Icon size in pixels.
 * @return {Element|null} SVG element or null for unknown keys.
 */
export const IconPreview = ( { name, size = 20 } ) => {
	const markup = BUILTIN_ICONS[ name ];
	if ( ! markup ) {
		return null;
	}
	return (
		<svg
			viewBox="0 0 24 24"
			width={ size }
			height={ size }
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			dangerouslySetInnerHTML={ { __html: markup } }
		/>
	);
};

/**
 * Icon picker with modal dialog.
 *
 * @since 1.0.0
 * @param {Object}   props          Component props.
 * @param {Object}   props.value    Current icon object or null.
 * @param {Function} props.onChange Change callback (icon|null).
 * @param {string}   props.label    Control label.
 * @return {Element} Picker element.
 */
const IconPicker = ( { value, onChange, label } ) => {
	const [ isOpen, setOpen ] = useState( false );

	/**
	 * Open the media library restricted to SVG files.
	 *
	 * @since 1.0.0
	 * @return {void}
	 */
	const openMediaLibrary = () => {
		if ( ! window.wp || ! window.wp.media ) {
			return;
		}
		const frame = window.wp.media( {
			title: __('Select icon (SVG only)', 'stsalv-smart-schema-builder'),
			library: { type: 'image/svg+xml' },
			multiple: false,
			button: { text: __('Use this file', 'stsalv-smart-schema-builder') },
		} );
		frame.on( 'select', () => {
			const attachment = frame.state().get( 'selection' ).first().toJSON();
			if ( 'image/svg+xml' !== attachment.mime ) {
				window.alert( __('Only SVG files can be used as icons.', 'stsalv-smart-schema-builder') ); // eslint-disable-line no-alert
				return;
			}
			onChange( { type: 'media', value: attachment.id, url: attachment.url } );
			setOpen( false );
		} );
		frame.open();
	};

	/**
	 * Render the current icon inside the trigger button.
	 *
	 * @since 1.0.0
	 * @return {Element} Preview element.
	 */
	const renderCurrent = () => {
		if ( ! value ) {
			return <span className="description">{ __('Not set', 'stsalv-smart-schema-builder') }</span>;
		}
		if ( 'media' === value.type && value.url ) {
			return <img className="ssb-icon-media" src={ value.url } alt="" width="24" height="24" />;
		}
		return <IconPreview name={ value.value } />;
	};

	return (
		<div className="ssb-icon-picker">
			<Button variant="secondary" className="ssb-icon-trigger" onClick={ () => setOpen( true ) }>
				{ renderCurrent() }
				<span>{ label || __('Icon', 'stsalv-smart-schema-builder') }</span>
			</Button>
			{ value && (
				<Button variant="link" isDestructive onClick={ () => onChange( null ) }>
					{ __('Clear', 'stsalv-smart-schema-builder') }
				</Button>
			) }
			{ isOpen && (
				<Modal
					title={ __('Select icon', 'stsalv-smart-schema-builder') }
					onRequestClose={ () => setOpen( false ) }
				>
					<TabPanel
						tabs={ [
							{ name: 'builtin', title: __('Built-in set', 'stsalv-smart-schema-builder'), className: 'ssb-tab' },
							{ name: 'media', title: __('Media library (SVG)', 'stsalv-smart-schema-builder'), className: 'ssb-tab' },
						] }
					>
						{ ( tab ) => {
							if ( 'media' === tab.name ) {
								return (
									<div className="ssb-icon-media-tab">
										{ value && 'media' === value.type && value.url && (
											<img src={ value.url } alt="" width="48" height="48" />
										) }
										<Button variant="primary" onClick={ openMediaLibrary }>
											{ __('Choose from media library', 'stsalv-smart-schema-builder') }
										</Button>
										<p className="description">
											{ __('Only SVG files are shown. SVGs using currentColor inherit the configured color.', 'stsalv-smart-schema-builder') }
										</p>
									</div>
								);
							}
							return (
								<div className="ssb-icon-grid">
									{ Object.keys( BUILTIN_ICONS ).map( ( name ) => (
										<button
											key={ name }
											type="button"
											title={ name }
											className={ value && 'builtin' === value.type && value.value === name ? 'is-active' : '' }
											onClick={ () => {
												onChange( { type: 'builtin', value: name } );
												setOpen( false );
											} }
										>
											<IconPreview name={ name } />
										</button>
									) ) }
								</div>
							);
						} }
					</TabPanel>
				</Modal>
			) }
		</div>
	);
};

export default IconPicker;