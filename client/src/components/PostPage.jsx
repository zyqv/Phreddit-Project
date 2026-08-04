import { formatTimestamp, renderTextWithLinks } from './utils.jsx';

function CommentItem({ comment, model, onReply }) {
  const replies = model
    .getCommentsByID(comment.commentIDs || [])
    .sort((a, b) => b.commentedDate - a.commentedDate);

  return (
    <div className="comment">
      <div className="comment-meta">
        {comment.commentedBy} · {formatTimestamp(comment.commentedDate)}
      </div>
      <div className="comment-content">{renderTextWithLinks(comment.content)}</div>
      <button type="button" className="reply-btn" onClick={() => onReply(comment.commentID)}>
        Reply
      </button>
      {replies.map((reply) => (
        <CommentItem key={reply.commentID} comment={reply} model={model} onReply={onReply} />
      ))}
    </div>
  );
}

export default function PostPage({ post, model, onAddComment, onReply }) {
  const community = model.getCommunityForPost(post.postID);
  const flair = model.getLinkFlair(post.linkFlairID);
  const commentCount = model.countAllComments(post.commentIDs);
  const comments = model
    .getCommentsByID(post.commentIDs || [])
    .sort((a, b) => b.commentedDate - a.commentedDate);

  return (
    <div className="post-page">
      <div className="post-meta">
        {community ? `${community.name} · ` : ''}
        {formatTimestamp(post.postedDate)}
      </div>
      <div className="post-username">{post.postedBy}</div>
      <h2 className="post-page-title">{post.title}</h2>
      {flair ? <div className="post-flair">{flair.content}</div> : null}
      <p className="post-content-full">{renderTextWithLinks(post.content)}</p>
      <div className="count-line post-stats">
        <span>Views: {post.views}</span>
        <span>Comments: {commentCount}</span>
      </div>
      <button type="button" id="add-comment" className="action-button" onClick={onAddComment}>
        Add a comment
      </button>
      <hr />
      <div id="comments-section">
        {comments.map((comment) => (
          <CommentItem key={comment.commentID} comment={comment} model={model} onReply={onReply} />
        ))}
      </div>
    </div>
  );
}