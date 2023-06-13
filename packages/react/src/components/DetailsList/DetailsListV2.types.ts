import * as React from 'react';
import { DetailsListBaseV2 } from './DetailsListV2.base';
import { SelectionMode } from '../../Selection';
import type { ISelection, ISelectionZoneProps } from '../../Selection';
import type { IRefObject, IBaseProps, IRenderFunction, IStyleFunctionOrObject } from '../../Utilities';
import type { IDragDropEvents, IDragDropContext, IDragDropHelper, IDragDropOptions } from '../../DragDrop';
import type { IGroup, IGroupedListProps } from '../GroupedList/index';
import type { IDetailsRowProps, IDetailsRowBaseProps } from './DetailsRow';
import type { IDetailsHeaderProps, IDetailsHeaderBaseProps } from './DetailsHeader';
import type { IDetailsFooterProps, IDetailsFooterBaseProps } from './DetailsFooter.types';
import type { IWithViewportProps, IViewport } from '../../utilities/decorators/withViewport';
import type { IListProps } from '../../List';
import type { ITheme } from '../../Styling';
import type { ICellStyleProps } from './DetailsRow.types';
import type { IDetailsColumnFieldProps } from './DetailsColumn.types';
import { IFocusZoneProps } from '../../FocusZone';
import {
  CheckboxVisibility,
  ConstrainMode,
  DetailsListLayoutMode,
  IColumn,
  IColumnReorderOptions,
  IDetailsGroupRenderProps,
  IDetailsList,
  IDetailsListCheckboxProps,
  IDetailsListStyleProps,
  IDetailsListStyles,
} from './DetailsList.types';

/**
 * {@docCategory DetailsList}
 */
export interface IDetailsListPropsV2 extends IBaseProps<IDetailsList>, IWithViewportProps {
  /** Theme provided by a higher-order component. */
  theme?: ITheme;

  /** Custom overrides to the themed or default styles. */
  styles?: IStyleFunctionOrObject<IDetailsListStyleProps, IDetailsListStyles>;

  /**
   * Callback to access the IDetailsList interface. Use this instead of ref for accessing
   * the public methods and properties of the component.
   */
  componentRef?: IRefObject<IDetailsList>;

  /** A key that uniquely identifies the given items. If provided, the selection will be reset when the key changes. */
  setKey?: string;

  /** The items to render. */
  items: any[];

  /** Set this to true to indicate that the items being displayed are placeholder data. */
  isPlaceholderData?: boolean;

  /** Properties to pass through to the List components being rendered. */
  listProps?: IListProps;

  /** Default index to set focus to once the items have rendered and the index exists. */
  initialFocusedIndex?: number;

  /** Class name to add to the root element. */
  className?: string;

  /** Grouping instructions. */
  groups?: IGroup[];

  /** Override properties to render groups. */
  groupProps?: IDetailsGroupRenderProps;

  /** Override for the indent width used for group nesting. */
  indentWidth?: number;

  /** Selection model to track selection state.  */
  selection?: ISelection;

  /** Controls how/if the details list manages selection. Options include none, single, multiple */
  selectionMode?: SelectionMode;

  /**
   * By default, selection is cleared when clicking on an empty (non-focusable) section of the screen.
   * Setting this value to true overrides that behavior and maintains selection.
   * @defaultvalue false
   **/
  selectionPreservedOnEmptyClick?: boolean;

  /**
   * Additional props to pass through to the SelectionZone created by default.
   */
  selectionZoneProps?: ISelectionZoneProps;

  /** Controls how the columns are adjusted. */
  layoutMode?: DetailsListLayoutMode;

  /**
   * Controls the visibility of selection check box.
   * @defaultvalue CheckboxVisibility.onHover
   */
  checkboxVisibility?: CheckboxVisibility;

  /**
   * Controls the visibility of the header.
   * @defaultvalue true
   */
  isHeaderVisible?: boolean;

