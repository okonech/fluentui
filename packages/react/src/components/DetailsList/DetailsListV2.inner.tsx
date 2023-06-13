import * as React from 'react';

import { FocusRects, KeyCodes, getRTLSafeKeyCode, classNamesFunction, memoizeFunction } from '../../Utilities';
import {
  CheckboxVisibility,
  ColumnActionsMode,
  ConstrainMode,
  DetailsListLayoutMode,
  ColumnDragEndLocation,
} from '../DetailsList/DetailsListV2.types';
import { DetailsHeader } from '../DetailsList/DetailsHeader';
import { SelectAllVisibility } from '../DetailsList/DetailsHeader.types';
import { DetailsRowBase } from '../DetailsList/DetailsRow.base';
import { FocusZone, FocusZoneDirection } from '../../FocusZone';
import { SelectionMode, SelectionZone } from '../../Selection';

import { DragDropHelper } from '../../DragDrop';
import { GroupedList } from '../../GroupedList';
import { List } from '../../List';
import { GetGroupCount } from '../../utilities/groupedList/GroupedListUtility';
import { DEFAULT_CELL_STYLE_PROPS } from './DetailsRow.styles';
// For every group level there is a GroupSpacer added. Importing this const to have the source value in one place.
import { composeComponentAs, composeRenderFunction, getId } from '@fluentui/utilities';
import { useConst } from '@fluentui/react-hooks';
import type { IRenderFunction } from '../../Utilities';
import type {
  IColumn,
  IDetailsListProps,
  IDetailsListStyles,
  IDetailsListStyleProps,
} from '../DetailsList/DetailsListV2.types';
import type {
  IDetailsHeader,
  IDetailsHeaderProps,
  IColumnReorderHeaderProps,
} from '../DetailsList/DetailsHeader.types';
import type { IDetailsFooterProps } from '../DetailsList/DetailsFooter.types';
import type { IDetailsRowProps } from '../DetailsList/DetailsRow.types';
import type { IFocusZone, IFocusZoneProps } from '../../FocusZone';
import type { ISelection } from '../../Selection';
import type { IGroupedList, IGroupDividerProps, IGroupRenderProps, IGroup } from '../../GroupedList';
import type { IListProps } from '../../List';

const getClassNames = classNamesFunction<IDetailsListStyleProps, IDetailsListStyles>();

export interface IDetailsListState {
  focusedItemIndex: number;
  lastWidth?: number;
  lastSelectionMode?: SelectionMode;
  adjustedColumns: IColumn[];
  isCollapsed?: boolean;
  isSizing?: boolean;
  isSomeGroupExpanded?: boolean;
  /**
   * A unique object used to force-update the List when it changes.
   */
  version: {};
  getDerivedStateFromProps(nextProps: IDetailsListProps, previousState: IDetailsListState): IDetailsListState;
}

const MIN_COLUMN_WIDTH = 100; // this is the global min width

const DEFAULT_RENDERED_WINDOWS_AHEAD = 2;
const DEFAULT_RENDERED_WINDOWS_BEHIND = 2;

type IDetailsListInnerProps = Omit<IDetailsListProps, 'selection'> &
  IDetailsListState & {
    selection: ISelection;
    dragDropHelper: DragDropHelper | undefined;
    rootRef: React.RefObject<HTMLDivElement>;
    listRef: React.RefObject<List>;
    groupedListRef: React.RefObject<IGroupedList>;
    focusZoneRef: React.RefObject<IFocusZone>;
    headerRef: React.RefObject<IDetailsHeader>;
    selectionZoneRef: React.RefObject<SelectionZone>;
    onGroupExpandStateChanged: (isSomeGroupExpanded: boolean) => void;
    onColumnIsSizingChanged: (column: IColumn, isSizing: boolean) => void;
    onRowDidMount: (row: DetailsRowBase) => void;
    onRowWillUnmount: (row: DetailsRowBase) => void;
    onColumnResized: (resizingColumn: IColumn, newWidth: number, resizingColumnIndex: number) => void;
    onColumnAutoResized: (column: IColumn, columnIndex: number) => void;
    onToggleCollapse: (collapsed: boolean) => void;
    onActiveRowChanged: (el?: HTMLElement, ev?: React.FocusEvent<HTMLElement>) => void;
    onBlur: (event: React.FocusEvent<HTMLElement>) => void;
    onRenderDefaultRow: (detailsRowProps: IDetailsRowProps) => JSX.Element;
  };

