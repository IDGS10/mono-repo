import React from 'react';

const SwarmCard = ({ swarm }) => {
  const statusColors = {
    requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    paused: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{swarm.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[swarm.status] || 'bg-gray-100 text-gray-800'}`}>
          {swarm.status}
        </span>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
        {swarm.description || 'No description provided'}
      </p>

      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-500">
        <span>
          Devices: <span className="text-gray-700 dark:text-gray-300">{swarm.devices || 0}/{swarm.maxDevices}</span>
        </span>
      </div>
    </div>
  );
};

export default SwarmCard;