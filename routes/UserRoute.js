const express = require('express');
const UserController = require('../controllers/UserController');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const ScannerController = require('../controllers/ScannerController');
const AdminController = require('../controllers/AdminController');


const router =express.Router()

router.get('/me', AuthController.Me);
router.post('/me/update', UserController.UserUpdate)

router.post('/login', AuthMiddleware.IsTamu, AuthController.login);
router.delete('/logout',  AuthMiddleware.IsLogin, AuthController.logout);
router.post('/register',  AuthMiddleware.IsTamu, UserController.register);

router.get('/scanner/:email', AuthMiddleware.IsScanner, ScannerController.CheckKehadiran);
router.post('/scanner/:email', AuthMiddleware.IsScanner, ScannerController.UpdateKehadiran);

router.get('/admin', AuthMiddleware.IsAdmin, AdminController.getAllUser);
router.post('/admin', AuthMiddleware.IsAdmin, AdminController.searchUser);
router.post('/admin/create', AuthMiddleware.IsAdmin, AdminController.CreateUser);
router.delete('/admin/deleted/:id', AuthMiddleware.IsAdmin, AdminController.deleteUser);


module.exports = router;