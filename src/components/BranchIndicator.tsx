import './BranchIndicator.css';

const BranchIndicator = () => {
  const branch = import.meta.env.VITE_DEPLOY_BRANCH;

  // Don't render if no branch is set (local development)
  if (!branch) {
    return null;
  }

  return (
    <div className="branch-indicator" data-branch={branch}>
      <span className="branch-indicator__label">Branch:</span>
      <span className="branch-indicator__value">{branch}</span>
    </div>
  );
};

export default BranchIndicator;
