import React, { useState } from 'react';
import { EAI_CORE } from '../utils/ssotParser';

interface CommandPaletteProps {
  onSelectCommand: (command: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelectCommand, onClose, isOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCommands = EAI_CORE.commands.filter(cmd => {
    const matchesSearch = cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-gray-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
             <h3 className="font-bold text-gray-800">Interventie Bibliotheek</h3>
             <p className="text-xs text-gray-500">Selecteer een didactische sturing</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <input 
            type="text" 
            placeholder="Zoek commando (bijv. /devil, /meta)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            autoFocus
          />
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => {
                  onSelectCommand(cmd.command);
                  onClose();
              }}
              className="w-full text-left group flex flex-col p-3 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <code className="text-blue-600 font-mono font-bold text-sm bg-blue-100 px-2 py-0.5 rounded">
                  {cmd.command}
                </code>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {cmd.description}
              </p>
            </button>
          ))}
          
          {filteredCommands.length === 0 && (
              <div className="p-8 text-center text-gray-400 italic">
                  Geen resultaten gevonden.
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
             <span className="text-[10px] text-gray-400 uppercase font-mono tracking-widest">EAI Command Center</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
