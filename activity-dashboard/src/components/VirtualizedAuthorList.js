import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AuthorCard from './AuthorCard';

const AuthorItem = memo(({ index, style, data }) => {
  const { sortedAuthors, authorDetails, commitDetails } = data;
  const [author, commits] = sortedAuthors[index];
  
  return (
    <div style={style}>
      <AuthorCard
        author={author}
        commits={commits}
        authorDetails={authorDetails}
        commitDetails={commitDetails}
      />
    </div>
  );
});

AuthorItem.displayName = 'AuthorItem';

const VirtualizedAuthorList = memo(({ data }) => {
  const { commitsByAuthor, authorDetails, commitDetails } = data;
  
  const sortedAuthors = useMemo(() => {
    return Object.entries(commitsByAuthor || {})
      .sort(([,a], [,b]) => b - a);
  }, [commitsByAuthor]);
  
  const listData = useMemo(() => ({
    sortedAuthors,
    authorDetails: authorDetails || {},
    commitDetails: commitDetails || {}
  }), [sortedAuthors, authorDetails, commitDetails]);
  
  const itemHeight = 160; // Altura estimada de cada AuthorCard
  const maxHeight = Math.min(sortedAuthors.length * itemHeight, 600);
  const actualHeight = sortedAuthors.length > 5 ? maxHeight : sortedAuthors.length * itemHeight;
  
  if (!sortedAuthors.length) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6c757d'
      }}>
        No hay datos de contribuidores disponibles
      </div>
    );
  }
  
  // Si hay pocos elementos, renderizar normalmente para mejor UX
  if (sortedAuthors.length <= 5) {
    return (
      <div>
        {sortedAuthors.map(([author, commits]) => (
          <AuthorCard
            key={author}
            author={author}
            commits={commits}
            authorDetails={authorDetails}
            commitDetails={commitDetails}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div style={{
      height: actualHeight,
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <List
        height={actualHeight}
        itemCount={sortedAuthors.length}
        itemSize={itemHeight}
        itemData={listData}
        overscanCount={3}
      >
        {AuthorItem}
      </List>
    </div>
  );
});

VirtualizedAuthorList.displayName = 'VirtualizedAuthorList';

export default VirtualizedAuthorList;
