'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Maximize2,
  Minimize2,
  Grid,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';
import { TableExtended, Floor, QuickAction, Reservation, Server, ServerSection } from '@/types/restaurant';
import { InteractiveTableCard } from './InteractiveTableCard';

interface InteractiveFloorPlanProps {
  floor: Floor;
  tables: TableExtended[];
  reservations: Reservation[];
  servers: Server[];
  selectedTable?: TableExtended;
  onTableSelect: (table: TableExtended) => void;
  onQuickAction: (action: string, tableId: string, data?: any) => void;
  quickActions: QuickAction[];
  showServerSections: boolean;
  selectedServerId?: string;
  className?: string;
}

export function InteractiveFloorPlan({
  floor,
  tables,
  reservations,
  servers,
  selectedTable,
  onTableSelect,
  onQuickAction,
  quickActions,
  showServerSections = true,
  selectedServerId,
  className = ''
}: InteractiveFloorPlanProps) {
  // View state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showObstacles, setShowObstacles] = useState(true);
  const [showTableDetails, setShowTableDetails] = useState(true);
  
  // Interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [pinchStartDistance, setPinchStartDistance] = useState(0);
  const [pinchStartScale, setPinchStartScale] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);

  // Constants
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;
  const ZOOM_STEP = 0.1;
  const PAN_BOUNDARY = 200;

  // Helper functions
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const constrainPosition = useCallback((newPosition: { x: number; y: number }) => {
    if (!containerRef.current || !floorRef.current) return newPosition;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const floorRect = floorRef.current.getBoundingClientRect();
    
    const maxX = Math.max(0, (floorRect.width * scale - containerRect.width) / 2 + PAN_BOUNDARY);
    const maxY = Math.max(0, (floorRect.height * scale - containerRect.height) / 2 + PAN_BOUNDARY);
    
    return {
      x: Math.max(-maxX, Math.min(maxX, newPosition.x)),
      y: Math.max(-maxY, Math.min(maxY, newPosition.y))
    };
  }, [scale]);

  // Event handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    setScale(newScale);
  }, [scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    const newPosition = constrainPosition({
      x: position.x + deltaX,
      y: position.y + deltaY
    });
    
    setPosition(newPosition);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastPanPoint, position, constrainPosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - start panning
      setIsPanning(true);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Two touches - start pinch zoom
      setIsPanning(false);
      const distance = getDistance(e.touches[0], e.touches[1]);
      setPinchStartDistance(distance);
      setPinchStartScale(scale);
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isPanning) {
      // Single touch - pan
      const deltaX = e.touches[0].clientX - lastPanPoint.x;
      const deltaY = e.touches[0].clientY - lastPanPoint.y;
      
      const newPosition = constrainPosition({
        x: position.x + deltaX,
        y: position.y + deltaY
      });
      
      setPosition(newPosition);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scaleFactor = distance / pinchStartDistance;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStartScale * scaleFactor));
      setScale(newScale);
    }
  }, [isPanning, lastPanPoint, position, constrainPosition, pinchStartDistance, pinchStartScale]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    setPinchStartDistance(0);
  }, []);

  // Control functions
  const zoomIn = () => setScale(prev => Math.min(MAX_SCALE, prev + ZOOM_STEP));
  const zoomOut = () => setScale(prev => Math.max(MIN_SCALE, prev - ZOOM_STEP));
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);
  const toggleGrid = () => setShowGrid(prev => !prev);
  const toggleObstacles = () => setShowObstacles(prev => !prev);
  const toggleTableDetails = () => setShowTableDetails(prev => !prev);

  // Filter tables by selected server
  const filteredTables = selectedServerId 
    ? tables.filter(table => table.serverId === selectedServerId)
    : tables;

  // Get server sections for visual overlay
  const serverSections = servers.flatMap(server => 
    server.sections.filter(section => section.isActive)
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case 'r':
          e.preventDefault();
          resetView();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'g':
          e.preventDefault();
          toggleGrid();
          break;
        case 'escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className={`relative bg-gray-100 rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'h-96'} ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[60] pointer-events-auto">
        <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Reset View (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleGrid}
            className={`p-2 rounded transition-colors ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Toggle Grid (G)"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={toggleObstacles}
            className={`p-2 rounded transition-colors ${showObstacles ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Toggle Obstacles"
          >
            {showObstacles ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleTableDetails}
            className={`p-2 rounded transition-colors ${showTableDetails ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Toggle Table Details"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scale indicator */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-[60] pointer-events-auto">
        <span className="text-sm font-medium text-gray-600">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Floor plan container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={floorRef}
          className="relative"
          style={{
            width: floor.layout.width,
            height: floor.layout.height,
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Background image */}
          {floor.layout.backgroundImage && (
            <img
              src={floor.layout.backgroundImage}
              alt={`${floor.name} layout`}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              draggable={false}
            />
          )}

          {/* Grid overlay */}
          {showGrid && (
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
          )}

          {/* Server sections overlay */}
          {showServerSections && serverSections.map(section => (
            <div
              key={section.id}
              className="absolute border-2 border-dashed opacity-30 rounded-lg"
              style={{
                left: 0, // Calculate based on section bounds
                top: 0,
                width: 200, // Calculate based on section bounds
                height: 150,
                backgroundColor: section.color + '20',
                borderColor: section.color
              }}
            >
              <div 
                className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: section.color, color: 'white' }}
              >
                {section.name}
              </div>
            </div>
          ))}

          {/* Obstacles */}
          {showObstacles && floor.layout.obstacles.map(obstacle => (
            <div
              key={obstacle.id}
              className="absolute bg-gray-400 opacity-60 flex items-center justify-center"
              style={{
                left: obstacle.position.x,
                top: obstacle.position.y,
                width: obstacle.position.width,
                height: obstacle.position.height,
                borderRadius: obstacle.type === 'pillar' ? '50%' : '4px'
              }}
            >
              {obstacle.label && (
                <span className="text-xs text-white font-medium text-center">
                  {obstacle.label}
                </span>
              )}
            </div>
          ))}

          {/* Tables */}
          {filteredTables.map(table => (
            <InteractiveTableCard
              key={table.id}
              table={table}
              onQuickAction={onQuickAction}
              onTableSelect={onTableSelect}
              isSelected={selectedTable?.id === table.id}
              scale={Math.max(0.8, Math.min(1.2, 1 / scale))} // Inverse scale for readability
              showDetails={showTableDetails}
              quickActions={quickActions}
              reservations={reservations.filter(r => r.tableId === table.id)}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[60] pointer-events-auto">
        <div className="text-xs font-medium text-gray-600 mb-2">Status Legend</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded animate-pulse"></div>
            <span>Needs Attention</span>
          </div>
        </div>
      </div>
    </div>
  );
}
