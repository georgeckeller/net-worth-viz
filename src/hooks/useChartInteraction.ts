import { useReducer, useCallback } from 'react';

/**
 * Chart interaction state machine.
 *
 * States and transitions:
 *   idle
 *     → categoryHovered   (mouse enters pie/bar/legend)
 *     → categorySelected  (first click on category)
 *
 *   categoryHovered
 *     → idle              (mouse leaves)
 *     → categorySelected  (click)
 *
 *   categorySelected
 *     → categoryDrilled   (second click on same category)
 *     → categorySelected  (click different category)
 *     → idle              (click background)
 *
 *   categoryDrilled
 *     → assetHovered      (mouse enters asset slice/bar)
 *     → assetSelected     (click asset)
 *     → idle              (click background / drill back up)
 *
 *   assetHovered
 *     → categoryDrilled   (mouse leaves asset)
 *     → assetSelected     (click asset)
 *
 *   assetSelected
 *     → assetSelected     (click different asset)
 *     → categoryDrilled   (click background within drill)
 *     → idle              (drill back up)
 */

export interface ChartInteractionState {
  activeIndex: number | null;
  hoveredCategoryKey: string | null;
  selectedCategory: string | null;
  lastClickedCategory: string | null;
  drilledCategory: string | null;
  selectedAsset: { categoryKey: string; assetName: string } | null;
  hoveredAsset: { categoryKey: string; assetName: string } | null;
}

type Action =
  | { type: 'HOVER_CATEGORY'; categoryKey: string; pieIndex: number }
  | { type: 'CLEAR_HOVER' }
  | { type: 'CLICK_CATEGORY'; categoryKey: string; pieIndex: number }
  | { type: 'DRILL_INTO'; categoryKey: string }
  | { type: 'DRILL_BACK' }
  | { type: 'HOVER_ASSET'; categoryKey: string; assetName: string }
  | { type: 'CLEAR_ASSET_HOVER' }
  | { type: 'SELECT_ASSET'; categoryKey: string; assetName: string; pieIndex: number }
  | { type: 'RESET' };

const initialState: ChartInteractionState = {
  activeIndex: null,
  hoveredCategoryKey: null,
  selectedCategory: null,
  lastClickedCategory: null,
  drilledCategory: null,
  selectedAsset: null,
  hoveredAsset: null,
};

function reducer(state: ChartInteractionState, action: Action): ChartInteractionState {
  switch (action.type) {
    case 'HOVER_CATEGORY':
      return {
        ...state,
        hoveredCategoryKey: action.categoryKey,
        activeIndex: action.pieIndex,
      };

    case 'CLEAR_HOVER':
      return {
        ...state,
        hoveredCategoryKey: null,
        hoveredAsset: null,
      };

    case 'CLICK_CATEGORY':
      if (state.lastClickedCategory === action.categoryKey) {
        // Second click → drill down
        return {
          ...state,
          drilledCategory: action.categoryKey,
          activeIndex: null,
          lastClickedCategory: null,
          selectedCategory: null,
          selectedAsset: null,
          hoveredAsset: null,
        };
      }
      // First click → select
      return {
        ...state,
        activeIndex: action.pieIndex,
        lastClickedCategory: action.categoryKey,
        selectedCategory: action.categoryKey,
        selectedAsset: null,
      };

    case 'DRILL_INTO':
      return {
        ...state,
        drilledCategory: action.categoryKey,
        activeIndex: null,
        lastClickedCategory: null,
        selectedCategory: action.categoryKey,
        selectedAsset: null,
        hoveredAsset: null,
      };

    case 'DRILL_BACK':
      return {
        ...state,
        drilledCategory: null,
        activeIndex: null,
        selectedCategory: null,
        lastClickedCategory: null,
        selectedAsset: null,
        hoveredAsset: null,
      };

    case 'HOVER_ASSET':
      return {
        ...state,
        hoveredAsset: { categoryKey: action.categoryKey, assetName: action.assetName },
      };

    case 'CLEAR_ASSET_HOVER':
      return {
        ...state,
        hoveredAsset: null,
      };

    case 'SELECT_ASSET':
      return {
        ...state,
        selectedAsset: { categoryKey: action.categoryKey, assetName: action.assetName },
        activeIndex: action.pieIndex,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useChartInteraction() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const hoverCategory = useCallback((categoryKey: string, pieIndex: number) => {
    dispatch({ type: 'HOVER_CATEGORY', categoryKey, pieIndex });
  }, []);

  const clearHover = useCallback(() => {
    dispatch({ type: 'CLEAR_HOVER' });
  }, []);

  const clickCategory = useCallback((categoryKey: string, pieIndex: number) => {
    dispatch({ type: 'CLICK_CATEGORY', categoryKey, pieIndex });
  }, []);

  const drillInto = useCallback((categoryKey: string) => {
    dispatch({ type: 'DRILL_INTO', categoryKey });
  }, []);

  const drillBack = useCallback(() => {
    dispatch({ type: 'DRILL_BACK' });
  }, []);

  const hoverAsset = useCallback((categoryKey: string, assetName: string) => {
    dispatch({ type: 'HOVER_ASSET', categoryKey, assetName });
  }, []);

  const clearAssetHover = useCallback(() => {
    dispatch({ type: 'CLEAR_ASSET_HOVER' });
  }, []);

  const selectAsset = useCallback((categoryKey: string, assetName: string, pieIndex: number) => {
    dispatch({ type: 'SELECT_ASSET', categoryKey, assetName, pieIndex });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    hoverCategory,
    clearHover,
    clickCategory,
    drillInto,
    drillBack,
    hoverAsset,
    clearAssetHover,
    selectAsset,
    reset,
  };
}
