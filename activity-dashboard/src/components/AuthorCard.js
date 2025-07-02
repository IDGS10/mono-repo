import React, { memo, useState, useCallback, useMemo } from 'react';
import CommitsList from './CommitsList';

const AuthorCard = memo(({ author, commits, authorDetails, commitDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const details = useMemo(() => authorDetails[author], [authorDetails, author]);
  const authorCommits = useMemo(() => commitDetails[author] || [], [commitDetails, author]);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  const handleProfileClick = useCallback(() => {
    if (details?.html_url) {
      window.open(details.html_url, '_blank');
    }
  }, [details?.html_url]);
  
  const cardStyle = useMemo(() => ({
    padding: '20px',
    margin: '15px 0',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s ease',
    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
    willChange: 'transform, box-shadow'
  }), [isHovered]);
  
  const headerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    cursor: details?.html_url ? 'pointer' : 'default'
  }), [details?.html_url]);
  
  return (
    <div 
      style={cardStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        style={headerStyle}
        onClick={handleProfileClick}
      >
        <div style={{ marginRight: '15px' }}>
          {details?.avatar_url ? (
            <img 
              src={details.avatar_url} 
              alt={author}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: '2px solid #007bff'
              }}
              loading="lazy"
            />
          ) : (
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#6c757d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {author.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            margin: '0 0 5px 0',
            color: '#212529',
            fontSize: '16px'
          }}>
            {author}
          </h4>
          <p style={{ 
            margin: 0,
            color: '#6c757d',
            fontSize: '14px'
          }}>
            {commits} commit{commits !== 1 ? 's' : ''}
            {authorCommits.length > 0 && (
              <span style={{ marginLeft: '10px', fontSize: '12px' }}>
                📝 {authorCommits.length} registro{authorCommits.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          minWidth: '40px',
          textAlign: 'center'
        }}>
          {commits}
        </div>
      </div>
      
      {/* Lista de commits */}
      <CommitsList commits={authorCommits} author={author} />
    </div>
  );
});

AuthorCard.displayName = 'AuthorCard';

export default AuthorCard;
