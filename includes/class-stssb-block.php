<?php
/**
 * Insertion points: Gutenberg block, shortcode and template tag.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Insertion points: Gutenberg block, shortcode and template tag.
 *
 * Registers the `[stsalv_smart_schema]` shortcode and the `stssb/schema` Gutenberg
 * block (dynamic, server-rendered, apiVersion 3). Provides the shared
 * render entry point used by the shortcode, the block and the
 * `stssb_schema()` template tag.
 *
 * @package StSalvSmartSchemaBuilder
 * @since   1.0.0
 */
class STSSB_Block {

	/**
	 * Singleton instance.
	 *
	 * @var STSSB_Block|null
	 */
	private static $instance = null;

	/**
	 * Get the singleton.
	 *
	 * @since 1.0.0
	 * @return STSSB_Block
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook registrations.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'register_shortcode' ) );
		add_action( 'init', array( $this, 'register_block' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'editor_assets' ) );
		add_action( 'enqueue_block_assets', array( $this, 'block_assets' ) );
	}

	/**
	 * Register the [stsalv_smart_schema] shortcode.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_shortcode() {
		add_shortcode( 'stsalv_smart_schema', array( $this, 'shortcode' ) );
	}

	/**
	 * Shortcode callback: [stsalv_smart_schema id="123"].
	 *
	 * @since 1.0.0
	 * @param array $atts Shortcode attributes.
	 * @return string Schema HTML.
	 */
	public function shortcode( $atts ) {
		$atts = shortcode_atts( array( 'id' => 0 ), $atts, 'stsalv_smart_schema' );
		return self::render_schema( (int) $atts['id'] );
	}

	/**
	 * Register the dynamic Gutenberg block (server-rendered, apiVersion 3).
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_block() {
		$asset_file = STSSB_PLUGIN_DIR . 'build/block/index.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array(),
				'version'      => STSSB_VERSION,
			);

		wp_register_script(
			'stssb-schema-editor',
			STSSB_PLUGIN_URL . 'build/block/index.js',
			array_merge(
				$asset['dependencies'],
				array( 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-server-side-render' )
			),
			$asset['version'],
			true
		);
		wp_set_script_translations( 'stssb-schema-editor', 'stsalv-smart-schema-builder' );

		wp_register_style(
			'stssb-schema-editor-style',
			STSSB_PLUGIN_URL . 'build/block/index.css',
			array(),
			STSSB_VERSION
		);

		register_block_type(
			'stssb/schema',
			array(
				'api_version'     => 3,
				'title'           => __( 'Smart Schema', 'stsalv-smart-schema-builder' ),
				'description'     => __( 'Renders a configured schema map.', 'stsalv-smart-schema-builder' ),
				'category'        => 'widgets',
				'icon'            => 'networking',
				'textdomain'      => 'stsalv-smart-schema-builder',
				'attributes'      => array(
					'schemaId' => array(
						'type'    => 'integer',
						'default' => 0,
					),
				),
				'supports'        => array(
					'html'   => false,
					'align'  => array( 'wide', 'full' ),
					'anchor' => true,
				),
				'editor_script'   => 'stssb-schema-editor',
				'editor_style'    => 'stssb-schema-editor-style',
				'style'           => 'stssb-frontend',
				'render_callback' => array( $this, 'render_block' ),
			)
		);
	}

	/**
	 * Editor assets: schema list for the selector plus front styles for preview.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function editor_assets() {
		$schemas = get_posts(
			array(
				'post_type'      => STSSB_CPT::POST_TYPE,
				'post_status'    => array( 'publish', 'draft' ),
				'posts_per_page' => 200,
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);
		$list    = array();
		foreach ( $schemas as $post_item ) {
			$list[] = array(
				'id'     => $post_item->ID,
				'title'  => $post_item->post_title,
				'status' => $post_item->post_status,
			);
		}
		wp_localize_script(
			'stssb-schema-editor',
			'stssbBlockEditor',
			array(
				'schemas'  => $list,
				'adminUrl' => admin_url( 'admin.php?page=' . STSSB_Admin::MENU_SLUG ),
			)
		);
	}

	/**
	 * Block assets for the editor iframe.
	 *
	 * Styles enqueued via enqueue_block_assets are the sanctioned way to
	 * reach the editor iframe (WP 5.8+). They are added only when the post
	 * being edited actually contains our block or shortcode.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function block_assets() {
		if ( ! is_admin() ) {
			return;
		}
		$post = get_post();
		if ( ! $post ) {
			return;
		}
		$content = (string) $post->post_content;
		if ( false === strpos( $content, 'wp:stssb/schema' ) && false === stripos( $content, '[stsalv_smart_schema' ) ) {
			return;
		}
		wp_enqueue_style( 'stssb-frontend' );
	}

	/**
	 * Block render callback.
	 *
	 * @since 1.0.0
	 * @param array  $attributes Block attributes.
	 * @param string $content    Inner content (unused, dynamic block).
	 * @return string Rendered HTML.
	 */
	public function render_block( $attributes, $content ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- required by block render_callback signature.
		$id      = isset( $attributes['schemaId'] ) ? (int) $attributes['schemaId'] : 0;
		$wrapper = '<div ' . get_block_wrapper_attributes() . '>';
		if ( ! $id ) {
			if ( current_user_can( 'stssb_edit_schemas' ) ) {
				return $wrapper . '<div class="stssb-block-empty">' .
					esc_html__( 'Select a schema in the block settings on the right.', 'stsalv-smart-schema-builder' ) .
					'</div></div>';
			}
			return '';
		}
		return $wrapper . self::render_schema( $id ) . '</div>';
	}

	/**
	 * Shared render entry used by shortcode, block and template tag.
	 *
	 * @since 1.0.0
	 * @param int $id Schema post ID.
	 * @return string Schema HTML.
	 */
	public static function render_schema( $id ) {
		if ( ! $id ) {
			return '';
		}
		return STSSB_Render::render( $id );
	}
}
