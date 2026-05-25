import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, trend }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 text-white"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-300">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && <Icon className="w-8 h-8 text-blue-400" />}
      </div>
    </motion.div>
  );
};

export default StatCard;
