import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/charts/RevenueChart';
import ProductChart from '../components/charts/ProductChart';
import LoadingSkeletons from '../components/LoadingSkeletons';
import InvoiceModal from '../components/InvoiceModal';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Award, 
  ShoppingBag, 
  CreditCard, 
  Calendar, 
  ExternalLink,
  ShoppingBag as BagIcon
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin') {
          const [analyticsRes, revenueRes, productsRes] = await Promise.all([
            api.get('/dashboard/analytics'),
            api.get('/dashboard/revenue'),
            api.get('/dashboard/top-products'),
          ]);

          setStats(analyticsRes.data);
          setRevenueData(revenueRes.data);
          setTopProducts(
            productsRes.data.map((p, i) => ({ name: p.name, value: p.salesCount || i + 1 }))
          );
        } else {
          const [statsRes, ordersRes] = await Promise.all([
            api.get('/dashboard/my-stats'),
            api.get('/dashboard/my-orders'),
          ]);
          setUserStats(statsRes.data);
          setUserOrders(ordersRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Determine VIP Tier based on spending
  const getVIPTier = (spent) => {
    if (!spent) return 'Premium Member';
    if (spent >= 1000) return 'Titanium Elite';
    if (spent >= 500) return 'Diamond Member';
    if (spent >= 100) return 'Gold Member';
    return 'Premium Member';
  };

  const vipTier = getVIPTier(userStats?.totalSpent);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Helper to summarize multi-item products in the order row
  const getOrderItemsSummary = (order) => {
    if (!order.items || order.items.length === 0) return 'Product Spec';
    if (order.items.length === 1) return order.items[0].productName;
    return `${order.items[0].productName} + ${order.items.length - 1} other item${order.items.length - 1 > 1 ? 's' : ''}`;
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Welcome Section */}
        <motion.div 
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-slate-900/60 border border-white/10 p-8 shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-300 text-lg max-w-xl">
                {user?.role === 'admin' 
                  ? 'Access system metrics, optimization pipelines, and live revenue feeds.'
                  : 'Discover curated high-quality products and track your premium orders.'}
              </p>
            </div>
            {user?.role !== 'admin' && (
              <Link 
                to="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all text-center self-start md:self-auto hover:scale-105 active:scale-95"
              >
                <BagIcon className="w-5 h-5" /> Start Shopping
              </Link>
            )}
          </div>
        </motion.div>

        {loading ? (
          <LoadingSkeletons />
        ) : user?.role === 'admin' ? (
          <>
            {/* Admin Stats Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`$${stats?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
                trend={12}
              />
              <StatCard
                icon={ShoppingCart}
                label="Total Sales"
                value={stats?.totalSales || 0}
                trend={8}
              />
              <StatCard
                icon={Package}
                label="Total Products"
                value={stats?.totalProducts || 0}
                trend={5}
              />
              <StatCard
                icon={TrendingUp}
                label="Growth Rate"
                value="15%"
                trend={3}
              />
            </motion.div>

            {/* Admin Charts Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <RevenueChart data={revenueData} />
              <ProductChart data={topProducts} />
            </motion.div>
          </>
        ) : (
          <>
            {/* Customer Stats Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard
                icon={DollarSign}
                label="Total Spent"
                value={`$${userStats?.totalSpent?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
              />
              <StatCard
                icon={ShoppingBag}
                label="Orders Placed"
                value={userStats?.ordersCount || 0}
              />
              <StatCard
                icon={Package}
                label="Items Purchased"
                value={userStats?.itemsBought || 0}
              />
              <StatCard
                icon={Award}
                label="VIP Membership"
                value={vipTier}
              />
            </motion.div>

            {/* Customer Orders Table */}
            <motion.div 
              variants={itemVariants}
              className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" /> Recent Purchase History
                </h2>
                <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                  {userOrders.length} {userOrders.length === 1 ? 'Order' : 'Orders'} Total
                </span>
              </div>

              {userOrders.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <ShoppingBag className="w-16 h-16 text-gray-500 mb-4 stroke-[1.5]" />
                  <p className="text-gray-300 text-lg mb-2 font-medium">No purchases made yet</p>
                  <p className="text-gray-500 text-sm max-w-sm mb-6">
                    You haven't ordered any premium products from our catalog yet. Start exploring now!
                  </p>
                  <Link
                    to="/products"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-sm font-semibold uppercase bg-slate-950/40">
                        <th className="px-6 py-4 text-left">Order ID</th>
                        <th className="px-6 py-4 text-left">Product Name</th>
                        <th className="px-6 py-4 text-center">Qty</th>
                        <th className="px-6 py-right text-right pr-6">Amount</th>
                        <th className="px-6 py-4 text-center">Payment</th>
                        <th className="px-6 py-4 text-center">Date</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {userOrders.map((order) => (
                        <tr 
                          key={order.orderId} 
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsInvoiceOpen(true);
                          }}
                          className="hover:bg-white/5 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 font-mono text-sm text-gray-400 font-semibold group-hover:text-blue-400 transition-colors">
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 font-medium text-white">
                            {getOrderItemsSummary(order)}
                          </td>
                          <td className="px-6 py-4 text-center font-bold">
                            {order.quantity}
                          </td>
                          <td className="px-6 py-4 text-right pr-6 font-bold text-white font-mono">
                            ${order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-center text-sm flex items-center justify-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-purple-400" />
                            <span className="capitalize">{order.paymentMethod ? order.paymentMethod.replace('_', ' ') : 'Credit Card'}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                              order.status === 'completed'
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : order.status === 'cancelled'
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                order.status === 'completed'
                                  ? 'bg-green-400'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-400'
                                  : 'bg-amber-400 animate-ping'
                              }`} />
                              <span className="capitalize">{order.status || 'pending'}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Itemized Invoice Drawer Overlay */}
      <InvoiceModal
        order={selectedOrder}
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedOrder(null);
        }}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
