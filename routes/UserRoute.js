const express = require('express');
const UserController = require('../controllers/UserController');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/AuthMiddleware');


const router =express.Router()

router.get('/me', AuthMiddleware.verifyUser, AuthController.Me)
router.post('/login', AuthController.login)
router.delete('/logout', AuthController.logout)

router.post('/register', UserController.register);


module.exports = router;