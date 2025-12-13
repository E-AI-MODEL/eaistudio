import React, { useState, useEffect, useRef, useCallback } from 'react';

interface GameSnakeProps {
  onClose: () => void;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const SPEED = 100;

const GameSnake: React.FC<GameSnakeProps> = ({ onClose }) => {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Ref for latest direction to avoid closure staleness in interval
  const directionRef = useRef<Direction>('RIGHT');

  const generateFood = useCallback((): Point => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        if (directionRef.current !== 'DOWN') directionRef.current = 'UP';
        break;
      case 'ArrowDown':
        if (directionRef.current !== 'UP') directionRef.current = 'DOWN';
        break;
      case 'ArrowLeft':
        if (directionRef.current !== 'RIGHT') directionRef.current = 'LEFT';
        break;
      case 'ArrowRight':
        if (directionRef.current !== 'LEFT') directionRef.current = 'RIGHT';
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = { ...head };

        // Update direction state for UI consistency
        setDirection(directionRef.current);

        switch (directionRef.current) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Check Wall Collision
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check Food Collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood());
          // Grow snake (don't pop tail)
        } else {
          newSnake.pop(); // Move snake (pop tail)
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameInterval);
  }, [gameOver, isPaused, food, generateFood]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#0b1120] border-2 border-green-500/50 rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.2)] p-6 w-full max-w-md relative overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-green-900/50 pb-2">
            <div>
                <h2 className="text-green-400 font-bold text-xl tracking-wider font-mono">DATA_SNAKE.EXE</h2>
                <p className="text-[10px] text-green-600 uppercase">Collect Knowledge Nodes</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="text-2xl font-bold text-white font-mono">{score}</div>
                    <div className="text-[10px] text-slate-500">BYTES</div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Game Board */}
        {/* We use inline styles for the grid because generic tailwind grid-cols-20 doesn't exist by default */}
        <div 
            className="relative w-full aspect-square bg-black/40 rounded-lg border border-slate-800 overflow-hidden mb-4"
            style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, 
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` 
            }}
        >
            {/* Grid Rendering */}
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                
                const isSnakeHead = snake[0].x === x && snake[0].y === y;
                const isSnakeBody = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
                const isFood = food.x === x && food.y === y;

                let cellClass = "";
                if (isSnakeHead) cellClass = "bg-green-400 shadow-[0_0_10px_#4ade80] z-10 rounded-sm";
                else if (isSnakeBody) cellClass = "bg-green-700/80 rounded-sm scale-90";
                else if (isFood) cellClass = "bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_#ef4444]";

                return (
                    <div key={i} className={`w-full h-full border-[0.5px] border-white/[0.02] ${cellClass}`}></div>
                );
            })}

            {/* Game Over Overlay */}
            {gameOver && (
                <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center text-center p-4">
                    <h3 className="text-red-500 font-bold text-3xl mb-2 font-mono">SYSTEM HALTED</h3>
                    <p className="text-slate-300 text-sm mb-6">Stream Connection Lost</p>
                    <button 
                        onClick={resetGame}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-95"
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mb-4 sm:hidden">
             <div></div>
             <button onPointerDown={(e) => { e.preventDefault(); if(directionRef.current !== 'DOWN') directionRef.current = 'UP'; }} className="h-12 bg-slate-800 rounded flex items-center justify-center active:bg-green-900 text-white shadow-lg active:scale-95 transition-transform">▲</button>
             <div></div>
             <button onPointerDown={(e) => { e.preventDefault(); if(directionRef.current !== 'RIGHT') directionRef.current = 'LEFT'; }} className="h-12 bg-slate-800 rounded flex items-center justify-center active:bg-green-900 text-white shadow-lg active:scale-95 transition-transform">◀</button>
             <button onPointerDown={(e) => { e.preventDefault(); if(directionRef.current !== 'UP') directionRef.current = 'DOWN'; }} className="h-12 bg-slate-800 rounded flex items-center justify-center active:bg-green-900 text-white shadow-lg active:scale-95 transition-transform">▼</button>
             <button onPointerDown={(e) => { e.preventDefault(); if(directionRef.current !== 'LEFT') directionRef.current = 'RIGHT'; }} className="h-12 bg-slate-800 rounded flex items-center justify-center active:bg-green-900 text-white shadow-lg active:scale-95 transition-transform">▶</button>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-slate-500 font-mono mt-auto">
            <span>Use Arrow Keys</span>
            <button onClick={onClose} className="hover:text-white underline">EXIT TERMINAL</button>
        </div>

      </div>
    </div>
  );
};

export default GameSnake;