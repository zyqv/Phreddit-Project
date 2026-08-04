export default function NavBar({
  communities,
  selectedView,
  selectedCommunityID,
  onHome,
  onCreateCommunity,
  onSelectCommunity,
}) {
  return (
    <aside className="leftnav">
      <button
        type="button"
        id="home-button"
        className={`nav-link ${selectedView === 'home' ? 'selected' : ''}`.trim()}
        onClick={onHome}
      >
        Home
      </button>
      <div className="sidebar-divider" />
      <h3 id="com">Communities</h3>
      <button
        type="button"
        id="com-button"
        className={`nav-button${selectedView === 'createCommunity' ? ' selected' : ''}`}
        onClick={onCreateCommunity}
      >
        Create Community
      </button>
      <div id="community-list">
        {communities.map((community) => (
          <button
            key={community.communityID}
            type="button"
            className={`community-link ${
              selectedView === 'community' && selectedCommunityID === community.communityID
                ? 'selected'
                : ''
            }`.trim()}
            onClick={() => onSelectCommunity(community.communityID)}
          >
            {community.name}
          </button>
        ))}
      </div>
    </aside>
  );
}
