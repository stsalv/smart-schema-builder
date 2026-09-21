<?php
/**
 * Built-in stroke icon registry shared by admin and front-end renderers.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Icon set: keys match the JavaScript BUILTIN_ICONS map.
 */
class SSB_Icons {

	/**
	 * Inner SVG markup for every built-in icon (24x24 viewBox).
	 *
	 * @since 1.0.0
	 * @return array<string,string> Icon map.
	 */
	public static function get_map() {
		return array(
			'truck'        => '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
			'train'        => '<rect x="4" y="3" width="16" height="13" rx="3"/><path d="M4 10h16"/><circle cx="8.5" cy="13" r="1"/><circle cx="15.5" cy="13" r="1"/><path d="m7 16-2 5"/><path d="m17 16 2 5"/>',
			'ship'         => '<path d="M12 10.2V14"/><path d="M12 2v3"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M19.4 20A11.6 11.6 0 0 0 21 14l-8.2-3.6a2 2 0 0 0-1.6 0L3 14a11.6 11.6 0 0 0 1.6 6"/><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
			'plane'        => '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
			'anchor'       => '<circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
			'container'    => '<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M7 7v10M12 7v10M17 7v10"/>',
			'warehouse'    => '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M7 22v-6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6"/><path d="M7 11h10"/>',
			'route'        => '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
			'package'      => '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4Z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
			'shield'       => '<path d="M20 13c0 5-3.5 7.5-7.7 8.8a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
			'file'         => '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
			'users'        => '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
			'download'     => '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
			'arrowRight'   => '<path d="m9 18 6-6-6-6"/>',
			'dots'         => '<path d="M6 12h.01" stroke-width="3"/><path d="M18 12h.01" stroke-width="3"/>',
			'dashes'       => '<path d="M4 12h16"/>',
			'dotDash'      => '<path d="M4 12h.01" stroke-width="3"/><path d="M10 12h12"/>',
			'dashesSparse' => '<path d="M8 12h8"/>',
		);
	}

	/**
	 * Render an inline SVG for a built-in icon.
	 *
	 * @since 1.0.0
	 * @param string $name  Icon key.
	 * @param string $css_class CSS class for the svg element.
	 * @return string SVG markup or empty string for unknown keys.
	 */
	public static function svg( $name, $css_class = 'ssb-icon' ) {
		$map = self::get_map();
		if ( ! isset( $map[ $name ] ) ) {
			return '';
		}
		return '<svg class="' . esc_attr( $css_class ) . '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' . $map[ $name ] . '</svg>';
	}

	/**
	 * Build a data URI used for repeating separator backgrounds.
	 *
	 * @since 1.0.0
	 * @param string $name  Icon key.
	 * @param string $color Stroke hex color.
	 * @return string Encoded data URI or empty string.
	 */
	public static function data_uri( $name, $color ) {
		$map = self::get_map();
		if ( ! isset( $map[ $name ] ) ) {
			return '';
		}
		$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="' . $color . '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' . $map[ $name ] . '</svg>';
		return 'data:image/svg+xml,' . rawurlencode( $svg );
	}
}
