const express = require('express');
const UserController = require('../controllers/UserController');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const ScannerController = require('../controllers/ScannerController');


const router =express.Router()

router.get('/me', AuthMiddleware.IsLogin, AuthController.Me)

router.post('/login', AuthMiddleware.IsTamu, AuthController.login)
router.delete('/logout',  AuthMiddleware.IsLogin, AuthController.logout)
router.post('/register',  AuthMiddleware.IsTamu, UserController.register);

router.get('/scanner/:email', AuthMiddleware.IsScanner, ScannerController.CheckKehadiran)
router.post('/scanner/:email', AuthMiddleware.IsScanner, ScannerController.UpdateKehadiran)

module.exports = router;