import { formatTimestamp, getPreviewText, renderTextWithLinks } from './utils.jsx';

function SortButtons({ currentSort, onSortChange }) {
  return (
    <div className="buttons">
      <button
        type="button"
        id="Newest"
        className={`sort-button${currentSort === 'newest' ? ' selected' : ''}`}
        onClick={() => onSortChange('newest')}
      >
        Newest
      </button>
      <button
        type="button"
        id="Oldest"
        className={`sort-button${currentSort === 'oldest' ? ' selected' : ''}`}
        onClick={() => onSortChange('oldest')}
      >
        Oldest
      </button>
      <button
        type="button"
        id="Active"
        className={`sort-button${currentSort === 'active' ? ' selected' : ''}`}
        onClick={() => onSortChange('active')}
      >
        Active
      </button>
    </div>
  );
}

export default function PostList({
  title,
  subtitle,
  communityMeta,
  posts,
  model,
  showCommunityName,
  currentSort,
  onSortChange,
  onOpenPost,
  emptyText,
  showPostCountLine = true,
}) {
  return (
    <div>
      <div className="homepage-header">
        <div>
          <h2 id="AllPosts">{title}</h2>
          {subtitle ? (
            <div className="community-description content-rich">{renderTextWithLinks(subtitle)}</div>
          ) : null}
          {communityMeta ? (
            <div className="community-meta-block">
              <p className="community-created">{communityMeta.createdLabel}</p>
              <p className="community-posts-members">
                <span>Posts: {communityMeta.postCount}</span>
                <span className="community-meta-sep"> · </span>
                <span>Members: {communityMeta.memberCount}</span>
              </p>
            </div>
          ) : null}
        </div>
        <SortButtons currentSort={currentSort} onSortChange={onSortChange} />
      </div>
      {showPostCountLine ? (
        <p id="post-count">{posts.length} posts</p>
      ) : null}
      <div id="post-list">
        {posts.length === 0 && emptyText ? (
          <p className="search-empty-hint">{emptyText}</p>
        ) : null}
        {posts.map((post) => {
          const community = model.getCommunityForPost(post.postID);
          const flair = model.getLinkFlair(post.linkFlairID);
          const commentCount = model.countAllComments(post.commentIDs);

          return (
            <button
              key={post.postID}
              type="button"
              className="post post-listing"
              onClick={() => onOpenPost(post.postID)}
            >
              <div className="post-meta">
                {showCommunityName && community ? `${community.name} · ` : ''}
                {post.postedBy} · {formatTimestamp(post.postedDate)}
              </div>
              <h4 className="post-title">{post.title}</h4>
              {flair ? <div className="post-flair">{flair.content}</div> : null}
              <p className="post-preview">{getPreviewText(post.content)}</p>
              <div className="count-line post-stats">
                <span>Views: {post.views}</span>
                <span>Comments: {commentCount}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}