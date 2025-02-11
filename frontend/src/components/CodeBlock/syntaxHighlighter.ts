// Basic token types
type TokenType = 
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'function'
  | 'operator'
  | 'punctuation'
  | 'text';

interface Token {
  type: TokenType;
  content: string;
}

// Language definitions
interface LanguageDefinition {
  keywords: string[];
  operators: string[];
  punctuation: string[];
}

const languages: Record<string, LanguageDefinition> = {
  python: {
    keywords: [
      'def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return',
      'import', 'from', 'as', 'try', 'except', 'finally', 'raise',
      'True', 'False', 'None', 'and', 'or', 'not', 'is', 'in'
    ],
    operators: ['+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=', '+=', '-=', '*=', '/='],
    punctuation: ['(', ')', '[', ']', '{', '}', ',', '.', ':', ';']
  },
  cpp: {
    keywords: [
      'auto', 'break', 'case', 'class', 'const', 'continue', 'default',
      'do', 'else', 'enum', 'extern', 'for', 'goto', 'if', 'inline',
      'namespace', 'new', 'private', 'protected', 'public', 'return',
      'sizeof', 'static', 'struct', 'switch', 'template', 'this',
      'typedef', 'union', 'virtual', 'void', 'volatile', 'while'
    ],
    operators: ['+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=', '+=', '-=', '*=', '/=', '++', '--', '->'],
    punctuation: ['(', ')', '[', ']', '{', '}', ',', '.', ':', ';', '<', '>']
  }
};

// Helper functions
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createToken(type: TokenType, content: string): Token {
  return { type, content: escapeHtml(content) };
}

// Simple tokenizer
function tokenize(code: string, language: string): Token[] {
  const tokens: Token[] = [];
  const lang = languages[language] || languages.python;
  
  let current = 0;
  
  while (current < code.length) {
    let char = code[current];
    
    // Handle whitespace
    if (/\s/.test(char)) {
      let value = '';
      while (current < code.length && /\s/.test(code[current])) {
        value += code[current];
        current++;
      }
      tokens.push(createToken('text', value));
      continue;
    }
    
    // Handle strings
    if (char === '"' || char === "'") {
      let value = char;
      current++;
      while (current < code.length && code[current] !== char) {
        value += code[current];
        current++;
      }
      if (current < code.length) {
        value += code[current];
        current++;
      }
      tokens.push(createToken('string', value));
      continue;
    }
    
    // Handle comments
    if (char === '#' || (char === '/' && code[current + 1] === '/')) {
      let value = '';
      while (current < code.length && code[current] !== '\n') {
        value += code[current];
        current++;
      }
      tokens.push(createToken('comment', value));
      continue;
    }
    
    // Handle numbers
    if (/[0-9]/.test(char)) {
      let value = '';
      while (current < code.length && /[0-9.]/.test(code[current])) {
        value += code[current];
        current++;
      }
      tokens.push(createToken('number', value));
      continue;
    }
    
    // Handle identifiers and keywords
    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      while (current < code.length && /[a-zA-Z0-9_]/.test(code[current])) {
        value += code[current];
        current++;
      }
      
      // Check if it's a function call
      if (code[current] === '(') {
        tokens.push(createToken('function', value));
      }
      // Check if it's a keyword
      else if (lang.keywords.includes(value)) {
        tokens.push(createToken('keyword', value));
      }
      // Otherwise it's just text
      else {
        tokens.push(createToken('text', value));
      }
      continue;
    }
    
    // Handle operators
    if (lang.operators.some(op => code.startsWith(op, current))) {
      const op = lang.operators.find(op => code.startsWith(op, current))!;
      tokens.push(createToken('operator', op));
      current += op.length;
      continue;
    }
    
    // Handle punctuation
    if (lang.punctuation.includes(char)) {
      tokens.push(createToken('punctuation', char));
      current++;
      continue;
    }
    
    // Handle unknown characters
    tokens.push(createToken('text', char));
    current++;
  }
  
  return tokens;
}

// Convert tokens to HTML
function tokensToHtml(tokens: Token[], isDark: boolean): string {
  const theme = {
    keyword: isDark ? 'text-purple-400' : 'text-purple-600',
    string: isDark ? 'text-green-400' : 'text-green-600',
    number: isDark ? 'text-yellow-400' : 'text-yellow-600',
    comment: isDark ? 'text-gray-500' : 'text-gray-500',
    function: isDark ? 'text-blue-400' : 'text-blue-600',
    operator: isDark ? 'text-red-400' : 'text-red-600',
    punctuation: isDark ? 'text-gray-400' : 'text-gray-600',
    text: isDark ? 'text-gray-300' : 'text-gray-800'
  };
  
  return tokens
    .map(token => `<span class="${theme[token.type]}">${token.content}</span>`)
    .join('');
}

// Main highlight function
export function highlightCode(code: string, language: string, isDark: boolean): string {
  const tokens = tokenize(code, language);
  return tokensToHtml(tokens, isDark);
}
