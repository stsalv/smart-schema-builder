<?php
/**
 * Template tags for Smart Schema Builder.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render a schema anywhere in a theme.
 *
 * @since 1.0.0
 * @param int $id Schema post ID.
 * @return string Schema HTML.
 */
function ssb_schema( $id ) {
	return SSB_Block::render_schema( (int) $id );
}
