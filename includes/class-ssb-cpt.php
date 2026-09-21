<?php
/**
 * Custom post type registration and meta field setup.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; }

/**
 * Custom post type registration and meta field setup.
 *
 * Registers the `ssb_schema` post type with custom capabilities and two
 * meta fields: `_ssb_config` (JSON configuration) and `_ssb_stats` (JSON
 * statistics). Provides default configuration and statistics arrays.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
class SSB_CPT {

	const POST_TYPE   = 'ssb_schema';
	const META_CONFIG = '_ssb_config';
	const META_STATS  = '_ssb_stats';

	/**
	 * Singleton instance.
	 *
	 * @var SSB_CPT|null
	 */
	private static $instance = null;

	/**
	 * Get the singleton.
	 *
	 * @since 1.0.0
	 * @return SSB_CPT
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook the post type and meta registration.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'register' ) );
	}

	/**
	 * Register the post type and meta fields.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register() {
		self::register_post_type();
		$this->register_meta();
	}

	/**
	 * Register the `ssb_schema` post type with custom capabilities.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_post_type() {
		$labels = array(
			'name'               => _x( 'Schemas', 'post type general name', 'stsalv-smart-schema-builder' ),
			'singular_name'      => _x( 'Schema', 'post type singular name', 'stsalv-smart-schema-builder' ),
			'menu_name'          => _x( 'Schemas', 'admin menu', 'stsalv-smart-schema-builder' ),
			'add_new'            => __( 'Add New', 'stsalv-smart-schema-builder' ),
			'add_new_item'       => __( 'Add New Schema', 'stsalv-smart-schema-builder' ),
			'new_item'           => __( 'New Schema', 'stsalv-smart-schema-builder' ),
			'edit_item'          => __( 'Edit Schema', 'stsalv-smart-schema-builder' ),
			'view_item'          => __( 'View Schema', 'stsalv-smart-schema-builder' ),
			'all_items'          => __( 'All Schemas', 'stsalv-smart-schema-builder' ),
			'search_items'       => __( 'Search Schemas', 'stsalv-smart-schema-builder' ),
			'not_found'          => __( 'No schemas found.', 'stsalv-smart-schema-builder' ),
			'not_found_in_trash' => __( 'No schemas found in Trash.', 'stsalv-smart-schema-builder' ),
		);

		$args = array(
			'labels'             => $labels,
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => false,
			'show_in_menu'       => false,
			'show_in_admin_bar'  => false,
			'query_var'          => false,
			'rewrite'            => false,
			'capability_type'    => 'post',
			// Remove map_meta_cap — control capabilities manually.
			'capabilities'       => array(
				'edit_post'          => 'ssb_edit_schemas',
				'read_post'          => 'ssb_edit_schemas',
				'delete_post'        => 'ssb_manage_settings',
				'edit_posts'         => 'ssb_edit_schemas',
				'edit_others_posts'  => 'ssb_edit_schemas',
				'publish_posts'      => 'ssb_edit_schemas',
				'read_private_posts' => 'ssb_edit_schemas',
				'create_posts'       => 'ssb_edit_schemas',
			),
			'has_archive'        => false,
			'hierarchical'       => false,
			'supports'           => array( 'title' ),
			'show_in_rest'       => false,
		);

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Register meta fields for schema configuration and statistics.
	 *
	 * Both meta fields are stored as JSON strings and require the
	 * `ssb_edit_schemas` capability for updates.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function register_meta() {
		// Simplify auth_callback — remove the hardcoded check.
		$args_config = array(
			'type'              => 'string',
			'description'       => 'Schema configuration JSON',
			'single'            => true,
			'show_in_rest'      => false,
			'sanitize_callback' => static function ( $value ) {
				return is_string( $value ) ? $value : '';
			},
			// We allow updates to everyone who can edit posts of this type.
			'auth_callback'     => static function () {
				return current_user_can( 'ssb_edit_schemas' );
			},
		);
		register_post_meta( self::POST_TYPE, self::META_CONFIG, $args_config );

		$args_stats                = $args_config;
		$args_stats['description'] = 'Schema statistics JSON';
		register_post_meta( self::POST_TYPE, self::META_STATS, $args_stats );
	}

	/**
	 * Return the default schema configuration.
	 *
	 * @since 1.0.0
	 * @return array Default configuration array.
	 */
	public static function get_default_config() {
		return array(
			'schema_version' => 1,
			'title'          => '',
			'description'    => '',
			'eyebrow'        => '',
			'titleSize'      => 'standard',
			'titleFont'      => '',
			'logoSize'       => 'standard',
			'logoColor'      => '#1a4fa0',
			'icon'           => array(
				'type'  => 'builtin',
				'value' => 'route',
			),
			'showIcon'       => true,
			'numbering'      => true,
			'download'       => array(
				'orientation' => 'landscape',
				'multipage'   => true,
				'pdf'         => array(
					'enabled'    => true,
					'label'      => __( 'Download PDF', 'stsalv-smart-schema-builder' ),
					'icon'       => array(
						'type'  => 'builtin',
						'value' => 'download',
					),
					'iconSize'   => 'standard',
					'color'      => '#1a4fa0',
					'hoverColor' => '',
				),
				'png'         => array(
					'enabled'    => true,
					'label'      => __( 'Download PNG', 'stsalv-smart-schema-builder' ),
					'icon'       => array(
						'type'  => 'builtin',
						'value' => 'download',
					),
					'iconSize'   => 'standard',
					'color'      => '#1a4fa0',
					'hoverColor' => '',
				),
				'json'        => array(
					'enabled'    => false,
					'label'      => __( 'Download JSON', 'stsalv-smart-schema-builder' ),
					'icon'       => array(
						'type'  => 'builtin',
						'value' => 'download',
					),
					'iconSize'   => 'standard',
					'color'      => '#1a4fa0',
					'hoverColor' => '',
				),
			),
			'footer'         => array(
				/* translators: %title: schema title placeholder, %cnt: item count placeholder; both replaced at render time. */
				'left'  => __( '%title · %cnt roles', 'stsalv-smart-schema-builder' ),
				'right' => __( 'Edition %yyyy.', 'stsalv-smart-schema-builder' ),
			),
			'tags'           => array(),
			'blocks'         => array(),
		);
	}

	/**
	 * Return the default schema statistics.
	 *
	 * @since 1.0.0
	 * @return array Default statistics array.
	 */
	public static function get_default_stats() {
		return array(
			'modal_opens'    => 0,
			'downloads_pdf'  => 0,
			'downloads_png'  => 0,
			'downloads_json' => 0,
		);
	}
}
