import React from 'react';

const RepositoryStats = ({ repoStats, branchStats }) => {
  if (!repoStats) return null;
  
  const { repository, contributors } = repoStats;
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatSize = (sizeKb) => {
    if (sizeKb < 1024) return `${sizeKb} KB`;
    if (sizeKb < 1024 * 1024) return `${(sizeKb / 1024).toFixed(1)} MB`;
    return `${(sizeKb / (1024 * 1024)).toFixed(1)} GB`;
  };
  
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{
        color: '#212529',
        marginBottom: '20px',
        fontSize: '20px'
      }}>
        🏛️ Información del Repositorio
      </h3>
      
      {/* Información básica del repo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          border: '2px solid #28a745'
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#155724' }}>⭐ Estrellas</h4>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#155724' }}>
            {repository.stars.toLocaleString()}
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          border: '2px solid #ffc107'
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#856404' }}>🍴 Forks</h4>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#856404' }}>
            {repository.forks.toLocaleString()}
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#d1ecf1',
          padding: '15px',
          borderRadius: '8px',
          border: '2px solid #17a2b8'
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#0c5460' }}>👀 Watchers</h4>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0c5460' }}>
            {repository.watchers.toLocaleString()}
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#f8d7da',
          padding: '15px',
          borderRadius: '8px',
          border: '2px solid #dc3545'
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#721c24' }}>🐛 Issues Abiertas</h4>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>
            {repository.open_issues.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Información adicional */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <h5 style={{ margin: '0 0 5px 0', color: '#495057' }}>💻 Lenguaje Principal</h5>
            <p style={{ margin: 0, color: '#6c757d' }}>{repository.language || 'No especificado'}</p>
          </div>
          <div>
            <h5 style={{ margin: '0 0 5px 0', color: '#495057' }}>📦 Tamaño</h5>
            <p style={{ margin: 0, color: '#6c757d' }}>{formatSize(repository.size)}</p>
          </div>
          <div>
            <h5 style={{ margin: '0 0 5px 0', color: '#495057' }}>📅 Creado</h5>
            <p style={{ margin: 0, color: '#6c757d' }}>{formatDate(repository.created_at)}</p>
          </div>
          <div>
            <h5 style={{ margin: '0 0 5px 0', color: '#495057' }}>🔄 Última Actualización</h5>
            <p style={{ margin: 0, color: '#6c757d' }}>{formatDate(repository.updated_at)}</p>
          </div>
        </div>
        
        {repository.description && (
          <div style={{ marginTop: '15px' }}>
            <h5 style={{ margin: '0 0 5px 0', color: '#495057' }}>📝 Descripción</h5>
            <p style={{ margin: 0, color: '#6c757d', fontStyle: 'italic' }}>
              {repository.description}
            </p>
          </div>
        )}
      </div>
      
      {/* Estadísticas por rama */}
      {branchStats && (
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Estadísticas por Rama</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            {Object.entries(branchStats).map(([branch, stats]) => (
              <div
                key={branch}
                style={{
                  backgroundColor: '#e9ecef',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da'
                }}
              >
                <h6 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '14px' }}>
                  🌿 {branch}
                </h6>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  <p style={{ margin: '0 0 3px 0' }}>Commits: {stats.totalCommits}</p>
                  <p style={{ margin: 0 }}>Autores: {stats.authors}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Top contribuidores */}
      {contributors && contributors.length > 0 && (
        <div style={{ marginTop: '25px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>🏆 Top Contribuidores</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            {contributors.slice(0, 8).map((contributor) => (
              <div
                key={contributor.login}
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => window.open(contributor.html_url, '_blank')}
              >
                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    marginBottom: '5px'
                  }}
                />
                <p style={{
                  margin: '0 0 3px 0',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  {contributor.login}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '10px',
                  color: '#6c757d'
                }}>
                  {contributor.contributions} contribuciones
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryStats;
