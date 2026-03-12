const AVATARS = {
  male: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png',
  female: 'https://cdn-icons-png.flaticon.com/512/2922/2922561.png',
  other: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
};

export const getAvatarForGender = (gender) => {
  const key = (gender || '').toLowerCase();
  if (key === 'male') return { uri: AVATARS.male };
  if (key === 'female') return { uri: AVATARS.female };
  if (key === 'other') return { uri: AVATARS.other };
  return { uri: AVATARS.other };
};

