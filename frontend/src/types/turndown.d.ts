declare module 'turndown' {
  interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    codeBlockStyle?: 'indented' | 'fenced';
    emDelimiter?: string;
    strongDelimiter?: string;
    bulletListMarker?: string;
    fence?: string;
  }

  class TurndownService {
    constructor(options?: TurndownOptions);
    turndown(html: string | Node): string;
    addRule(key: string, rule: Rule): this;
    keep(filter: Filter): this;
    remove(filter: Filter): this;
    use(plugin: Plugin | Plugin[]): this;
  }

  interface Rule {
    filter: Filter;
    replacement(content: string, node: Node, options: TurndownOptions): string;
  }

  type Filter = string | string[] | ((node: Node, options: TurndownOptions) => boolean);
  type Plugin = (service: TurndownService) => void;

  export default TurndownService;
}
