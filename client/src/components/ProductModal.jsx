import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-slate-900 border border-white/20 rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {initialData ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={formData.name || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400"
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400 h-24"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400"
            required
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={formData.stock || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="discount"
            placeholder="Discount (%)"
            value={formData.discount || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400"
            min="0"
            max="100"
          />
          <input
            type="url"
            name="image"
            placeholder="Image URL"
            value={formData.image || ''}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400"
          />
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProductModal;
