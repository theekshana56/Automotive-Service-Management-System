import { useEffect, useState } from 'react';
import api from '../../api/client';
import { getSocket } from '../../services/socket';
import PageHeader from '../../components/inventory/PageHeader';
import DataTable from '../../components/inventory/DataTable';
import StatusBadge from '../../components/inventory/StatusBadge';
import LoadingSpinner from '../../components/inventory/LoadingSpinner';
import ErrorAlert from '../../components/inventory/ErrorAlert';

export default function LowStockPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/parts/low-stock');
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load low-stock parts:', err);
      setError('Failed to load low-stock parts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    
    const s = getSocket();
    console.log('🔌 Socket connection status:', s ? 'Connected' : 'Not connected');
    
    if (s) {
      const onLow = () => {
        console.log('🔄 Low-stock update received, refreshing...');
        load();
      };
      
      s.on('connect', () => {
        console.log('✅ Socket connected:', s.id);
      });
      
      s.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });
      
      s.on('stock:low', onLow);
      return () => {
        s.off('stock:low', onLow);
        s.off('connect');
        s.off('disconnect');
      };
    } else {
      console.log('⚠️ Socket not available - real-time updates disabled');
    }
  }, []);

  const headerActions = [
    {
      label: 'Refresh',
      icon: '🔄',
      onClick: load,
      variant: 'secondary'
    }
  ];

  const columns = [
    {
      key: 'name',
      header: 'Part Name',
      width: '25%',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-200">{row.name}</div>
          <div className="text-xs text-slate-400 font-mono">{row.partCode}</div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      width: '15%',
      render: (row) => (
        <span className="text-slate-300">{row.category}</span>
      )
    },
    {
      key: 'onHand',
      header: 'On Hand',
      width: '10%',
      render: (row) => {
        const stock = row.stock || {};
        return (
          <div className="text-center font-medium">
            {stock.onHand || 0}
          </div>
        );
      }
    },
    {
      key: 'reserved',
      header: 'Reserved',
      width: '10%',
      render: (row) => {
        const stock = row.stock || {};
        return (
          <div className="text-center text-slate-400">
            {stock.reserved || 0}
          </div>
        );
      }
    },
    {
      key: 'available',
      header: 'Available',
      width: '10%',
      render: (row) => {
        const stock = row.stock || {};
        const onHand = stock.onHand || 0;
        const reserved = stock.reserved || 0;
        const available = Math.max(0, onHand - reserved);
        const reorderLevel = stock.reorderLevel || 0;
        const isLowStock = available <= reorderLevel;
        
        return (
          <div className="text-center">
            <div className={`font-bold ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
              {available}
            </div>
          </div>
        );
      }
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      width: '15%',
      render: (row) => {
        const stock = row.stock || {};
        return (
          <div className="text-center text-slate-300">
            {stock.reorderLevel || 0}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (row) => {
        const stock = row.stock || {};
        const onHand = stock.onHand || 0;
        const reserved = stock.reserved || 0;
        const available = Math.max(0, onHand - reserved);
        const reorderLevel = stock.reorderLevel || 0;
        const isLowStock = available <= reorderLevel;
        
        return (
          <StatusBadge 
            status={isLowStock ? 'Low Stock' : 'Normal'} 
            variant={isLowStock ? 'error' : 'success'} 
          />
        );
      }
    }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading low-stock parts..." />;
  }

  if (error) {
    return (
      <div className="bg-app min-h-screen">
        <div className="app-container">
          <div className="max-w-4xl mx-auto">
            <PageHeader
              title="Low-Stock Parts"
              subtitle="Monitor parts that need restocking"
            />
            <ErrorAlert 
              message={error}
              onDismiss={() => setError('')}
            />
            <div className="card text-center py-12">
              <button 
                onClick={load}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Low-Stock Parts"
            subtitle="Monitor parts that need restocking"
            badge={
              <div className="badge bg-red-500/20 text-red-400 border-red-500/30">
                {items.length} items
              </div>
            }
            actions={headerActions}
          />

          {items.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-medium text-slate-300 mb-2">All Good!</h3>
              <p className="text-slate-400">No parts are currently running low on stock.</p>
            </div>
          ) : (
            <>
              {/* Alert Banner */}
              <div className="card bg-red-500/10 border-red-500/20 mb-6">
                <div className="card-body">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h3 className="text-red-400 font-medium">Low Stock Alert</h3>
                      <p className="text-red-300 text-sm">
                        {items.length} part{items.length !== 1 ? 's' : ''} need{items.length === 1 ? 's' : ''} immediate attention for restocking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={items}
                loading={loading}
                emptyMessage="No low-stock parts found"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}