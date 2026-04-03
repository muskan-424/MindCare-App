require('dotenv').config();
const connectDB = require('./config/db');
const Quote = require('./models/Quote');

const quotes = [
  { quote: 'Be yourself no matter what they say!', author: 'Sting' },
  { quote: 'The only way out is through.', author: 'Robert Frost' },
  { quote: 'You are braver than you believe, stronger than you seem, and smarter than you think.', author: 'A.A. Milne' },
  { quote: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
  { quote: 'Mental health is not a destination, but a process.', author: 'Noam Shpancer' },
  { quote: 'You don\'t have to control your thoughts. You just have to stop letting them control you.', author: 'Dan Millman' },
  { quote: 'Self-care is not self-indulgence, it is self-preservation.', author: 'Audre Lorde' },
  { quote: 'Happiness can be found even in the darkest of times, if one only remembers to turn on the light.', author: 'Albus Dumbledore' },
  { quote: 'There is hope, even when your brain tells you there isn\'t.', author: 'John Green' },
  { quote: 'You are not your illness. You have an individual story to tell. You have a name, a history, a personality.', author: 'Julian Seifter' },
  { quote: 'Recovery is not one and done. It is a lifelong journey that takes place one day, one step at a time.', author: 'Unknown' },
  { quote: 'What mental health needs is more sunlight, more candor, and more unashamed conversation.', author: 'Glenn Close' },
  { quote: 'The strongest people are not those who show strength in front of us, but those who win battles we know nothing about.', author: 'Unknown' },
  { quote: 'Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.', author: 'Kahlil Gibran' },
  { quote: 'Take your time healing, as long as you want. Nobody else knows what you\'ve been through.', author: 'Abertoli' },
  { quote: 'Not until we are lost do we begin to understand ourselves.', author: 'Henry David Thoreau' },
  { quote: 'Promise me you\'ll always remember: you\'re braver than you believe, and stronger than you seem.', author: 'Christopher Robin' },
  { quote: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela' },
  { quote: 'Your present circumstances don\'t determine where you go; they merely determine where you start.', author: 'Nido Qubein' },
  { quote: 'Courage doesn\'t always roar. Sometimes courage is the quiet voice at the end of the day saying, I will try again tomorrow.', author: 'Mary Anne Radmacher' },
];

const seedQuotes = async () => {
  try {
    await connectDB();
    
    // Clear existing quotes
    await Quote.deleteMany({});
    console.log('Cleared existing quotes');
    
    // Insert new quotes
    await Quote.insertMany(quotes);
    console.log(`Seeded ${quotes.length} quotes successfully!`);
    
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seedQuotes();
