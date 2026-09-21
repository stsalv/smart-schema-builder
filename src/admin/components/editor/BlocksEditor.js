/**
 * Editor tab: blocks, groups and items constructor.
 *
 * @package SmartSchemaBuilder
 * @since   1.0.0
 */
import { useState } from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	RadioControl,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createBlock, createGroup, createItem, LAYOUTS, move } from '../../utils/schema-helpers';
import IconPicker from './IconPicker';
import ColorField from './ColorField';

/**
 * Up/down reorder buttons.
 *
 * @since 1.0.0
 * @param {Object}   props         Component props.
 * @param {Function} props.onUp    Move up callback.
 * @param {Function} props.onDown  Move down callback.
 * @param {boolean}  props.isFirst Disables the up button.
 * @param {boolean}  props.isLast  Disables the down button.
 * @return {Element} Buttons group.
 */
const MoveButtons = ( { onUp, onDown, isFirst, isLast } ) => (
	<span className="ssb-move">
		<Button icon="arrow-up-alt2" label={ __('Move up', 'stsalv-smart-schema-builder') } disabled={ isFirst } onClick={ onUp } isSmall />
		<Button icon="arrow-down-alt2" label={ __('Move down', 'stsalv-smart-schema-builder') } disabled={ isLast } onClick={ onDown } isSmall />
	</span>
);

/**
 * Icon size presets for item cards.
 *
 * @since 1.0.0
 * @type {Array<{value: string, label: string}>}
 */
const ICON_SIZES = [
	{ value: 'small', label: __('Small', 'stsalv-smart-schema-builder') },
	{ value: 'standard', label: __('Standard', 'stsalv-smart-schema-builder') },
	{ value: 'large', label: __('Large', 'stsalv-smart-schema-builder') },
];

/**
 * Single item editor card.
 *
 * @since 1.0.0
 * @param {Object}   props          Component props.
 * @param {Object}   props.item     Item entity.
 * @param {Array}    props.tags     Available tags.
 * @param {Function} props.onPatch  Patch callback (partial item).
 * @param {Function} props.onMove   Move callback (direction).
 * @param {Function} props.onRemove Remove callback.
 * @param {boolean}  props.isFirst  Disables the up button.
 * @param {boolean}  props.isLast   Disables the down button.
 * @return {Element} Card element.
 */
const ItemCard = ( { item, tags, onPatch, onMove, onRemove, isFirst, isLast } ) => {
	const [ showDetails, setDetails ] = useState( false );

	return (
		<div className="ssb-item-card">
			<div className="ssb-item-card__row">
				<TextControl
					className="ssb-input--wide"
					label={ __('Item title', 'stsalv-smart-schema-builder') }
					hideLabelFromVision
					placeholder={ __('Item title', 'stsalv-smart-schema-builder') }
					value={ item.title }
					onChange={ ( next ) => onPatch( { title: next } ) }
				/>
				<MoveButtons onUp={ () => onMove( -1 ) } onDown={ () => onMove( 1 ) } isFirst={ isFirst } isLast={ isLast } />
				<Button variant="tertiary" isDestructive onClick={ onRemove }>
					{ __('Delete', 'stsalv-smart-schema-builder') }
				</Button>
			</div>
			<TextControl
				label={ __('Short description', 'stsalv-smart-schema-builder') }
				value={ item.short || '' }
				onChange={ ( next ) => onPatch( { short: next } ) }
			/>
			<Button variant="link" onClick={ () => setDetails( ( prev ) => ! prev ) }>
				{ showDetails
					? __('Hide full description and tags', 'stsalv-smart-schema-builder')
					: __('Full description and tags', 'stsalv-smart-schema-builder') }
			</Button>
			{ showDetails && (
				<>
					<TextareaControl
						label={ __('Full description (HTML allowed)', 'stsalv-smart-schema-builder') }
						value={ item.full || '' }
						onChange={ ( next ) => onPatch( { full: next } ) }
					/>
					<div className="ssb-item-settings">
						<div className="ssb-item-settings__col">
							<IconPicker
								label={ __('Item icon', 'stsalv-smart-schema-builder') }
								value={ item.icon }
								onChange={ ( next ) => onPatch( { icon: next } ) }
							/>
							<RadioControl
								label={ __('Icon size', 'stsalv-smart-schema-builder') }
								selected={ item.iconSize || 'standard' }
								options={ ICON_SIZES }
								onChange={ ( next ) => onPatch( { iconSize: next } ) }
							/>
							<ColorField
								label={ __('Background color', 'stsalv-smart-schema-builder') }
								value={ item.bg || '#ffffff' }
								onChange={ ( next ) => onPatch( { bg: next } ) }
							/>
							<fieldset className="ssb-fieldset">
								<legend>{ __('Tags', 'stsalv-smart-schema-builder') }</legend>
								{ 0 === tags.length && (
									<p className="description">
										{ __('No tags yet. Create them in the Tags tab.', 'stsalv-smart-schema-builder') }
									</p>
								) }
								{ tags.map( ( tag ) => (
									<CheckboxControl
										key={ tag.id }
										label={ tag.label || tag.id }
										checked={ ( item.tags || [] ).includes( tag.id ) }
										onChange={ ( checked ) =>
											onPatch( {
												tags: checked
													? [ ...( item.tags || [] ), tag.id ]
													: ( item.tags || [] ).filter( ( id ) => id !== tag.id ),
											} )
										}
									/>
								) ) }
							</fieldset>
						</div>
						<div className="ssb-item-settings__col">
							<ColorField
								label={ __('Icon text color', 'stsalv-smart-schema-builder') }
								value={ item.fg || '#1e293b' }
								onChange={ ( next ) => onPatch( { fg: next } ) }
							/>
							<ColorField
								label={ __('Icon background color', 'stsalv-smart-schema-builder') }
								value={ item.iconBg || '#ffffff' }
								onChange={ ( next ) => onPatch( { iconBg: next } ) }
							/>
						</div>
					</div>
				</>
			) }
		</div>
	);
};

