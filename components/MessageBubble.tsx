import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  themeClasses?: string; // Optional custom classes for theming
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, themeClasses }) => {
  const isUser = message.role === 'user';
  
  // Default user style if no theme provided
  const userStyle = themeClasses || 'bg-blue-600/10 border-blue-500/30 text-blue-100';
  const modelStyle = 'bg-slate-800/50 border border-slate-700 text-slate-300';
  const errorStyle = 'bg-red-900/20 border-red-500/50 text-red-400';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[90%] sm:max-w-[80%] rounded-lg p-4 text-sm leading-relaxed border ${
          message.isError ? errorStyle : (isUser ? userStyle : modelStyle)
        }`}
      >
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'opacity-80' : 'text-slate-500'}`}>
                {isUser ? 'OPERATOR' : 'EAI CORE'}
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
        </div>

        <div className="markdown-body">
            {isUser ? (
                 <p className="whitespace-pre-wrap font-sans">{message.text}</p>
            ) : (
                <ReactMarkdown 
                    components={{
                        ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="" {...props} />,
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mb-2 mt-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold text-white mb-2 mt-2" {...props} />,
                        code: ({node, ...props}) => <code className="bg-black/30 text-amber-300 px-1 py-0.5 rounded font-mono text-xs border border-white/5" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-slate-600 pl-3 italic text-slate-400" {...props} />,
                    }}
                >
                    {message.text}
                </ReactMarkdown>
            )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;