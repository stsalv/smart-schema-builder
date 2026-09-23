<?php
/**
 * Template tags for Smart Schema Builder.
 *
 * @package StSalvSmartSchemaBuilder
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
function stssb_schema( $id ) {
	return STSSB_Block::render_schema( (int) $id );
}
