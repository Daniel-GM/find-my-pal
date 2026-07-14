import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full"
      style={{ padding: '120px 24px', minHeight: 'calc(100dvh - 60px)' }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <GitBranch
          size={80}
          style={{ color: 'var(--text-muted)', opacity: 0.4 }}
        />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-[22px] font-bold text-center mt-6"
        style={{ color: 'var(--text-primary)' }}
      >
        Select a Pal to Begin
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-[14px] text-center mt-2"
        style={{
          color: 'var(--text-secondary)',
          maxWidth: 400,
        }}
      >
        Choose a Pal from the sidebar to see all possible parent breeding
        combinations.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-[13px] text-center mt-4"
        style={{ color: 'var(--text-muted)' }}
      >
        You can search by name, number, or filter by element type.
      </motion.p>
    </motion.div>
  );
}
