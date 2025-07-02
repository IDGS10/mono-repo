import React from 'react';

const BranchSelector = ({ branches, selectedBranch, onBranchChange, loading }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#212529'
      }}>
        Seleccionar Vista:
      </label>
      <select 
        value={selectedBranch}
        onChange={(e) => onBranchChange(e.target.value)}
        disabled={loading}
        style={{
          padding: '10px 15px',
          fontSize: '14px',
          border: '2px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: 'white',
          cursor: loading ? 'not-allowed' : 'pointer',
          minWidth: '250px',
          outline: 'none',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#007bff';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e9ecef';
        }}
      >
        <option value="ALL_BRANCHES">🌍 Todas las Ramas (Vista Global)</option>
        <optgroup label="Ramas Individuales">
          {branches.filter(branch => branch !== 'ALL_BRANCHES').map(branch => (
            <option key={branch} value={branch}>
              🌿 {branch}
            </option>
          ))}
        </optgroup>
      </select>
      
      {selectedBranch === 'ALL_BRANCHES' && (
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '12px',
          color: '#6c757d',
          fontStyle: 'italic'
        }}>
          💡 Mostrando datos combinados de todas las ramas del repositorio
        </p>
      )}
    </div>
  );
};

export default BranchSelector;
