const express = require('express');
const router = express.Router();

// Static journal entries for now; can be moved to Mongo later.
let JOURNALS = [
  {
    id: 1,
    date: '13 November 2020',
    time: '6:07 AM',
    content:
      'I went to office today after 2 weeks. It feels like everyone is ignoring me or what. This all is due to my 2 weeks leave I guess. Or maybe they are not ignoring me and just busy in their work. Damn, this overthinking :( ',
  },
  {
    id: 2,
    date: '13 November 2020',
    time: '8:10 AM',
    content:
      'Over-thinking. I do it all the time. I’m doing it right now — right now as I write this, having not even been awake for half an hour...',
  },
  {
    id: 3,
    date: '13 November 2020',
    time: '10:11 AM',
    content:
      'I met a Buddhist today. He is known as Ajahn Brahm. When talking about overthinking, he says he used to do it a lot too...',
  },
  {
    id: 4,
    date: '13 November 2020',
    time: '12:07 PM',
    content:
      'Over-thinking allows for the creation of baseless or unsubstantiated assumptions. It can turn decision making into an agonizing ordeal.',
  },
  {
    id: 5,
    date: '14 November 2020',
    time: '05:17 PM',
    content:
      'I am having a good day today. I had the best sleep at night. No one is with me when I put up my views in the office meeting, but now I don’t care...',
  },
];

// GET /api/journals
router.get('/', (_req, res) => {
  res.json(JOURNALS);
});

module.exports = router;

