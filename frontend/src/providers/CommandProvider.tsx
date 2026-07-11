import * as React from 'react';

interface CommandContextValue {
  registerCommand: (name: string, callback: () => void) => () => void;
  commands: Record<string, () => void>;
}

const CommandContext = React.createContext<CommandContextValue | null>(null);

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [commands, setCommands] = React.useState<Record<string, () => void>>({});

  const registerCommand = React.useCallback((name: string, callback: () => void) => {
    setCommands((prev) => ({ ...prev, [name]: callback }));
    return () => {
      setCommands((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    };
  }, []);

  return (
    <CommandContext.Provider value={{ registerCommand, commands }}>
      {children}
    </CommandContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandContext() {
  const context = React.useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandContext must be used within CommandProvider');
  }
  return context;
}

export default CommandProvider;
