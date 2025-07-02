import React, { useState, useCallback, memo } from 'react';

const RepositorySelector = memo(({ onRepositoryChange, loading, currentRepo }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState('url'); // 'url' o 'manual'
  const [manualOwner, setManualOwner] = useState('');
  const [manualRepo, setManualRepo] = useState('');
  const [error, setError] = useState('');

  const parseGitHubUrl = useCallback((url) => {
    try {
      // Limpiar la URL
      const cleanUrl = url.trim();
      
      // Patrones para diferentes formatos de URL de GitHub
      const patterns = [
        // https://github.com/owner/repo
        /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/,
        // github.com/owner/repo
        /^github\.com\/([^\/]+)\/([^\/]+)\/?$/,
        // owner/repo
        /^([^\/]+)\/([^\/]+)$/
      ];

      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) {
          let owner = match[1];
          let repo = match[2];
          
          // Remover extensiones comunes (.git, etc.)
          repo = repo.replace(/\.git$/, '');
          
          return { owner, repo };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setError('');

    let owner, repo;

    if (inputMode === 'url') {
      const parsed = parseGitHubUrl(inputValue);
      if (!parsed) {
        setError('URL de repositorio inválida. Formatos válidos: https://github.com/owner/repo, github.com/owner/repo, o owner/repo');
        return;
      }
      owner = parsed.owner;
      repo = parsed.repo;
    } else {
      if (!manualOwner.trim() || !manualRepo.trim()) {
        setError('Por favor, ingresa tanto el propietario como el nombre del repositorio');
        return;
      }
      owner = manualOwner.trim();
      repo = manualRepo.trim();
    }

    // Validar que no contengan caracteres especiales problemáticos
    if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
      setError('El propietario y repositorio solo pueden contener letras, números, puntos, guiones y guiones bajos');
      return;
    }

    onRepositoryChange(owner, repo);
    setError('');
  }, [inputValue, inputMode, manualOwner, manualRepo, parseGitHubUrl, onRepositoryChange]);

  const handleInputModeChange = useCallback((mode) => {
    setInputMode(mode);
    setError('');
    setInputValue('');
    setManualOwner('');
    setManualRepo('');
  }, []);

  const popularRepos = [
    { owner: 'facebook', repo: 'react', label: 'React (Facebook)' },
    { owner: 'microsoft', repo: 'vscode', label: 'VS Code (Microsoft)' },
    { owner: 'vercel', repo: 'next.js', label: 'Next.js (Vercel)' },
    { owner: 'vuejs', repo: 'vue', label: 'Vue.js' },
    { owner: 'angular', repo: 'angular', label: 'Angular' },
    { owner: 'nodejs', repo: 'node', label: 'Node.js' }
  ];

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px',
      border: '2px solid #e9ecef'
    }}>
      <h3 style={{
        color: '#212529',
        marginBottom: '20px',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        🔍 Seleccionar Repositorio
      </h3>

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <button
          type="button"
          onClick={() => handleInputModeChange('url')}
          style={{
            padding: '8px 16px',
            border: inputMode === 'url' ? '2px solid #007bff' : '1px solid #ced4da',
            borderRadius: '6px',
            backgroundColor: inputMode === 'url' ? '#e3f2fd' : 'white',
            color: inputMode === 'url' ? '#1976d2' : '#495057',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: inputMode === 'url' ? 'bold' : 'normal'
          }}
        >
          📎 URL/Enlace
        </button>
        <button
          type="button"
          onClick={() => handleInputModeChange('manual')}
          style={{
            padding: '8px 16px',
            border: inputMode === 'manual' ? '2px solid #007bff' : '1px solid #ced4da',
            borderRadius: '6px',
            backgroundColor: inputMode === 'manual' ? '#e3f2fd' : 'white',
            color: inputMode === 'manual' ? '#1976d2' : '#495057',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: inputMode === 'manual' ? 'bold' : 'normal'
          }}
        >
          ✏️ Manual
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {inputMode === 'url' ? (
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#495057'
            }}>
              URL del Repositorio:
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="https://github.com/owner/repo o owner/repo"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#007bff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
              }}
            />
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px', 
            marginBottom: '15px' 
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#495057'
              }}>
                Propietario:
              </label>
              <input
                type="text"
                value={manualOwner}
                onChange={(e) => setManualOwner(e.target.value)}
                placeholder="ej: facebook"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e9ecef';
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#495057'
              }}>
                Repositorio:
              </label>
              <input
                type="text"
                value={manualRepo}
                onChange={(e) => setManualRepo(e.target.value)}
                placeholder="ej: react"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e9ecef';
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '14px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ {error}
          </div>
        )}

        {currentRepo && (
          <div style={{
            backgroundColor: '#d1ecf1',
            color: '#0c5460',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '14px',
            border: '1px solid #bee5eb'
          }}>
            📊 Analizando: <strong>{currentRepo.owner}/{currentRepo.repo}</strong>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (inputMode === 'url' && !inputValue.trim()) || (inputMode === 'manual' && (!manualOwner.trim() || !manualRepo.trim()))}
          style={{
            backgroundColor: loading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#218838';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#28a745';
            }
          }}
        >
          {loading ? '🔄 Analizando...' : '🔍 Analizar Repositorio'}
        </button>
      </form>

      {/* Repositorios populares para pruebas rápidas */}
      <div style={{ marginTop: '20px' }}>
        <h5 style={{
          color: '#6c757d',
          fontSize: '14px',
          marginBottom: '10px',
          fontWeight: '600'
        }}>
          ⚡ Prueba rápida con repositorios populares:
        </h5>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {popularRepos.map((repo) => (
            <button
              key={`${repo.owner}/${repo.repo}`}
              type="button"
              onClick={() => onRepositoryChange(repo.owner, repo.repo)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                border: '1px solid #007bff',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#007bff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#007bff';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#007bff';
                }
              }}
            >
              {repo.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

RepositorySelector.displayName = 'RepositorySelector';

export default RepositorySelector;
