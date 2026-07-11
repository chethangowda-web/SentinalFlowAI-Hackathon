import * as React from 'react';

interface ModalContextValue {
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalContent, setModalContent] = React.useState<React.ReactNode | null>(null);

  const showModal = (content: React.ReactNode) => setModalContent(content);
  const hideModal = () => setModalContent(null);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card border p-6 rounded-lg max-w-lg w-full relative">
            {modalContent}
            <button
              onClick={hideModal}
              className="absolute right-4 top-4 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}

export default ModalProvider;
