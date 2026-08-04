import { useState } from 'react';
import { validateHyperlinks } from './utils.jsx';

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <div className="error">{message}</div>;
}

export function CreateCommunityForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', description: '', creator: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Community name cannot be empty.';
    } else if (form.name.trim().length > 100) {
      nextErrors.name = 'Community name cannot exceed 100 characters.';
    }

    if (!form.description.trim()) {
      nextErrors.description = 'Description cannot be empty.';
    } else if (form.description.trim().length > 500) {
      nextErrors.description = 'Description cannot exceed 500 characters.';
    } else {
      const hyperlinkError = validateHyperlinks(form.description);
      if (hyperlinkError) {
        nextErrors.description = hyperlinkError;
      }
    }

    if (!form.creator.trim()) {
      nextErrors.creator = 'Creator username cannot be empty.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        creator: form.creator.trim(),
      });
    }
  };

  return (
    <div className="form-page">
      <h2>Create Community</h2>

      <div className="form-group">
        <label htmlFor="community-name">
          Community Name <span className="required">*</span>
        </label>
        <input
          id="community-name"
          type="text"
          maxLength="100"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="form-group">
        <label htmlFor="community-description">
          Description <span className="required">*</span>
        </label>
        <textarea
          id="community-description"
          maxLength="500"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <FieldError message={errors.description} />
      </div>

      <div className="form-group">
        <label htmlFor="community-creator">
          Creator Username <span className="required">*</span>
        </label>
        <input
          id="community-creator"
          type="text"
          value={form.creator}
          onChange={(event) => setForm({ ...form, creator: event.target.value })}
        />
        <FieldError message={errors.creator} />
      </div>

      <button type="button" id="engender-community" className="action-button" onClick={handleSubmit}>
        Engender Community
      </button>
    </div>
  );
}

export function CreatePostForm({ communities, flairs, onSubmit }) {
  const [form, setForm] = useState({
    communityID: '',
    title: '',
    linkFlairID: '',
    newFlair: '',
    content: '',
    postedBy: '',
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const nextErrors = {};

    if (!form.communityID) {
      nextErrors.communityID = 'Please select a community.';
    }

    if (!form.title.trim()) {
      nextErrors.title = 'Title cannot be empty.';
    } else if (form.title.trim().length > 100) {
      nextErrors.title = 'Title cannot exceed 100 characters.';
    }

    if (form.linkFlairID && form.newFlair.trim()) {
      nextErrors.flair = 'Choose an existing flair or enter a new flair, not both.';
    } else if (form.newFlair.trim().length > 30) {
      nextErrors.flair = 'New flair cannot exceed 30 characters.';
    }

    if (!form.content.trim()) {
      nextErrors.content = 'Content cannot be empty.';
    } else {
      const hyperlinkError = validateHyperlinks(form.content);
      if (hyperlinkError) {
        nextErrors.content = hyperlinkError;
      }
    }

    if (!form.postedBy.trim()) {
      nextErrors.postedBy = 'Username cannot be empty.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onSubmit({
        communityID: form.communityID,
        title: form.title.trim(),
        linkFlairID: form.linkFlairID,
        newFlair: form.newFlair.trim(),
        content: form.content.trim(),
        postedBy: form.postedBy.trim(),
      });
    }
  };

  return (
    <div className="form-page create-post">
      <h2>Create Post</h2>

      <div className="form-group">
        <label htmlFor="post-community">
          Community <span className="required">*</span>
        </label>
        <select
          id="post-community"
          value={form.communityID}
          onChange={(event) => setForm({ ...form, communityID: event.target.value })}
        >
          <option value="">-- Select a community --</option>
          {communities.map((community) => (
            <option key={community.communityID} value={community.communityID}>
              {community.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.communityID} />
      </div>

      <div className="form-group">
        <label htmlFor="post-title">
          Title <span className="required">*</span>
        </label>
        <input
          id="post-title"
          type="text"
          maxLength="100"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <FieldError message={errors.title} />
      </div>

      <div className="form-group">
        <label htmlFor="post-flair">Existing Link Flair</label>
        <select
          id="post-flair"
          value={form.linkFlairID}
          onChange={(event) => setForm({ ...form, linkFlairID: event.target.value })}
        >
          <option value="">None</option>
          {flairs.map((flair) => (
            <option key={flair.linkFlairID} value={flair.linkFlairID}>
              {flair.content}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="new-flair">Or New Link Flair</label>
        <input
          id="new-flair"
          type="text"
          maxLength="30"
          value={form.newFlair}
          onChange={(event) => setForm({ ...form, newFlair: event.target.value })}
        />
        <FieldError message={errors.flair} />
      </div>

      <div className="form-group">
        <label htmlFor="post-content">
          Content <span className="required">*</span>
        </label>
        <textarea
          id="post-content"
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
        />
        <FieldError message={errors.content} />
      </div>

      <div className="form-group">
        <label htmlFor="post-user">
          Username <span className="required">*</span>
        </label>
        <input
          id="post-user"
          type="text"
          value={form.postedBy}
          onChange={(event) => setForm({ ...form, postedBy: event.target.value })}
        />
        <FieldError message={errors.postedBy} />
      </div>

      <button type="button" id="submit-post" className="action-button" onClick={handleSubmit}>
        Submit Post
      </button>
    </div>
  );
}

export function CreateCommentForm({ isReply, onSubmit }) {
  const [form, setForm] = useState({ content: '', commentedBy: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const nextErrors = {};

    if (!form.content.trim()) {
      nextErrors.content = 'Content cannot be empty.';
    } else if (form.content.trim().length > 500) {
      nextErrors.content = 'Content cannot exceed 500 characters.';
    } else {
      const hyperlinkError = validateHyperlinks(form.content);
      if (hyperlinkError) {
        nextErrors.content = hyperlinkError;
      }
    }

    if (!form.commentedBy.trim()) {
      nextErrors.commentedBy = 'Username cannot be empty.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onSubmit({
        content: form.content.trim(),
        commentedBy: form.commentedBy.trim(),
      });
    }
  };

  return (
    <div className="form-page create-comment">
      <h2>{isReply ? 'Reply' : 'Add a comment'}</h2>

      <div className="form-group">
        <label htmlFor="comment-content">
          Content <span className="required">*</span>
        </label>
        <textarea
          id="comment-content"
          maxLength="500"
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
        />
        <FieldError message={errors.content} />
      </div>

      <div className="form-group">
        <label htmlFor="comment-user">
          Username <span className="required">*</span>
        </label>
        <input
          id="comment-user"
          type="text"
          value={form.commentedBy}
          onChange={(event) => setForm({ ...form, commentedBy: event.target.value })}
        />
        <FieldError message={errors.commentedBy} />
      </div>

      <button type="button" id="submit-comment" className="action-button" onClick={handleSubmit}>
        Submit Comment
      </button>
    </div>
  );
}