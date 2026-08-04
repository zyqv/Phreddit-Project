import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { formatTimestamp, getPreviewText, renderTextWithLinks } from './utils.jsx';

const API_BASE = 'http://127.0.0.1:8000/api';

function toDate(value) {
  return value ? new Date(value) : new Date();
}

function FieldError({ message }) {
  return message ? <div className="error">{message}</div> : null;
}

function SortButtons({ currentSort, onSortChange }) {
  return (
    <div className="buttons">
      {['newest', 'oldest', 'active'].map((sort) => (
        <button
          key={sort}
          type="button"
          className={`sort-button${currentSort === sort ? ' selected' : ''}`}
          onClick={() => onSortChange(sort)}
        >
          {sort[0].toUpperCase() + sort.slice(1)}
        </button>
      ))}
    </div>
  );
}

function Welcome({ onGuest, onLogin, onRegister, error }) {
  return (
    <main className="welcome-page">
      <h1>phreddit</h1>
      <p>Welcome to Phreddit.</p>
      <div className="welcome-actions">
        <button type="button" className="action-button" onClick={onRegister}>Register as a new user</button>
        <button type="button" className="action-button" onClick={onLogin}>Login as an existing user</button>
        <button type="button" className="action-button" onClick={onGuest}>Continue as guest</button>
      </div>
      <FieldError message={error} />
    </main>
  );
}

function AuthForm({ mode, onSubmit, onBack, serverError }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', displayName: '', password: '', passwordConfirm: '' });
  const [errors, setErrors] = useState({});
  const isRegister = mode === 'register';

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  function submit() {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    if (!form.password) next.password = 'Password is required.';
    if (isRegister) {
      if (!form.firstName.trim()) next.firstName = 'First name is required.';
      if (!form.lastName.trim()) next.lastName = 'Last name is required.';
      if (!form.displayName.trim()) next.displayName = 'Display name is required.';
      if (form.password !== form.passwordConfirm) next.passwordConfirm = 'Passwords must match.';
    }
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(form);
  }

  return (
    <main className="welcome-page auth-form">
      <h1>{isRegister ? 'Create Account' : 'Login'}</h1>
      {isRegister ? (
        <>
          <label>First Name <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></label>
          <FieldError message={errors.firstName} />
          <label>Last Name <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></label>
          <FieldError message={errors.lastName} />
          <label>Display Name <input value={form.displayName} onChange={(e) => update('displayName', e.target.value)} /></label>
          <FieldError message={errors.displayName} />
        </>
      ) : null}
      <label>Email <input value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
      <FieldError message={errors.email} />
      <label>Password <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} /></label>
      <FieldError message={errors.password} />
      {isRegister ? (
        <>
          <label>Confirm Password <input type="password" value={form.passwordConfirm} onChange={(e) => update('passwordConfirm', e.target.value)} /></label>
          <FieldError message={errors.passwordConfirm} />
        </>
      ) : null}
      <FieldError message={serverError} />
      <div className="welcome-actions row-actions">
        <button type="button" className="action-button" onClick={submit}>{isRegister ? 'Sign Up' : 'Login'}</button>
        <button type="button" className="action-button" onClick={onBack}>Back</button>
      </div>
    </main>
  );
}

function Banner({ currentUser, searchValue, setSearchValue, submitSearch, onTitle, onCreatePost, onProfile, onLogout, createPostSelected }) {
  const loggedIn = Boolean(currentUser);
  return (
    <header className="header">
      <button type="button" id="header-title" className="title-link" onClick={onTitle}>phreddit</button>
      <div id="search-bar">
        <input
          id="search-input"
          type="text"
          placeholder="Search Phreddit..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') submitSearch(); }}
        />
      </div>
      <button type="button" id="create-button" className={`banner-button${createPostSelected ? ' selected' : ''}`} disabled={!loggedIn} onClick={onCreatePost}>Create Post</button>
      <button type="button" className="banner-button" disabled={!loggedIn} onClick={onProfile}>{loggedIn ? currentUser.displayName : 'Guest'}</button>
      {loggedIn ? <button type="button" className="banner-button" onClick={onLogout}>Logout</button> : null}
    </header>
  );
}

