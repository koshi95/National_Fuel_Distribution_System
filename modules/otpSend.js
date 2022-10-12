const luxon        = require("luxon")
const validator    = require("validator")
const conn         = require("../routes/db-config")
const axios        = require('axios')

require("dotenv").config()

const send = async ( mobile, type ) => {
    // Checking mobile availability
    if ( !mobile ) {
        return ({ msg: false, val: 'Empty mobile number' })
    }

    // Length validations
    if ( !validator.isLength( mobile,{min:10,max:10} ) ) {
        return ({ msg: false, val: 'Wrong mobile number' })
    }

    // check if the mobile is an integer
    if ( !validator.isInt( mobile) ) {
        return ({ msg: false, val: 'Wrong mobile number' })
    }

    // check mobile number is exists
    let uniqeCheck = new Promise(function(resolve) {
        var table;
        if ( type == 1 ) {
            table = 'user'
        } else if ( type == 2 ) {
            table = 'user'
        } else {
            table = 'pumper'
        }
        conn.query(`SELECT id FROM ${table} WHERE mobile = '${mobile}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong2' });
            } else {
                if ( result.length == 0 ) {
                    resolve ({ msg: false, val: 'Somthing went wrong1' })
                } else {
                    resolve({ msg: true, val: result[0].id})
                }
            }
        })
    });

    let check = await uniqeCheck;
    if ( check.msg != true ) {
        return check;
    }

    // check already sended
    let sended = new Promise(function(resolve) {
        conn.query(`SELECT id FROM verification WHERE userid = '${check.val}' && type = ${type} LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' })
            } else {
                if ( result.length == 0 ) {
                    resolve (true);
                } else {
                    if ( type == 3 || type == 2 ) {
                        resolve (true);
                    } else {
                        resolve({ msg: false, val: 'Already sended' })
                    }
                    
                }
            }
        })
    });

    let send = await sended;
    if ( send != true ) {
        return send;
    }

    const otpCode = "0123456".split('').sort(function(){return 0.5-Math.random()}).join('').substring(0,6);

    // Get current date
    const date = luxon.DateTime.now().setZone("Asia/COlombo").toFormat("y-MM-dd HH:mm:ss")
    
    let insert = new Promise(function(resolve) {
        conn.query(`INSERT INTO verification(id, userid, otp, type, timestamp) VALUES ('','${check.val}','${otpCode}',${type},'${date}')`,(error)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong4' })
            } else {
                axios.post('https://sms.virgincareer.lk/api/v3/sms/send', {
                    recipient : mobile,
                    sender_id : process.env.SENDER,
                    message   : otpCode
                },
                {
                headers: {
                    Authorization: `Bearer ${process.env.SMSAUTH}`
                }
                })
                .then(res => {
                    console.log(res)
                    if (res.data.status == 'success'){
                        resolve({ msg: true, val: 'verification code successfully send' })
                    } else {
                        resolve({ msg: false, val: 'Failed to send verification code' })
                    }
                })
                .catch(error => {
                    console.log(error);
                    resolve({ msg: false, val: 'Failed to send verification code' })
                });
                
            }
        })
    });
    
    return await insert;
}

module.exports = {
    send
}