/**
 * Hooks-based implementation of DetailsList.
 * Since many existing consumers of DetailsList expect `ref` to return a `DetailsList`,
 * this inner component handles rendering while the outer maintains compatibility.
 */
export const DetailsListInnerV2: React.ComponentType<IDetailsListInnerProps> = (
  props: IDetailsListInnerProps,
): JSX.Element | null => {
  const { selection } = props;

  const {
    ariaLabelForListHeader,
    ariaLabelForSelectAllCheckbox,
    ariaLabelForSelectionColumn,
    className,
    checkboxVisibility,
    compact,
    constrainMode,
    dragDropEvents,
    groups,
    groupProps,
    indentWidth,
    items,
    isPlaceholderData,
    isHeaderVisible,
    layoutMode,
    onItemInvoked,
    onItemContextMenu,
    onColumnHeaderClick,
    onColumnHeaderContextMenu,
    selectionMode = selection.mode,
    selectionPreservedOnEmptyClick,
    selectionZoneProps,
    // eslint-disable-next-line deprecation/deprecation
    ariaLabel,
    ariaLabelForGrid,
    rowElementEventMap,
    // eslint-disable-next-line deprecation/deprecation
    shouldApplyApplicationRole = false,
    getKey,
    listProps,
    usePageCache,
    onShouldVirtualize,
    viewport,
    minimumPixelsForDrag,
    getGroupHeight,
    styles,
    theme,
    cellStyleProps = DEFAULT_CELL_STYLE_PROPS,
    onRenderCheckbox,
    useFastIcons,
    dragDropHelper,
    adjustedColumns,
    isCollapsed,
    isSizing,
    isSomeGroupExpanded,
    version,
    rootRef,
    listRef,
    focusZoneRef,
    columnReorderOptions,
    groupedListRef,
    headerRef,
    onGroupExpandStateChanged,
    onColumnIsSizingChanged,
    onRowDidMount,
    onRowWillUnmount,
    disableSelectionZone,
    isSelectedOnFocus = true,
    onColumnResized,
    onColumnAutoResized,
    onToggleCollapse,
    onActiveRowChanged,
    onBlur,
    rowElementEventMap: eventsToRegister,
    onRenderMissingItem,
    onRenderItemColumn,
    onRenderField,
    getCellValueKey,
    getRowAriaLabel,
    getRowAriaDescribedBy,
    checkButtonAriaLabel,
    checkButtonGroupAriaLabel,
    checkboxCellClassName,
    useReducedRowRenderer,
    enableUpdateAnimations,
    enterModalSelectionOnTouch,
    onRenderDefaultRow,
    selectionZoneRef,
    focusZoneProps,
  } = props;

  const defaultRole = 'grid';
  const role = props.role ? props.role : defaultRole;

  const rowId = getId('row');

  const groupNestingDepth = getGroupNestingDepth(groups);
  const groupedDetailsListIndexMap = useGroupedDetailsListIndexMap(groups);

  const additionalListProps = React.useMemo((): IListProps => {
    return {
      renderedWindowsAhead: isSizing ? 0 : DEFAULT_RENDERED_WINDOWS_AHEAD,
      renderedWindowsBehind: isSizing ? 0 : DEFAULT_RENDERED_WINDOWS_BEHIND,
      getKey,
      version,
      ...listProps,
    };
  }, [isSizing, getKey, version, listProps]);

  let selectAllVisibility = SelectAllVisibility.none; // for SelectionMode.none
  if (selectionMode === SelectionMode.single) {
    selectAllVisibility = SelectAllVisibility.hidden;
  }
  if (selectionMode === SelectionMode.multiple) {
    // if isCollapsedGroupSelectVisible is false, disable select all when the list has all collapsed groups
    let isCollapsedGroupSelectVisible =
      groupProps && groupProps.headerProps && groupProps.headerProps.isCollapsedGroupSelectVisible;
    if (isCollapsedGroupSelectVisible === undefined) {
      isCollapsedGroupSelectVisible = true;
    }
    const isSelectAllVisible = isCollapsedGroupSelectVisible || !groups || isSomeGroupExpanded;
    selectAllVisibility = isSelectAllVisible ? SelectAllVisibility.visible : SelectAllVisibility.hidden;
  }

  if (checkboxVisibility === CheckboxVisibility.hidden) {
    selectAllVisibility = SelectAllVisibility.none;
  }

  const defaultOnRenderDetailsHeader = React.useCallback(
    (detailsHeaderProps: IDetailsHeaderProps): JSX.Element | null => {
      return <DetailsHeader {...detailsHeaderProps} />;
    },
    [],
  );

  const defaultOnRenderDetailsFooter = React.useCallback((): JSX.Element | null => {
    return null;
  }, []);

  const propsOnRenderDetailsHeader = props.onRenderDetailsHeader;

  const onRenderDetailsHeader = React.useMemo(() => {
    return propsOnRenderDetailsHeader
      ? composeRenderFunction(propsOnRenderDetailsHeader, defaultOnRenderDetailsHeader)
      : defaultOnRenderDetailsHeader;
  }, [propsOnRenderDetailsHeader, defaultOnRenderDetailsHeader]);

  const propsOnRenderDetailsFooter = props.onRenderDetailsFooter;

  const onRenderDetailsFooter = React.useMemo(() => {
    return propsOnRenderDetailsFooter
      ? composeRenderFunction(propsOnRenderDetailsFooter, defaultOnRenderDetailsFooter)
      : defaultOnRenderDetailsFooter;
  }, [propsOnRenderDetailsFooter, defaultOnRenderDetailsFooter]);

  const detailsFooterProps = React.useMemo((): IDetailsFooterProps => {
    return {
      columns: adjustedColumns,
      groupNestingDepth,
      selection,
      selectionMode,
      viewport,
      checkboxVisibility,
      indentWidth,
      cellStyleProps,
    };
  }, [
    adjustedColumns,
    groupNestingDepth,
    selection,
    selectionMode,
    viewport,
    checkboxVisibility,
    indentWidth,
    cellStyleProps,
  ]);

  const columnReorderOnDragEnd = columnReorderOptions && columnReorderOptions.onDragEnd;

  const onColumnDragEnd = React.useCallback(
    (
      {
        dropLocation,
      }: {
        dropLocation?: ColumnDragEndLocation;
      },
      event: MouseEvent,
    ): void => {
      let finalDropLocation: ColumnDragEndLocation = ColumnDragEndLocation.outside;
      if (columnReorderOnDragEnd) {
        if (dropLocation && dropLocation !== ColumnDragEndLocation.header) {
          finalDropLocation = dropLocation;
        } else if (rootRef.current) {
          const clientRect = rootRef.current.getBoundingClientRect();
          if (
            event.clientX > clientRect.left &&
            event.clientX < clientRect.right &&
            event.clientY > clientRect.top &&
            event.clientY < clientRect.bottom
          ) {
            finalDropLocation = ColumnDragEndLocation.surface;
          }
        }
        columnReorderOnDragEnd(finalDropLocation);
      }
    },
    [columnReorderOnDragEnd, rootRef],
  );

  const columnReorderProps = React.useMemo((): IColumnReorderHeaderProps | undefined => {
    if (columnReorderOptions) {
      return {
        ...columnReorderOptions,
        onColumnDragEnd,
      };
    }
  }, [columnReorderOptions, onColumnDragEnd]);

  const rowCount =
    (isHeaderVisible ? 1 : 0) +
    (props.onRenderDetailsFooter ? 1 : 0) +
    GetGroupCount(groups) +
    (items ? items.length : 0);
  const colCount =
    (selectAllVisibility !== SelectAllVisibility.none ? 1 : 0) +
    (adjustedColumns ? adjustedColumns.length : 0) +
    (groups ? 1 : 0);

  const classNames = React.useMemo(() => {
    return getClassNames(styles, {
      theme: theme!,
      compact,
      isFixed: layoutMode === DetailsListLayoutMode.fixedColumns,
      isHorizontalConstrained: constrainMode === ConstrainMode.horizontalConstrained,
      className,
    });
  }, [styles, theme, compact, layoutMode, constrainMode, className]);

  const onRenderDetailsGroupFooter = groupProps && groupProps.onRenderFooter;

  const finalOnRenderDetailsGroupFooter = React.useMemo(() => {
    return onRenderDetailsGroupFooter
      ? (groupFooterProps: IGroupDividerProps, defaultRender?: IRenderFunction<IGroupDividerProps>) => {
          return onRenderDetailsGroupFooter(
            {
              ...groupFooterProps,
              columns: adjustedColumns,
              groupNestingDepth,
              indentWidth,
              selection,
              selectionMode,
              viewport,
              checkboxVisibility,
              cellStyleProps,
            },
            defaultRender,
          );
        }
      : undefined;
  }, [
    onRenderDetailsGroupFooter,
    adjustedColumns,
    groupNestingDepth,
    indentWidth,
    selection,
    selectionMode,
    viewport,
    checkboxVisibility,
    cellStyleProps,
  ]);

  const onRenderDetailsGroupHeader = groupProps && groupProps.onRenderHeader;

  const finalOnRenderDetailsGroupHeader = React.useMemo(() => {
    return onRenderDetailsGroupHeader
      ? (groupHeaderProps: IGroupDividerProps, defaultRender?: IRenderFunction<IGroupDividerProps>) => {
          const { groupIndex } = groupHeaderProps;
          const groupKey: string | undefined =
            groupIndex !== undefined ? groupHeaderProps.groups?.[groupIndex]?.key : undefined;
          const totalRowCount: number =
            groupKey !== undefined && groupedDetailsListIndexMap[groupKey]
              ? groupedDetailsListIndexMap[groupKey].totalRowCount
              : 0;

          return onRenderDetailsGroupHeader(
            {
              ...groupHeaderProps,
              columns: adjustedColumns,
              groupNestingDepth,
              indentWidth,
              selection,
              selectionMode: checkboxVisibility !== CheckboxVisibility.hidden ? selectionMode : SelectionMode.none,
              viewport,
              checkboxVisibility,
              cellStyleProps,
              ariaColSpan: adjustedColumns.length,
              ariaLevel: undefined,
              ariaPosInSet: undefined,
              ariaSetSize: undefined,
              ariaRowCount: undefined,
              ariaRowIndex: groupIndex !== undefined ? totalRowCount + (isHeaderVisible ? 1 : 0) : undefined,
            },
            defaultRender,
          );
        }
      : (groupHeaderProps: IGroupDividerProps, defaultRender: IRenderFunction<IGroupDividerProps>) => {
          const { groupIndex } = groupHeaderProps;
          const groupKey: string | undefined =
            groupIndex !== undefined ? groupHeaderProps.groups?.[groupIndex]?.key : undefined;
          const totalRowCount: number =
            groupKey !== undefined && groupedDetailsListIndexMap[groupKey]
              ? groupedDetailsListIndexMap[groupKey].totalRowCount
              : 0;

          return defaultRender({
            ...groupHeaderProps,
            ariaColSpan: adjustedColumns.length,
            ariaLevel: undefined,
            ariaPosInSet: undefined,
            ariaSetSize: undefined,
            ariaRowCount: undefined,
            ariaRowIndex: groupIndex !== undefined ? totalRowCount + (isHeaderVisible ? 1 : 0) : undefined,
          });
        };
  }, [
    onRenderDetailsGroupHeader,
    adjustedColumns,
    groupNestingDepth,
    indentWidth,
    isHeaderVisible,
    selection,
    selectionMode,
    viewport,
    checkboxVisibility,
    cellStyleProps,
    groupedDetailsListIndexMap,
  ]);

  const finalGroupProps = React.useMemo((): IGroupRenderProps | undefined => {
    return {
      ...groupProps,
      role: role === defaultRole ? 'rowgroup' : 'presentation',
      onRenderFooter: finalOnRenderDetailsGroupFooter,
      onRenderHeader: finalOnRenderDetailsGroupHeader,
      // pass through custom group header checkbox label
      headerProps: {
        ...groupProps?.headerProps,
        selectAllButtonProps: {
          'aria-label': checkButtonGroupAriaLabel,
          ...groupProps?.headerProps?.selectAllButtonProps,
        },
      },
    };
  }, [groupProps, finalOnRenderDetailsGroupFooter, finalOnRenderDetailsGroupHeader, checkButtonGroupAriaLabel, role]);

  const sumColumnWidths = useConst(() =>
    memoizeFunction((columns: IColumn[]) => {
      let totalWidth: number = 0;

      columns.forEach((column: IColumn) => (totalWidth += column.calculatedWidth || column.minWidth));

      return totalWidth;
    }),
  );

  const collapseAllVisibility = groupProps && groupProps.collapseAllVisibility;

  const rowWidth = React.useMemo(() => {
    return sumColumnWidths(adjustedColumns);
  }, [adjustedColumns, sumColumnWidths]);

  const onRenderCell = React.useCallback(
    (nestingDepth: number, item: any, index: number, group?: IGroup): React.ReactNode => {
      const finalOnRenderRow = props.onRenderRow
        ? composeRenderFunction(props.onRenderRow, onRenderDefaultRow)
        : onRenderDefaultRow;

      const groupKey: string | undefined = group ? group.key : undefined;
      const numOfGroupHeadersBeforeItem: number =
        groupKey && groupedDetailsListIndexMap[groupKey]
          ? groupedDetailsListIndexMap[groupKey].numOfGroupHeadersBeforeItem
          : 0;

      const rowRole = role === defaultRole ? undefined : 'presentation';

      // add tabindex="0" to first row if no header exists, to ensure the focuszone is in the tab order
      const rowFocusZoneProps = isHeaderVisible || index > 0 ? {} : { tabIndex: 0 };

      const rowProps: IDetailsRowProps = {
        item,
        itemIndex: index,
        flatIndexOffset: (isHeaderVisible ? 2 : 1) + numOfGroupHeadersBeforeItem,
        compact,
        columns: adjustedColumns,
        groupNestingDepth: nestingDepth,
        id: `${rowId}-${index}`,
        selectionMode,
        selection,
        onDidMount: onRowDidMount,
        onWillUnmount: onRowWillUnmount,
        onRenderItemColumn,
        onRenderField,
        getCellValueKey,
        eventsToRegister,
        dragDropEvents,
        dragDropHelper,
        viewport,
        checkboxVisibility,
        collapseAllVisibility,
        getRowAriaLabel,
        getRowAriaDescribedBy,
        checkButtonAriaLabel,
        checkboxCellClassName,
        useReducedRowRenderer,
        indentWidth,
        cellStyleProps,
        onRenderDetailsCheckbox: onRenderCheckbox,
        enableUpdateAnimations,
        rowWidth,
        useFastIcons,
        role: rowRole,
        isGridRow: true,
        focusZoneProps: rowFocusZoneProps,
      };

      if (!item) {
        if (onRenderMissingItem) {
          return onRenderMissingItem(index, rowProps);
        }

        return null;
      }

      return finalOnRenderRow(rowProps);
    },
    [
      compact,
      adjustedColumns,
      selectionMode,
      selection,
      rowId,
      onRowDidMount,
      onRowWillUnmount,
      onRenderItemColumn,
      onRenderField,
      getCellValueKey,
      eventsToRegister,
      dragDropEvents,
      dragDropHelper,
      viewport,
      checkboxVisibility,
      collapseAllVisibility,
      getRowAriaLabel,
      getRowAriaDescribedBy,
      isHeaderVisible,
      checkButtonAriaLabel,
      checkboxCellClassName,
      useReducedRowRenderer,
      indentWidth,
      cellStyleProps,
      onRenderCheckbox,
      enableUpdateAnimations,
      useFastIcons,
      onRenderDefaultRow,
      onRenderMissingItem,
      props.onRenderRow,
      rowWidth,
      role,
      groupedDetailsListIndexMap,
    ],
  );

  const onRenderListCell = React.useCallback(
    (nestingDepth: number): ((item: any, itemIndex: number) => React.ReactNode) => {
      return (item: any, itemIndex: number): React.ReactNode => {
        return onRenderCell(nestingDepth, item, itemIndex);
      };
    },
    [onRenderCell],
  );

  const isRightArrow = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      // eslint-disable-next-line deprecation/deprecation
      return event.which === getRTLSafeKeyCode(KeyCodes.right, theme);
    },
    [theme],
  );

  const focusZoneInnerProps: IFocusZoneProps = {
    ...focusZoneProps,
    componentRef: focusZoneProps && focusZoneProps.componentRef ? focusZoneProps.componentRef : focusZoneRef,
    className: classNames.focusZone,
    direction: focusZoneProps ? focusZoneProps.direction : FocusZoneDirection.vertical,
    shouldEnterInnerZone:
      focusZoneProps && focusZoneProps.shouldEnterInnerZone ? focusZoneProps.shouldEnterInnerZone : isRightArrow,
    onActiveElementChanged:
      focusZoneProps && focusZoneProps.onActiveElementChanged
        ? focusZoneProps.onActiveElementChanged
        : onActiveRowChanged,
    shouldRaiseClicksOnEnter: false,
    onBlur: focusZoneProps && focusZoneProps.onBlur ? focusZoneProps.onBlur : onBlur,
  };

  const FinalGroupedList =
    groups && groupProps?.groupedListAs ? composeComponentAs(groupProps.groupedListAs, GroupedList) : GroupedList;

  const list = groups ? (
    <FinalGroupedList
      focusZoneProps={focusZoneInnerProps}
      componentRef={groupedListRef}
      groups={groups}
      groupProps={finalGroupProps}
      items={items}
      onRenderCell={onRenderCell}
      role="presentation"
      selection={selection}
      selectionMode={checkboxVisibility !== CheckboxVisibility.hidden ? selectionMode : SelectionMode.none}
      dragDropEvents={dragDropEvents}
      dragDropHelper={dragDropHelper}
      eventsToRegister={rowElementEventMap}
      listProps={additionalListProps}
      onGroupExpandStateChanged={onGroupExpandStateChanged}
      usePageCache={usePageCache}
      onShouldVirtualize={onShouldVirtualize}
      getGroupHeight={getGroupHeight}
      compact={compact}
    />
  ) : (
    <FocusZone {...focusZoneInnerProps}>
      <List
        ref={listRef}
        role="presentation"
        items={items}
        onRenderCell={onRenderListCell(0)}
        usePageCache={usePageCache}
        onShouldVirtualize={onShouldVirtualize}
        {...additionalListProps}
      />
    </FocusZone>
  );

  const onHeaderKeyDown = React.useCallback(
    (ev: React.KeyboardEvent<HTMLElement>): void => {
      // eslint-disable-next-line deprecation/deprecation
      if (ev.which === KeyCodes.down) {
        if (focusZoneRef.current && focusZoneRef.current.focus()) {
          // select the first item in list after down arrow key event
          // only if nothing was selected; otherwise start with the already-selected item
          if (isSelectedOnFocus && selection.getSelectedIndices().length === 0) {
            selection.setIndexSelected(0, true, false);
          }

          ev.preventDefault();
          ev.stopPropagation();
        }
      }
    },
    [selection, focusZoneRef, isSelectedOnFocus],
  );

  const onContentKeyDown = React.useCallback(
    (ev: React.KeyboardEvent<HTMLElement>): void => {
      // eslint-disable-next-line deprecation/deprecation
      if (ev.which === KeyCodes.up && !ev.altKey) {
        if (headerRef.current && headerRef.current.focus()) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      }
    },
    [headerRef],
  );

  return (
    <div
      ref={rootRef}
      className={classNames.root}
      data-automationid="DetailsList"
      data-is-scrollable="false"
      {...(shouldApplyApplicationRole ? { role: 'application' } : {})}
    >
      <FocusRects />
      <div
        role={role}
        // ariaLabel is a legacy prop that used to be applied on the root node, which has poor AT support
        // it is now treated as a fallback to ariaLabelForGrid for legacy support
        aria-label={ariaLabelForGrid || ariaLabel}
        aria-rowcount={isPlaceholderData ? 0 : rowCount}
        aria-colcount={colCount}
        aria-busy={isPlaceholderData}
      >
        <div onKeyDown={onHeaderKeyDown} role="presentation" className={classNames.headerWrapper}>
          {isHeaderVisible &&
            onRenderDetailsHeader(
              {
                componentRef: headerRef,
                selectionMode,
                layoutMode: layoutMode!,
                selection,
                columns: adjustedColumns,
                onColumnClick: onColumnHeaderClick,
                onColumnContextMenu: onColumnHeaderContextMenu,
                onColumnResized,
                onColumnIsSizingChanged,
                onColumnAutoResized,
                groupNestingDepth,
                isAllCollapsed: isCollapsed,
                onToggleCollapseAll: onToggleCollapse,
                ariaLabel: ariaLabelForListHeader,
                ariaLabelForSelectAllCheckbox,
                ariaLabelForSelectionColumn,
                selectAllVisibility,
                collapseAllVisibility: groupProps && groupProps.collapseAllVisibility,
                viewport,
                columnReorderProps,
                minimumPixelsForDrag,
                cellStyleProps,
                checkboxVisibility,
                indentWidth,
                onRenderDetailsCheckbox: onRenderCheckbox,
                rowWidth: sumColumnWidths(adjustedColumns),
                useFastIcons,
              },
              onRenderDetailsHeader,
            )}
        </div>
        <div onKeyDown={onContentKeyDown} role="presentation" className={classNames.contentWrapper}>
          {!disableSelectionZone ? (
            <SelectionZone
              ref={selectionZoneRef}
              selection={selection}
              selectionPreservedOnEmptyClick={selectionPreservedOnEmptyClick}
              selectionMode={selectionMode}
              isSelectedOnFocus={isSelectedOnFocus}
              selectionClearedOnEscapePress={isSelectedOnFocus}
              toggleWithoutModifierPressed={!isSelectedOnFocus}
              onItemInvoked={onItemInvoked}
              onItemContextMenu={onItemContextMenu}
              enterModalOnTouch={enterModalSelectionOnTouch}
              {...(selectionZoneProps || {})}
            >
              {list}
            </SelectionZone>
          ) : (
            list
          )}
        </div>
        {onRenderDetailsFooter({
          ...detailsFooterProps,
        })}
      </div>
    </div>
  );
};

