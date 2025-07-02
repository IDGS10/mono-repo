import React, { useState, useCallback, useMemo, memo } from 'react';
import { FixedSizeList as List } from 'react-window';

const CommitItem = memo(({ index, style, data }) => {
  const { commits, onCommitClick } = data;
  const commit = commits[index];
  
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  const truncateMessage = useCallback((message, maxLength = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }, []);
  
  const handleClick = useCallback(() => {
    onCommitClick(commit.url);
  }, [commit.url, onCommitClick]);
  
  return (
    <div style={style}>
      <div
        style={{
          backgroundColor: 'white',
          padding: '12px',
          margin: '4px 8px',
          borderRadius: '6px',
          border: '1px solid #dee2e6',
          cursor: 'pointer',
          transition: 'box-shadow 0.1s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
        onClick={handleClick}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px'
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              margin: '0 0 5px 0',
              fontSize: '13px',
              color: '#212529',
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              {truncateMessage(commit.message)}
            </p>
            <div style={{
              display: 'flex',
              gap: '15px',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '11px',
                color: '#6c757d'
              }}>
                📅 {formatDate(commit.date)}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#6c757d',
                fontFamily: 'monospace'
              }}>
                🔗 {commit.sha.substring(0, 7)}
              </span>
            </div>
          </div>
          
          {(commit.additions > 0 || commit.deletions > 0) && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginLeft: '10px'
            }}>
              {commit.additions > 0 && (
                <span style={{
                  fontSize: '10px',
                  color: '#28a745',
                  backgroundColor: '#d4edda',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: 'bold'
                }}>
                  +{commit.additions}
                </span>
              )}
              {commit.deletions > 0 && (
                <span style={{
                  fontSize: '10px',
                  color: '#dc3545',
                  backgroundColor: '#f8d7da',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: 'bold'
                }}>
                  -{commit.deletions}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CommitItem.displayName = 'CommitItem';

const CommitsList = memo(({ commits, author, isAlwaysExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const handleCommitClick = useCallback((url) => {
    window.open(url, '_blank');
  }, []);
  
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);
  
  const toggleShowAll = useCallback(() => {
    setShowAll(!showAll);
  }, [showAll]);
  
  const sortedCommits = useMemo(() => {
    if (!commits || commits.length === 0) return [];
    return [...commits].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [commits]);
  
  const displayCommits = useMemo(() => {
    return showAll ? sortedCommits : sortedCommits.slice(0, 5);
  }, [sortedCommits, showAll]);
  
  const listData = useMemo(() => ({
    commits: displayCommits,
    onCommitClick: handleCommitClick
  }), [displayCommits, handleCommitClick]);
  
  if (!commits || commits.length === 0) return null;
  
  // Si isAlwaysExpanded es true, mostrar directamente los commits sin botón de expansión
  if (isAlwaysExpanded) {
    return (
      <div style={{
        marginTop: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '15px',
        border: '1px solid #e9ecef'
      }}>
        <h5 style={{
          margin: '0 0 15px 0',
          color: '#495057',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Commits de {author}:
        </h5>
        
        <div style={{ 
          height: Math.min(displayCommits.length * 80, 300),
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <List
            height={Math.min(displayCommits.length * 80, 300)}
            itemCount={displayCommits.length}
            itemSize={80}
            itemData={listData}
            overscanCount={2}
          >
            {CommitItem}
          </List>
        </div>
        
        {commits.length > 5 && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              onClick={toggleShowAll}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {showAll ? 'Mostrar menos' : `Ver todos (${commits.length})`}
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Comportamiento original con botón de expansión
  return (
    <div style={{ marginTop: '15px' }}>
      <button
        onClick={toggleExpanded}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {isExpanded ? '🔼 Ocultar Commits' : '🔽 Ver Commits'} ({commits.length})
      </button>
      
      {isExpanded && (
        <div style={{
          marginTop: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '15px',
          border: '1px solid #e9ecef'
        }}>
          <h5 style={{
            margin: '0 0 15px 0',
            color: '#495057',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Commits de {author}:
          </h5>
          
          <div style={{ 
            height: Math.min(displayCommits.length * 80, 300),
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <List
              height={Math.min(displayCommits.length * 80, 300)}
              itemCount={displayCommits.length}
              itemSize={80}
              itemData={listData}
              overscanCount={2}
            >
              {CommitItem}
            </List>
          </div>
          
          {commits.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                onClick={toggleShowAll}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {showAll ? 'Mostrar menos' : `Ver todos (${commits.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CommitsList.displayName = 'CommitsList';

export default CommitsList;