function NavBar({ communities, currentUser, selectedView, selectedCommunityID, onHome, onCreateCommunity, onSelectCommunity }) {
  return (
    <aside className="leftnav">
      <button type="button" id="home-button" className={`nav-link ${selectedView === 'home' ? 'selected' : ''}`.trim()} onClick={onHome}>Home</button>
      <div className="sidebar-divider" />
      <h3 id="com">Communities</h3>
      <button type="button" id="com-button" className={`nav-button${selectedView === 'createCommunity' ? ' selected' : ''}`} disabled={!currentUser} onClick={onCreateCommunity}>Create Community</button>
      <div id="community-list">
        {communities.map((community) => (
          <button key={community.communityID} type="button" className={`community-link ${selectedView === 'community' && selectedCommunityID === community.communityID ? 'selected' : ''}`.trim()} onClick={() => onSelectCommunity(community.communityID)}>
            {community.name}
          </button>
        ))}
      </div>
    </aside>
  );
}

function makeModel(data) {
  const communityMap = new Map(data.communities.map((community) => [community.communityID, community]));
  const postMap = new Map(data.posts.map((post) => [post.postID, post]));
  const commentMap = new Map(data.comments.map((comment) => [comment.commentID, comment]));
  const flairMap = new Map(data.linkFlairs.map((flair) => [flair.linkFlairID, flair]));

  function getCommentsByID(ids = []) {
    return ids.map((commentID) => commentMap.get(commentID)).filter(Boolean);
  }

  function countAllComments(ids = []) {
    return ids.reduce((count, commentID) => {
      const comment = commentMap.get(commentID);
      return comment ? count + 1 + countAllComments(comment.commentIDs || []) : count;
    }, 0);
  }

  function collectCommentText(ids = []) {
    return ids.map((commentID) => {
      const comment = commentMap.get(commentID);
      return comment ? `${comment.content} ${collectCommentText(comment.commentIDs || [])}` : '';
    }).join(' ');
  }

  function getLatestCommentDateForPost(post) {
    let latest = post.postedDate;
    function visit(ids = []) {
      ids.forEach((commentID) => {
        const comment = commentMap.get(commentID);
        if (comment) {
          if (comment.commentedDate > latest) latest = comment.commentedDate;
          visit(comment.commentIDs || []);
        }
      });
    }
    visit(post.commentIDs || []);
    return latest;
  }

  function postHasComment(post, targetCommentID) {
    function visit(ids = []) {
      return ids.some((commentID) => {
        if (commentID === targetCommentID) return true;
        const comment = commentMap.get(commentID);
        return comment ? visit(comment.commentIDs || []) : false;
      });
    }
    return visit(post.commentIDs || []);
  }

  function getPostForComment(commentID) {
    return data.posts.find((post) => postHasComment(post, commentID));
  }

  return {
    getCommunityByID: (id) => communityMap.get(id),
    getPostByID: (id) => postMap.get(id),
    getCommentByID: (id) => commentMap.get(id),
    getUserByID: (id) => data.users.find((user) => user.userID === id),
    getLinkFlair: (id) => flairMap.get(id),
    getCommentsByID,
    countAllComments,
    getLatestCommentDateForPost,
    getPostForComment,
    getCommunityForPost: (postID) => data.communities.find((community) => (community.postIDs || []).includes(postID)),
    getCommunityPosts: (communityID) => ((communityMap.get(communityID) || {}).postIDs || []).map((postID) => postMap.get(postID)).filter(Boolean),
    searchPosts: (text) => {
      const terms = text.toLowerCase().split(/\s+/).filter(Boolean);
      return data.posts.filter((post) => {
        const haystack = `${post.title} ${post.content} ${collectCommentText(post.commentIDs)}`.toLowerCase();
        return terms.some((term) => haystack.includes(term));
      });
    },
  };
}

