// src/components/admin/shared/AdminTable.jsx
function AdminTable({ headers, data, renderRow, emptyMessage = 'داده‌ای یافت نشد' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 text-xs">
            {headers.map((h, i) => (
              <th key={i} className="text-right py-2 px-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={headers.length} className="text-center py-8 text-gray-500">{emptyMessage}</td></tr>
          ) : (
            data.map((item, idx) => renderRow(item, idx))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminTable;