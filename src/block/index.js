/**
 * Smart Schema block: editor UI with live server-side preview.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, Placeholder, SelectControl } from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { __, sprintf } from '@wordpress/i18n';
import './editor.css';

/**
 * Block name must match the PHP registration.
 *
 * @since 1.0.0
 * @type {string}
 */
const BLOCK_NAME = 'ssb/schema';

registerBlockType( BLOCK_NAME, {
	edit: ( { attributes, setAttributes } ) => {
		const blockProps = useBlockProps();
		const schemaId = attributes.schemaId || 0;
		const data = window.ssbBlockEditor || { schemas: [] };

		const options = [
			{ value: '0', label: __('— Select a schema —', 'stsalv-smart-schema-builder') },
			...data.schemas.map( ( s ) => ( {
				value: String( s.id ),
				label:
					'draft' === s.status
						
						? // translators: %s: schema title; used in the Gutenberg block selector.
						 sprintf( __('%s (draft)', 'stsalv-smart-schema-builder'), s.title )
						: s.title,
			} ) ),
		];

		return (
			<>
				<InspectorControls>
					<PanelBody title={ __('Schema', 'stsalv-smart-schema-builder') }>
						<SelectControl
							label={ __('Schema to render', 'stsalv-smart-schema-builder') }
							value={ String( schemaId ) }
							options={ options }
							onChange={ ( next ) =>
								setAttributes( { schemaId: parseInt( next, 10 ) || 0 } )
							}
						/>
						<p className="description">
							{ __('Schemas are managed under Smart Schemas in the admin menu.', 'stsalv-smart-schema-builder') }
						</p>
					</PanelBody>
				</InspectorControls>
				<div { ...blockProps }>
					{ ! schemaId ? (
						<Placeholder
							icon="networking"
							label={ __('Smart Schema', 'stsalv-smart-schema-builder') }
							instructions={ __('Choose a schema in the block settings on the right.', 'stsalv-smart-schema-builder') }
						/>
					) : (
						<ServerSideRender
							block={ BLOCK_NAME }
							attributes={ attributes }
							EmptyResponsePlaceholder={ () => (
								<Placeholder
									icon="networking"
									label={ __('Smart Schema', 'stsalv-smart-schema-builder') }
									instructions={ __('The schema rendered empty: it is a draft or its config is damaged.', 'stsalv-smart-schema-builder') }
								/>
							) }
						/>
					) }
				</div>
			</>
		);
	},
	save: () => null,
} );