const express   = require("express")
const app       = express()
const jwt       = require('jsonwebtoken')
const conn      = require("../routes/db-config")

const cookieParser = require("cookie-parser");
app.use(cookieParser());


const check =  async function ( req, role = 1 ) {
    if ( req.cookies == undefined ) {
        return ({ msg: false, val: 'Not authorized' });
    }
    if ( req.cookies.jwt == undefined ) {
        return ({ msg: false, val: 'Not authorized' });
    }

    let check = new Promise(function(resolve) {
        jwt.verify(req.cookies.jwt, process.env.JWTSECRET, (err, decodedToken) => {
            if (err) {
                resolve({ msg: false, val: 'Not authorized' });
            } else {
                
                if ("uid" in decodedToken) {
                    if ( role == 1 ) {
                        table = 'user';
                    } else if ( role == 2 ) {
                        table = 'pumper';
                    } else {
                        table = 'admin';
                    }
                    conn.query(`SELECT id FROM ${table} WHERE id = '${decodedToken.uid}';`,(error,result)=>{
                        if (error) {
                            resolve({ msg: false, val: 'Somthing went wrong' });
                        } 
                        if ( result.length == 0 ) {
                            resolve({ msg: false, val: 'Not authorized' });
                        } else {
                            resolve({ msg: true, val: result[0].id });
                        }
                    })
                } else {
                    resolve({ msg: false, val: 'Not authorized' });
                }
            }
        })
    })
    return await check;
}
 
module.exports = {
    check
}