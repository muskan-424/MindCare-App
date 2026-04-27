const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentFeatureVector = require('../models/AssessmentFeatureVector');
const AssessmentFusionResult = require('../models/AssessmentFusionResult');
const { assessTextPayload } = require('../services/ai/textAssessmentService');
const { assessVoicePayload } = require('../services/ai/voiceAssessmentService');
const { assessVisionPayload } = require('../services/ai/visionAssessmentService');
const { fuseAssessment } = require('../services/ai/fusionAssessmentService');
const { getSessionQuestions } = require('../services/ai/questionPolicyService');

router.use(auth);

function hasAllRequiredModalities(session) {
  return session.requiredModalities.every((m) => session.completedModalities.includes(m));
}

router.post('/session/start', async (req, res) => {
  try {
    const userId = req.user.id;
    const { triggerType, consent } = req.body || {};

    const session = await AssessmentSession.create({
      user: userId,
      triggerType: triggerType || 'login_quick',
      status: 'collecting',
      cameraConsent: !!consent?.cameraConsent,
      micConsent: !!consent?.micConsent,
      textConsent: !!consent?.textConsent,
    });

    if (!session.cameraConsent || !session.micConsent || !session.textConsent) {
      session.status = 'failed';
      session.failedReason = 'All modality consents are required';
      await session.save();
      return res.status(400).json({
        error: 'Camera, microphone, and text consent are required',
        sessionId: session._id,
      });
    }

    await AssessmentFeatureVector.create({ session: session._id, user: userId });

    res.status(201).json({
      sessionId: session._id,
      status: session.status,
      requiredModalities: session.requiredModalities,
      questions: getSessionQuestions(),
    });
  } catch (err) {
    console.error('AI Intake session start error:', err);
    res.status(500).json({ error: 'Failed to start AI intake session', details: err.message, stack: err.stack });
  }
});

router.post('/session/:sessionId/text-response', async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.sessionId,
      user: req.user.id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ error: 'Session already completed' });

    const textResult = await assessTextPayload(req.body || {});

    const fv = await AssessmentFeatureVector.findOne({ session: session._id });
    fv.text = textResult;
    fv.rawRefs.textResponseCount = Number(fv.rawRefs.textResponseCount || 0) + 1;
    await fv.save();

    if (!session.completedModalities.includes('text')) {
      session.completedModalities.push('text');
    }
    session.status = hasAllRequiredModalities(session) ? 'ready_for_fusion' : 'collecting';
    await session.save();

    res.json({ success: true, text: textResult, sessionStatus: session.status });
  } catch (err) {
    console.error('AI Intake text error:', err.message);
    res.status(500).json({ error: 'Failed to process text assessment' });
  }
});

router.post('/session/:sessionId/voice-response', async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.sessionId,
      user: req.user.id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const voiceResult = await assessVoicePayload(req.body || {});
    const fv = await AssessmentFeatureVector.findOne({ session: session._id });
    fv.voice = voiceResult;
    fv.rawRefs.latestVoiceRef = String(req.body?.voiceRef || '');
    await fv.save();

    if (!session.completedModalities.includes('voice')) {
      session.completedModalities.push('voice');
    }
    session.status = hasAllRequiredModalities(session) ? 'ready_for_fusion' : 'collecting';
    await session.save();

    res.json({ success: true, voice: voiceResult, sessionStatus: session.status });
  } catch (err) {
    console.error('AI Intake voice error:', err.message);
    res.status(500).json({ error: 'Failed to process voice assessment' });
  }
});

router.post('/session/:sessionId/vision-meta', async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.sessionId,
      user: req.user.id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const visionResult = await assessVisionPayload(req.body || {});
    const fv = await AssessmentFeatureVector.findOne({ session: session._id });
    fv.vision = visionResult;
    fv.rawRefs.latestVisionRef = String(req.body?.visionRef || '');
    await fv.save();

    if (!session.completedModalities.includes('vision')) {
      session.completedModalities.push('vision');
    }
    session.status = hasAllRequiredModalities(session) ? 'ready_for_fusion' : 'collecting';
    await session.save();

    res.json({ success: true, vision: visionResult, sessionStatus: session.status });
  } catch (err) {
    console.error('AI Intake vision error:', err.message);
    res.status(500).json({ error: 'Failed to process vision assessment' });
  }
});

router.post('/session/:sessionId/fusion/run', async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.sessionId,
      user: req.user.id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (!hasAllRequiredModalities(session)) {
      return res.status(400).json({
        error: 'All modalities are required before fusion',
        required: session.requiredModalities,
        completed: session.completedModalities,
      });
    }

    const fv = await AssessmentFeatureVector.findOne({ session: session._id }).lean();
    const fusion = fuseAssessment(fv);

    const result = await AssessmentFusionResult.findOneAndUpdate(
      { session: session._id },
      {
        user: req.user.id,
        riskScore: fusion.riskScore,
        riskLevel: fusion.riskLevel,
        confidence: fusion.confidence,
        contradictionFlags: fusion.contradictionFlags,
        recommendations: fusion.recommendations,
        modelVersion: fusion.modelVersion,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    res.json({
      success: true,
      sessionId: session._id,
      result: {
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        confidence: result.confidence,
        contradictionFlags: result.contradictionFlags,
        recommendations: result.recommendations,
      },
    });
  } catch (err) {
    console.error('AI Intake fusion error:', err.message);
    res.status(500).json({ error: 'Failed to run assessment fusion' });
  }
});

router.get('/session/:sessionId/report', async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.sessionId,
      user: req.user.id,
    }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const featureVector = await AssessmentFeatureVector.findOne({ session: session._id }).lean();
    const fusion = await AssessmentFusionResult.findOne({ session: session._id }).lean();

    res.json({
      session: {
        id: session._id,
        status: session.status,
        triggerType: session.triggerType,
        requiredModalities: session.requiredModalities,
        completedModalities: session.completedModalities,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      },
      modalities: {
        text: featureVector?.text || null,
        voice: featureVector?.voice || null,
        vision: featureVector?.vision || null,
      },
      fusion: fusion
        ? {
            riskScore: fusion.riskScore,
            riskLevel: fusion.riskLevel,
            confidence: fusion.confidence,
            contradictionFlags: fusion.contradictionFlags,
            recommendations: fusion.recommendations,
            modelVersion: fusion.modelVersion,
          }
        : null,
    });
  } catch (err) {
    console.error('AI Intake report fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch assessment report' });
  }
});

router.post('/session/:sessionId/abort', async (req, res) => {
  try {
    const session = await AssessmentSession.findOne({
      _id: req.params.sessionId,
      user: req.user.id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ error: 'Completed session cannot be aborted' });

    session.status = 'aborted';
    session.failedReason = 'User aborted session';
    await session.save();
    res.json({ success: true });
  } catch (err) {
    console.error('AI Intake abort error:', err.message);
    res.status(500).json({ error: 'Failed to abort session' });
  }
});

module.exports = router;
