const express = require('express');
const router = express.Router();

// Static therapist data, matching frontend constants.
const THERAPISTS = [
  {
    id: '1',
    name: 'Dr. Brain Wofe',
    specialisation: 'Psychologist',
    img: 'https://www.allsmilesdentist.com/wp-content/uploads/2017/08/Doctors-circle.png',
    bio:
      'Excepteur velit dolore nostrud do minim eiusmod esse ipsum officia deserunt. Nulla non veniam minim veniam. Sit nostrud minim voluptate ullamco ullamco esse ad sunt.',
    email: 'brain@hotmail.com',
    contact_no: '123456788',
    timing: '4:30 PM - 8:30 PM',
    fee: '$15/session',
    stars: 5,
  },
  {
    id: '2',
    name: 'Dr. Selkon Kane',
    specialisation: 'Psychiatrist',
    img: 'https://www.ayurvedaconsultants.com/frontEndFiles/images/doctor-circle.jpg',
    bio:
      'Excepteur velit dolore nostrud do minim eiusmod esse ipsum officia deserunt. Nulla non veniam minim veniam. Sit nostrud minim voluptate ullamco ullamco esse ad sunt.',
    email: 'kane_selkon12@gmail.com',
    contact_no: '123456788',
    timing: '5:30 PM - 9:30 PM',
    fee: '$10/session',
    stars: 5,
  },
  {
    id: '3',
    name: 'Dr. SN Mohanty',
    specialisation: 'Counsellor',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRUi3Cot4kn3qaJfO7i9b4gWrs-f2OHUH7tfQ&usqp=CAU',
    bio:
      'Excepteur velit dolore nostrud do minim eiusmod esse ipsum officia deserunt. Nulla non veniam minim veniam. Sit nostrud minim voluptate ullamco ullamco esse ad sunt.',
    email: 'official_sn1889@gmail.com',
    contact_no: '12345688',
    timing: '5:00 PM - 9:00 PM',
    fee: '$15/session',
    stars: 5,
  },
  {
    id: '8',
    name: 'Kate Williams',
    specialisation: 'Social Worker',
    img:
      'https://images.squarespace-cdn.com/content/v1/5e24e80299d8c23d1391ff77/1580455910868-CFM7L73ID2TJ36JNYRZX/ke17ZwdGBToddI8pDm48kJK4Mm1kch8SFO9ZNkN1NT97gQa3H78H3Y0txjaiv_0fDoOvxcdMmMKkDsyUqMSsMWxHk725yiiHCCLfrh8O1z5QHyNOqBUUEtDDsRWrJLTmN9YSRtfoTLg6dUq-6F17A0FFZK5fArcnK1IqGweyunyWChwIwkIJ_P7MaZif-uMs/Amber-Chow-Career-Counsellor-Burnaby-Circle.png',
    bio:
      'Excepteur velit dolore nostrud do minim eiusmod esse ipsum officia deserunt. Nulla non veniam minim veniam. Sit nostrud minim voluptate ullamco ullamco esse ad sunt.',
    email: 'official_sn1889@gmail.com',
    contact_no: '12345688',
    timing: '5:00 PM - 9:00 PM',
    fee: '$15/session',
    stars: 5,
  },
  // ...remaining entries omitted for brevity; can be added similarly
];

// GET /api/therapists
router.get('/', (_req, res) => {
  res.json(THERAPISTS);
});

module.exports = router;

