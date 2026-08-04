const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Community = require('./models/communities');
const Post = require('./models/posts');
const Comment = require('./models/comments');
const LinkFlair = require('./models/linkflairs');
const User = require('./models/users');

const app = express();
const PORT = 8000;
const DB_URL = 'mongodb://127.0.0.1:27017/phreddit';

app.use(cors());
app.use(express.json());

function id(value) {
  return value ? value.toString() : '';
}

function publicUser(user) {
  return {
    userID: id(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    displayName: user.displayName,
    reputation: user.reputation,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}

function displayNameFor(usersByID, userID) {
  const user = usersByID.get(id(userID));
  return user ? user.displayName : 'Unknown User';
}

async function collectCommentTreeIDs(idsToVisit) {
  const found = [];
  const stack = [...idsToVisit];
  while (stack.length > 0) {
    const nextID = stack.pop();
    found.push(nextID);
    const comment = await Comment.findById(nextID);
    if (comment) {
      stack.push(...comment.commentIDs);
    }
  }
  return found;
}

async function deletePostAndComments(postID) {
  const post = await Post.findById(postID);
  if (!post) {
    return;
  }
  const commentIDs = await collectCommentTreeIDs(post.commentIDs);
  await Comment.deleteMany({ _id: { $in: commentIDs } });
  await Community.updateMany({}, { $pull: { postIDs: post._id } });
  await Post.findByIdAndDelete(post._id);
}

async function deleteCommunityPosts(communityID) {
  const community = await Community.findById(communityID);
  if (!community) {
    return;
  }
  for (const postID of community.postIDs) {
    await deletePostAndComments(postID);
  }
  await Community.findByIdAndDelete(community._id);
}

async function getAllData() {
  const [users, communities, posts, comments, linkFlairs] = await Promise.all([
    User.find(),
    Community.find(),
    Post.find(),
    Comment.find(),
    LinkFlair.find(),
  ]);

  const usersByID = new Map(users.map((user) => [id(user._id), user]));

  return {
    users: users.map(publicUser),
    communities: communities.map((community) => ({
      communityID: id(community._id),
      name: community.name,
      description: community.description,
      creator: id(community.creator),
      creatorName: displayNameFor(usersByID, community.creator),
      postIDs: community.postIDs.map(id),
      startDate: community.startDate,
      members: community.members.map(id),
      memberCount: community.members.length,
    })),
    posts: posts.map((post) => ({
      postID: id(post._id),
      title: post.title,
      content: post.content,
      linkFlairID: id(post.linkFlairID),
      postedBy: id(post.postedBy),
      postedByName: displayNameFor(usersByID, post.postedBy),
      postedDate: post.postedDate,
      commentIDs: post.commentIDs.map(id),
      views: post.views,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      votes: post.votes.map((vote) => ({ user: id(vote.user), vote: vote.vote })),
    })),
    comments: comments.map((comment) => ({
      commentID: id(comment._id),
      content: comment.content,
      commentIDs: comment.commentIDs.map(id),
      commentedBy: id(comment.commentedBy),
      commentedByName: displayNameFor(usersByID, comment.commentedBy),
      commentedDate: comment.commentedDate,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
      votes: comment.votes.map((vote) => ({ user: id(vote.user), vote: vote.vote })),
    })),
    linkFlairs: linkFlairs.map((flair) => ({
      linkFlairID: id(flair._id),
      content: flair.content,
    })),
  };
}

function passwordContainsUserInfo(password, userData) {
  const loweredPassword = password.toLowerCase();
  const emailID = userData.email.split('@')[0].toLowerCase();
  return [userData.firstName, userData.lastName, userData.displayName, emailID]
    .filter(Boolean)
    .some((piece) => loweredPassword.includes(piece.toLowerCase()));
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.get('/api/data', async (req, res) => {
  try {
    res.json(await getAllData());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data.' });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { firstName, lastName, email, displayName, password, passwordConfirm } = req.body;
    if (!firstName || !lastName || !email || !displayName || !password || !passwordConfirm) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!validEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwords must match.' });
    }
    if (passwordContainsUserInfo(password, { firstName, lastName, email, displayName })) {
      return res.status(400).json({ error: 'Password cannot contain your name, display name, or email id.' });
    }
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { displayName }] });
    if (existing) {
      return res.status(400).json({ error: 'Email or display name is already in use.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, displayName, passwordHash });
    return res.status(201).json(publicUser(user));
  } catch (error) {
    return res.status(400).json({ error: 'Account could not be created.' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'No account exists for that email.' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    return res.json(publicUser(user));
  } catch (error) {
    return res.status(400).json({ error: 'Login failed.' });
  }
});

app.post('/api/logout', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/communities', async (req, res) => {
  try {
    const { name, description, creatorID } = req.body;
    const creator = await User.findById(creatorID);
    if (!creator) {
      return res.status(401).json({ error: 'Login is required.' });
    }
    const duplicate = await Community.findOne({ name });
    if (duplicate) {
      return res.status(400).json({ error: 'Community names must be unique.' });
    }
    const community = await Community.create({ name, description, creator: creator._id, members: [creator._id], postIDs: [] });
    return res.status(201).json({ communityID: id(community._id) });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create community.' });
  }
});

app.put('/api/communities/:communityID', async (req, res) => {
  try {
    const { name, description } = req.body;
    const duplicate = await Community.findOne({ name, _id: { $ne: req.params.communityID } });
    if (duplicate) {
      return res.status(400).json({ error: 'Community names must be unique.' });
    }
    const community = await Community.findByIdAndUpdate(req.params.communityID, { name, description }, { new: true });
    if (!community) {
      return res.status(404).json({ error: 'Community not found.' });
    }
    return res.json({ communityID: id(community._id) });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update community.' });
  }
});

app.delete('/api/communities/:communityID', async (req, res) => {
  try {
    await deleteCommunityPosts(req.params.communityID);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to delete community.' });
  }
});

app.patch('/api/communities/:communityID/membership', async (req, res) => {
  try {
    const { userID, action } = req.body;
    const update = action === 'join'
      ? { $addToSet: { members: userID } }
      : { $pull: { members: userID } };
    const community = await Community.findByIdAndUpdate(req.params.communityID, update, { new: true });
    if (!community) {
      return res.status(404).json({ error: 'Community not found.' });
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update membership.' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { communityID, title, content, creatorID, linkFlairID, newFlair } = req.body;
    const [community, creator] = await Promise.all([Community.findById(communityID), User.findById(creatorID)]);
    if (!community || !creator) {
      return res.status(404).json({ error: 'Community or user not found.' });
    }
    let flairRef = linkFlairID || null;
    if (newFlair && newFlair.trim()) {
      const flair = await LinkFlair.create({ content: newFlair.trim() });
      flairRef = flair._id;
    }
    const post = await Post.create({ title, content, postedBy: creator._id, linkFlairID: flairRef, commentIDs: [] });
    community.postIDs.unshift(post._id);
    await community.save();
    return res.status(201).json({ postID: id(post._id) });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create post.' });
  }
});

app.put('/api/posts/:postID', async (req, res) => {
  try {
    const { communityID, title, content, linkFlairID, newFlair } = req.body;
    let flairRef = linkFlairID || null;
    if (newFlair && newFlair.trim()) {
      const flair = await LinkFlair.create({ content: newFlair.trim() });
      flairRef = flair._id;
    }
    const post = await Post.findByIdAndUpdate(req.params.postID, { title, content, linkFlairID: flairRef }, { new: true });
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    if (communityID) {
      await Community.updateMany({}, { $pull: { postIDs: post._id } });
      await Community.findByIdAndUpdate(communityID, { $addToSet: { postIDs: post._id } });
    }
    return res.json({ postID: id(post._id) });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update post.' });
  }
});

app.delete('/api/posts/:postID', async (req, res) => {
  try {
    await deletePostAndComments(req.params.postID);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to delete post.' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { parentType, parentID, content, creatorID } = req.body;
    const creator = await User.findById(creatorID);
    if (!creator) {
      return res.status(401).json({ error: 'Login is required.' });
    }
    const comment = await Comment.create({ content, commentedBy: creator._id, commentIDs: [] });
    if (parentType === 'post') {
      await Post.findByIdAndUpdate(parentID, { $push: { commentIDs: { $each: [comment._id], $position: 0 } } });
    } else if (parentType === 'comment') {
      await Comment.findByIdAndUpdate(parentID, { $push: { commentIDs: { $each: [comment._id], $position: 0 } } });
    } else {
      return res.status(400).json({ error: 'Invalid parent type.' });
    }
    return res.status(201).json({ commentID: id(comment._id) });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create comment.' });
  }
});

app.put('/api/comments/:commentID', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.commentID, { content: req.body.content }, { new: true });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    return res.json({ commentID: id(comment._id) });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update comment.' });
  }
});

app.delete('/api/comments/:commentID', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentID);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    const idsToDelete = await collectCommentTreeIDs([comment._id]);
    await Post.updateMany({}, { $pull: { commentIDs: comment._id } });
    await Comment.updateMany({}, { $pull: { commentIDs: comment._id } });
    await Comment.deleteMany({ _id: { $in: idsToDelete } });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to delete comment.' });
  }
});