  /** Column definitions. If none are provided, default columns will be created based on the items' properties. */
  columns?: IColumn[];

  /** Controls how the list constrains overflow. */
  constrainMode?: ConstrainMode;

  /** Event names and corresponding callbacks that will be registered to rendered row elements. */
  rowElementEventMap?: { eventName: string; callback: (context: IDragDropContext, event?: any) => void }[];

  /** Callback for when the list has been updated. Useful for telemetry tracking externally. */
  onDidUpdate?: (detailsList?: DetailsListBaseV2) => void;

  /**
   * Callback for when a given row has been mounted. Useful for identifying when a row has been rendered on the page.
   */
  onRowDidMount?: (item?: any, index?: number) => void;

  /**
   * Callback for when a given row has been unmounted.
   * Useful for identifying when a row has been removed from the page.
   */
  onRowWillUnmount?: (item?: any, index?: number) => void;

  /** Callback for when the user clicks on the column header. */
  onColumnHeaderClick?: (ev?: React.MouseEvent<HTMLElement>, column?: IColumn) => void;

  /** Callback for when the user asks for a contextual menu (usually via right click) from a column header. */
  onColumnHeaderContextMenu?: (column?: IColumn, ev?: React.MouseEvent<HTMLElement>) => void;

  /** Callback fired on column resize */
  onColumnResize?: (column?: IColumn, newWidth?: number, columnIndex?: number) => void;

  /** Callback for when a given row has been invoked (by pressing enter while it is selected.) */
  onItemInvoked?: (item?: any, index?: number, ev?: Event) => void;

  /**
   * Callback for when the context menu of an item has been accessed.
   * If undefined or false is returned, `ev.preventDefault()` will be called.
   */
  onItemContextMenu?: (item?: any, index?: number, ev?: Event) => void | boolean;

  /**
   * Callback to override the default row rendering.
   */
  onRenderRow?: IRenderFunction<IDetailsRowProps>;

  /**
   * If provided, will be the "default" item column renderer method.
   * This affects cells within the rows, not the rows themselves.
   * If a column definition provides its own `onRender` method, that will be used instead of this.
   */
  onRenderItemColumn?: (item?: any, index?: number, column?: IColumn) => React.ReactNode;

  /**
   * Render function which is composed around rendering every cell.
   */
  onRenderField?: IRenderFunction<IDetailsColumnFieldProps>;

  /**
   * If provided, will be the "default" item column cell value return.
   * A column's `getValueKey` can override `getCellValueKey`.
   */
  getCellValueKey?: (item?: any, index?: number, column?: IColumn) => string;

  /** Map of callback functions related to row drag and drop functionality. */
  dragDropEvents?: IDragDropEvents;

  /** Callback for what to render when the item is missing. */
  onRenderMissingItem?: (index?: number, rowProps?: IDetailsRowProps) => React.ReactNode;

  /** An override to render the details header. */
  onRenderDetailsHeader?: IRenderFunction<IDetailsHeaderProps>;

  /** An override to render the details footer. */
  onRenderDetailsFooter?: IRenderFunction<IDetailsFooterProps>;

  /**  If provided, can be used to render a custom checkbox. */
  onRenderCheckbox?: IRenderFunction<IDetailsListCheckboxProps>;

  /** Viewport info, provided by the `withViewport` decorator. */
  viewport?: IViewport;

  /**
   * Callback for when an item in the list becomes active by clicking anywhere inside the row or navigating to it
   * with the keyboard.
   */
  onActiveItemChanged?: (item?: any, index?: number, ev?: React.FocusEvent<HTMLElement>) => void;

  /** Accessible label for the list header. */
  ariaLabelForListHeader?: string;

  /** Accessible label for the select all checkbox. */
  ariaLabelForSelectAllCheckbox?: string;

  /** Accessible label for the name of the selection column. */
  ariaLabelForSelectionColumn?: string;

