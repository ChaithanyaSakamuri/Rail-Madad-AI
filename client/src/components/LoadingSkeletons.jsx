import { motion } from 'framer-motion';

const LoadingSkeletons = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-20 bg-white/10 rounded-lg"
        />
      ))}
    </div>
  );
};

export default LoadingSkeletons;