app.patch('/api/posts/:postID/views', async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.postID, { $inc: { views: 1 } });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update views.' });
  }
});

async function voteOn(Model, itemID, voterID, ownerField, direction) {
  const voter = await User.findById(voterID);
  const item = await Model.findById(itemID);
  if (!voter || !item) {
    throw new Error('Not found.');
  }
  if (voter.reputation < 50) {
    const err = new Error('Users with reputation below 50 cannot vote.');
    err.status = 403;
    throw err;
  }
  if (item.votes.some((vote) => id(vote.user) === id(voter._id))) {
    const err = new Error('Users can only vote once.');
    err.status = 400;
    throw err;
  }
  item.votes.push({ user: voter._id, vote: direction });
  if (direction === 'up') {
    item.upvotes += 1;
    await User.findByIdAndUpdate(item[ownerField], { $inc: { reputation: 5 } });
  } else {
    item.downvotes += 1;
    await User.findByIdAndUpdate(item[ownerField], { $inc: { reputation: -10 } });
  }
  await item.save();
}

app.patch('/api/posts/:postID/vote', async (req, res) => {
  try {
    await voteOn(Post, req.params.postID, req.body.userID, 'postedBy', req.body.vote);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message || 'Failed to vote.' });
  }
});

app.patch('/api/comments/:commentID/vote', async (req, res) => {
  try {
    await voteOn(Comment, req.params.commentID, req.body.userID, 'commentedBy', req.body.vote);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message || 'Failed to vote.' });
  }
});

app.delete('/api/users/:userID', async (req, res) => {
  try {
    const userID = req.params.userID;
    const communities = await Community.find({ creator: userID });
    for (const community of communities) {
      await deleteCommunityPosts(community._id);
    }
    const posts = await Post.find({ postedBy: userID });
    for (const post of posts) {
      await deletePostAndComments(post._id);
    }
    const comments = await Comment.find({ commentedBy: userID });
    for (const comment of comments) {
      const idsToDelete = await collectCommentTreeIDs([comment._id]);
      await Post.updateMany({}, { $pull: { commentIDs: comment._id } });
      await Comment.updateMany({}, { $pull: { commentIDs: comment._id } });
      await Comment.deleteMany({ _id: { $in: idsToDelete } });
    }
    await Community.updateMany({}, { $pull: { members: userID } });
    await User.findByIdAndDelete(userID);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: 'Failed to delete user.' });
  }
});

async function startServer() {
  try {
    await mongoose.connect(DB_URL);
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
  } catch (error) {
    console.error('Failed to connect to database.');
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  console.log('Server closed. Database instance disconnected.');
  process.exit(0);
});

startServer();
