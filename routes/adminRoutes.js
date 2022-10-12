const express = require("express");
const router  = express.Router();
const path    = require("path");
const verify  = require("../modules/verification")
const cookieParser = require("cookie-parser");
router.use(cookieParser());

var root = {root: path.join(__dirname,'../views/admin/')}

router.get("/", async (req,res) => {
    const verifyRes = await verify.check( req, 3 );
    if  ( verifyRes.msg == false ) {
        res.redirect('/admin/login')
        return;
    }
    res.sendFile('index.html',root)
})

router.get("/login",(req,res) => {
    res.sendFile("login.html",root)
})

router.get("/pumper", async (req,res) => {
    const verifyRes = await verify.check( req, 3 );
    if  ( verifyRes.msg == false ) {
        res.redirect('/admin/login')
        return;
    }
    res.sendFile("pumper.html",root)
})

router.get("/stock-update", async (req,res) => {
    const verifyRes = await verify.check( req, 3 );
    if  ( verifyRes.msg == false ) {
        res.redirect('/admin/login')
        return;
    }
    res.sendFile("stock-update.html",root)
})

module.exports = router;