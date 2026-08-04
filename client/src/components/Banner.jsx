export default function Banner({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onHome,
  onCreatePost,
  createPostSelected,
}) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <header className="header">
      <button type="button" id="header-title" className="title-link" onClick={onHome}>
        phreddit
      </button>

      <div id="search-bar">
        <input
          id="search-input"
          type="text"
          placeholder="Search Phreddit..."
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button
        type="button"
        id="create-button"
        className={`banner-button${createPostSelected ? ' selected' : ''}`}
        onClick={onCreatePost}
      >
        Create Post
      </button>
    </header>
  );
}