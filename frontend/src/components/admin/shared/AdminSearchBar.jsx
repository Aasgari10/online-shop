// src/components/admin/shared/AdminSearchBar.jsx
function AdminSearchBar({ value, onChange, placeholder = 'جستجو...' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-56 px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
    />
  );
}

export default AdminSearchBar;