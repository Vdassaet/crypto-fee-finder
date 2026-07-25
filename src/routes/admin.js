/**
 * ChainRecover AI - Admin Panel Express Router
 */

const express = require('express');
const router = express.Router();
const {
  getAdminDashboardSummary,
  getAdminUsers,
  getAdminWallets,
  getAdminScans,
  getAdminRevenue,
  getAdminApiUsage,
  getAdminLogs,
  getAdminErrors
} = require('../services/adminService');

/**
 * GET /api/v1/admin/dashboard
 */
router.get('/dashboard', (req, res) => {
  const data = getAdminDashboardSummary();
  res.json({ success: true, data });
});

/**
 * GET /api/v1/admin/users
 */
router.get('/users', (req, res) => {
  const users = getAdminUsers();
  res.json({ success: true, data: users });
});

/**
 * GET /api/v1/admin/wallets
 */
router.get('/wallets', (req, res) => {
  const wallets = getAdminWallets();
  res.json({ success: true, data: wallets });
});

/**
 * GET /api/v1/admin/scans
 */
router.get('/scans', (req, res) => {
  const scans = getAdminScans();
  res.json({ success: true, data: scans });
});

/**
 * GET /api/v1/admin/revenue
 */
router.get('/revenue', (req, res) => {
  const revenue = getAdminRevenue();
  res.json({ success: true, data: revenue });
});

/**
 * GET /api/v1/admin/api-usage
 */
router.get('/api-usage', (req, res) => {
  const apiUsage = getAdminApiUsage();
  res.json({ success: true, data: apiUsage });
});

/**
 * GET /api/v1/admin/logs
 */
router.get('/logs', (req, res) => {
  const logs = getAdminLogs();
  res.json({ success: true, data: logs });
});

/**
 * GET /api/v1/admin/errors
 */
router.get('/errors', (req, res) => {
  const errors = getAdminErrors();
  res.json({ success: true, data: errors });
});

module.exports = router;