/**
 * Single group editor card.
 *
 * Layout: controls stack on the left, reorder and delete on the right,
 * items list spans the full card width below.
 *
 * @since 1.0.0
 * @param {Object}   props          Component props.
 * @param {Object}   props.group    Group entity.
 * @param {Array}    props.tags     Available tags.
 * @param {Function} props.onPatch  Patch callback (partial group).
 * @param {Function} props.onMove   Move callback (direction).
 * @param {Function} props.onRemove Remove callback.
 * @param {boolean}  props.isFirst  Disables the up button.
 * @param {boolean}  props.isLast   Disables the down button.
 * @return {Element} Card element.
 */
const GroupCard = ( { group, tags, onPatch, onMove, onRemove, isFirst, isLast } ) => (
	<div className="ssb-group-card" style={ { borderLeftColor: group.color } }>
		<div className="ssb-group-card__top">
			<div className="ssb-group-card__controls">
				<ColorField
					label={ __('Group color', 'stsalv-smart-schema-builder') }
					value={ group.color }
					onChange={ ( next ) => onPatch( { color: next } ) }
				/>
				<TextControl
					label={ __('Group title', 'stsalv-smart-schema-builder') }
					value={ group.title }
					onChange={ ( next ) => onPatch( { title: next } ) }
				/>
				<IconPicker
					label={ __('Group icon', 'stsalv-smart-schema-builder') }
					value={ group.icon }
					onChange={ ( next ) => onPatch( { icon: next } ) }
				/>
				<ToggleControl
					label={ __('Show short descriptions', 'stsalv-smart-schema-builder') }
					checked={ !! group.showShortDesc }
					onChange={ ( next ) => onPatch( { showShortDesc: next } ) }
				/>
			</div>
			<div className="ssb-group-card__side">
				<MoveButtons onUp={ () => onMove( -1 ) } onDown={ () => onMove( 1 ) } isFirst={ isFirst } isLast={ isLast } />
				<Button variant="tertiary" isDestructive onClick={ onRemove }>
					{ __('Delete group', 'stsalv-smart-schema-builder') }
				</Button>
			</div>
		</div>
		<div className="ssb-group-card__items">
			{ ( group.items || [] ).map( ( item, itemIndex ) => (
				<ItemCard
					key={ item.id }
					item={ item }
					tags={ tags }
					isFirst={ 0 === itemIndex }
					isLast={ itemIndex === ( group.items || [] ).length - 1 }
					onPatch={ ( patch ) =>
						onPatch( {
							items: group.items.map( ( it, i ) => ( i === itemIndex ? { ...it, ...patch } : it ) ),
						} )
					}
					onMove={ ( dir ) => onPatch( { items: move( group.items, itemIndex, dir ) } ) }
					onRemove={ () => onPatch( { items: group.items.filter( ( _, i ) => i !== itemIndex ) } ) }
				/>
			) ) }
			<Button
				variant="secondary"
				isSmall
				onClick={ () => onPatch( { items: [ ...( group.items || [] ), createItem() ] } ) }
			>
				{ __('Add item', 'stsalv-smart-schema-builder') }
			</Button>
		</div>
	</div>
);