  /** Callback to get the aria-label string for a given item. */
  getRowAriaLabel?: (item: any) => string;

  /** Callback to get the aria-describedby IDs (space-separated strings) of elements that describe the item. */
  getRowAriaDescribedBy?: (item: any) => string;

  /**
   * Callback to get the item key, to be used in the selection and on render.
   * Must be provided if sorting or filtering is enabled.
   */
  getKey?: (item: any, index?: number) => string;

  /**
   * Accessible label describing or summarizing the list.
   * @deprecated use `ariaLabelForGrid`
   */
  ariaLabel?: string;

  /** Accessible label for the row check button, e.g. "select row". */
  checkButtonAriaLabel?: string;

  /** Accessible label for the group header check button, e.g. "select section". */
  checkButtonGroupAriaLabel?: string;

  /** Accessible label for the grid within the list. */
  ariaLabelForGrid?: string;

  /** An optional margin for proportional columns, to e.g. account for scrollbars when laying out width. */
  flexMargin?: number;

  /**
   * Whether the role `application` should be applied to the list.
   * @defaultvalue false
   * @deprecated using the application role in this case is an antipattern, and heavily discouraged.
   */
  shouldApplyApplicationRole?: boolean;

  /**
   * The minimum mouse move distance to interpret the action as drag event.
   * @defaultvalue 5
   */
  minimumPixelsForDrag?: number;

  /**
   * Whether to render in compact mode.
   * @defaultvalue false
   */
  compact?: boolean;

  /**
   * Whether to enable render page caching. This is an experimental performance optimization that is off by default.
   * @defaultvalue false
   */
  usePageCache?: boolean;

  /**
   * Callback to determine whether the list should be rendered in full, or virtualized.
   *
   * Virtualization will add and remove pages of items as the user scrolls them into the visible range.
   * This benefits larger list scenarios by reducing the DOM on the screen, but can negatively affect performance
   * for smaller lists.
   *
   * The default implementation will virtualize when this callback is not provided.
   */
  onShouldVirtualize?: (props: IListProps) => boolean;

  /** Class name to add to the cell of a checkbox. */
  checkboxCellClassName?: string;

  /** Whether the selection zone should enter modal state on touch. */
  enterModalSelectionOnTouch?: boolean;

  /** Options for column reordering using drag and drop. */
  columnReorderOptions?: IColumnReorderOptions;

  /** Callback to override default group height calculation used by list virtualization. */
  getGroupHeight?: IGroupedListProps['getGroupHeight'];

  /**
   * Whether to re-render a row only when props changed. Might cause regression when depending on external updates.
   * @defaultvalue false
   */
  useReducedRowRenderer?: boolean;

  /**
   * Props impacting the render style of cells. Since these have an impact on calculated column widths, they are
   * handled separately from normal theme styling, but they are passed to the styling system.
   */
  cellStyleProps?: ICellStyleProps;

  /** Whether to disable the built-in SelectionZone, so the host component can provide its own. */
  disableSelectionZone?: boolean;

  /**
   * Determines if an item is selected on focus.
   *
   * @defaultvalue true
   */
  isSelectedOnFocus?: boolean;

  /** Whether to animate updates */
  enableUpdateAnimations?: boolean;

  /**
   * Whether to use fast icon and check components. The icons can't be targeted by customization
   * but are still customizable via class names.
   * @defaultvalue true
   */
  useFastIcons?: boolean;

  /** Role for the list. */
  role?: string;

  /**
   * Properties to pass through to the FocusZone.
   */
  focusZoneProps?: IFocusZoneProps;
}

export type {
  IDetailsHeaderProps,
  IDetailsRowBaseProps,
  IDetailsHeaderBaseProps,
  IDetailsFooterBaseProps,
  IDragDropContext,
  IDragDropEvents,
  IDragDropHelper,
  IDragDropOptions,
  IViewport,
  IWithViewportProps,
};
