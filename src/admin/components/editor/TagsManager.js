/**
 * Editor tab: schema tags dictionary.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
import { Button, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { uid } from '../../utils/schema-helpers';
import ColorField from './ColorField';

/**
 * Tags dictionary manager.
 *
 * @since 1.0.0
 * @param {Object}   props          Component props.
 * @param {Array}    props.tags     Current tags array.
 * @param {Function} props.onChange Change callback (next tags array).
 * @return {Element} Manager element.
 */
const TagsManager = ( { tags, onChange } ) => {
	/**
	 * Patch a single tag with a partial update.
	 *
	 * @since 1.0.0
	 * @param {string} id    Tag ID.
	 * @param {Object} patch Partial tag properties to merge.
	 * @return {void}
	 */
	const patchTag = ( id, patch ) =>
		onChange( tags.map( ( tag ) => ( tag.id === id ? { ...tag, ...patch } : tag ) ) );

	/**
	 * Append a new empty tag with default color.
	 *
	 * @since 1.0.0
	 * @return {void}
	 */
	const addTag = () => onChange( [ ...tags, { id: uid( 't' ), label: '', color: '#0f172a' } ] );

	/**
	 * Remove a tag. The parent editor also strips the tag from items.
	 *
	 * @since 1.0.0
	 * @param {string} id Tag ID.
	 * @return {void}
	 */
	const removeTag = ( id ) => onChange( tags.filter( ( tag ) => tag.id !== id ) );

	return (
		<div className="ssb-tags">
			<p className="description">
				{ __('Tags are rendered on the front end as toggle switches. Deleting a tag also removes it from all items.', 'stsalv-smart-schema-builder') }
			</p>
			{ tags.map( ( tag ) => (
				<div className="ssb-tags-row" key={ tag.id }>
					<TextControl
						className="ssb-input--tag"
						label={ __('Tag label', 'stsalv-smart-schema-builder') }
						hideLabelFromVision
						placeholder={ __('Tag label', 'stsalv-smart-schema-builder') }
						value={ 'string' === typeof tag.label ? tag.label : '' }
						onChange={ ( next ) => patchTag( tag.id, { label: next } ) }
					/>
					<ColorField
						label={ __('Tag color', 'stsalv-smart-schema-builder') }
						value={ tag.color || '#0f172a' }
						onChange={ ( next ) => patchTag( tag.id, { color: next } ) }
					/>
					<Button variant="tertiary" isDestructive onClick={ () => removeTag( tag.id ) }>
						{ __('Delete', 'stsalv-smart-schema-builder') }
					</Button>
				</div>
			) ) }
			<Button variant="secondary" onClick={ addTag }>
				{ __('Add tag', 'stsalv-smart-schema-builder') }
			</Button>
		</div>
	);
};

export default TagsManager;