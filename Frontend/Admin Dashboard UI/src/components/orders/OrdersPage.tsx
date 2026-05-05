import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';
import { Badge } from '../ui/badge';

const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  const parts = dateStr.split(/[,\s]+/);
  const datePart = parts[0];
  const timePart = parts.length > 1 ? parts[1] : "00:00:00";

  if (datePart && datePart.includes('/')) {
    const [day, month, year] = datePart.split('/');
    d = new Date(`${year}-${month}-${day}T${timePart}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "2025-11-02 16:28:37";
  if (dateStr.includes('T')) {
    return dateStr.split('.')[0].replace('T', ' ');
  }

  return dateStr.replace(',', '');
};


interface OrderPageProps {
  orders: any[];
  onBack: () => void;
  selectedMonth?: { key: string; label: string } | null;
}

export default function OrderPage({ orders, onBack, selectedMonth }: OrderPageProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'paid_at', direction: 'desc' });

  const filteredOrders = useMemo(() => {
    if (!selectedMonth) return orders;
    return orders.filter(order => {
      const d = parseSafeDate(order.paid_at);
      if (!d) return false;
      const orderKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return orderKey === selectedMonth.key;
    });
  }, [orders, selectedMonth]);

  const sortedOrders = useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {

        if (sortConfig.key === 'paid_at') {
          const dateA = parseSafeDate(a.paid_at);
          const dateB = parseSafeDate(b.paid_at);
          const timeA = dateA ? dateA.getTime() : 0;
          const timeB = dateB ? dateB.getTime() : 0;
          return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
        }

        if (sortConfig.key === 'total_price') {
          const priceA = Number(a.total_price) || 0;
          const priceB = Number(b.total_price) || 0;
          return sortConfig.direction === 'asc' ? priceA - priceB : priceB - priceA;
        }
        // Sort Strings Alphabetically
        const valA = String(a[sortConfig.key] || '').toLowerCase();
        const valB = String(b[sortConfig.key] || '').toLowerCase();
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h2 className="text-white text-3xl font-bold">
            {selectedMonth ? `${selectedMonth.label} Orders` : 'All Orders'}
          </h2>
        </div>
        <Badge className="bg-cyan-500/20 text-white text-md border-cyan">
          {sortedOrders.length} Orders found
        </Badge>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 bg-slate-900/50">
              <TableHead className="text-slate-300 cursor-pointer hover:text-white" onClick={() => requestSort('order_id')}>
                Order ID <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="text-slate-300 cursor-pointer hover:text-white" onClick={() => requestSort('user_id')}>
                User ID <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="text-slate-300 cursor-pointer hover:text-white" onClick={() => requestSort('paid_at')}>
                Date <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="text-slate-300 cursor-pointer hover:text-white" onClick={() => requestSort('total_price')}>
                Amount <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="text-slate-300">Payment Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((order) => (
              <TableRow key={order.order_id} className="border-slate-700 hover:bg-slate-700/30">
                <TableCell className="text-slate-400 font-mono text-xs">{order.order_id}</TableCell>
                <TableCell className="text-white font-medium">{order.user_id}</TableCell>

                <TableCell className="text-slate-300">
                  {formatDisplayDate(order.paid_at)}
                </TableCell>

                <TableCell className="text-white font-bold">₹{order.total_price}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-slate-600 text-slate-400 capitalize">
                    {order.payment_method || 'Online'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}