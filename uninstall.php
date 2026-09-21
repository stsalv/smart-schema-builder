<?php
/**
 * Uninstall handler: remove plugin data on deletion.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Remove custom capabilities from every role.
foreach ( array_keys( wp_roles()->roles ) as $ssb_role_slug ) {
	$ssb_role_obj = get_role( $ssb_role_slug );
	if ( $ssb_role_obj ) {
		$ssb_role_obj->remove_cap( 'ssb_edit_schemas' );
		$ssb_role_obj->remove_cap( 'ssb_manage_settings' );
	}
}

// Delete all schema posts (meta is removed with force delete).
$ssb_schema_ids = get_posts(
	array(
		'post_type'      => 'ssb_schema',
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	)
);
foreach ( $ssb_schema_ids as $ssb_schema_id ) {
	wp_delete_post( $ssb_schema_id, true );
}

// Clean orphaned meta keys, just in case.
delete_post_meta_by_key( '_ssb_config' );
delete_post_meta_by_key( '_ssb_stats' );
