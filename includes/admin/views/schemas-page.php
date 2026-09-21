<?php
/**
 * Admin view: schemas list / editor mountpoint.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; }
?>
<div class="wrap ssb-wrap">
	<div id="ssb-admin-root"
		data-action="<?php echo esc_attr( $action ); ?>"
		data-schema-id="<?php echo esc_attr( $schema_id ); ?>"></div>
</div>
