<?php
/**
 * Admin menu pages and ajax handlers for schema CRUD and import/export.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; }

/**
 * Admin menu pages and ajax handlers for schema CRUD and import/export.
 *
 * Registers the Smart Schemas top-level menu with All Schemas, Editor and
 * Statistics sub-pages, and wires the admin ajax handlers used by the
 * React editor: list, get, save, delete, export and import.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
class SSB_Admin {

	const MENU_SLUG  = 'stsalv-smart-schema-builder';
	const STATS_SLUG = 'stsalv-smart-schema-builder-stats';
	const EDIT_SLUG  = 'stsalv-smart-schema-builder-edit';

	/**
	 * Singleton instance.
	 *
	 * @var SSB_Admin|null
	 */
	private static $instance = null;

	/**
	 * Get the singleton.
	 *
	 * @since 1.0.0
	 * @return SSB_Admin
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook menu pages and admin ajax handlers.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'admin_menu', array( $this, 'add_menu_pages' ) );
		add_action( 'wp_ajax_ssb_list_schemas', array( $this, 'ajax_list_schemas' ) );
		add_action( 'wp_ajax_ssb_get_schema', array( $this, 'ajax_get_schema' ) );
		add_action( 'wp_ajax_ssb_save_schema', array( $this, 'ajax_save_schema' ) );
		add_action( 'wp_ajax_ssb_delete_schema', array( $this, 'ajax_delete_schema' ) );
		add_action( 'wp_ajax_ssb_export_schema', array( $this, 'ajax_export_schema' ) );
		add_action( 'wp_ajax_ssb_import_schema', array( $this, 'ajax_import_schema' ) );
	}

	/**
	 * Register top-level menu and sub-pages.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function add_menu_pages() {
		add_menu_page(
			__( 'Smart Schema Builder', 'stsalv-smart-schema-builder' ),
			__( 'Smart Schemas', 'stsalv-smart-schema-builder' ),
			'ssb_edit_schemas',
			self::MENU_SLUG,
			array( $this, 'render_schemas_page' ),
			'dashicons-networking',
			26
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'All Schemas', 'stsalv-smart-schema-builder' ),
			__( 'All schemas', 'stsalv-smart-schema-builder' ),
			'ssb_edit_schemas',
			self::MENU_SLUG,
			array( $this, 'render_schemas_page' )
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'Statistics', 'stsalv-smart-schema-builder' ),
			__( 'Statistics', 'stsalv-smart-schema-builder' ),
			'ssb_manage_settings',
			self::STATS_SLUG,
			array( $this, 'render_stats_page' )
		);
	}

	/**
	 * Render the schemas list or editor mountpoint.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function render_schemas_page() {
		$action    = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : 'list'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- view routing, not a state-changing action.
		$schema_id = isset( $_GET['schema'] ) ? absint( wp_unslash( $_GET['schema'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- view routing, not a state-changing action.

		$views_dir = SSB_PLUGIN_DIR . 'includes/admin/views/';
		require $views_dir . 'schemas-page.php';
	}

	/**
	 * Render the statistics table mountpoint.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function render_stats_page() {
		$views_dir = SSB_PLUGIN_DIR . 'includes/admin/views/';
		require $views_dir . 'stats-page.php';
	}


	/**
	 * Read a JSON payload from POST transported as base64.
	 *
	 * Base64 alphabet contains no slashes or quotes, so the payload is
	 * immune to wp_unslash() and charset issues on any host configuration.
	 *
	 * @since 1.0.0
	 * @param string $key POST key.
	 * @return array|null Decoded array or null on failure.
	 */
	private function get_json_payload( $key ) {
		// Nonce is verified by every calling ajax handler before this helper runs.
		if ( ! isset( $_POST[ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified by callers.
			return null;
		}
		// Nonce is verified by every calling ajax handler before this helper runs.
		$raw = base64_decode( sanitize_text_field( wp_unslash( $_POST[ $key ] ) ), true ); // phpcs:ignore WordPress.Security.NonceVerification.Missing,WordPress.PHP.DiscouragedPHPFunctions -- verified by callers; benign base64 transport.

		if ( false === $raw ) {
			// Fallback for legacy plain JSON payloads that were not base64-encoded.
			$raw = sanitize_text_field( wp_unslash( $_POST[ $key ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified by callers.
		}
		$data = json_decode( $raw, true );
		return is_array( $data ) ? $data : null;
	}

	/**
	 * Encode any payload for storage as raw UTF-8 JSON.
	 *
	 * JSON_UNESCAPED_UNICODE keeps non-ASCII characters as-is so the stored
	 * string contains no backslashes that could be stripped by host-level
	 * slashing layers.
	 *
	 * @since 1.0.0
	 * @param mixed $data Payload to encode.
	 * @return string JSON string.
	 */
	private function encode_json( $data ) {
		return wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	}


	/* ========================= AJAX handlers ========================= */

	/**
	 * Admin ajax: list all schemas for the editor selector.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_list_schemas() {
		check_ajax_referer( 'ssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'ssb_edit_schemas' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'stsalv-smart-schema-builder' ) ), 403 );
		}

		$posts = get_posts(
			array(
				'post_type'      => SSB_CPT::POST_TYPE,
				'posts_per_page' => 200,
				'post_status'    => array( 'publish', 'draft' ),
				'orderby'        => 'modified',
				'order'          => 'DESC',
			)
		);

		$items = array();
		foreach ( $posts as $p ) {
			$config      = json_decode( get_post_meta( $p->ID, SSB_CPT::META_CONFIG, true ), true );
			$block_count = is_array( $config ) && isset( $config['blocks'] ) ? count( $config['blocks'] ) : 0;
			$items[]     = array(
				'id'          => $p->ID,
				'title'       => $p->post_title,
				'status'      => $p->post_status,
				'block_count' => $block_count,
				'modified'    => mysql2date( 'Y-m-d H:i', $p->post_modified ),
			);
		}

		wp_send_json_success( array( 'schemas' => $items ) );
	}

	/**
	 * Admin ajax: return a single schema by id (or an empty one when id is 0).
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_get_schema() {
		check_ajax_referer( 'ssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'ssb_edit_schemas' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'stsalv-smart-schema-builder' ) ), 403 );
		}

		$id = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : 0;
		if ( ! $id ) {
			wp_send_json_success(
				array(
					'id'     => 0,
					'title'  => '',
					'status' => 'draft',
					'config' => SSB_CPT::get_default_config(),
				)
			);
		}

		$post = get_post( $id );
		if ( ! $post || SSB_CPT::POST_TYPE !== $post->post_type ) {
			wp_send_json_error( array( 'message' => __( 'Schema not found.', 'stsalv-smart-schema-builder' ) ), 404 );
		}

		$raw    = (string) get_post_meta( $id, SSB_CPT::META_CONFIG, true );
		$config = json_decode( $raw, true );
		if ( ! is_array( $config ) && '' !== $raw ) {
			wp_send_json_error(
				array( 'message' => __( 'Schema configuration is damaged. Re-import the schema JSON or recreate the schema.', 'stsalv-smart-schema-builder' ) ),
				409
			);
		}
		if ( ! is_array( $config ) ) {
			$config = SSB_CPT::get_default_config();
		}

		wp_send_json_success(
			array(
				'id'     => $id,
				'title'  => $post->post_title,
				'status' => $post->post_status,
				'config' => $config,
			)
		);
	}

	/**
	 * Admin ajax: create or update a schema (status draft|publish).
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_save_schema() {
		check_ajax_referer( 'ssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'ssb_edit_schemas' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'stsalv-smart-schema-builder' ) ), 403 );
		}

		$id     = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
		$title  = isset( $_POST['title'] ) ? sanitize_text_field( wp_unslash( $_POST['title'] ) ) : '';
		$status = isset( $_POST['status'] ) ? sanitize_key( $_POST['status'] ) : 'draft';
		if ( ! in_array( $status, array( 'publish', 'draft' ), true ) ) {
			$status = 'draft';
		}

		$config_data = $this->get_json_payload( 'config' );
		if ( null === $config_data ) {
			wp_send_json_error( array( 'message' => __( 'Invalid configuration.', 'stsalv-smart-schema-builder' ) ), 400 );
		}

		if ( $id ) {
			$post = get_post( $id );
			if ( ! $post || SSB_CPT::POST_TYPE !== $post->post_type ) {
				wp_send_json_error( array( 'message' => __( 'Schema not found.', 'stsalv-smart-schema-builder' ) ), 404 );
			}
			wp_update_post(
				array(
					'ID'          => $id,
					'post_title'  => $title,
					'post_status' => $status,
				)
			);
		} else {
			$id = wp_insert_post(
				array(
					'post_type'   => SSB_CPT::POST_TYPE,
					'post_title'  => $title ? $title : __( 'Untitled Schema', 'stsalv-smart-schema-builder' ),
					'post_status' => $status,
				),
				true
			);
			if ( is_wp_error( $id ) ) {
				wp_send_json_error( array( 'message' => $id->get_error_message() ), 500 );
			}
			if ( ! get_post_meta( $id, SSB_CPT::META_STATS, true ) ) {
				update_post_meta( $id, SSB_CPT::META_STATS, wp_slash( $this->encode_json( SSB_CPT::get_default_stats() ) ) );
			}
		}

		update_post_meta( $id, SSB_CPT::META_CONFIG, wp_slash( $this->encode_json( $config_data ) ) );

		wp_send_json_success(
			array(
				'id'    => $id,
				'title' => $title,
			)
		);
	}

	/**
	 * Admin ajax: permanently delete a schema and its meta.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_delete_schema() {
		check_ajax_referer( 'ssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'ssb_manage_settings' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'stsalv-smart-schema-builder' ) ), 403 );
		}

		$id = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
		if ( ! $id ) {
			wp_send_json_error( array( 'message' => __( 'Invalid ID.', 'stsalv-smart-schema-builder' ) ), 400 );
		}

		$result = wp_delete_post( $id, true );
		if ( ! $result ) {
			wp_send_json_error( array( 'message' => __( 'Failed to delete schema.', 'stsalv-smart-schema-builder' ) ), 500 );
		}

		wp_send_json_success( array( 'id' => $id ) );
	}

	/**
	 * Admin ajax: export a schema config as JSON.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_export_schema() {
		check_ajax_referer( 'ssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'ssb_edit_schemas' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'stsalv-smart-schema-builder' ) ), 403 );
		}

		$id   = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : 0;
		$post = get_post( $id );
		if ( ! $post || SSB_CPT::POST_TYPE !== $post->post_type ) {
			wp_send_json_error( array( 'message' => __( 'Schema not found.', 'stsalv-smart-schema-builder' ) ), 404 );
		}

		$config = json_decode( get_post_meta( $id, SSB_CPT::META_CONFIG, true ), true );
		if ( ! is_array( $config ) ) {
			$config = SSB_CPT::get_default_config();
		}

		wp_send_json_success(
			array(
				'exported_at' => gmdate( 'c' ),
				'plugin'      => 'stsalv-smart-schema-builder',
				'version'     => SSB_VERSION,
				'title'       => $post->post_title,
				'status'      => $post->post_status,
				'config'      => $config,
			)
		);
	}

	/**
	 * Admin ajax: import a schema config from a JSON payload (create or overwrite).
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function ajax_import_schema() {
		check_ajax_referer( 'ssb_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'ssb_edit_schemas' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'stsalv-smart-schema-builder' ) ), 403 );
		}

		$target_id = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
		$data      = $this->get_json_payload( 'import' );

		if ( null === $data || ! isset( $data['config'] ) || ! is_array( $data['config'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid import file.', 'stsalv-smart-schema-builder' ) ), 400 );
		}

		$title  = isset( $data['title'] ) ? sanitize_text_field( $data['title'] ) : __( 'Imported Schema', 'stsalv-smart-schema-builder' );
		$status = isset( $data['status'] ) && in_array( $data['status'], array( 'publish', 'draft' ), true )
			? $data['status']
			: 'draft';
		$config = $data['config'];

		if ( $target_id ) {
			$post = get_post( $target_id );
			if ( ! $post || SSB_CPT::POST_TYPE !== $post->post_type ) {
				wp_send_json_error( array( 'message' => __( 'Target schema not found.', 'stsalv-smart-schema-builder' ) ), 404 );
			}
			wp_update_post(
				array(
					'ID'          => $target_id,
					'post_title'  => $title,
					'post_status' => $status,
				)
			);
			$id = $target_id;
		} else {
			$id = wp_insert_post(
				array(
					'post_type'   => SSB_CPT::POST_TYPE,
					'post_title'  => $title,
					'post_status' => $status,
				),
				true
			);
			if ( is_wp_error( $id ) ) {
				wp_send_json_error( array( 'message' => $id->get_error_message() ), 500 );
			}
			update_post_meta( $id, SSB_CPT::META_STATS, wp_slash( $this->encode_json( SSB_CPT::get_default_stats() ) ) );
		}

		update_post_meta( $id, SSB_CPT::META_CONFIG, wp_slash( $this->encode_json( $config ) ) );

		wp_send_json_success(
			array(
				'id'    => $id,
				'title' => $title,
			)
		);
	}
}
