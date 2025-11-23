import React from 'react';
import { ProductStatus } from '../types';

export const StatusBadge: React.FC<{ status: ProductStatus }> = ({ status }) => {
  const styles = {
    [ProductStatus.PRODUCT_CREATED]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    [ProductStatus.DEPARTED_MANUFACTURER]: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    [ProductStatus.ARRIVED_WAREHOUSE]: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    [ProductStatus.DEPARTED_WAREHOUSE]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    [ProductStatus.ARRIVED_SHOP]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    [ProductStatus.AVAILABLE_FOR_SALE]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    [ProductStatus.SOLD_TO_CUSTOMER]: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const labels = {
    [ProductStatus.PRODUCT_CREATED]: 'Created',
    [ProductStatus.DEPARTED_MANUFACTURER]: 'Departed Mfg',
    [ProductStatus.ARRIVED_WAREHOUSE]: 'In Warehouse',
    [ProductStatus.DEPARTED_WAREHOUSE]: 'Left Warehouse',
    [ProductStatus.ARRIVED_SHOP]: 'Stocked',
    [ProductStatus.AVAILABLE_FOR_SALE]: 'Available for Sale',
    [ProductStatus.SOLD_TO_CUSTOMER]: 'Sold',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-700 text-slate-400'}`}>
      {labels[status] || status}
    </span>
  );
};