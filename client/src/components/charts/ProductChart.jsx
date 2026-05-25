import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

const ProductChart = ({ data }) => {
  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Top Products</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data || []}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {(data || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProductChart;
