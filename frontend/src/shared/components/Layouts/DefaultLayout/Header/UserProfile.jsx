const UserProfile = () => {
  return (
    <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {localStorage.getItem('userEmail') || 'Usuario'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Administrador
        </div>
      </div>
      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-full flex items-center justify-center text-white font-medium shadow-lg hover:scale-105 transition-transform duration-200">
        👤
      </div>
    </div>
  );
};

export default UserProfile;