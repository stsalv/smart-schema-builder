=== StSalv Smart Schema Builder ===
Contributors: stsalv
Tags: schema, diagram, map, workflow, visualization
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Build, manage and publish interactive role/process schema maps with filters, modal descriptions and PDF/PNG/JSON exports.

== Description ==

StSalv Smart Schema Builder turns structured role/process maps into responsive, interactive pages. Configure blocks, groups, items, tags and print forms in a React-based admin, insert schemas with a Gutenberg block, shortcode or template tag, and let visitors explore the map with AND-logic tag filters, deep-linkable state and accessible modals.

= Core features =

* Structured editor: blocks (sequence, columns, hub, panel, separator), groups, items, tags, per-item icons/colors, auto numbering.
* Layout presets with container-query responsiveness and a media-query fallback for older browsers.
* Tag filters with AND-logic, URL state (shareable links), aria-live announcements and print-aware highlighting.
* Accessible modal with full descriptions, focus trap, ESC/backdrop close and correct wheel scrolling (Lenis-safe).
* Print forms: PDF (landscape/portrait, multi-page slicing, appendix pages with role descriptions) and PNG (2x), built client-side with jsPDF and html-to-image; JSON export via public REST endpoint.
* Gutenberg block with live server-side preview, plus `[stsalv_smart_schema id="…"]` shortcode and `stssb_schema( $id )` template tag.
* Per-schema statistics: modal opens and downloads by format, admin table with manual edit and reset.
* Capabilities: `stssb_edit_schemas`, `stssb_manage_settings`; drafts are never exposed to guests.

= Privacy =

The plugin stores aggregate per-schema counters (modal opens, downloads) in post meta. No personal data, cookies or external requests are involved. Front-end downloads are generated locally in the visitor's browser.

= Source code =

The source code and build tools for this plugin are publicly available on GitHub:
https://github.com/stsalv/smart-schema-builder

The repository includes the unminified source (`src/`), the build configuration
(`webpack.config.js`, `package.json`) and instructions for regenerating the
compiled assets (`build/`) with `npm install && npm run build`.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/` or install via Plugins → Add New.
2. Activate StSalv Smart Schema Builder.
3. Go to Smart Schemas → Add New, configure the map and Publish.
4. Insert it with the Smart Schema block, `[stsalv_smart_schema id="123"]` or `stssb_schema( 123 )`.

== Screenshots ==

1. Schema list in admin dashboard with status indicators
2. Schema editor — General tab
3. Blocks editor with columns layout
3. Front-end rendering with tag filters
4. Modal dialog with full description
5. PDF export (landscape, multi-page)

== Frequently Asked Questions ==

= Where are PDF/PNG files generated? =
In the visitor's browser (jsPDF + html-to-image). Nothing is stored on the server.

= Can guests download drafts? =
No. Drafts render only for logged-in users with `stssb_edit_schemas`; public endpoints return 404 for them.

= My theme fonts look wrong in exports =
Exports embed computed styles; use web-safe fonts or self-hosted fonts with CORS enabled.

== Changelog ==

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.0 =
Initial release.