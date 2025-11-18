export type TileShapeId = '1x1' | '2x1' | '1x2' | '2x2';

export type TileShape = {
  id: TileShapeId;
  width: number;
  height: number;
  weight: number;
  description: string;
};

export type GridConfig = {
  mobileColumns: number;
  tabletColumns: number;
  desktopColumns: number;
  minTileSizePx: number;
  gapPx: number;
};

export type PlacementRules = {
  startPosition: {
    row: number;
    col: number;
  };
  fallbackStrategy: 'degrade' | 'skip';
  degradeOrder: TileShapeId[];
  avoidAdjacent2x2: boolean;
  alternateOrientation: boolean;
};

export type ImportanceModifier = {
  preferredShapes: TileShapeId[];
  weightMultiplier: number;
};

export type TilingRules = {
  gridConfig: GridConfig;
  tileShapes: TileShape[];
  placementRules: PlacementRules;
  importanceModifiers: {
    breakingNews: ImportanceModifier;
    featured: ImportanceModifier;
    evergreen: ImportanceModifier;
  };
};

export type Position = {
  row: number;
  col: number;
};

export type PlacedTile = {
  id: string;
  shape: TileShape;
  position: Position;
  articleIndex: number;
};

export type MosaicGrid = {
  columns: number;
  tiles: PlacedTile[];
  occupiedCells: Set<string>;
};
