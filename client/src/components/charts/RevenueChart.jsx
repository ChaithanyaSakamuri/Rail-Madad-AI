import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }) => {
  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Revenue Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey={data && data.length > 0 && 'date' in data[0] ? 'date' : '_id'} 
            stroke="rgba(255,255,255,0.7)" 
          />
          <YAxis stroke="rgba(255,255,255,0.7)" />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }} />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
