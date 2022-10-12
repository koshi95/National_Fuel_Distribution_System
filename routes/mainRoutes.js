const express = require("express");
const router  = express.Router();
const path    = require("path");
const verify  = require("../modules/verification")
const cookieParser = require("cookie-parser");
router.use(cookieParser());

var root = {root: path.join(__dirname,'../views/')}

/* 
    --------- driver routing start ---------
*/

router.get("/",(req,res) => {
    res.sendFile('index.html',root)
})

router.get("/register", async (req,res) => {
    const verifyRes = await verify.check( req );
    if  ( verifyRes.msg == true ) {
        res.redirect('/select-vehicle')
        return;
    }
    res.sendFile("register.html",root)
})

router.get("/login", async (req,res) => {
    const verifyRes = await verify.check( req );
    if  ( verifyRes.msg == true ) {
        res.redirect('/select-vehicle')
        return;
    }
    res.sendFile("login.html",root)
})

router.get("/dashboard/:id(\\d+)", async (req,res) => {
    const verifyRes = await verify.check( req );
    if  ( verifyRes.msg == false ) {
        res.redirect('/login')
        return;
    }
    res.sendFile("dashboard.html",root)
})

router.get("/select-vehicle", async (req,res) => {
    const verifyRes = await verify.check( req );
    if  ( verifyRes.msg == false ) {
        res.send(verifyRes)
        return;
    }
    res.sendFile("select-vehicle.html",root)
})

/* 
    --------- driver routing end ---------
*/



/* 
    --------- pumper routing start ---------
*/

router.get("/pumper-login", async (req,res) => {
    const verifyRes = await verify.check( req, 2 );
    if  ( verifyRes.msg == true ) {
        res.redirect('/search-vehicle')
        return;
    }
    res.sendFile("pumper-login.html",root)
})

router.get("/fuel-pump/:id", async (req,res) => {
    const verifyRes = await verify.check( req, 2 );
    if  ( verifyRes.msg == false ) {
        res.redirect('/pumper-login')
        return;
    }
    res.sendFile("fuel-pump.html",root)
})

router.get("/search-vehicle",async (req,res) => {
    const verifyRes = await verify.check( req, 2 );
    if  ( verifyRes.msg == false ) {
        res.redirect('/pumper-login')
        return;
    }
    res.sendFile("search-vehicle.html",root)
})

router.get("/vehicle-details/", async (req,res) => {

    res.sendFile("vehicle-details.html",root)
    
})

/* 
    --------- pumper routing end ---------
*/

module.exports = router;