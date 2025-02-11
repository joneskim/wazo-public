declare module 'react-syntax-highlighter' {
  import { ComponentType, ReactNode } from 'react';

  export interface SyntaxHighlighterProps {
    children?: ReactNode;
    style?: any;
    language?: string;
    className?: string;
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/cjs/styles/prism' {
  const styles: { [key: string]: any };
  export const oneLight: any;
  export default styles;
}