function sortPosts(posts, model, currentSort) {
  const sorted = [...posts];
  if (currentSort === 'newest') sorted.sort((a, b) => b.postedDate - a.postedDate);
  if (currentSort === 'oldest') sorted.sort((a, b) => a.postedDate - b.postedDate);
  if (currentSort === 'active') {
    sorted.sort((a, b) => {
      const diff = model.getLatestCommentDateForPost(b) - model.getLatestCommentDateForPost(a);
      return diff || b.postedDate - a.postedDate;
    });
  }
  return sorted;
}

function splitJoinedFirst(posts, model, currentUser) {
  if (!currentUser) return posts;
  const joined = [];
  const other = [];
  posts.forEach((post) => {
    const community = model.getCommunityForPost(post.postID);
    if (community && community.members.includes(currentUser.userID)) joined.push(post);
    else other.push(post);
  });
  return [...joined, ...(joined.length && other.length ? [{ isDivider: true, postID: 'divider' }] : []), ...other];
}

function PostList({ title, subtitle, communityMeta, posts, model, showCommunityName, currentSort, onSortChange, onOpenPost, emptyText }) {
  return (
    <div>
      <div className="homepage-header">
        <div>
          <h2 id="AllPosts">{title}</h2>
          {subtitle ? <div className="community-description content-rich">{renderTextWithLinks(subtitle)}</div> : null}
          {communityMeta ? (
            <div className="community-meta-block">
              <p className="community-created">Created {formatTimestamp(communityMeta.startDate)} by {communityMeta.creatorName}</p>
              <p className="community-posts-members"><span>Posts: {communityMeta.postCount}</span><span className="community-meta-sep"> · </span><span>Members: {communityMeta.memberCount}</span></p>
              {communityMeta.membershipButton}
            </div>
          ) : null}
        </div>
        <SortButtons currentSort={currentSort} onSortChange={onSortChange} />
      </div>
      <p id="post-count">{posts.filter((post) => !post.isDivider).length} posts</p>
      <div id="post-list">
        {posts.length === 0 && emptyText ? <p className="search-empty-hint">{emptyText}</p> : null}
        {posts.map((post) => {
          if (post.isDivider) return <div key="divider" className="sublist-divider">Posts from other communities</div>;
          const community = model.getCommunityForPost(post.postID);
          const flair = model.getLinkFlair(post.linkFlairID);
          return (
            <button key={post.postID} type="button" className="post post-listing" onClick={() => onOpenPost(post.postID)}>
              <div className="post-meta">{showCommunityName && community ? `${community.name} · ` : ''}{post.postedByName} · {formatTimestamp(post.postedDate)}</div>
              <h4 className="post-title">{post.title}</h4>
              {flair ? <div className="post-flair">{flair.content}</div> : null}
              <p className="post-preview">{getPreviewText(post.content)}</p>
              <div className="count-line post-stats"><span>Views: {post.views}</span><span>Comments: {model.countAllComments(post.commentIDs)}</span><span>Upvotes: {post.upvotes}</span><span>Downvotes: {post.downvotes}</span></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VoteButtons({ item, type, currentUser, onVote }) {
  if (!currentUser) return null;
  const alreadyVoted = item.votes?.some((vote) => vote.user === currentUser.userID);
  const disabled = alreadyVoted || currentUser.reputation < 50;
  return (
    <div className="vote-actions">
      <button type="button" className="action-button small" disabled={disabled} onClick={() => onVote(type, item[`${type}ID`], 'up')}>Upvote</button>
      <button type="button" className="action-button small" disabled={disabled} onClick={() => onVote(type, item[`${type}ID`], 'down')}>Downvote</button>
    </div>
  );
}

function CommentItem({ comment, model, currentUser, onReply, onVote }) {
  const replies = model.getCommentsByID(comment.commentIDs || []).sort((a, b) => b.commentedDate - a.commentedDate);
  return (
    <div className="comment">
      <div className="comment-meta">{comment.commentedByName} · {formatTimestamp(comment.commentedDate)}</div>
      <div className="comment-content">{renderTextWithLinks(comment.content)}</div>
      <div className="count-line post-stats"><span>Upvotes: {comment.upvotes}</span><span>Downvotes: {comment.downvotes}</span></div>
      <VoteButtons item={comment} type="comment" currentUser={currentUser} onVote={onVote} />
      {currentUser ? <button type="button" className="reply-btn" onClick={() => onReply(comment.commentID)}>Reply</button> : null}
      {replies.map((reply) => <CommentItem key={reply.commentID} comment={reply} model={model} currentUser={currentUser} onReply={onReply} onVote={onVote} />)}
    </div>
  );
}

function PostPage({ post, model, currentUser, onAddComment, onReply, onVote }) {
  const community = model.getCommunityForPost(post.postID);
  const flair = model.getLinkFlair(post.linkFlairID);
  const comments = model.getCommentsByID(post.commentIDs || []).sort((a, b) => b.commentedDate - a.commentedDate);
  return (
    <div className="post-page">
      <div className="post-meta">{community?.name} · {formatTimestamp(post.postedDate)}</div>
      <div className="post-username">{post.postedByName}</div>
      <h2 className="post-page-title">{post.title}</h2>
      {flair ? <div className="post-flair">{flair.content}</div> : null}
      <div className="post-content-full">{renderTextWithLinks(post.content)}</div>
      <div className="count-line post-stats"><span>Views: {post.views}</span><span>Comments: {model.countAllComments(post.commentIDs)}</span><span>Upvotes: {post.upvotes}</span><span>Downvotes: {post.downvotes}</span></div>
      <VoteButtons item={post} type="post" currentUser={currentUser} onVote={onVote} />
      {currentUser ? <button type="button" className="action-button add-comment" onClick={onAddComment}>Add a comment</button> : null}
      <hr />
      {comments.map((comment) => <CommentItem key={comment.commentID} comment={comment} model={model} currentUser={currentUser} onReply={onReply} onVote={onVote} />)}
    </div>
  );
}

function CommunityForm({ initial, onSubmit, onDelete }) {
  const [form, setForm] = useState({ name: initial?.name || '', description: initial?.description || '' });
  const [error, setError] = useState('');
  function submit() {
    if (!form.name.trim()) return setError('Community name cannot be empty.');
    if (form.name.trim().length > 100) return setError('Community name cannot exceed 100 characters.');
    if (!form.description.trim()) return setError('Description cannot be empty.');
    if (form.description.trim().length > 500) return setError('Description cannot exceed 500 characters.');
    setError('');
    return onSubmit({ name: form.name.trim(), description: form.description.trim() });
  }
  return (
    <div className="form-page">
      <h2>{initial ? 'Edit Community' : 'Create Community'}</h2>
      <label>Community Name <input maxLength="100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Description <textarea maxLength="500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <FieldError message={error} />
      <button type="button" className="action-button" onClick={submit}>{initial ? 'Save Community' : 'Engender Community'}</button>
      {initial ? <button type="button" className="action-button danger" onClick={onDelete}>Delete Community</button> : null}
    </div>
  );
}

function PostForm({ initial, communities, flairs, currentUser, onSubmit, onDelete }) {
  const [form, setForm] = useState({ communityID: initial?.communityID || '', title: initial?.title || '', linkFlairID: initial?.linkFlairID || '', newFlair: '', content: initial?.content || '' });
  const [error, setError] = useState('');
  function submit() {
    if (!form.communityID) return setError('Please select a community.');
    if (!form.title.trim()) return setError('Title cannot be empty.');
    if (form.title.trim().length > 100) return setError('Title cannot exceed 100 characters.');
    if (form.newFlair.trim().length > 30) return setError('New flair cannot exceed 30 characters.');
    if (!form.content.trim()) return setError('Content cannot be empty.');
    setError('');
    return onSubmit({ ...form, title: form.title.trim(), content: form.content.trim(), newFlair: form.newFlair.trim(), creatorID: currentUser.userID });
  }
  return (
    <div className="form-page create-post">
      <h2>{initial ? 'Edit Post' : 'Create Post'}</h2>
      <label>Community <select value={form.communityID} onChange={(e) => setForm({ ...form, communityID: e.target.value })}><option value="">-- Select a community --</option>{communities.map((community) => <option key={community.communityID} value={community.communityID}>{community.name}</option>)}</select></label>
      <label>Title <input maxLength="100" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label>Existing Link Flair <select value={form.linkFlairID} onChange={(e) => setForm({ ...form, linkFlairID: e.target.value })}><option value="">None</option>{flairs.map((flair) => <option key={flair.linkFlairID} value={flair.linkFlairID}>{flair.content}</option>)}</select></label>
      <label>Or New Link Flair <input maxLength="30" value={form.newFlair} onChange={(e) => setForm({ ...form, newFlair: e.target.value })} /></label>
      <label>Content <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
      <FieldError message={error} />
      <button type="button" className="action-button" onClick={submit}>{initial ? 'Save Post' : 'Submit Post'}</button>
      {initial ? <button type="button" className="action-button danger" onClick={onDelete}>Delete Post</button> : null}
    </div>
  );
}

function CommentForm({ initial, isReply, onSubmit, onDelete }) {
  const [content, setContent] = useState(initial?.content || '');
  const [error, setError] = useState('');
  function submit() {
    if (!content.trim()) return setError('Content cannot be empty.');
    if (content.trim().length > 500) return setError('Content cannot exceed 500 characters.');
    setError('');
    return onSubmit(content.trim());
  }
  return (
    <div className="form-page create-comment">
      <h2>{initial ? 'Edit Comment' : isReply ? 'Reply' : 'Add a comment'}</h2>
      <label>Content <textarea maxLength="500" value={content} onChange={(e) => setContent(e.target.value)} /></label>
      <FieldError message={error} />
      <button type="button" className="action-button" onClick={submit}>{initial ? 'Save Comment' : 'Submit Comment'}</button>
      {initial ? <button type="button" className="action-button danger" onClick={onDelete}>Delete Comment</button> : null}
    </div>
  );
}

function Profile({ user, adminUser, data, model, onEditCommunity, onEditPost, onEditComment, onViewUser, onDeleteUser, onBackAdmin }) {
  const [tab, setTab] = useState(adminUser?.isAdmin && adminUser.userID === user.userID ? 'users' : 'posts');
  const isAdminOwnProfile = adminUser?.isAdmin && adminUser.userID === user.userID;
  const communities = data.communities.filter((community) => community.creator === user.userID);
  const posts = data.posts.filter((post) => post.postedBy === user.userID);
  const comments = data.comments.filter((comment) => comment.commentedBy === user.userID);
  const nonAdminUsers = data.users.filter((item) => !item.isAdmin);
  return (
    <div className="profile-page">
      {adminUser?.isAdmin && adminUser.userID !== user.userID ? <button type="button" className="action-button" onClick={onBackAdmin}>Back to admin profile</button> : null}
      <h2>{user.displayName}</h2>
      <p>Email: {user.email}</p>
      <p>Member since: {formatTimestamp(toDate(user.createdAt))}</p>
      <p>Reputation: {user.reputation}</p>
      <div className="buttons profile-tabs">
        {isAdminOwnProfile ? <button type="button" className={`sort-button${tab === 'users' ? ' selected' : ''}`} onClick={() => setTab('users')}>Users</button> : null}
        <button type="button" className={`sort-button${tab === 'posts' ? ' selected' : ''}`} onClick={() => setTab('posts')}>Posts</button>
        <button type="button" className={`sort-button${tab === 'communities' ? ' selected' : ''}`} onClick={() => setTab('communities')}>Communities</button>
        <button type="button" className={`sort-button${tab === 'comments' ? ' selected' : ''}`} onClick={() => setTab('comments')}>Comments</button>
      </div>
      <div className="profile-list">
        {tab === 'users' && nonAdminUsers.map((item) => <div key={item.userID} className="profile-row"><button type="button" className="text-link" onClick={() => onViewUser(item.userID)}>{item.displayName} · {item.email} · Reputation: {item.reputation}</button><button type="button" className="action-button small danger" onClick={() => onDeleteUser(item.userID)}>Delete</button></div>)}
        {tab === 'communities' && (communities.length ? communities.map((community) => <button key={community.communityID} type="button" className="text-link block" onClick={() => onEditCommunity(community.communityID)}>{community.name}</button>) : <p>No communities to display.</p>)}
        {tab === 'posts' && (posts.length ? posts.map((post) => <button key={post.postID} type="button" className="text-link block" onClick={() => onEditPost(post.postID)}>{post.title}</button>) : <p>No posts to display.</p>)}
        {tab === 'comments' && (comments.length ? comments.map((comment) => {
          const post = model.getPostForComment(comment.commentID);
          return <button key={comment.commentID} type="button" className="text-link block" onClick={() => onEditComment(comment.commentID)}>{post?.title || 'Post'} · {comment.content.slice(0, 20)}</button>;
        }) : <p>No comments to display.</p>)}
        {tab === 'users' && nonAdminUsers.length === 0 ? <p>No users to display.</p> : null}
      </div>
    </div>
  );
}

export default function Phreddit() {
  const [data, setData] = useState({ users: [], communities: [], posts: [], comments: [], linkFlairs: [] });
  const [currentUser, setCurrentUser] = useState(null);
  const [mode, setMode] = useState('welcome');
  const [view, setView] = useState({ type: 'home' });
  const [searchValue, setSearchValue] = useState('');
  const [currentSort, setCurrentSort] = useState('newest');
  const [error, setError] = useState('');

  async function refreshData() {
    const response = await axios.get(`${API_BASE}/data`);
    const next = {
      users: response.data.users.map((user) => ({ ...user, createdAt: toDate(user.createdAt) })),
      communities: response.data.communities.map((community) => ({ ...community, startDate: toDate(community.startDate) })),
      posts: response.data.posts.map((post) => ({ ...post, postedDate: toDate(post.postedDate) })),
      comments: response.data.comments.map((comment) => ({ ...comment, commentedDate: toDate(comment.commentedDate) })),
      linkFlairs: response.data.linkFlairs,
    };
    setData(next);
    setCurrentUser((old) => old ? next.users.find((user) => user.userID === old.userID) || null : null);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refreshData().catch(() => setError('Could not load application data.')); }, []);

  const model = useMemo(() => makeModel(data), [data]);
  const selectedCommunityID = view.type === 'community' ? view.communityID : '';

  function sortedCommunities() {
    if (!currentUser) return data.communities;
    return [...data.communities].sort((a, b) => Number(b.members.includes(currentUser.userID)) - Number(a.members.includes(currentUser.userID)) || a.name.localeCompare(b.name));
  }

  function sortedPostsForDisplay(posts) {
    return splitJoinedFirst(sortPosts(posts, model, currentSort), model, currentUser);
  }

  function openHome() { setCurrentSort('newest'); setView({ type: 'home' }); }
  function openCommunity(communityID) { setCurrentSort('newest'); setView({ type: 'community', communityID }); }
  async function openPost(postID) { await axios.patch(`${API_BASE}/posts/${postID}/views`); await refreshData(); setView({ type: 'post', postID }); }
  function submitSearch() { setCurrentSort('newest'); setView({ type: 'search', searchText: searchValue.trim() }); }

  async function request(action, fallbackMessage) {
    try { setError(''); await action(); await refreshData(); }
    catch (err) { setError(err.response?.data?.error || fallbackMessage); }
  }

  async function handleVote(type, itemID, vote) {
    await request(async () => axios.patch(`${API_BASE}/${type}s/${itemID}/vote`, { userID: currentUser.userID, vote }), 'Vote failed.');
  }

  if (mode === 'welcome') {
    return <Welcome error={error} onGuest={() => { setCurrentUser(null); setMode('app'); openHome(); }} onLogin={() => { setError(''); setMode('login'); }} onRegister={() => { setError(''); setMode('register'); }} />;
  }

  if (mode === 'login' || mode === 'register') {
    return (
      <AuthForm
        mode={mode}
        serverError={error}
        onBack={() => { setError(''); setMode('welcome'); }}
        onSubmit={async (form) => {
          try {
            setError('');
            if (mode === 'register') {
              await axios.post(`${API_BASE}/users/register`, form);
              setMode('welcome');
            } else {
              const response = await axios.post(`${API_BASE}/users/login`, form);
              setCurrentUser(response.data);
              setMode('app');
              openHome();
            }
            await refreshData();
          } catch (err) { setError(err.response?.data?.error || 'Request failed.'); }
        }}
      />
    );
  }

  const content = (() => {
    if (view.type === 'home') {
      return <PostList title="All Posts" posts={sortedPostsForDisplay(data.posts)} model={model} showCommunityName currentSort={currentSort} onSortChange={setCurrentSort} onOpenPost={openPost} />;
    }
    if (view.type === 'search') {
      const posts = view.searchText ? model.searchPosts(view.searchText) : [];
      return <PostList title={posts.length ? `Results for: ${view.searchText}` : `No results found for: ${view.searchText}`} posts={sortedPostsForDisplay(posts)} model={model} showCommunityName currentSort={currentSort} onSortChange={setCurrentSort} onOpenPost={openPost} emptyText="No posts matched your search." />;
    }
    if (view.type === 'community') {
      const community = model.getCommunityByID(view.communityID);
      if (!community) return <p>Community not found.</p>;
      const isMember = currentUser && community.members.includes(currentUser.userID);
      const membershipButton = currentUser ? <button type="button" className="action-button small" onClick={() => request(async () => axios.patch(`${API_BASE}/communities/${community.communityID}/membership`, { userID: currentUser.userID, action: isMember ? 'leave' : 'join' }), 'Membership update failed.')}>{isMember ? 'Leave Community' : 'Join Community'}</button> : null;
      return <PostList title={community.name} subtitle={community.description} communityMeta={{ ...community, postCount: community.postIDs.length, membershipButton }} posts={sortPosts(model.getCommunityPosts(community.communityID), model, currentSort)} model={model} showCommunityName={false} currentSort={currentSort} onSortChange={setCurrentSort} onOpenPost={openPost} />;
    }
    if (view.type === 'post') {
      const post = model.getPostByID(view.postID);
      if (!post) return <p>Post not found.</p>;
      return <PostPage post={post} model={model} currentUser={currentUser} onAddComment={() => setView({ type: 'newComment', postID: post.postID, parentType: 'post' })} onReply={(commentID) => setView({ type: 'newComment', postID: post.postID, parentType: 'comment', parentID: commentID })} onVote={handleVote} />;
    }
    if (view.type === 'createCommunity') {
      return <CommunityForm onSubmit={(form) => request(async () => { const response = await axios.post(`${API_BASE}/communities`, { ...form, creatorID: currentUser.userID }); setView({ type: 'community', communityID: response.data.communityID }); }, 'Community could not be saved.')} />;
    }
    if (view.type === 'editCommunity') {
      const community = model.getCommunityByID(view.communityID);
      return <CommunityForm initial={community} onSubmit={(form) => request(async () => { await axios.put(`${API_BASE}/communities/${community.communityID}`, form); setView({ type: 'community', communityID: community.communityID }); }, 'Community could not be saved.')} onDelete={() => { if (confirm('Delete this community and all of its posts and comments?')) request(async () => { await axios.delete(`${API_BASE}/communities/${community.communityID}`); setView({ type: 'profile', userID: currentUser.userID }); }, 'Community could not be deleted.'); }} />;
    }
    if (view.type === 'createPost') {
      const communities = currentUser ? [...data.communities].sort((a, b) => Number(b.members.includes(currentUser.userID)) - Number(a.members.includes(currentUser.userID)) || a.name.localeCompare(b.name)) : data.communities;
      return <PostForm communities={communities} flairs={data.linkFlairs} currentUser={currentUser} onSubmit={(form) => request(async () => { await axios.post(`${API_BASE}/posts`, form); openHome(); }, 'Post could not be saved.')} />;
    }
    if (view.type === 'editPost') {
      const post = model.getPostByID(view.postID);
      const community = model.getCommunityForPost(post.postID);
      return <PostForm initial={{ ...post, communityID: community?.communityID || '' }} communities={data.communities} flairs={data.linkFlairs} currentUser={currentUser} onSubmit={(form) => request(async () => { await axios.put(`${API_BASE}/posts/${post.postID}`, form); setView({ type: 'profile', userID: view.profileUserID || currentUser.userID }); }, 'Post could not be saved.')} onDelete={() => { if (confirm('Delete this post and all of its comments?')) request(async () => { await axios.delete(`${API_BASE}/posts/${post.postID}`); setView({ type: 'profile', userID: view.profileUserID || currentUser.userID }); }, 'Post could not be deleted.'); }} />;
    }
    if (view.type === 'newComment') {
      return <CommentForm isReply={view.parentType === 'comment'} onSubmit={(content) => request(async () => { await axios.post(`${API_BASE}/comments`, { parentType: view.parentType, parentID: view.parentType === 'post' ? view.postID : view.parentID, content, creatorID: currentUser.userID }); setView({ type: 'post', postID: view.postID }); }, 'Comment could not be saved.')} />;
    }
    if (view.type === 'editComment') {
      const comment = model.getCommentByID(view.commentID);
      return <CommentForm initial={comment} onSubmit={(content) => request(async () => { await axios.put(`${API_BASE}/comments/${comment.commentID}`, { content }); setView({ type: 'profile', userID: view.profileUserID || currentUser.userID }); }, 'Comment could not be saved.')} onDelete={() => { if (confirm('Delete this comment and all replies?')) request(async () => { await axios.delete(`${API_BASE}/comments/${comment.commentID}`); setView({ type: 'profile', userID: view.profileUserID || currentUser.userID }); }, 'Comment could not be deleted.'); }} />;
    }
    if (view.type === 'profile') {
      const user = model.getUserByID(view.userID || currentUser.userID);
      if (!user) return <p>User not found.</p>;
      return <Profile user={user} adminUser={currentUser} data={data} model={model} onEditCommunity={(communityID) => setView({ type: 'editCommunity', communityID, profileUserID: user.userID })} onEditPost={(postID) => setView({ type: 'editPost', postID, profileUserID: user.userID })} onEditComment={(commentID) => setView({ type: 'editComment', commentID, profileUserID: user.userID })} onViewUser={(userID) => setView({ type: 'profile', userID })} onDeleteUser={(userID) => { if (confirm('Delete this user and all of their communities, posts, and comments?')) request(async () => axios.delete(`${API_BASE}/users/${userID}`), 'User could not be deleted.'); }} onBackAdmin={() => setView({ type: 'profile', userID: currentUser.userID })} />;
    }
    return null;
  })();

  return (
    <section className="app-shell">
      <Banner currentUser={currentUser} searchValue={searchValue} setSearchValue={setSearchValue} submitSearch={submitSearch} onTitle={() => { if (currentUser) openHome(); else setMode('welcome'); }} onCreatePost={() => setView({ type: 'createPost' })} onProfile={() => setView({ type: 'profile', userID: currentUser.userID })} onLogout={async () => { await axios.post(`${API_BASE}/logout`); setCurrentUser(null); setMode('welcome'); }} createPostSelected={view.type === 'createPost'} />
      <div className="layout">
        <NavBar communities={sortedCommunities()} currentUser={currentUser} selectedView={view.type} selectedCommunityID={selectedCommunityID} onHome={openHome} onCreateCommunity={() => setView({ type: 'createCommunity' })} onSelectCommunity={openCommunity} />
        <main className="homepage">{error ? <div className="error system-error">{error}</div> : null}{content}</main>
      </div>
    </section>
  );
}