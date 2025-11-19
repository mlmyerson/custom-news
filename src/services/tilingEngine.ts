import type { TileShape, TileShapeId, TilingRules, Position, PlacedTile, MosaicGrid } from '../types/tile';
import tilingRulesJson from '../config/tilingRules.json';

/**
 * Load tiling rules from JSON configuration
 */
export const loadTilingRules = (): TilingRules => {
  return tilingRulesJson as TilingRules;
};

/**
 * Generate a unique key for a grid cell position
 */
const cellKey = (row: number, col: number): string => `${row},${col}`;

/**
 * Check if a tile shape can fit at the given position in the grid
 */
const canFitTile = (
  shape: TileShape,
  position: Position,
  grid: MosaicGrid,
  occupiedCells: Set<string>
): boolean => {
  const { row, col } = position;
  const { width, height } = shape;

  // Check if tile would exceed grid columns
  if (col + width > grid.columns) {
    return false;
  }

  // Check if all required cells are empty
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      if (occupiedCells.has(cellKey(r, c))) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Mark cells as occupied by a tile
 */
const occupyCells = (
  shape: TileShape,
  position: Position,
  occupiedCells: Set<string>
): void => {
  const { row, col } = position;
  const { width, height } = shape;

  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      occupiedCells.add(cellKey(r, c));
    }
  }
};

/**
 * Check if a 2x2 tile would be adjacent to another 2x2 tile
 */
const isAdjacent2x2 = (
  position: Position,
  tiles: PlacedTile[]
): boolean => {
  const { row, col } = position;
  
  for (const tile of tiles) {
    if (tile.shape.id !== '2x2') continue;
    
    const tileRow = tile.position.row;
    const tileCol = tile.position.col;
    
    // Check if tiles are horizontally or vertically adjacent
    const horizontallyAdjacent = 
      (row === tileRow && (col === tileCol + 2 || col + 2 === tileCol));
    const verticallyAdjacent = 
      (col === tileCol && (row === tileRow + 2 || row + 2 === tileRow));
    
    if (horizontallyAdjacent || verticallyAdjacent) {
      return true;
    }
  }
  
  return false;
};

/**
 * Select a tile shape based on weighted probabilities
 */
const selectTileShape = (
  shapes: TileShape[],
  position: Position,
  grid: MosaicGrid,
  rules: TilingRules
): TileShape | null => {
  // Calculate total weight
  const totalWeight = shapes.reduce((sum, shape) => sum + shape.weight, 0);
  
  // Generate random value
  const random = Math.random() * totalWeight;
  
  // Select shape based on weight
  let accumulated = 0;
  for (const shape of shapes) {
    accumulated += shape.weight;
    if (random <= accumulated) {
      // Check if shape can fit
      if (canFitTile(shape, position, grid, grid.occupiedCells)) {
        // Additional check for 2x2 adjacency rule
        if (shape.id === '2x2' && rules.placementRules.avoidAdjacent2x2) {
          if (isAdjacent2x2(position, grid.tiles)) {
            continue; // Skip this shape
          }
        }
        return shape;
      }
      // Shape was selected but doesn't fit, exit selection
      break;
    }
  }
  
  return null;
};

/**
 * Try to place a tile using the degradation strategy
 */
const tryPlaceWithDegradation = (
  position: Position,
  grid: MosaicGrid,
  rules: TilingRules
): TileShape | null => {
  const { degradeOrder } = rules.placementRules;
  
  for (const shapeId of degradeOrder) {
    const shape = rules.tileShapes.find(s => s.id === shapeId);
    if (!shape) continue;
    
    if (canFitTile(shape, position, grid, grid.occupiedCells)) {
      // Additional check for 2x2 adjacency rule
      if (shape.id === '2x2' && rules.placementRules.avoidAdjacent2x2) {
        if (isAdjacent2x2(position, grid.tiles)) {
          continue;
        }
      }
      return shape;
    }
  }
  
  return null;
};

// Maximum rows to search when looking for empty cells (prevents infinite loops in edge cases)
const MAX_SEARCH_ROWS = 100;

/**
 * Find the next empty cell in the grid
 */
const findNextEmptyCell = (
  startRow: number,
  startCol: number,
  grid: MosaicGrid
): Position | null => {
  let row = startRow;
  let col = startCol;
  
  // Search for next empty cell
  while (true) {
    // Check if current cell is empty
    if (!grid.occupiedCells.has(cellKey(row, col))) {
      return { row, col };
    }
    
    // Move to next cell
    col++;
    if (col >= grid.columns) {
      col = 0;
      row++;
    }
    
    // If we've searched too many rows without finding space, stop
    if (row > startRow + MAX_SEARCH_ROWS) {
      return null;
    }
  }
};

/**
 * Generate a mosaic layout for the given number of articles
 */
export const generateMosaic = (
  articleCount: number,
  columns: number = 4,
  rulesOverride?: Partial<TilingRules>
): MosaicGrid => {
  const baseRules = loadTilingRules();
  const rules = rulesOverride 
    ? {
        ...baseRules,
        ...rulesOverride,
        gridConfig: { ...baseRules.gridConfig, ...rulesOverride.gridConfig },
        placementRules: { ...baseRules.placementRules, ...rulesOverride.placementRules },
        importanceModifiers: { ...baseRules.importanceModifiers, ...rulesOverride.importanceModifiers },
      }
    : baseRules;
  
  const grid: MosaicGrid = {
    columns,
    tiles: [],
    occupiedCells: new Set<string>(),
  };
  
  let currentRow = rules.placementRules.startPosition.row;
  let currentCol = rules.placementRules.startPosition.col;
  let articlesPlaced = 0;
  
  while (articlesPlaced < articleCount) {
    // Find next empty cell
    const position = findNextEmptyCell(currentRow, currentCol, grid);
    if (!position) {
      break; // No more space available
    }
    
    currentRow = position.row;
    currentCol = position.col;
    
    // Try to select and place a tile
    let selectedShape = selectTileShape(rules.tileShapes, position, grid, rules);
    
    // If no shape selected, try degradation strategy
    if (!selectedShape && rules.placementRules.fallbackStrategy === 'degrade') {
      selectedShape = tryPlaceWithDegradation(position, grid, rules);
    }
    
    // Place the tile if we found a valid shape
    if (selectedShape) {
      const tile: PlacedTile = {
        id: `tile-${articlesPlaced}`,
        shape: selectedShape,
        position: { row: currentRow, col: currentCol },
        articleIndex: articlesPlaced,
      };
      
      grid.tiles.push(tile);
      occupyCells(selectedShape, position, grid.occupiedCells);
      articlesPlaced++;
    }
    
    // Move to next column
    currentCol++;
    if (currentCol >= grid.columns) {
      currentCol = 0;
      currentRow++;
    }
  }
  
  return grid;
};

/**
 * Calculate the pixel dimensions for a tile based on grid configuration
 */
export const calculateTileDimensions = (
  shape: TileShape,
  rules: TilingRules,
  columns: number,
  containerWidth: number
): { width: number; height: number } => {
  const { minTileSizePx, gapPx } = rules.gridConfig;
  
  // Calculate base tile size
  const totalGaps = (columns - 1) * gapPx;
  const availableWidth = containerWidth - totalGaps;
  const baseTileSize = Math.max(minTileSizePx, availableWidth / columns);
  
  // Calculate tile dimensions
  const width = baseTileSize * shape.width + (shape.width - 1) * gapPx;
  const height = baseTileSize * shape.height + (shape.height - 1) * gapPx;
  
  return { width, height };
};