/**
 * Blocks constructor: the whole blocks/groups/items tree.
 *
 * @since 1.0.0
 * @param {Object}   props          Component props.
 * @param {Array}    props.blocks   Blocks array.
 * @param {Array}    props.tags     Available tags.
 * @param {Function} props.onChange Change callback (next blocks array).
 * @return {Element} Constructor element.
 */
const BlocksEditor = ( { blocks, tags, onChange } ) => {
	/**
	 * Patch a single block.
	 *
	 * @since 1.0.0
	 * @param {number} index Block index.
	 * @param {Object} patch Partial block data.
	 * @return {void}
	 */
	const patchBlock = ( index, patch ) =>
		onChange( blocks.map( ( block, i ) => ( i === index ? { ...block, ...patch } : block ) ) );

	return (
		<div className="ssb-blocks">
			{ blocks.map( ( block, blockIndex ) => (
				<section className="ssb-block-card" key={ block.id }>
					<header className="ssb-block-card__head">
						<TextControl
							className="ssb-input--wide"
							label={ __('Block name', 'stsalv-smart-schema-builder') }
							placeholder={ __('Block name, e.g. Commercial parties', 'stsalv-smart-schema-builder') }
							value={ block.title }
							onChange={ ( next ) => patchBlock( blockIndex, { title: next } ) }
						/>
						<SelectControl
							label={ __('Layout', 'stsalv-smart-schema-builder') }
							value={ block.layout }
							options={ LAYOUTS }
							onChange={ ( next ) => patchBlock( blockIndex, { layout: next } ) }
						/>
						<MoveButtons
							onUp={ () => onChange( move( blocks, blockIndex, -1 ) ) }
							onDown={ () => onChange( move( blocks, blockIndex, 1 ) ) }
							isFirst={ 0 === blockIndex }
							isLast={ blockIndex === blocks.length - 1 }
						/>
						<Button
							variant="tertiary"
							isDestructive
							onClick={ () => onChange( blocks.filter( ( _, i ) => i !== blockIndex ) ) }
						>
							{ __('Delete block', 'stsalv-smart-schema-builder') }
						</Button>
					</header>
					{ 'separator' === block.layout ? (
						<div className="ssb-block-card__separator">
							<IconPicker
								label={ __('Separator icon', 'stsalv-smart-schema-builder') }
								value={ block.icon }
								onChange={ ( next ) => patchBlock( blockIndex, { icon: next } ) }
							/>
							<ColorField
								label={ __('Separator color', 'stsalv-smart-schema-builder') }
								value={ block.color || '#64748b' }
								onChange={ ( next ) => patchBlock( blockIndex, { color: next } ) }
							/>
							<p className="description">
								{ __('The separator repeats its icon across the full container width. Groups and items are not used for this layout.', 'stsalv-smart-schema-builder') }
							</p>
						</div>
					) : (
						<div className="ssb-block-card__groups">
							{ ( block.groups || [] ).map( ( group, groupIndex ) => (
								<GroupCard
									key={ group.id }
									group={ group }
									tags={ tags }
									isFirst={ 0 === groupIndex }
									isLast={ groupIndex === ( block.groups || [] ).length - 1 }
									onPatch={ ( patch ) =>
										patchBlock( blockIndex, {
											groups: block.groups.map( ( g, i ) => ( i === groupIndex ? { ...g, ...patch } : g ) ),
										} )
									}
									onMove={ ( dir ) =>
										patchBlock( blockIndex, { groups: move( block.groups, groupIndex, dir ) } )
									}
									onRemove={ () =>
										patchBlock( blockIndex, {
											groups: block.groups.filter( ( _, i ) => i !== groupIndex ),
										} )
									}
								/>
							) ) }
							<Button
								variant="secondary"
								isSmall
								onClick={ () => patchBlock( blockIndex, { groups: [ ...( block.groups || [] ), createGroup() ] } ) }
							>
								{ __('Add group', 'stsalv-smart-schema-builder') }
							</Button>
						</div>
					) }
				</section>
			) ) }
			<Button variant="primary" onClick={ () => onChange( [ ...blocks, createBlock() ] ) }>
				{ __('Add block', 'stsalv-smart-schema-builder') }
			</Button>
		</div>
	);
};

export default BlocksEditor;