export function buildColumns(
  items: any[],
  canResizeColumns?: boolean,
  onColumnClick?: (ev: React.MouseEvent<HTMLElement>, column: IColumn) => void,
  sortedColumnKey?: string,
  isSortedDescending?: boolean,
  groupedColumnKey?: string,
  isMultiline?: boolean,
  columnActionsMode?: ColumnActionsMode,
) {
  const columns: IColumn[] = [];

  if (items && items.length) {
    const firstItem = items[0];

    for (const propName in firstItem) {
      if (firstItem.hasOwnProperty(propName)) {
        columns.push({
          key: propName,
          name: propName,
          fieldName: propName,
          minWidth: MIN_COLUMN_WIDTH,
          maxWidth: 300,
          isCollapsible: !!columns.length,
          isMultiline: isMultiline === undefined ? false : isMultiline,
          isSorted: sortedColumnKey === propName,
          isSortedDescending: !!isSortedDescending,
          isRowHeader: false,
          columnActionsMode: columnActionsMode ?? ColumnActionsMode.clickable,
          isResizable: canResizeColumns,
          onColumnClick,
          isGrouped: groupedColumnKey === propName,
        });
      }
    }
  }

  return columns;
}

function getGroupNestingDepth(groups: IDetailsListProps['groups']): number {
  let level = 0;
  let groupsInLevel = groups;

  while (groupsInLevel && groupsInLevel.length > 0) {
    level++;
    groupsInLevel = groupsInLevel[0].children;
  }

  return level;
}

interface IGroupedDetailsListIndexMap {
  [key: string]: { numOfGroupHeadersBeforeItem: number; totalRowCount: number };
}

function useGroupedDetailsListIndexMap(groups: IDetailsListProps['groups']) {
  return React.useMemo((): IGroupedDetailsListIndexMap => {
    const indexMap: IGroupedDetailsListIndexMap = {};
    if (groups) {
      let rowCount = 1;
      let numGroupHeaders = 1;
      for (const group of groups) {
        const { key } = group;
        indexMap[key] = { numOfGroupHeadersBeforeItem: numGroupHeaders, totalRowCount: rowCount };
        numGroupHeaders++;
        rowCount += group.count + 1;
      }
    }
    return indexMap;
  }, [groups]);
}
