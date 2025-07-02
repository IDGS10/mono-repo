import { Octokit } from "@octokit/core";

let octokit = new Octokit();

export const setGitHubToken = (token) => {
  octokit = new Octokit({ auth: token });
};

export const getBranches = async (owner, repo) => {
  try {
    const response = await octokit.request(
      'GET /repos/{owner}/{repo}/branches',
      {
        owner,
        repo,
        per_page: 100
      }
    );
    
    return response.data.map(branch => branch.name);
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
};

export const getBranchActivity = async (owner, repo, branch) => {
  try {
    const response = await octokit.request(
      'GET /repos/{owner}/{repo}/commits',
      {
        owner,
        repo,
        sha: branch,
        per_page: 100
      }
    );
    
    // Procesar los commits para contar por autor y obtener información detallada
    const commitsByAuthor = {};
    const authorDetails = {};
    const commitDetails = {};
    
    response.data.forEach(commit => {
      const author = commit.author?.login || 'Unknown';
      const authorData = commit.author;
      
      // Contar commits por autor
      commitsByAuthor[author] = (commitsByAuthor[author] || 0) + 1;
      
      // Guardar detalles del autor
      if (authorData && !authorDetails[author]) {
        authorDetails[author] = {
          login: authorData.login,
          avatar_url: authorData.avatar_url,
          html_url: authorData.html_url,
          id: authorData.id
        };
      }
      
      // Guardar detalles de commits por autor
      if (!commitDetails[author]) {
        commitDetails[author] = [];
      }
      
      commitDetails[author].push({
        sha: commit.sha,
        message: commit.commit.message,
        date: commit.commit.author.date,
        url: commit.html_url,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        total: commit.stats?.total || 0
      });
    });
    
    return {
      branch,
      totalCommits: response.data.length,
      commitsByAuthor,
      authorDetails,
      commitDetails,
      commits: response.data
    };
  } catch (error) {
    console.error('Error fetching branch activity:', error);
    throw error;
  }
};

export const getAllBranchesActivity = async (owner, repo) => {
  try {
    // Obtener todas las ramas
    const branches = await getBranches(owner, repo);
    
    // Obtener actividad de todas las ramas
    const allBranchesData = await Promise.all(
      branches.map(async (branch) => {
        try {
          return await getBranchActivity(owner, repo, branch);
        } catch (error) {
          console.warn(`Error fetching data for branch ${branch}:`, error);
          return null;
        }
      })
    );
    
    // Filtrar ramas que fallaron
    const validBranchesData = allBranchesData.filter(data => data !== null);
    
    // Combinar datos de todas las ramas
    const combinedCommitsByAuthor = {};
    const combinedAuthorDetails = {};
    const combinedCommitDetails = {};
    const branchStats = {};
    let totalCommitsAllBranches = 0;
    
    validBranchesData.forEach(branchData => {
      branchStats[branchData.branch] = {
        totalCommits: branchData.totalCommits,
        authors: Object.keys(branchData.commitsByAuthor).length
      };
      
      totalCommitsAllBranches += branchData.totalCommits;
      
      // Combinar commits por autor
      Object.entries(branchData.commitsByAuthor).forEach(([author, count]) => {
        combinedCommitsByAuthor[author] = (combinedCommitsByAuthor[author] || 0) + count;
      });
      
      // Combinar detalles de autores
      Object.entries(branchData.authorDetails).forEach(([author, details]) => {
        if (!combinedAuthorDetails[author]) {
          combinedAuthorDetails[author] = details;
        }
      });
      
      // Combinar detalles de commits
      Object.entries(branchData.commitDetails).forEach(([author, commits]) => {
        if (!combinedCommitDetails[author]) {
          combinedCommitDetails[author] = [];
        }
        combinedCommitDetails[author] = [...combinedCommitDetails[author], ...commits];
      });
    });
    
    return {
      branch: 'ALL_BRANCHES',
      totalCommits: totalCommitsAllBranches,
      commitsByAuthor: combinedCommitsByAuthor,
      authorDetails: combinedAuthorDetails,
      commitDetails: combinedCommitDetails,
      branchStats,
      branches: branches
    };
  } catch (error) {
    console.error('Error fetching all branches activity:', error);
    throw error;
  }
};

export const getRepositoryStats = async (owner, repo) => {
  try {
    const [repoResponse, contributorsResponse] = await Promise.all([
      octokit.request('GET /repos/{owner}/{repo}', { owner, repo }),
      octokit.request('GET /repos/{owner}/{repo}/contributors', { owner, repo, per_page: 100 })
    ]);
    
    return {
      repository: {
        name: repoResponse.data.name,
        description: repoResponse.data.description,
        stars: repoResponse.data.stargazers_count,
        forks: repoResponse.data.forks_count,
        watchers: repoResponse.data.watchers_count,
        language: repoResponse.data.language,
        created_at: repoResponse.data.created_at,
        updated_at: repoResponse.data.updated_at,
        size: repoResponse.data.size,
        open_issues: repoResponse.data.open_issues_count
      },
      contributors: contributorsResponse.data.map(contributor => ({
        login: contributor.login,
        avatar_url: contributor.avatar_url,
        html_url: contributor.html_url,
        contributions: contributor.contributions,
        type: contributor.type
      }))
    };
  } catch (error) {
    console.error('Error fetching repository stats:', error);
    throw error;
  }
};