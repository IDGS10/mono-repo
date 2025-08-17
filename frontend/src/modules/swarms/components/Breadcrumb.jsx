export default function Breadcrumb({ items }) {
  return (
    <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      {items.map((item, index) => (
        <span key={index}>
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline"
            >
              {item.label}
            </button>
          ) : (
            <span className={index === items.length - 1 ? "text-gray-900 dark:text-gray-100 font-medium" : ""}>
              {item.label}
            </span>
          )}
          {index < items.length - 1 && <span className="mx-2">›</span>}
        </span>
      ))}
    </nav>
  );
}