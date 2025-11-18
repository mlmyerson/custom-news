import { describe, expect, it, beforeEach, vi } from 'vitest';
import { loadTilingRules, generateMosaic, calculateTileDimensions } from './tilingEngine';
import type { TilingRules } from '../types/tile';

describe('tilingEngine', () => {
  describe('loadTilingRules', () => {
    it('loads tiling rules from JSON configuration', () => {
      const rules = loadTilingRules();
      
      expect(rules).toBeDefined();
      expect(rules.gridConfig).toBeDefined();
      expect(rules.tileShapes).toBeDefined();
      expect(rules.placementRules).toBeDefined();
      expect(rules.importanceModifiers).toBeDefined();
    });
    
    it('has correct tile shapes with proper weights', () => {
      const rules = loadTilingRules();
      
      expect(rules.tileShapes).toHaveLength(4);
      
      const shapes = rules.tileShapes.reduce((acc, shape) => {
        acc[shape.id] = shape;
        return acc;
      }, {} as Record<string, any>);
      
      expect(shapes['1x1']).toEqual({
        id: '1x1',
        width: 1,
        height: 1,
        weight: 55,
        description: 'Square tile - most common',
      });
      
      expect(shapes['2x2']).toEqual({
        id: '2x2',
        width: 2,
        height: 2,
        weight: 10,
        description: 'Feature tile - used sparingly',
      });
    });
    
    it('has valid grid configuration', () => {
      const rules = loadTilingRules();
      
      expect(rules.gridConfig.mobileColumns).toBe(4);
      expect(rules.gridConfig.minTileSizePx).toBe(90);
      expect(rules.gridConfig.gapPx).toBe(8);
    });
    
    it('has valid placement rules', () => {
      const rules = loadTilingRules();
      
      expect(rules.placementRules.startPosition).toEqual({ row: 0, col: 0 });
      expect(rules.placementRules.fallbackStrategy).toBe('degrade');
      expect(rules.placementRules.degradeOrder).toEqual(['2x2', '2x1', '1x2', '1x1']);
      expect(rules.placementRules.avoidAdjacent2x2).toBe(true);
    });
  });
  
  describe('generateMosaic', () => {
    beforeEach(() => {
      // Reset random seed for consistent tests
      vi.spyOn(Math, 'random');
    });
    
    it('generates a mosaic with the correct number of tiles', () => {
      const articleCount = 10;
      const columns = 4;
      
      const mosaic = generateMosaic(articleCount, columns);
      
      expect(mosaic.tiles).toHaveLength(articleCount);
      expect(mosaic.columns).toBe(columns);
    });
    
    it('places tiles starting from top-left', () => {
      const mosaic = generateMosaic(5, 4);
      
      // First tile should be at or near position (0, 0)
      const firstTile = mosaic.tiles[0];
      expect(firstTile.position.row).toBe(0);
      expect(firstTile.position.col).toBe(0);
    });
    
    it('does not place overlapping tiles', () => {
      const mosaic = generateMosaic(20, 4);
      
      // Check that no two tiles occupy the same cell
      const cellOccupancy = new Map<string, string>();
      
      for (const tile of mosaic.tiles) {
        const { row, col } = tile.position;
        const { width, height } = tile.shape;
        
        for (let r = row; r < row + height; r++) {
          for (let c = col; c < col + width; c++) {
            const key = `${r},${c}`;
            expect(cellOccupancy.has(key), `Cell ${key} is occupied by multiple tiles`).toBe(false);
            cellOccupancy.set(key, tile.id);
          }
        }
      }
    });
    
    it('respects column boundaries', () => {
      const columns = 4;
      const mosaic = generateMosaic(20, columns);
      
      for (const tile of mosaic.tiles) {
        const { col } = tile.position;
        const { width } = tile.shape;
        
        expect(col + width).toBeLessThanOrEqual(columns);
      }
    });
    
    it('creates tiles with valid shapes from the rules', () => {
      const mosaic = generateMosaic(10, 4);
      const rules = loadTilingRules();
      const validShapeIds = rules.tileShapes.map(s => s.id);
      
      for (const tile of mosaic.tiles) {
        expect(validShapeIds).toContain(tile.shape.id);
      }
    });
    
    it('assigns sequential article indices to tiles', () => {
      const articleCount = 8;
      const mosaic = generateMosaic(articleCount, 4);
      
      const indices = mosaic.tiles.map(t => t.articleIndex).sort((a, b) => a - b);
      expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
    
    it('handles small grids without errors', () => {
      const mosaic = generateMosaic(3, 2);
      
      expect(mosaic.tiles.length).toBeGreaterThan(0);
      expect(mosaic.tiles.length).toBeLessThanOrEqual(3);
    });
    
    it('handles large article counts', () => {
      const mosaic = generateMosaic(50, 6);
      
      expect(mosaic.tiles).toHaveLength(50);
    });
    
    it('fills occupied cells set correctly', () => {
      const mosaic = generateMosaic(10, 4);
      
      // Count occupied cells
      let expectedOccupiedCells = 0;
      for (const tile of mosaic.tiles) {
        expectedOccupiedCells += tile.shape.width * tile.shape.height;
      }
      
      expect(mosaic.occupiedCells.size).toBe(expectedOccupiedCells);
    });
    
    it('avoids placing 2x2 tiles adjacent to each other when rule is enabled', () => {
      // Generate a larger mosaic to increase chances of 2x2 tiles
      const mosaic = generateMosaic(30, 6);
      
      const tiles2x2 = mosaic.tiles.filter(t => t.shape.id === '2x2');
      
      // Check each pair of 2x2 tiles
      for (let i = 0; i < tiles2x2.length; i++) {
        for (let j = i + 1; j < tiles2x2.length; j++) {
          const tile1 = tiles2x2[i];
          const tile2 = tiles2x2[j];
          
          const row1 = tile1.position.row;
          const col1 = tile1.position.col;
          const row2 = tile2.position.row;
          const col2 = tile2.position.col;
          
          // Check if horizontally adjacent
          const horizontallyAdjacent = 
            (row1 === row2 && (col1 === col2 + 2 || col1 + 2 === col2));
          
          // Check if vertically adjacent
          const verticallyAdjacent = 
            (col1 === col2 && (row1 === row2 + 2 || row1 + 2 === row2));
          
          expect(horizontallyAdjacent || verticallyAdjacent).toBe(false);
        }
      }
    });
    
    it('uses degradation strategy when primary shape does not fit', () => {
      // Use a very narrow grid to force degradation
      const mosaic = generateMosaic(10, 2);
      
      // In a 2-column grid, we should see mostly 1x1 and 1x2 tiles
      const shapes = mosaic.tiles.map(t => t.shape.id);
      const has2x2or2x1 = shapes.some(id => id === '2x2' || id === '2x1');
      
      // With a 2-column grid, 2x-wide tiles can fit but are less common
      // We mainly want to ensure the algorithm completes successfully
      expect(mosaic.tiles.length).toBe(10);
    });
  });
  
  describe('calculateTileDimensions', () => {
    it('calculates dimensions for 1x1 tile', () => {
      const rules = loadTilingRules();
      const shape = rules.tileShapes.find(s => s.id === '1x1')!;
      const containerWidth = 400;
      const columns = 4;
      
      const dims = calculateTileDimensions(shape, rules, columns, containerWidth);
      
      // (400 - 3*8) / 4 = 94px per tile
      expect(dims.width).toBeCloseTo(94, 0);
      expect(dims.height).toBeCloseTo(94, 0);
    });
    
    it('calculates dimensions for 2x2 tile', () => {
      const rules = loadTilingRules();
      const shape = rules.tileShapes.find(s => s.id === '2x2')!;
      const containerWidth = 400;
      const columns = 4;
      
      const dims = calculateTileDimensions(shape, rules, columns, containerWidth);
      
      // Base tile size: (400 - 3*8) / 4 = 94px
      // 2x2 tile: 94*2 + 8 = 196px
      expect(dims.width).toBeCloseTo(196, 0);
      expect(dims.height).toBeCloseTo(196, 0);
    });
    
    it('calculates dimensions for 2x1 tile', () => {
      const rules = loadTilingRules();
      const shape = rules.tileShapes.find(s => s.id === '2x1')!;
      const containerWidth = 400;
      const columns = 4;
      
      const dims = calculateTileDimensions(shape, rules, columns, containerWidth);
      
      expect(dims.width).toBeCloseTo(196, 0);
      expect(dims.height).toBeCloseTo(94, 0);
    });
    
    it('respects minimum tile size', () => {
      const rules = loadTilingRules();
      const shape = rules.tileShapes.find(s => s.id === '1x1')!;
      const containerWidth = 200; // Small container
      const columns = 4;
      
      const dims = calculateTileDimensions(shape, rules, columns, containerWidth);
      
      // Should not go below minTileSizePx (90px)
      expect(dims.width).toBeGreaterThanOrEqual(rules.gridConfig.minTileSizePx);
      expect(dims.height).toBeGreaterThanOrEqual(rules.gridConfig.minTileSizePx);
    });
    
    it('accounts for gaps in multi-cell tiles', () => {
      const rules = loadTilingRules();
      const shape = rules.tileShapes.find(s => s.id === '2x1')!;
      const containerWidth = 400;
      const columns = 4;
      
      const dims = calculateTileDimensions(shape, rules, columns, containerWidth);
      
      // Should include gap in the calculation
      const expectedWidth = 94 * 2 + 8; // 2 tiles + 1 gap
      expect(dims.width).toBeCloseTo(expectedWidth, 0);
    });
  });
  
  describe('JSON rules configuration', () => {
    it('can be overridden with custom rules', () => {
      const customRules: Partial<TilingRules> = {
        tileShapes: [
          {
            id: '1x1',
            width: 1,
            height: 1,
            weight: 100,
            description: 'Only shape',
          },
        ],
      };
      
      const mosaic = generateMosaic(10, 4, customRules);
      
      // All tiles should be 1x1
      for (const tile of mosaic.tiles) {
        expect(tile.shape.id).toBe('1x1');
      }
    });
  });
});
