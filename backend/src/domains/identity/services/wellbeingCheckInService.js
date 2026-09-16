/**
 * Wellbeing check-in: PHQ-4 (a validated 4-item anxiety/depression screen) plus five 1–5 scales.
 * Answers are stored on the Profile and feed the burnout model, which had no real inputs before.
 *
 * PHQ-4 items are scored 0–3 ("Not at all" … "Nearly every day"):
 *   GAD-2 = nervous + worrying   (0–6, >= 3 suggests anxiety)
 *   PHQ-2 = interest + down      (0–6, >= 3 suggests depression)
 *   Total 0–2 normal, 3–5 mild, 6–8 moderate, 9–12 severe psychological distress.
 */

const PHQ4_ITEMS = ['nervous', 'worrying', 'interest', 'down'];
const SCALE_ITEMS = ['stress', 'pressure', 'sleep', 'activity', 'social'];

function isIntInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

/** @returns {{ answers?: object, errors?: string[] }} */
function validateCheckIn(body) {
  const errors = [];
  const answers = {};
  for (const item of PHQ4_ITEMS) {
    const value = Number(body?.[item]);
    if (!isIntInRange(value, 0, 3)) errors.push(`${item} must be an integer from 0 to 3`);
    answers[item] = value;
  }
  for (const item of SCALE_ITEMS) {
    const value = Number(body?.[item]);
    if (!isIntInRange(value, 1, 5)) errors.push(`${item} must be an integer from 1 to 5`);
    answers[item] = value;
  }
  return errors.length ? { errors } : { answers };
}

function scoreCheckIn(answers) {
  const gad2 = answers.nervous + answers.worrying;
  const phq2 = answers.interest + answers.down;
  const total = gad2 + phq2;
  let severity = 'normal';
  if (total >= 9) severity = 'severe';
  else if (total >= 6) severity = 'moderate';
  else if (total >= 3) severity = 'mild';
  return { gad2, phq2, total, severity, anxietyFlag: gad2 >= 3, depressionFlag: phq2 >= 3 };
}

/** Profile fields the burnout model reads (see burnoutPredictionService). */
function toProfileFields(answers, score) {
  return {
    anxietyLevel: score.gad2,
    depressionLevel: score.phq2,
    stressLevel: answers.stress,
    academicStress: answers.pressure,
    sleepQuality: answers.sleep,
    activityLevel: answers.activity,
    socialInteraction: answers.social,
    wellbeingCheckInAt: new Date(),
  };
}

module.exports = { PHQ4_ITEMS, SCALE_ITEMS, validateCheckIn, scoreCheckIn, toProfileFields };
