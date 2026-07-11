import { useLocation, useOutlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NotificationDrawer } from './NotificationDrawer';
import { CommandPalette } from './CommandPalette';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeInOut" as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeInOut" as const } },
};

export function AppLayout() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6"
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette />
      <NotificationDrawer />
      <AIAssistant />
    </div>
  );
}

export default AppLayout;
