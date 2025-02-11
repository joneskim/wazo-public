import React from 'react';

export const ExecutingBlocksContext = React.createContext<string[]>([]);

export const ExecutingBlocksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [executingBlocks, setExecutingBlocks] = React.useState<string[]>([]);

  return (
    <ExecutingBlocksContext.Provider value={executingBlocks}>
      {children}
    </ExecutingBlocksContext.Provider>
  );
};
