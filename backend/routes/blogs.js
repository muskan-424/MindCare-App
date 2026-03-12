const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');

const SEED_FEATURED = [
  { title: 'How Depression Made Me a Morning Person', author: 'McKay Cooper', likes: 100, profilePic: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', image: 'https://miro.medium.com/max/788/1*bdezOVG_rWX8mXkVn62QOQ.jpeg', section: 'featured' },
  { title: 'What I Learned from Depression', author: 'Mark Heider', likes: 220, profilePic: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', image: 'https://miro.medium.com/max/788/1*n3bgDB8TG4kfyVbTzGcSWA.jpeg', section: 'featured' },
  { title: '7 lessons I\'ve learned from practicing yoga', author: 'David Gershon', likes: 620, profilePic: 'https://images.pexels.com/photos/736716/pexels-photo-736716.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', image: 'https://miro.medium.com/max/875/1*v5kDIx_1WTzqHzdJmFPSgA.jpeg', section: 'featured' },
];
const SEED_POPULAR = [
  { title: 'Mastering Depression and Living the Life You Were Meant to Live', author: 'James Molly', likes: 620, profilePic: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', image: 'https://miro.medium.com/max/2126/1*luCXoCDBjoqSHu7KqbfJiw.jpeg', section: 'popular' },
  { title: 'A New Prime Suspect For Depression', author: 'Thomas Greene', likes: 421, profilePic: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', image: 'https://miro.medium.com/max/788/1*8atjnMgv1YE7waQcX5HYaA.jpeg', section: 'popular' },
  { title: 'How I learned to stop worrying and love the stress', author: 'Arthur Shelby', likes: 156, profilePic: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', image: 'https://miro.medium.com/max/788/1*Nrm8MhT-REjApjavtK9Rgg.jpeg', section: 'popular' },
];

async function ensureSeeded() {
  const count = await BlogPost.countDocuments();
  if (count === 0) {
    await BlogPost.insertMany([...SEED_FEATURED, ...SEED_POPULAR]);
  }
}

router.get('/', async (_req, res) => {
  try {
    await ensureSeeded();
    const featured = await BlogPost.find({ section: 'featured', active: true }).sort({ likes: -1 }).lean();
    const popular = await BlogPost.find({ section: 'popular', active: true }).sort({ likes: -1 }).lean();
    res.json({
      featured: featured.map((p) => ({
        id: p._id,
        author: p.author,
        likes: p.likes,
        title: p.title,
        profilePic: p.profilePic,
        image: p.image,
      })),
      popular: popular.map((p) => ({
        id: p._id,
        title: p.title,
        likes: p.likes,
        image: p.image,
        profilePic: p.profilePic,
        author: p.author,
      })),
    });
  } catch (err) {
    console.error('Error fetching blogs:', err.message);
    res.status(500).json({ error: 'Failed to load blogs' });
  }
});

module.exports = router;
