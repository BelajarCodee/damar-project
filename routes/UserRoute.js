const express = require('express');
const UserController = require('../controllers/UserController');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const ScannerController = require('../controllers/ScannerController');
const AdminController = require('../controllers/AdminController');


const router =express.Router()

router.get('/me', AuthMiddleware.IsLogin, AuthController.Me);
router.post('/me/update', AuthMiddleware.IsLogin, UserController.updateUser);

router.post('/login', AuthMiddleware.IsTamu, AuthController.login);
router.delete('/logout',  AuthMiddleware.IsLogin, AuthController.logout);
router.post('/register',  AuthMiddleware.IsTamu, UserController.register);

router.get('/scanner/:email', AuthMiddleware.IsScanner, ScannerController.CheckKehadiran);
router.post('/scanner/:email', AuthMiddleware.IsScanner, ScannerController.UpdateKehadiran);

router.get('/admin', AuthMiddleware.IsAdmin, AdminController.getAllUser);
router.post('/admin', AuthMiddleware.IsAdmin, AdminController.searchUser);
router.post('/admin/create', AuthMiddleware.IsAdmin, AdminController.CreateUser);
router.delete('/admin/deleted/:id', AuthMiddleware.IsAdmin, AdminController.deleteUser);
router.delete('/admin/deleted', AuthMiddleware.IsAdmin, AdminController.deletedAllUser)


module.exports = router;