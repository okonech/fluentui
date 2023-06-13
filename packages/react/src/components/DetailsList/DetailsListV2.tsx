export { DetailsListV2 as DetailsListV2_unstable };

import * as React from 'react';
import { styled } from '../../Utilities';
import { DetailsListBaseV2 } from './DetailsListV2.base';
import { getDetailsListStyles } from './DetailsList.styles';
import type { IDetailsListProps, IDetailsListStyleProps, IDetailsListStyles } from './DetailsList.types';

/**
 * NOTE: DetailsListV2 is "unstable" and meant for preview use. It passes
 * the same test suite as DetailsList but it is an entirely new implementation
 * so it may have bugs and implementation details may change without notice.
 *
 * DetailsListV2 is an API-compatible replacement for DetailsList with a new implementation
 * that addresses performance issues DetailsList has with rerenders under certain
 * conditions.
 */
export const DetailsListV2: React.FunctionComponent<IDetailsListProps> = styled<
  IDetailsListProps,
  IDetailsListStyleProps,
  IDetailsListStyles
>(DetailsListBaseV2, getDetailsListStyles, undefined, {
  scope: 'DetailsListV2',
});

DetailsListV2.displayName = 'DetailsListV2_unstable';

export type { IDetailsListProps };
