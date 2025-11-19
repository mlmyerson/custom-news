// Minimum tile size for readability of text content (more conservative than the 90px minimum for tap-friendliness in tilingRules.json)
// This ensures adequate space for headlines while the config's minTileSizePx ensures minimum tap target size
export const MIN_READABLE_TILE_PX = 140;

export const calculateReadableColumns = (
  containerWidth: number,
  requestedColumns: number,
  gapPx: number,
  minReadablePx = MIN_READABLE_TILE_PX,
): number => {
  let cols = Math.max(1, requestedColumns);

  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return cols;
  }

  while (cols > 1) {
    const totalGaps = (cols - 1) * gapPx;
    const availableWidth = containerWidth - totalGaps;
    const columnWidth = availableWidth / cols;

    if (columnWidth >= minReadablePx) {
      break;
    }

    cols -= 1;
  }

  return Math.max(1, cols);
};

export const calculateBaseTileSize = (
  containerWidth: number,
  columns: number,
  gapPx: number,
  minReadablePx = MIN_READABLE_TILE_PX,
): number => {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0 || columns <= 0) {
    return minReadablePx;
  }

  const totalGaps = (columns - 1) * gapPx;
  const availableWidth = containerWidth - totalGaps;
  const columnWidth = Math.floor(availableWidth / columns);

  return Math.max(minReadablePx, columnWidth);
};
