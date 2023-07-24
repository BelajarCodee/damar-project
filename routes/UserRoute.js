const express = require('express');
const UserController = require('../controllers/UserController');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/AuthMiddleware');


const router =express.Router()

router.get('/me', AuthMiddleware.IsUser, AuthController.Me)

router.post('/login', AuthMiddleware.IsTamu, AuthController.login)
router.delete('/logout',  AuthMiddleware.IsLogin, AuthController.logout)

router.post('/register',  AuthMiddleware.IsTamu, UserController.register);

module.exports = router;