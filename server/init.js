const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Community = require('./models/communities');
const Post = require('./models/posts');
const Comment = require('./models/comments');
const LinkFlair = require('./models/linkflairs');
const User = require('./models/users');

const DB_URL = 'mongodb://127.0.0.1:27017/phreddit';

async function main() {
  const [email, displayName, password] = process.argv.slice(2);
  if (!email || !displayName || !password) {
    console.log('Usage: node server/init.js <admin-email> <admin-display-name> <admin-password>');
    process.exit(1);
  }

  await mongoose.connect(DB_URL);
  await Promise.all([
    Community.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    LinkFlair.deleteMany({}),
    User.deleteMany({}),
  ]);

  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email,
    displayName,
    passwordHash: await bcrypt.hash(password, 10),
    reputation: 1000,
    isAdmin: true,
  });

  const user1 = await User.create({
    firstName: 'Alex',
    lastName: 'Poster',
    email: 'alex@example.com',
    displayName: 'trucknutz69',
    passwordHash: await bcrypt.hash('StarterPass1!', 10),
    reputation: 100,
  });

  const user2 = await User.create({
    firstName: 'Mara',
    lastName: 'Historian',
    email: 'mara@example.com',
    displayName: 'MarcoArelius',
    passwordHash: await bcrypt.hash('StarterPass2!', 10),
    reputation: 100,
  });

  const user3 = await User.create({
    firstName: 'Rollo',
    lastName: 'Reader',
    email: 'rollo@example.com',
    displayName: 'rollo',
    passwordHash: await bcrypt.hash('StarterPass3!', 10),
    reputation: 100,
  });

  const flair1 = await LinkFlair.create({ content: 'The jerkstore called...' });
  const flair2 = await LinkFlair.create({ content: 'They walk among us' });

  const comment1 = await Comment.create({
    content: 'There is no higher calling than the protection of Tesla products. NTJ.',
    commentedBy: user3._id,
    commentedDate: new Date('August 23, 2024 08:22:00'),
    upvotes: 1,
    downvotes: 0,
  });

  const comment2 = await Comment.create({
    content: 'The truth is out there.',
    commentedBy: admin._id,
    commentedDate: new Date('September 10, 2024 06:41:00'),
    upvotes: 2,
    downvotes: 0,
  });

  const post1 = await Post.create({
    title: 'AITJ: I parked my cybertruck in the handicapped spot to protect it from bitter, jealous losers.',
    content: 'Recently I went to the store in my brand new Tesla cybertruck. I wanted to make sure my truck was protected. So tell me phreddit, was I the jerk?',
    linkFlairID: flair1._id,
    postedBy: user1._id,
    postedDate: new Date('August 23, 2024 01:19:00'),
    commentIDs: [comment1._id],
    views: 14,
    upvotes: 1,
    downvotes: 0,
  });

  const post2 = await Post.create({
    title: 'Remember when this was a HISTORY channel?',
    content: 'Does anyone else remember when they used to show actual historical content on this channel and not just endless alien encounters?',
    linkFlairID: flair2._id,
    postedBy: user2._id,
    postedDate: new Date('September 9, 2024 14:24:00'),
    commentIDs: [comment2._id],
    views: 1023,
    upvotes: 3,
    downvotes: 1,
  });

  await Community.create({
    name: 'Am I the Jerk?',
    description: 'A practical application of the principles of justice.',
    creator: user1._id,
    postIDs: [post1._id],
    startDate: new Date('August 10, 2014 04:18:00'),
    members: [user1._id, user3._id],
  });

  await Community.create({
    name: 'The History Channel',
    description: 'A fantastical reimagining of our past and present.',
    creator: user2._id,
    postIDs: [post2._id],
    startDate: new Date('May 4, 2017 08:32:00'),
    members: [user2._id, admin._id],
  });

  await mongoose.disconnect();
  console.log('done');
}

main().catch(async (error) => {
  console.log(`ERROR: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
