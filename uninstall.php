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
foreach ( array_keys( wp_roles()->roles ) as $stssb_role_slug ) {
	$stssb_role_obj = get_role( $stssb_role_slug );
	if ( $stssb_role_obj ) {
		$stssb_role_obj->remove_cap( 'stssb_edit_schemas' );
		$stssb_role_obj->remove_cap( 'stssb_manage_settings' );
	}
}

// Delete all schema posts (meta is removed with force delete).
$stssb_schema_ids = get_posts(
	array(
		'post_type'      => 'stssb_schema',
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	)
);
foreach ( $stssb_schema_ids as $stssb_schema_id ) {
	wp_delete_post( $stssb_schema_id, true );
}

// Clean orphaned meta keys, just in case.
delete_post_meta_by_key( '_stssb_config' );
delete_post_meta_by_key( '_stssb_stats' );
