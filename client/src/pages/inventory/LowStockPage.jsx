import { useEffect, useState } from 'react';
import api from '../../api/client';
import { getSocket } from '../../services/socket';

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
    
    // Set up real-time updates via Socket.IO
    const s = getSocket();
    console.log('🔌 Socket connection status:', s ? 'Connected' : 'Not connected');
    
    if (s) {
      const onLow = () => {
        console.log('🔄 Low-stock update received, refreshing...');
        load(); // refresh list when server emits low-stock
      };
      
      // Listen for connection events
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

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100%', 
        padding: '2rem',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>Low-Stock Parts</h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100%', 
        padding: '2rem',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>Low-Stock Parts</h2>
          <div style={{ 
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
            <button 
              onClick={load}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      padding: '2rem',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ 
            color: '#1e293b', 
            margin: 0,
            fontSize: '1.875rem',
            fontWeight: '600'
          }}>
            Low-Stock Parts ({items.length})
          </h2>
          <button 
            onClick={load}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🔄 Refresh
          </button>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Name</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Code</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>On Hand</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Reserved</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Available</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Reorder Level</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => {
                  const stock = p.stock || {};
                  const onHand = stock.onHand || 0;
                  const reserved = stock.reserved || 0;
                  const available = Math.max(0, onHand - reserved);
                  const reorderLevel = stock.reorderLevel || 0;
                  const isLowStock = available <= reorderLevel;
                  
                  return (
                    <tr key={p._id} style={{ 
                      backgroundColor: isLowStock ? '#fef2f2' : 'transparent',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <td style={{ 
                        padding: '1rem', 
                        color: '#1f2937',
                        fontWeight: '500'
                      }}>{p.name}</td>
                      <td style={{ 
                        padding: '1rem', 
                        color: '#6b7280',
                        fontFamily: 'monospace'
                      }}>{p.partCode}</td>
                      <td style={{ 
                        padding: '1rem', 
                        color: '#1f2937',
                        textAlign: 'center'
                      }}>{onHand}</td>
                      <td style={{ 
                        padding: '1rem', 
                        color: '#1f2937',
                        textAlign: 'center'
                      }}>{reserved}</td>
                      <td style={{ 
                        padding: '1rem', 
                        fontWeight: 'bold', 
                        color: isLowStock ? '#dc2626' : '#059669',
                        textAlign: 'center'
                      }}>
                        {available}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        color: '#1f2937',
                        textAlign: 'center'
                      }}>{reorderLevel}</td>
                      <td style={{ 
                        padding: '1rem', 
                        color: '#6b7280'
                      }}>{p.category}</td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ 
                      padding: '3rem 1rem', 
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '1rem'
                    }}>
                      No low-stock parts 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
