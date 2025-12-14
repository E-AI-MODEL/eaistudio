import React, { useState, useEffect } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    const lines = [
        "INITIALIZING EAI KERNEL...",
        "MOUNTING SSOT FILE SYSTEM...",
        "PARSING DIDACTIC VECTORS...",
        "CALIBRATING NEURAL WEIGHTS...",
        "ESTABLISHING SECURE UPLINK...",
        "SYSTEM READY."
    ];

    let currentLine = 0;
    
    // Log interval to simulate loading steps
    const logInterval = setInterval(() => {
        if (currentLine < lines.length) {
            setLogs(prev => [...prev, lines[currentLine]]);
            currentLine++;
        }
    }, 600);

    // Progress bar simulation
    const progressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) return 100;
            return prev + Math.random() * 4;
        });
    }, 50);

    // Completion logic
    const totalTime = 4200;
    setTimeout(() => {
        setOpacity(0); // Fade out effect
        setTimeout(onComplete, 1000); // Wait for fade to finish before unmounting
    }, totalTime);

    return () => {
        clearInterval(logInterval);
        clearInterval(progressInterval);
    };
  }, [onComplete]);

  // Don't render if fully faded out (though parent usually unmounts)
  if (opacity === 0 && progress >= 100) return null;

  return (
    <div 
        className="fixed inset-0 z-[9999] bg-[#050914] flex flex-col items-center justify-center font-mono text-cyan-500 transition-opacity duration-1000 ease-in-out select-none cursor-wait"
        style={{ opacity: opacity / 100 }}
    >
        {/* Animated Core Logo */}
        <div className="relative w-32 h-32 mb-12">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-[spin_4s_linear_infinite]"></div>
            <div className="absolute inset-2 border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-6 border-2 border-b-blue-500 border-l-transparent border-t-transparent border-r-transparent rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white tracking-widest animate-pulse">EAI</span>
            </div>
        </div>

        {/* Loading Bar */}
        <div className="w-64 sm:w-80 h-1 bg-slate-800 rounded-full mb-6 overflow-hidden relative">
            <div 
                className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-100"
                style={{ width: `${progress}%` }}
            />
        </div>

        {/* Terminal Logs */}
        <div className="h-24 flex flex-col justify-end items-center space-y-1 overflow-hidden w-full max-w-md px-4">
            {logs.slice(-4).map((log, i) => (
                <div key={i} className="text-[10px] sm:text-xs text-cyan-500/80 w-full text-center tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {`> ${log}`}
                </div>
            ))}
        </div>
        
        <div className="absolute bottom-8 text-[9px] text-slate-600 tracking-[0.2em] uppercase">
            Neural Architecture v12.4.0
        </div>
    </div>
  );
};

export default BootSequence;