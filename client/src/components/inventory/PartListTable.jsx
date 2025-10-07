import StatusBadge from './StatusBadge';

export default function PartListTable({ data, loading, onEdit, onDeactivate, onActivate, onDelete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading parts...</p>
        </div>
      </div>
    );
  }

  const parts = data?.items || [];

  return (
    <div className="flex-1 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="p-4 text-left text-sm font-medium text-slate-300">Part Code</th>
              <th className="p-4 text-left text-sm font-medium text-slate-300">Name</th>
              <th className="p-4 text-left text-sm font-medium text-slate-300">Category</th>
              <th className="p-4 text-left text-sm font-medium text-slate-300">Stock</th>
              <th className="p-4 text-left text-sm font-medium text-slate-300">Selling Price</th>
              <th className="p-4 text-left text-sm font-medium text-slate-300">Status</th>
              <th className="p-4 text-right text-sm font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {parts.map((part) => (
              <tr 
                key={part._id} 
                className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => onEdit(part)}
              >
                {/* Part Code */}
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-100">
                    {part.partCode || 'N/A'}
                  </div>
                </td>

                {/* Name */}
                <td className="p-4">
                  <div className="text-sm text-slate-200">
                    {part.name || 'Unnamed Part'}
                  </div>
                </td>

                {/* Category */}
                <td className="p-4">
                  <div className="text-sm text-slate-400">
                    {part.category || 'Uncategorized'}
                  </div>
                </td>

                {/* Stock */}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-200">
                      {part.stock?.onHand || 0}
                    </span>
                    {(part.stock?.reserved || 0) > 0 && (
                      <span className="text-xs text-slate-500">
                        ({part.stock.reserved} reserved)
                      </span>
                    )}
                  </div>
                </td>

                {/* Selling Price */}
                <td className="p-4">
                  <div className="text-sm text-slate-200">
                    ${part.sellingPrice ? part.sellingPrice.toFixed(2) : '0.00'}
                  </div>
                </td>

                {/* Status */}
                <td className="p-4">
                  <StatusBadge
                    status={part.isActive ? "active" : "inactive"}
                    type="active"
                    size="sm"
                  />
                </td>

                {/* Actions */}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(part);
                      }}
                      className="p-2 rounded-md bg-slate-700/40 hover:bg-slate-600/60 transition"
                      title="Edit Part"
                    >
                      ✏️
                    </button>
                    {part.isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeactivate(part);
                        }}
                        className="p-2 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-400 transition"
                        title="Deactivate Part"
                      >
                        🚫
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivate(part);
                        }}
                        className="p-2 rounded-md bg-green-500/20 hover:bg-green-500/40 text-green-400 transition"
                        title="Activate Part"
                      >
                        ✅
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(part);
                      }}
                      className="p-2 rounded-md bg-red-600/30 hover:bg-red-600/50 text-red-400 transition"
                      title="Delete Part Permanently"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}