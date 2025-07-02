import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getBranchActivity, getBranches, getAllBranchesActivity, getRepositoryStats, setGitHubToken } from './services/githubService';
import VirtualizedAuthorList from './components/VirtualizedAuthorList';
import BranchSelector from './components/BranchSelector';
import LoadingSpinner from './components/LoadingSpinner';
import RepositoryStats from './components/RepositoryStats';
import RepositorySelector from './components/RepositorySelector';
import { useDebounce, useMemoizedData, useScrollOptimization } from './hooks/useOptimization';

// Registra los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Memoizar componente del gráfico
const MemoizedChart = memo(({ data, branch }) => {
  const chartData = useMemo(() => {
    if (!data) return null;
    
    return {
      labels: Object.keys(data.commitsByAuthor),
      datasets: [
        {
          label: branch === 'ALL_BRANCHES' ? 'Commits (Todas las Ramas)' : `Commits en ${branch}`,
          data: Object.values(data.commitsByAuthor),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(255, 99, 255, 0.8)',
            'rgba(99, 255, 132, 0.8)',
            'rgba(132, 99, 255, 0.8)',
            'rgba(255, 180, 99, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(255, 99, 255, 1)',
            'rgba(99, 255, 132, 1)',
            'rgba(132, 99, 255, 1)',
            'rgba(255, 180, 99, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [data, branch]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: branch === 'ALL_BRANCHES' 
          ? 'Commits por autor en todas las ramas' 
          : `Commits por autor en la rama "${branch}"`,
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#007bff',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const percentage = ((value / data.totalCommits) * 100).toFixed(1);
            return `${context.dataset.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Commits',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Autores',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      }
    }
  }), [branch, data]);

  if (!chartData) return null;

  return <Bar 
    data={chartData} 
    options={options}
    key={branch}
  />;
});

MemoizedChart.displayName = 'MemoizedChart';

const App = () => {
  const [branch, setBranch] = useState('ALL_BRANCHES');
  const [branches, setBranches] = useState(['ALL_BRANCHES']);
  const [data, setData] = useState(null);
  const [repoStats, setRepoStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [repoStatsLoading, setRepoStatsLoading] = useState(false);
  const [currentRepo, setCurrentRepo] = useState({ owner: 'IDGS10', repo: 'mono-repo' });
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  // Usar hook de optimización de scroll
  useScrollOptimization();

  // Memoizar datos procesados
  const memoizedData = useMemoizedData(data, [data]);

  // Debounce para cambios de rama
  const debouncedBranchChange = useDebounce(useCallback((newBranch) => {
    setBranch(newBranch);
  }, []), 300);

  // Función para cambiar repositorio
  const handleRepositoryChange = useCallback(async (owner, repo) => {
    setCurrentRepo({ owner, repo });
    setError('');
    setData(null);
    setRepoStats(null);
    setBranches(['ALL_BRANCHES']);
    setBranch('ALL_BRANCHES');
    
    // Resetear estados de carga
    setBranchesLoading(true);
    setRepoStatsLoading(true);
    
    try {
      const [branchList, repositoryStats] = await Promise.all([
        getBranches(owner, repo),
        getRepositoryStats(owner, repo)
      ]);
      
      setBranches(['ALL_BRANCHES', ...branchList]);
      setRepoStats(repositoryStats);
    } catch (error) {
      console.error('Error fetching repository data:', error);
      let errorMessage = 'Error al obtener información del repositorio. ';
      
      if (error.message.includes('404')) {
        errorMessage += 'El repositorio no existe o es privado.';
      } else if (error.message.includes('403')) {
        errorMessage += 'Límite de API alcanzado o repositorio restringido.';
      } else {
        errorMessage += 'Verifica que el repositorio sea público y accesible.';
      }
      
      setError(errorMessage);
    } finally {
      setBranchesLoading(false);
      setRepoStatsLoading(false);
    }
  }, []);

  // Cargar repositorio por defecto al iniciar
  useEffect(() => {
    handleRepositoryChange('IDGS10', 'mono-repo');
  }, [handleRepositoryChange]);

  const fetchData = useCallback(async () => {
    if (!currentRepo.owner || !currentRepo.repo) return;
    
    setLoading(true);
    setError('');
    
    try {
      let activityData;
      
      if (branch === 'ALL_BRANCHES') {
        activityData = await getAllBranchesActivity(currentRepo.owner, currentRepo.repo);
      } else {
        activityData = await getBranchActivity(currentRepo.owner, currentRepo.repo, branch);
      }
      
      setData(activityData);
    } catch (error) {
      console.error('Error fetching activity data:', error);
      let errorMessage = 'Error al obtener datos de actividad. ';
      
      if (error.message.includes('404')) {
        errorMessage += 'La rama especificada no existe.';
      } else if (error.message.includes('403')) {
        errorMessage += 'Límite de API alcanzado.';
      } else {
        errorMessage += 'Intenta nuevamente en unos momentos.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [branch, currentRepo]);

  useEffect(() => {
    if (branch && !branchesLoading && currentRepo.owner && currentRepo.repo) {
      fetchData();
    }
  }, [branch, branchesLoading, fetchData, currentRepo]);

  // Memoizar estadísticas para evitar recálculos
  const stats = useMemo(() => {
    if (!memoizedData) return null;
    
    return {
      totalCommits: memoizedData.totalCommits || 0,
      uniqueAuthors: Object.keys(memoizedData.commitsByAuthor || {}).length,
      maxCommits: Math.max(...Object.values(memoizedData.commitsByAuthor || {}), 0),
      branchesCount: memoizedData.branches?.length || 0
    };
  }, [memoizedData]);

  const handleBranchChange = useCallback((newBranch) => {
    debouncedBranchChange(newBranch);
  }, [debouncedBranchChange]);

  const handleTokenChange = useCallback((e) => {
    const newToken = e.target.value;
    setToken(newToken);
    setGitHubToken(newToken);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          color: '#212529',
          marginBottom: '10px',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          📊 Analizador Universal de Repositorios GitHub
        </h1>
        <p style={{
          color: '#6c757d',
          fontSize: '16px',
          marginBottom: '20px'
        }}>
          Analiza cualquier repositorio público de GitHub para obtener estadísticas completas de commits, contribuciones y actividad
        </p>
      </div>

      {/* Input para Token */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
        marginBottom: '20px' 
      }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px', 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#495057' 
        }}>
          Token de GitHub:
        </label>
        <input
          type="text"
          value={token}
          onChange={handleTokenChange}
          placeholder="Ingresa tu token de GitHub para aumentar el límite de la API"
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: '2px solid #e9ecef', 
            borderRadius: '6px', 
            fontSize: '14px', 
            outline: 'none', 
            transition: 'border-color 0.2s ease' 
          }}
          onFocus={(e) => { e.target.style.borderColor = '#007bff'; }}
          onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; }}
        />
      </div>

      {/* Selector de Repositorio */}
      <RepositorySelector 
        onRepositoryChange={handleRepositoryChange}
        loading={branchesLoading || repoStatsLoading || loading}
        currentRepo={currentRepo}
      />

      {/* Error Global */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Controles de Rama */}
      {!branchesLoading && !repoStatsLoading && branches.length > 1 && (
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px'
        }}>
          <BranchSelector 
            branches={branches}
            selectedBranch={branch}
            onBranchChange={handleBranchChange}
            loading={loading}
          />
          
          <button 
            onClick={fetchData} 
            disabled={loading}
            style={{
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#0056b3';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#007bff';
              }
            }}
          >
            {loading ? '🔄 Actualizando...' : '🔄 Actualizar Datos'}
          </button>
        </div>
      )}
      
      {/* Estados de carga inicial */}
      {(branchesLoading || repoStatsLoading) && (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px'
        }}>
          <LoadingSpinner message={`Cargando información del repositorio ${currentRepo.owner}/${currentRepo.repo}...`} />
        </div>
      )}

      {/* Estadísticas del Repositorio */}
      {!branchesLoading && !repoStatsLoading && repoStats && (
        <RepositoryStats 
          repoStats={repoStats} 
          branchStats={data?.branchStats}
        />
      )}
      
      {/* Contenido principal */}
      {!branchesLoading && !repoStatsLoading && (
        <>
          {loading ? (
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <LoadingSpinner message={
                branch === 'ALL_BRANCHES' 
                  ? `Analizando todas las ramas de ${currentRepo.owner}/${currentRepo.repo}... Esto puede tomar unos momentos.` 
                  : `Cargando datos de la rama ${branch} en ${currentRepo.owner}/${currentRepo.repo}...`
              } />
            </div>
          ) : (
            <>
              {data && stats && (
                <>
                  {/* Resumen de Actividad */}
                  <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    marginBottom: '20px'
                  }}>
                    <h2 style={{ 
                      color: '#212529',
                      marginBottom: '20px',
                      fontSize: '22px'
                    }}>
                      📈 Actividad en <span style={{ color: '#007bff' }}>{currentRepo.owner}/{currentRepo.repo}</span>
                      {branch !== 'ALL_BRANCHES' && (
                        <span style={{ color: '#6c757d', fontSize: '18px' }}> - Rama: {branch}</span>
                      )}
                    </h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '20px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '20px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        border: '2px solid #2196f3'
                      }}>
                        <h3 style={{ margin: 0, fontSize: '24px', color: '#1976d2' }}>
                          {stats.totalCommits.toLocaleString()}
                        </h3>
                        <p style={{ margin: '5px 0 0 0', color: '#424242' }}>
                          Total de Commits
                        </p>
                      </div>
                      <div style={{
                        backgroundColor: '#f3e5f5',
                        padding: '20px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        border: '2px solid #9c27b0'
                      }}>
                        <h3 style={{ margin: 0, fontSize: '24px', color: '#7b1fa2' }}>
                          {stats.uniqueAuthors}
                        </h3>
                        <p style={{ margin: '5px 0 0 0', color: '#424242' }}>
                          Contribuidores Activos
                        </p>
                      </div>
                      {branch === 'ALL_BRANCHES' && stats.branchesCount > 0 && (
                        <div style={{
                          backgroundColor: '#e8f5e8',
                          padding: '20px',
                          borderRadius: '10px',
                          textAlign: 'center',
                          border: '2px solid #4caf50'
                        }}>
                          <h3 style={{ margin: 0, fontSize: '24px', color: '#388e3c' }}>
                            {stats.branchesCount}
                          </h3>
                          <p style={{ margin: '5px 0 0 0', color: '#424242' }}>
                            Ramas Analizadas
                          </p>
                        </div>
                      )}
                      <div style={{
                        backgroundColor: '#fff3e0',
                        padding: '20px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        border: '2px solid #ff9800'
                      }}>
                        <h3 style={{ margin: 0, fontSize: '24px', color: '#f57c00' }}>
                          {stats.maxCommits}
                        </h3>
                        <p style={{ margin: '5px 0 0 0', color: '#424242' }}>
                          Máx. Commits por Autor
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Contribuidores con Commits - Virtualizada */}
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
                      👥 Contribuidores y sus Commits
                    </h3>
                    <p style={{
                      color: '#6c757d',
                      fontSize: '14px',
                      marginBottom: '20px',
                      lineHeight: '1.5',
                      fontWeight: '400',
                      
                    }}>
                      Haz clic en cualquier tarjeta de autor para ver su perfil de GitHub, 
                      o expande la lista de commits para ver los detalles específicos y navegar a cada commit.
                    </p>
                    <VirtualizedAuthorList data={data} />
                  </div>

                  {/* Gráfico */}
                  <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h3 style={{ 
                      color: '#212529',
                      marginBottom: '20px',
                      fontSize: '20px'
                    }}>
                      📊 Gráfico de Actividad por Contribuidor
                    </h3>
                    <div style={{ height: '400px' }}>
                      <MemoizedChart data={data} branch={branch} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;