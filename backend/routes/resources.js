const express = require('express');
const router = express.Router();
const IssueReport = require('../models/IssueReport');
const { auth } = require('../middleware/auth');

// GET /api/resources/assigned
// Retrieve all curated resources assigned to the user directly from their verified risk reports
router.get('/assigned', auth, async (req, res) => {
  try {
    const reports = await IssueReport.find({
      user: req.user.id,
      adminVerified: true,
      'assignedResources.0': { $exists: true }
    }).sort({ createdAt: -1 }).lean();

    // Flatten all assigned resources from reports into a single array
    const allResources = [];
    reports.forEach(report => {
      report.assignedResources.forEach(resource => {
        allResources.push({
          ...resource,
          assignedAt: report.createdAt,
          reportCategory: report.category
        });
      });
    });

    res.json({ success: true, resources: allResources });
  } catch (err) {
    console.error('Fetch assigned resources error:', err.message);
    res.status(500).json({ error: 'Failed to fetch assigned resources' });
  }
});

module.exports = router;
