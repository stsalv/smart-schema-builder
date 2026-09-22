<?php
/**
 * Front-end renderer: converts a schema config into scoped HTML.
 *
 * Instance isolation: every render gets a unique root id, all group colors
 * are passed as inline CSS custom properties, and the shared stylesheet
 * contains no per-schema rules, so multiple schemas coexist safely.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Front-end renderer: converts a schema config into scoped HTML.
 *
 * Each render call produces a self-contained HTML fragment with a unique
 * root id, inline CSS custom properties for group colors, and no shared
 * per-schema rules, so multiple schemas on one page coexist safely.
 * Handles publication visibility (drafts require `ssb_edit_schemas`),
 * damaged-config diagnostics, and late-render asset fallback.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
class SSB_Render {

	/**
	 * Per-request counter for unique instance ids.
	 *
	 * @var int
	 */
	private static $instance_counter = 0;

	/**
	 * Render a schema as HTML.
	 *
	 * @since 1.0.0
	 * @param int $schema_id Schema post ID.
	 * @return string HTML string, empty when nothing may be shown.
	 */
	public static function render( $schema_id ) {
		$post = get_post( (int) $schema_id );
		if ( ! $post || SSB_CPT::POST_TYPE !== $post->post_type ) {
			return '';
		}
		if ( 'publish' !== get_post_status( $post ) && ! current_user_can( 'ssb_edit_schemas' ) ) {
			return '';
		}

		$raw    = (string) get_post_meta( $post->ID, SSB_CPT::META_CONFIG, true );
		$config = json_decode( $raw, true );

		if ( ! is_array( $config ) ) {
			if ( '' !== $raw ) {
				// Damaged config: record the JSON error in the WP debug log so the
				// site admin can diagnose the issue from wp-content/debug.log or
				// the host's PHP error log.
				$err_code = json_last_error();
				$err_msg  = json_last_error_msg();
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- intentional, gated by WP_DEBUG.
						sprintf(
							'[SSB] Schema #%d config is damaged (JSON error %d: %s). Raw length: %d bytes.',
							$post->ID,
							$err_code,
							$err_msg,
							strlen( $raw )
						)
					);
				}
			}

			// Show a diagnostic banner only to logged-in users who can edit schemas,
			// so regular visitors still see a clean page.
			if ( current_user_can( 'ssb_edit_schemas' ) ) {
				return sprintf(
					'<div class="ssb-error" role="alert">%s <a href="%s">%s</a></div>',
					esc_html__( 'Schema configuration is damaged. See wp-content/debug.log for details or re-import the schema.', 'stsalv-smart-schema-builder' ),
					esc_url( admin_url( 'admin.php?page=' . SSB_Admin::MENU_SLUG ) ),
					esc_html__( 'Go to Smart schemas', 'stsalv-smart-schema-builder' )
				);
			}

			return '';
		}

		$blocks = (array) ( $config['blocks'] ?? array() );
		$title  = (string) ( $config['title'] ?? $post->post_title );

		$item_count = 0;
		foreach ( $blocks as $block ) {
			foreach ( (array) ( $block['groups'] ?? array() ) as $group ) {
				$item_count += count( (array) ( $group['items'] ?? array() ) );
			}
		}

		++self::$instance_counter;
		$instance_id = 'ssb-' . $post->ID . '-' . self::$instance_counter;
		$numbering   = ! empty( $config['numbering'] );

		$out   = array();
		$out[] = SSB_Assets::ensure_frontend();

		$pub_ts    = (int) get_post_time( 'U', true, $post );
		$pub_label = $pub_ts ? date_i18n( get_option( 'date_format' ), $pub_ts ) : '';

		$orientation = 'portrait' === ( $config['download']['orientation'] ?? 'landscape' ) ? 'portrait' : 'landscape';
		$multipage   = empty( $config['download']['multipage'] ) ? '0' : '1';
		$out[]       = '<div class="ssb-root" id="' . esc_attr( $instance_id ) . '" data-schema-id="' . esc_attr( $post->ID ) . '" data-tags-param="' . esc_attr( 'ssb_tags_' . $post->ID ) . '" data-pub-date="' . esc_attr( $pub_label ) . '" data-orientation="' . esc_attr( $orientation ) . '" data-multipage="' . esc_attr( $multipage ) . '">';

		$out[] = self::render_header( $config, $title );
		// Print-only meta line: publication date plus active filters (filled
		// client-side). Hidden on screen, revealed in print compositions.
		$out[] = '<div class="ssb-print-meta" hidden><span class="ssb-print-meta-date">' . esc_html( $pub_label ) . '</span><span class="ssb-print-meta-tags"></span></div>';

		$out[] = self::render_tags_bar( $config );

		$number     = 1;
		$head_index = 0;
		foreach ( $blocks as $block ) {
			$layout = (string) ( $block['layout'] ?? 'columns' );
			if ( 'separator' === $layout ) {
				$out[] = self::render_separator( $block );
				continue;
			}
			++$head_index;
			$out[] = '<div class="ssb-block-head"><span class="ssb-idx">' . str_pad( (string) $head_index, 2, '0', STR_PAD_LEFT ) . '</span><h3 class="ssb-block-title">' . esc_html( (string) ( $block['title'] ?? '' ) ) . '</h3></div>';
			switch ( $layout ) {
				case 'sequence':
					$out[] = self::render_sequence( $block, $number, $numbering );
					break;
				case 'hub':
					$out[] = self::render_hub( $block, $number, $numbering );
					break;
				case 'panel':
					$out[] = self::render_panel( $block, $number, $numbering );
					break;
				case 'columns':
				default:
					$out[] = self::render_columns( $block, $number, $numbering );
					break;
			}
		}

		$out[] = self::render_footer( $config, $post, $item_count, $title );
		$out[] = '</div>';

		return implode( "\n", $out );
	}

	/**
	 * Schema header with optional logo icon and download buttons.
	 *
	 * @since 1.0.0
	 * @param array  $config Schema config.
	 * @param string $title  Schema title.
	 * @return string HTML.
	 */
	private static function render_header( $config, $title ) {
		// The logo is rendered whenever an icon is set; with the page toggle
		// off it is hidden on screen but kept for print forms (PDF/PNG).
		$icon_html = self::render_icon( $config['icon'] ?? null, 'ssb-logo-icon' );
		$logo_off  = empty( $config['showIcon'] );

		$eyebrow = (string) ( $config['eyebrow'] ?? '' );

		$size = (string) ( $config['titleSize'] ?? 'standard' );
		if ( ! in_array( $size, array( 'small', 'standard', 'large' ), true ) ) {
			$size = 'standard';
		}
		$title_class = 'ssb-title' . ( 'standard' !== $size ? ' ssb-title--' . $size : '' );

		$title_style = '';
		$font        = self::sanitize_font_family( (string) ( $config['titleFont'] ?? '' ) );
		if ( '' !== $font && self::font_available( $font ) ) {
			$title_style = ' style="font-family:' . esc_attr( $font ) . '"';
		}

		$logo_size = (string) ( $config['logoSize'] ?? 'standard' );
		if ( ! in_array( $logo_size, array( 'small', 'standard', 'large' ), true ) ) {
			$logo_size = 'standard';
		}
		$logo_color = self::sanitize_hex( $config['logoColor'] ?? '#1a4fa0', '#1a4fa0' );
		$logo_style = ' style="--ssb-logo-ink:' . esc_attr( $logo_color )
			. ';--ssb-logo-tile:' . esc_attr( self::mix( $logo_color, '#ffffff', 0.92 ) ) . '"';

		$html  = '<header class="ssb-header">';
		$html .= $icon_html ? '<div class="ssb-logo ssb-logo--' . esc_attr( $logo_size ) . ( $logo_off ? ' ssb-logo--screen-off' : '' ) . '"' . $logo_style . '>' . $icon_html . '</div>' : '';
		$html .= '<div class="ssb-header-text">';
		if ( '' !== trim( $eyebrow ) ) {
			$html .= '<p class="ssb-eyebrow">' . esc_html( $eyebrow ) . '</p>';
		}
		$html .= '<h2 class="' . esc_attr( $title_class ) . '"' . $title_style . '>' . esc_html( $title ) . '</h2>';
		$desc  = (string) ( $config['description'] ?? '' );
		if ( '' !== trim( $desc ) ) {
			$html .= '<p class="ssb-description">' . esc_html( $desc ) . '</p>';
		}
		$html .= '</div>';
		$html .= self::render_download( $config );
		$html .= '</header>';
		return $html;
	}


	/**
	 * Strip unsafe characters from a font-family CSS value.
	 *
	 * @since 1.0.0
	 * @param string $font Raw font-family value.
	 * @return string Sanitized value or empty string.
	 */
	private static function sanitize_font_family( $font ) {
		$font = trim( (string) $font );
		if ( '' === $font ) {
			return '';
		}
		return trim( preg_replace( '/[^A-Za-z0-9 ,\'"\-()]/', '', $font ) );
	}

	/**
	 * Detect dark colors to switch card text to light automatically.
	 *
	 * @since 1.0.0
	 * @param string $hex Hex color.
	 * @return bool True when the color is dark.
	 */
	private static function is_dark( $hex ) {
		$rgb       = self::hex_to_rgb( $hex );
		$luminance = ( $rgb[0] * 299 + $rgb[1] * 587 + $rgb[2] * 114 ) / 1000;
		return $luminance < 150;
	}


	/**
	 * Check whether the first family of a font stack is available in the
	 * active theme or in the built-in list. When the font is missing (for
	 * example after migrating to another site), the title simply inherits
	 * the default font because no inline style is printed.
	 *
	 * @since 1.0.0
	 * @param string $font Font-family value.
	 * @return bool True when the font is available.
	 */
	private static function font_available( $font ) {
		$parts = explode( ',', $font );
		$first = strtolower( trim( $parts[0], " '\"" ) );
		if ( '' === $first ) {
			return false;
		}
		$builtin = array(
			'inter',
			'manrope',
			'fira code',
			'inter tight',
			'system-ui',
			'sans-serif',
			'serif',
			'monospace',
			'arial',
			'helvetica',
			'georgia',
			'times new roman',
			'verdana',
			'tahoma',
			'trebuchet ms',
			'courier new',
		);
		if ( in_array( $first, $builtin, true ) ) {
			return true;
		}
		foreach ( self::get_theme_fonts() as $fam ) {
			$label = strtolower( $fam['label'] );
			$value = strtolower( trim( explode( ',', $fam['value'] )[0], " '\"" ) );
			if ( $first === $label || $first === $value ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Font families declared by the active theme (theme.json presets).
	 *
	 * @since 1.0.0
	 * @return array<int,array{label:string,value:string}> Font options.
	 */
	public static function get_theme_fonts() {
		$fonts = array();
		if ( class_exists( 'WP_Theme_JSON_Resolver' ) ) {
			$merged = WP_Theme_JSON_Resolver::get_merged_data();
			if ( is_object( $merged ) && method_exists( $merged, 'get_font_families' ) ) {
				foreach ( (array) $merged->get_font_families() as $fam ) {
					if ( ! empty( $fam['name'] ) && ! empty( $fam['fontFamily'] ) ) {
						$fonts[] = array(
							'label' => (string) $fam['name'],
							'value' => (string) $fam['fontFamily'],
						);
					}
				}
			}
		}
		return $fonts;
	}

	/**
	 * Tag toggle bar.
	 *
	 * @since 1.0.0
	 * @param array $config Schema config.
	 * @return string HTML or empty string when no tags exist.
	 */
	private static function render_tags_bar( $config ) {
		$tags = (array) ( $config['tags'] ?? array() );
		if ( ! $tags ) {
			return '';
		}
		$html = '<div class="ssb-tags" role="group" aria-label="' . esc_attr__( 'Schema filters', 'stsalv-smart-schema-builder' ) . '">';
		foreach ( $tags as $tag ) {
			if ( ! is_array( $tag ) || empty( $tag['id'] ) ) {
				continue;
			}
			$tag_color = self::sanitize_hex( $tag['color'] ?? '#0f172a', '#0f172a' );

			$tag_label = isset( $tag['label'] ) && is_string( $tag['label'] ) && '' !== $tag['label']
				? $tag['label']
				: (string) ( $tag['id'] ?? '' );

			$html .= '<button type="button" class="ssb-tag" data-tag="' . esc_attr( $tag['id'] ) . '" aria-pressed="false" style="--ssb-tag-color:' . esc_attr( $tag_color ) . '">' . esc_html( $tag_label ) . '</button>';
		}
		$html .= '</div>';
		return $html;
	}

	/**
	 * Download buttons for enabled formats.
	 *
	 * @since 1.0.0
	 * @param array $config Schema config.
	 * @return string HTML or empty string.
	 */
	private static function render_download( $config ) {
		$download = (array) ( $config['download'] ?? array() );
		$buttons  = '';
		foreach ( array( 'pdf', 'png', 'json' ) as $format ) {
			$row = (array) ( $download[ $format ] ?? array() );
			if ( empty( $row['enabled'] ) ) {
				continue;
			}
			$color       = self::sanitize_hex( $row['color'] ?? '#1a4fa0', '#1a4fa0' );
			$large       = 'large' === ( $row['iconSize'] ?? 'standard' );
			$icon        = self::render_icon(
				$row['icon'] ?? array(
					'type'  => 'builtin',
					'value' => 'download',
				),
				'ssb-download-icon' . ( $large ? ' ssb-download-icon--large' : '' )
			);
			$hover       = trim( (string) ( $row['hoverColor'] ?? '' ) );
			$hover_style = '' !== $hover ? ';--ssb-btn-hover:' . self::sanitize_hex( $hover, '#1a4fa0' ) : '';

			$buttons .= '<button type="button" class="ssb-download-btn" data-format="' . esc_attr( $format ) . '" style="--ssb-btn-color:' . esc_attr( $color ) . $hover_style . '">' . $icon . '<span class="ssb-download-label">' . esc_html( (string) ( $row['label'] ?? '' ) ) . '</span></button>';
		}
		return $buttons ? '<div class="ssb-download">' . $buttons . '</div>' : '';
	}

	/**
	 * Sequence layout: item cards in a row with arrows between them.
	 *
	 * @since 1.0.0
	 * @param array $block     Block entity.
	 * @param int   $number    Numbering counter (by reference).
	 * @param bool  $numbering Whether numbering is enabled.
	 * @return string HTML.
	 */
	private static function render_sequence( $block, &$number, $numbering ) {
		$cards = array();
		foreach ( (array) ( $block['groups'] ?? array() ) as $group ) {
			$show_short = ! empty( $group['showShortDesc'] );
			foreach ( (array) ( $group['items'] ?? array() ) as $item ) {
				$cards[] = self::render_card( $item, $number, $numbering, $show_short );
			}
		}
		if ( ! $cards ) {
			return '';
		}
		$arrow = '<span class="ssb-arrow" aria-hidden="true">' . SSB_Icons::svg( 'arrowRight', 'ssb-arrow-icon' ) . '</span>';
		return '<div class="ssb-sequence">' . implode( $arrow, $cards ) . '</div>';
	}

	/**
	 * Columns layout: groups rendered as colored columns.
	 *
	 * @since 1.0.0
	 * @param array $block     Block entity.
	 * @param int   $number    Numbering counter (by reference).
	 * @param bool  $numbering Whether numbering is enabled.
	 * @return string HTML.
	 */
	private static function render_columns( $block, &$number, $numbering ) {
		$cols = array();
		foreach ( (array) ( $block['groups'] ?? array() ) as $group ) {
			$show_short = ! empty( $group['showShortDesc'] );
			$cards      = '';
			foreach ( (array) ( $group['items'] ?? array() ) as $item ) {
				$cards .= self::render_card( $item, $number, $numbering, $show_short );
			}
			$head   = '<header class="ssb-group-head">' . self::render_icon( $group['icon'] ?? null, 'ssb-group-icon' ) . '<h4 class="ssb-group-title">' . esc_html( (string) ( $group['title'] ?? '' ) ) . '</h4></header>';
			$cols[] = '<section class="ssb-group" ' . self::color_vars( $group['color'] ?? '#64748b' ) . '>' . $head . $cards . '</section>';
		}
		return $cols ? '<div class="ssb-columns">' . implode( '', $cols ) . '</div>' : '';
	}

	/**
	 * Hub layout: vertical stack, first card accented.
	 *
	 * @since 1.0.0
	 * @param array $block     Block entity.
	 * @param int   $number    Numbering counter (by reference).
	 * @param bool  $numbering Whether numbering is enabled.
	 * @return string HTML.
	 */
	private static function render_hub( $block, &$number, $numbering ) {
		$cols        = array();
		$first_group = true;
		foreach ( (array) ( $block['groups'] ?? array() ) as $group ) {
			$show_short     = ! empty( $group['showShortDesc'] );
			$cards          = '';
			$first_in_group = true;
			foreach ( (array) ( $group['items'] ?? array() ) as $item ) {
				$extra          = ( $first_group && $first_in_group ) ? 'ssb-card--accent' : '';
				$cards         .= self::render_card( $item, $number, $numbering, $show_short, $extra );
				$first_in_group = false;
			}
			if ( '' === $cards ) {
				continue;
			}
			$gtitle      = (string) ( $group['title'] ?? '' );
			$gicon       = self::render_icon( $group['icon'] ?? null, 'ssb-group-icon' );
			$head        = ( $gicon || '' !== trim( $gtitle ) )
				? '<header class="ssb-group-head">' . $gicon . ( '' !== trim( $gtitle ) ? '<h4 class="ssb-group-title">' . esc_html( $gtitle ) . '</h4>' : '' ) . '</header>'
				: '';
			$cols[]      = '<section class="ssb-hub-col" ' . self::color_vars( $group['color'] ?? '#64748b' ) . '>' . $head . $cards . '</section>';
			$first_group = false;
		}
		return $cols ? '<div class="ssb-hub">' . implode( '', $cols ) . '</div>' : '';
	}

	/**
	 * Panel layout: compact colored panels per group.
	 *
	 * @since 1.0.0
	 * @param array $block     Block entity.
	 * @param int   $number    Numbering counter (by reference).
	 * @param bool  $numbering Whether numbering is enabled.
	 * @return string HTML.
	 */
	private static function render_panel( $block, &$number, $numbering ) {
		$panels = array();
		foreach ( (array) ( $block['groups'] ?? array() ) as $group ) {
			$show_short = ! empty( $group['showShortDesc'] );
			$cards      = '';
			foreach ( (array) ( $group['items'] ?? array() ) as $item ) {
				$cards .= self::render_card( $item, $number, $numbering, $show_short );
			}
			$head     = '<div class="ssb-panel-head">' . self::render_icon( $group['icon'] ?? null, 'ssb-group-icon' ) . '<h4 class="ssb-group-title">' . esc_html( (string) ( $group['title'] ?? '' ) ) . '</h4></div>';
			$panels[] = '<aside class="ssb-panel" ' . self::color_vars( $group['color'] ?? '#64748b' ) . '>' . $head . $cards . '</aside>';
		}
		return $panels ? '<div class="ssb-panels">' . implode( '', $panels ) . '</div>' : '';
	}

	/**
	 * Separator layout: repeating icon lines around the block title.
	 * Falls back to a dashed line when no icon is configured.
	 *
	 * @since 1.0.0
	 * @param array $block Block entity.
	 * @return string HTML.
	 */
	private static function render_separator( $block ) {
		$color      = self::sanitize_hex( $block['color'] ?? '#64748b', '#64748b' );
		$line_class = 'ssb-sep-line';
		$line_style = '';
		$icon       = $block['icon'] ?? null;
		$uri        = '';
		if ( is_array( $icon ) && 'builtin' === ( $icon['type'] ?? '' ) && ! empty( $icon['value'] ) ) {
			$uri = SSB_Icons::data_uri( (string) $icon['value'], $color );
		} elseif ( is_array( $icon ) && 'media' === ( $icon['type'] ?? '' ) ) {
			$uri = (string) ( $icon['url'] ?? wp_get_attachment_image_url( (int) ( $icon['value'] ?? 0 ), 'full' ) );
		}
		if ( $uri ) {
			$line_style = ' style="' . esc_attr( "background-image:url('$uri')" ) . '"';
		} else {
			$line_class .= ' ssb-sep-line--dashed';
		}
		$title = (string) ( $block['title'] ?? '' );
		$line  = '<span class="' . esc_attr( $line_class ) . '" aria-hidden="true"' . $line_style . '></span>';
		return '<div class="ssb-sep" style="--ssb-sep-color:' . esc_attr( $color ) . '">' . $line . ( '' !== trim( $title ) ? '<span class="ssb-sep-title">' . esc_html( $title ) . '</span>' : '' ) . $line . '</div>';
	}

	/**
	 * Single item card.
	 *
	 * @since 1.0.0
	 * @param array  $item       Item entity.
	 * @param int    $number     Numbering counter (by reference).
	 * @param bool   $numbering  Whether numbering is enabled.
	 * @param bool   $show_short Whether short descriptions are visible.
	 * @param string $extra      Additional CSS class.
	 * @return string HTML.
	 */
	private static function render_card( $item, &$number, $numbering, $show_short, $extra = '' ) {
		$tags      = array_map( 'strval', (array) ( $item['tags'] ?? array() ) );
		$full      = (string) ( $item['full'] ?? '' );
		$clickable = '' !== trim( wp_strip_all_tags( $full ) );

		// Item-level colors: background and text from the palette presets.
		$bg_raw = trim( (string) ( $item['bg'] ?? '' ) );
		$fg_raw = trim( (string) ( $item['fg'] ?? '' ) );
		$bg     = '' !== $bg_raw ? self::sanitize_hex( $bg_raw, '#ffffff' ) : '';
		$fg     = '' !== $fg_raw ? self::sanitize_hex( $fg_raw, '#1e293b' ) : '';

		// An explicit background wins over the automatic hub accent.
		if ( $bg && false !== strpos( $extra, 'ssb-card--accent' ) ) {
			$extra = trim( str_replace( 'ssb-card--accent', '', $extra ) );
		}

		$style       = '';
		$icon_bg_raw = trim( (string) ( $item['iconBg'] ?? '' ) );
		$icon_bg     = '' !== $icon_bg_raw ? self::sanitize_hex( $icon_bg_raw, '#ffffff' ) : '';
		$dark_bg     = $bg && self::is_dark( $bg );

		if ( $bg ) {
			$style .= '--ssb-card-bg:' . $bg . ';';
		}
		// Dark item backgrounds automatically switch text to white and add a
		// dimmed variant for the short description, mirroring group tints.
		if ( $dark_bg ) {
			$style .= '--ssb-card-fg:#ffffff;--ssb-card-fg-muted:rgba(255,255,255,.75);';
		}
		if ( $fg ) {
			$style .= '--ssb-icon-ink:' . $fg . ';';
		} elseif ( $dark_bg ) {
			$style .= '--ssb-icon-ink:#ffffff;';
		}
		if ( $icon_bg ) {
			$style .= '--ssb-icon-tile:' . $icon_bg . ';';
		} elseif ( $fg ) {
			$style .= '--ssb-icon-tile:' . self::mix( $fg, $bg ? $bg : '#ffffff', 0.88 ) . ';';
		} elseif ( $dark_bg ) {
			$style .= '--ssb-icon-tile:rgba(255,255,255,.18);';
		}

		$icon_html = '';
		$icon      = $item['icon'] ?? null;
		if ( $icon ) {
			$isize     = (string) ( $item['iconSize'] ?? 'standard' );
			$isize     = in_array( $isize, array( 'small', 'standard', 'large' ), true ) ? $isize : 'standard';
			$icon_html = '<span class="ssb-card-icon ssb-card-icon--' . esc_attr( $isize ) . '">' . self::render_icon( $icon, 'ssb-card-icon-svg' ) . '</span>';
		}

		$classes = 'ssb-card' . ( $clickable ? ' ssb-card--clickable' : '' ) . ( $extra ? ' ' . $extra : '' );

		$html  = '<div class="' . esc_attr( $classes ) . '" data-tags="' . esc_attr( implode( ' ', $tags ) ) . '"'
			. ( $style ? ' style="' . esc_attr( $style ) . '"' : '' )
			. ( $clickable ? ' tabindex="0" role="button"' : '' ) . '>';
		$html .= $numbering ? '<span class="ssb-num">' . (int) $number . '</span>' : '';
		++$number;
		$html .= $icon_html;
		$html .= '<div class="ssb-card-body">';
		$html .= '<p class="ssb-card-title">' . esc_html( (string) ( $item['title'] ?? '' ) ) . '</p>';
		if ( $show_short && '' !== trim( (string) ( $item['short'] ?? '' ) ) ) {
			$html .= '<p class="ssb-card-short">' . esc_html( (string) $item['short'] ) . '</p>';
		}
		if ( $clickable ) {
			$html .= '<div class="ssb-card-full" hidden>' . self::sanitize_full( $full ) . '</div>';
		}
		$html .= '</div></div>';
		return $html;
	}

	/**
	 * Sanitize the full description for output.
	 *
	 * Plain text (no HTML tags) is escaped and keeps its line breaks,
	 * so quotes, dashes and newlines can never be parsed as markup.
	 * Real HTML passes through wp_kses_post() as before.
	 *
	 * @since 1.0.0
	 * @param string $full Raw full description.
	 * @return string Safe HTML.
	 */
	private static function sanitize_full( $full ) {
		$trimmed = trim( (string) $full );
		if ( '' === $trimmed ) {
			return '';
		}
		if ( ! preg_match( '/<[a-z\/!][^>]*>/i', $trimmed ) ) {
			return nl2br( esc_html( $trimmed ) );
		}
		return wp_kses_post( $trimmed );
	}

	/**
	 * Signature footer with variable substitution.
	 *
	 * @since 1.0.0
	 * @param array  $config     Schema config.
	 * @param object $post       Schema post.
	 * @param int    $item_count Total item count.
	 * @param string $title      Schema title.
	 * @return string HTML or empty string.
	 */
	private static function render_footer( $config, $post, $item_count, $title ) {
		$footer = (array) ( $config['footer'] ?? array() );
		$left   = self::substitute( (string) ( $footer['left'] ?? '' ), $post, $item_count, $title );
		$right  = self::substitute( (string) ( $footer['right'] ?? '' ), $post, $item_count, $title );
		if ( '' === trim( $left ) && '' === trim( $right ) ) {
			return '';
		}
		return '<div class="ssb-footer">'
			. '<span class="ssb-footer-left">' . esc_html( $left ) . '</span>'
			. '<span class="ssb-footer-right">' . esc_html( $right ) . '</span>'
			. '</div>';
	}

	/**
	 * Replace signature variables (%dd %mm %yyyy %yy %cnt %title).
	 *
	 * @since 1.0.0
	 * @param string $text       Raw text.
	 * @param object $post       Schema post (publication date source).
	 * @param int    $item_count Total item count.
	 * @param string $title      Schema title.
	 * @return string Substituted text.
	 */
	private static function substitute( $text, $post, $item_count, $title ) {
		if ( '' === $text ) {
			return '';
		}
		$ts = (int) get_post_time( 'U', true, $post );
		if ( ! $ts ) {
			$ts = time();
		}
		return strtr(
			$text,
			array(
				'%dd'    => gmdate( 'd', $ts ),
				'%mm'    => gmdate( 'm', $ts ),
				'%yyyy'  => gmdate( 'Y', $ts ),
				'%yy'    => gmdate( 'y', $ts ),
				'%cnt'   => (string) $item_count,
				'%title' => $title,
			)
		);
	}

	/**
	 * Render an icon object (builtin or media) to markup.
	 *
	 * @since 1.0.0
	 * @param mixed  $icon  Icon value: object, legacy string or null.
	 * @param string $css_class CSS class.
	 * @return string HTML or empty string.
	 */
	private static function render_icon( $icon, $css_class = 'ssb-icon' ) {
		if ( is_string( $icon ) ) {
			return $icon ? SSB_Icons::svg( $icon, $css_class ) : '';
		}
		if ( ! is_array( $icon ) ) {
			return '';
		}
		if ( 'builtin' === ( $icon['type'] ?? '' ) ) {
			return SSB_Icons::svg( (string) ( $icon['value'] ?? '' ), $css_class );
		}
		if ( 'media' === ( $icon['type'] ?? '' ) ) {
			$inline = self::get_inline_svg( (int) ( $icon['value'] ?? 0 ), $css_class );
			if ( '' !== $inline ) {
				return $inline;
			}
			$url = $icon['url'] ?? wp_get_attachment_image_url( (int) ( $icon['value'] ?? 0 ), 'thumbnail' );
			return $url ? '<img class="' . esc_attr( $css_class ) . '" src="' . esc_url( $url ) . '" alt="" />' : '';
		}
		return '';
	}

	/**
	 * Read an SVG attachment and return sanitized inline SVG markup.
	 *
	 * Only image/svg+xml attachments are inlined; the SVG root receives the
	 * requested CSS class so it can be recolored via currentColor.
	 *
	 * @since 1.0.0
	 * @param int    $attachment_id Attachment post ID.
	 * @param string $css_class         CSS class for the svg root.
	 * @return string Inline SVG or empty string on failure.
	 */
	private static function get_inline_svg( $attachment_id, $css_class ) {
		if ( ! $attachment_id || 'image/svg+xml' !== get_post_mime_type( $attachment_id ) ) {
			return '';
		}
		$file = get_attached_file( $attachment_id );
		if ( ! $file || ! is_readable( $file ) ) {
			return '';
		}
		$raw = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( ! is_string( $raw ) || strlen( $raw ) > 200000 ) {
			return '';
		}
		$raw   = preg_replace( '/<!--.*?-->/s', '', $raw );
		$raw   = preg_replace( '/<\?xml[^>]*\?>/i', '', $raw );
		$raw   = preg_replace( '/<!DOCTYPE[^>]*>/i', '', $raw );
		$clean = wp_kses( $raw, self::svg_kses_allowed() );
		if ( false === stripos( $clean, '<svg' ) ) {
			return '';
		}
		$clean = preg_replace( '/\sclass="[^"]*"/i', '', $clean, 1 );
		// Drop root width/height so CSS controls the icon size, keeping viewBox.
		$clean = preg_replace_callback(
			'/<svg[^>]*>/i',
			static function ( $matches ) {
				return preg_replace( '/\s(width|height)="[^"]*"/i', '', $matches[0] );
			},
			$clean,
			1
		);
		$clean = preg_replace( '/<svg/i', '<svg class="' . esc_attr( $css_class ) . '" aria-hidden="true"', $clean, 1 );
		return $clean;
	}

	/**
	 * KSES rules for inlined SVG icons (scripts and handlers are stripped).
	 *
	 * @since 1.0.0
	 * @return array<string,array<string,bool>> Allowed tags and attributes.
	 */
	private static function svg_kses_allowed() {
		// Attribute names are lowercased by wp_kses(), so camelCase keys
		// (viewBox, preserveAspectRatio) must be listed in lowercase.
		$attrs = array(
			'fill'                => true,
			'fill-opacity'        => true,
			'fill-rule'           => true,
			'stroke'              => true,
			'stroke-opacity'      => true,
			'stroke-width'        => true,
			'stroke-linecap'      => true,
			'stroke-linejoin'     => true,
			'stroke-dasharray'    => true,
			'stroke-miterlimit'   => true,
			'opacity'             => true,
			'd'                   => true,
			'viewbox'             => true,
			'preserveaspectratio' => true,
			'transform'           => true,
			'clip-path'           => true,
			'clip-rule'           => true,
			'points'              => true,
			'cx'                  => true,
			'cy'                  => true,
			'r'                   => true,
			'rx'                  => true,
			'ry'                  => true,
			'x'                   => true,
			'y'                   => true,
			'width'               => true,
			'height'              => true,
			'style'               => true,
		);
		return array(
			'svg'      => $attrs,
			'path'     => $attrs,
			'g'        => $attrs,
			'defs'     => $attrs,
			'clippath' => $attrs,
			'circle'   => $attrs,
			'rect'     => $attrs,
			'ellipse'  => $attrs,
			'line'     => $attrs,
			'polyline' => $attrs,
			'polygon'  => $attrs,
		);
	}



	/**
	 * Inline CSS custom properties for a group accent color.
	 *
	 * @since 1.0.0
	 * @param string $color Accent hex color.
	 * @return string style attribute.
	 */
	private static function color_vars( $color ) {
		$accent = self::sanitize_hex( $color, '#64748b' );
		return 'style="--ssb-accent:' . esc_attr( $accent )
			. ';--ssb-soft:' . esc_attr( self::mix( $accent, '#ffffff', 0.85 ) )
			. ';--ssb-tint:' . esc_attr( self::mix( $accent, '#ffffff', 0.94 ) )
			. ';--ssb-bord:' . esc_attr( self::mix( $accent, '#ffffff', 0.70 ) ) . '"';
	}

	/**
	 * Normalize a color string to #rrggbb.
	 *
	 * @since 1.0.0
	 * @param mixed  $color    Raw color.
	 * @param string $fallback Fallback hex.
	 * @return string Hex color.
	 */
	private static function sanitize_hex( $color, $fallback ) {
		$color = trim( (string) $color );
		if ( preg_match( '/^#[0-9a-fA-F]{6}$/', $color ) ) {
			return strtolower( $color );
		}
		if ( preg_match( '/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/', $color, $m ) ) {
			return '#' . strtolower( $m[1] . $m[1] . $m[2] . $m[2] . $m[3] . $m[3] );
		}
		return $fallback;
	}

	/**
	 * Mix two hex colors.
	 *
	 * @since 1.0.0
	 * @param string $hex_a   First color.
	 * @param string $hex_b   Second color.
	 * @param float  $weight_b Weight of the second color (0..1).
	 * @return string Mixed hex color.
	 */
	private static function mix( $hex_a, $hex_b, $weight_b ) {
		$a   = self::hex_to_rgb( $hex_a );
		$b   = self::hex_to_rgb( $hex_b );
		$out = '#';
		for ( $i = 0; $i < 3; $i++ ) {
			$v    = (int) round( $a[ $i ] * ( 1 - $weight_b ) + $b[ $i ] * $weight_b );
			$out .= str_pad( dechex( $v ), 2, '0', STR_PAD_LEFT );
		}
		return $out;
	}

	/**
	 * Convert hex color to RGB array.
	 *
	 * @since 1.0.0
	 * @param string $hex Hex color.
	 * @return array<int,int> RGB channels.
	 */
	private static function hex_to_rgb( $hex ) {
		$hex = ltrim( (string) $hex, '#' );
		return array(
			(int) hexdec( substr( $hex, 0, 2 ) ),
			(int) hexdec( substr( $hex, 2, 2 ) ),
			(int) hexdec( substr( $hex, 4, 2 ) ),
		);
	}
}
