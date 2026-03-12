require('dotenv').config();
const mongoose = require('mongoose');
const FitnessCategory = require('../models/FitnessCategory');
const FitnessSubcategory = require('../models/FitnessSubcategory');
const FitnessContentItem = require('../models/FitnessContentItem');

const CATEGORIES = [
  { name: 'Yoga', icon: 'https://cdn-icons-png.flaticon.com/512/2647/2647625.png', order: 1 },
  { name: 'Meditation', icon: 'https://cdn-icons-png.flaticon.com/512/3663/3663335.png', order: 2 },
  { name: 'Cardio', icon: 'https://cdn-icons-png.flaticon.com/512/10043/10043015.png', order: 3 },
  { name: 'Stretching', icon: 'https://cdn-icons-png.flaticon.com/512/4144/4144158.png', order: 4 },
  { name: 'Healthy Diet', icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', order: 5 },
];

const SUBCATEGORIES = [
  { categoryName: 'Yoga', name: 'Beginner Yoga Flow', icon: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', order: 1 },
  { categoryName: 'Yoga', name: 'Yoga for Anxiety Relief', icon: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg', order: 2 },
  { categoryName: 'Yoga', name: 'Bedtime Yoga', icon: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', order: 3 },
  { categoryName: 'Meditation', name: '5-Minute Daily Meditation', icon: 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg', order: 1 },
  { categoryName: 'Meditation', name: 'Sleep Meditation', icon: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg', order: 2 },
  { categoryName: 'Meditation', name: 'Anxiety-Calming Breath', icon: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg', order: 3 },
  { categoryName: 'Cardio', name: 'Low Impact Cardio', icon: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg', order: 1 },
  { categoryName: 'Cardio', name: 'Beginner HIIT', icon: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg', order: 2 },
  { categoryName: 'Stretching', name: 'Full Body Stretch', icon: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg', order: 1 },
  { categoryName: 'Stretching', name: 'Morning Stretch', icon: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg', order: 2 },
  { categoryName: 'Healthy Diet', name: 'Healthy Breakfast Ideas', icon: 'https://i.ytimg.com/vi/8aV2KYf_MXw/hqdefault.jpg', order: 1 },
  { categoryName: 'Healthy Diet', name: 'Meal Prep Basics', icon: 'https://i.ytimg.com/vi/Qe4qU9oxC6o/hqdefault.jpg', order: 2 },
];

const CONTENT_ITEMS = [
  { categoryName: 'Yoga', subcategoryName: 'Beginner Yoga Flow', title: '10-Minute Beginner Yoga', imageUrl: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', videoId: 'v7AYKMP6rOE' },
  { categoryName: 'Yoga', subcategoryName: 'Beginner Yoga Flow', title: 'Gentle Morning Yoga', imageUrl: 'https://i.ytimg.com/vi/KmYdVq47UOU/hqdefault.jpg', videoId: 'KmYdVq47UOU' },
  { categoryName: 'Yoga', subcategoryName: 'Yoga for Anxiety Relief', title: 'Yoga for Anxiety and Stress', imageUrl: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg', videoId: 'inpok4MKVLM' },
  { categoryName: 'Yoga', subcategoryName: 'Yoga for Anxiety Relief', title: 'Calming Yoga for Worry', imageUrl: 'https://i.ytimg.com/vi/b1H3xO3x_Js/hqdefault.jpg', videoId: 'b1H3xO3x_Js' },
  { categoryName: 'Yoga', subcategoryName: 'Bedtime Yoga', title: 'Bedtime Yoga for Relaxation', imageUrl: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', videoId: 'v7AYKMP6rOE' },
  { categoryName: 'Meditation', subcategoryName: '5-Minute Daily Meditation', title: 'Quick Reset Meditation', imageUrl: 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg', videoId: 'O-6f5wQXSu8' },
  { categoryName: 'Meditation', subcategoryName: 'Sleep Meditation', title: 'Deep Sleep Talk Down', imageUrl: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg', videoId: '2OEL4P1Rz04' },
  { categoryName: 'Meditation', subcategoryName: 'Anxiety-Calming Breath', title: 'Breathing for Anxiety Relief', imageUrl: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg', videoId: 'inpok4MKVLM' },
  { categoryName: 'Cardio', subcategoryName: 'Low Impact Cardio', title: 'Low Impact Cardio Workout', imageUrl: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg', videoId: 'ml6cT4AZdqI' },
  { categoryName: 'Cardio', subcategoryName: 'Beginner HIIT', title: 'Beginner HIIT Session', imageUrl: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg', videoId: 'ml6cT4AZdqI' },
  { categoryName: 'Stretching', subcategoryName: 'Full Body Stretch', title: 'Full Body Stretch Routine', imageUrl: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg', videoId: 'L_xrDAtykMI' },
  { categoryName: 'Stretching', subcategoryName: 'Morning Stretch', title: '5-Minute Morning Stretch', imageUrl: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg', videoId: 'L_xrDAtykMI' },
  { categoryName: 'Healthy Diet', subcategoryName: 'Healthy Breakfast Ideas', title: '3 Healthy Breakfast Ideas', imageUrl: 'https://i.ytimg.com/vi/8aV2KYf_MXw/hqdefault.jpg', videoId: '8aV2KYf_MXw' },
  { categoryName: 'Healthy Diet', subcategoryName: 'Meal Prep Basics', title: 'Beginner Meal Prep Guide', imageUrl: 'https://i.ytimg.com/vi/Qe4qU9oxC6o/hqdefault.jpg', videoId: 'Qe4qU9oxC6o' },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  if ((await FitnessCategory.countDocuments()) === 0) {
    await FitnessCategory.insertMany(CATEGORIES);
    await FitnessSubcategory.insertMany(SUBCATEGORIES);
    await FitnessContentItem.insertMany(CONTENT_ITEMS);
    console.log('Fitness seed done.');
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
