import React, { useState, useCallback, useEffect } from 'react';
import { RenderElementProps, ReactEditor, useSlate } from 'slate-react';
import { Transforms, Node as SlateNode, Editor } from 'slate';
import { CodeBlockElement, CustomEditor } from '../../types/slate';
import { executeCode } from '../../api/codeExecution';
import { PlayIcon, SunIcon, MoonIcon } from './icons';
import { useCodeBlockTheme } from '../../contexts/CodeBlockThemeContext';
import { highlightCode } from './syntaxHighlighter';
import './syntax.css';

const LANGUAGES = ['python', 'c', 'cpp'] as const;
type Language = typeof LANGUAGES[number];

interface CodeBlockProps extends RenderElementProps {
  element: CodeBlockElement;
  editor: CustomEditor;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  attributes,
  children,
  element,
  editor,
  language: initialLanguage,
  onLanguageChange,
}) => {
  const [language, setLanguage] = useState<Language>(element.language as Language || 'python');
  const [isExecuting, setIsExecuting] = useState(false);
  const { isDark, toggleTheme } = useCodeBlockTheme();
  const [highlightedCode, setHighlightedCode] = useState('');

  const updateHighlighting = useCallback((code: string) => {
    const highlighted = highlightCode(code, language, isDark);
    setHighlightedCode(highlighted);
  }, [language, isDark]);

  useEffect(() => {
    const code = SlateNode.string(element);
    updateHighlighting(code);
  }, [element, updateHighlighting]);

  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as Language;
    setLanguage(newLanguage);
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(editor, { language: newLanguage }, { at: path });
    const code = SlateNode.string(element);
    updateHighlighting(code);
  }, [editor, element, updateHighlighting]);

  const handleRun = async () => {
    if (!editor) return;
    const code = SlateNode.string(element);
    if (!code) return;
    
    setIsExecuting(true);

    try {
      const result = await executeCode(code, language || 'python', '', '');
      const path = ReactEditor.findPath(editor, element);
      Transforms.setNodes(
        editor,
        {
          output: result.output || undefined,
          error: result.stderr || undefined,
        },
        { at: path }
      );
    } catch (err) {
      console.error('Execution error:', err);
      const path = ReactEditor.findPath(editor, element);
      Transforms.setNodes(
        editor,
        {
          output: undefined,
          error: err instanceof Error ? err.message : String(err),
        },
        { at: path }
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div {...attributes} className="not-prose relative my-6 group">
      <div className="absolute -left-10 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleRun();
          }}
          disabled={isExecuting}
          className={`h-8 w-8 inline-flex items-center justify-center text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
            isDark 
              ? 'bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white' 
              : 'bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white'
          }`}
        >
          {isExecuting ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <PlayIcon />
          )}
        </button>
      </div>
      
      <div className={`rounded-xl overflow-hidden shadow-lg ring-1 ${
        isDark 
          ? 'bg-gray-900/[0.96] ring-white/10 shadow-black/20' 
          : 'bg-white ring-black/5 shadow-black/5'
      }`}>
        <div className={`flex items-center justify-between px-4 py-2.5 ${
          isDark ? 'bg-white/[0.07]' : 'bg-gray-50/80'
        }`}>
          <select 
            contentEditable={false}
            value={language} 
            onChange={handleLanguageChange}
            className={`px-2 h-6 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors ${
              isDark 
                ? 'bg-transparent hover:bg-white/5 border border-white/10 text-gray-400' 
                : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-600'
            }`}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang} className={isDark ? 'bg-gray-900' : 'bg-white'}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            onClick={toggleTheme}
            className={`p-1 rounded-md transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isDark ? (
              <SunIcon size={14} />
            ) : (
              <MoonIcon size={14} />
            )}
          </button>
        </div>
        
        <div 
          className={`p-4 font-mono text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-800'
          }`}
        >
          <div 
            className={`language-${language} ${isDark ? 'dark' : ''}`}
            style={{ background: 'transparent' }}
          >
            <div 
              {...attributes}
              style={{ position: 'relative' }}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const { selection } = editor;
                  if (!selection) return;

                  if (!e.shiftKey) {
                    // Insert 4 spaces at cursor
                    const spaces = '    ';
                    Transforms.insertText(editor, spaces);
                  } else {
                    // Try to remove 4 spaces before cursor
                    const currentPoint = selection.anchor;
                    if (currentPoint.offset >= 4) {
                      const start = { ...currentPoint, offset: currentPoint.offset - 4 };
                      const range = { anchor: start, focus: currentPoint };
                      const textBefore = Editor.string(editor, range);
                      
                      if (textBefore === '    ') {
                        Transforms.delete(editor, { at: range });
                      }
                    }
                  }
                }
              }}
            >
              <div
                contentEditable={false}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
              <div style={{ position: 'relative', zIndex: 1, color: 'transparent', caretColor: isDark ? '#e5e7eb' : '#1f2937' }}>
                {children}
              </div>
            </div>
          </div>
        </div>
        
        {(element.output || element.error) && (
          <div contentEditable={false} className={`border-t ${
            isDark ? 'border-white/[0.08]' : 'border-gray-100'
          }`}>
            {element.output && (
              <div className="relative">
                <div className="absolute left-4 top-3 flex items-center">
                  <span className={`flex items-center gap-1.5 px-1.5 py-1 text-[10px] font-medium ${
                    isDark
                      ? 'text-green-400/90 bg-green-400/10'
                      : 'text-green-600 bg-green-50'
                  }`}>
                    Output
                  </span>
                </div>
                <pre className={`p-4 pt-12 font-mono text-sm whitespace-pre-wrap ${
                  isDark
                    ? 'text-gray-300'
                    : 'text-gray-700 bg-gray-50/50'
                }`}>
                  {element.output}
                </pre>
              </div>
            )}
            {element.error && (
              <div className="relative">
                <div className="absolute left-4 top-3 flex items-center">
                  <span className={`flex items-center gap-1.5 px-1.5 py-1 text-[10px] font-medium ${
                    isDark
                      ? 'text-red-400/90 bg-red-400/10'
                      : 'text-red-600 bg-red-50'
                  }`}>
                    Error
                  </span>
                </div>
                <pre className={`p-4 pt-12 font-mono text-sm whitespace-pre-wrap ${
                  isDark
                    ? 'text-red-400'
                    : 'text-red-600 bg-red-50'
                }`}>
                  {element.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
