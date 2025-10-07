import React from "react";
import StatusBadge from "../ui/StatusBadge";
import LoadingSpinner from "../ui/LoadingSpinner";

export default function SupplierListTable({
  data,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  loading = false,
}) {
  const items = data?.items || [];

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <LoadingSpinner size="lg" text="Loading suppliers..." />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4 opacity-50">🏢</div>
        <p className="text-slate-400 text-lg">No suppliers found</p>
        <p className="text-slate-500 text-sm mt-2">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl shadow-md border border-slate-700/40">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-800/70 sticky top-0 z-10">
            <tr className="text-left text-slate-300 text-sm">
              <th className="p-4 w-[30%]">Supplier</th>
              <th className="p-4 w-[25%]">Contact</th>
              <th className="p-4 w-[15%]">Status</th>
              <th className="p-4 w-[20%]">Notes</th>
              <th className="p-4 w-[10%] text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/40">
            {items.map((supplier) => {
              const displayName =
                supplier.name ||
                supplier.companyName ||
                supplier.displayName ||
                "—";
              const displayEmail =
                supplier.email || supplier.primaryContact?.email || "—";
              const displayContact =
                supplier.contactPerson ||
                supplier.primaryContact?.fullName ||
                "";
              const firstAddr =
                Array.isArray(supplier.addresses) && supplier.addresses[0]
                  ? supplier.addresses[0]
                  : null;
              const displayAddress =
                supplier.address ||
                (firstAddr
                  ? [
                      firstAddr.line1,
                      firstAddr.line2,
                      firstAddr.city,
                      firstAddr.country,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "");

              return (
                <tr
                  key={supplier._id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {/* Supplier Info */}
                  <td className="p-4">
                    <div>
                      <div
                        className="font-semibold text-slate-200 truncate"
                        title={displayName}
                      >
                        {displayName}
                      </div>
                      <div
                        className="text-sm text-slate-400 truncate"
                        title={displayEmail}
                      >
                        {displayEmail}
                      </div>
                      {displayContact && (
                        <div className="text-xs text-slate-500 mt-1">
                          Contact: {displayContact}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="p-4">
                    <div className="space-y-1">
                      {(supplier.phone || supplier.primaryContact?.phone) && (
                        <div className="text-sm text-slate-300 flex items-center gap-1">
                          📞 {supplier.phone || supplier.primaryContact?.phone}
                        </div>
                      )}
                      {displayAddress && (
                        <div
                          className="text-xs text-slate-400 line-clamp-2"
                          title={displayAddress}
                        >
                          📍 {displayAddress}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <StatusBadge
                      status={supplier.isActive ? "active" : "inactive"}
                      type="active"
                      size="sm"
                    />
                  </td>

                  {/* Notes */}
                  <td className="p-4 text-sm text-slate-400 max-w-xs">
                    <span className="line-clamp-2">
                      {supplier.notes || "No notes"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(supplier);
                        }}
                        className="p-2 rounded-md bg-slate-700/40 hover:bg-slate-600/60 transition"
                        title="Edit Supplier"
                      >
                        ✏️
                      </button>
                      {supplier.isActive ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeactivate(supplier);
                          }}
                          className="p-2 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-400 transition"
                          title="Deactivate Supplier"
                        >
                          🚫
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onActivate(supplier);
                          }}
                          className="p-2 rounded-md bg-green-500/20 hover:bg-green-500/40 text-green-400 transition"
                          title="Activate Supplier"
                        >
                          ✅
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(supplier);
                        }}
                        className="p-2 rounded-md bg-red-600/30 hover:bg-red-600/50 text-red-400 transition"
                        title="Delete Supplier"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
