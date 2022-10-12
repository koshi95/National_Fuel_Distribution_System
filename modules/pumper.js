const express   = require("express")
const app       = express()
const validator = require("validator")
const luxon     = require("luxon")
const conn      = require("../routes/db-config")
const verify    = require("./verification")
const otpSend    = require("./otpSend")
const jwt       = require('jsonwebtoken')
const cookieParser = require("cookie-parser")
app.use(cookieParser())
require("dotenv").config()

/* Start functions */


function dayBack( day ) {
    if ( day == 'Monday' ) {
        return 1;
    } else if ( day == 'Tuesday' ) {
        return 2;
    } else if ( day == 'Wednesday' ) {
        return 3;
    } else if ( day == 'Thursday' ) {
        return 4;
    } else if ( day == 'Friday' ) {
        return 5;
    } else if ( day == 'Saturday' ) {
        return 6;
    } else if ( day == 'Sunday' ) {
        return 7;
    }
}

function monthDays( year, month ) {
    if ( month == 1 ) {
        return 31;
    } if ( month == 2 ) {
        if ( year % 4 ) {
            return 29;
        }
        return 28;
    } if ( month == 3 ) {
        return 31;
    } if ( month == 4 ) {
        return 30;
    } if ( month == 5 ) {
        return 31;
    } if ( month == 6 ) {
        return 30;
    } if ( month == 7 ) {
        return 31;
    } if ( month == 8 ) {
        return 31;
    } if ( month == 9 ) {
        return 30;
    } if ( month == 10 ) {
        return 31;
    } if ( month == 11 ) {
        return 30;
    } if ( month == 12 ) {
        return 31;
    }
}

function oneTotwo( count ) {
    if ( count < 10 ) {
        return `0${count}`
    }
    return count;
}

async function getSunday(day, date, month, year) {

    var back = await dayBack( day );
    
    date = date-back;
    if ( date < 0 ) {
        month = (month - 1);
        back = await monthDays( year, month );
        date = back + date;
    }
    date = oneTotwo(date);
    month = oneTotwo(month);
    return {date:date, month:month};

}

async function getMonday(day, date, month, year) {

    var back = await dayBack( day );
    
    date = parseInt(date) + 8 - back;

    back = await monthDays( parseInt(year), parseInt(month) );
    if ( date > back ) {
        month = (parseInt(month) + 1);
        date = date - back;
    }
    date = oneTotwo(date);
    month = oneTotwo(month);
    return {date:date, month:month};

}

/* End functions */


const pumperLogin = async ( mobile ) => {

    // Checking mobile availability
    if ( !mobile ) {
        return ({ msg: false, val: 'Empty mobile number' });
    }

    // Length validations
    if ( !validator.isLength( mobile,{min:10,max:10} ) ) {
        return ({ msg: false, val: 'Wrong mobile number' });	
    }

    // check if the mobile is an integer
    if ( !validator.isInt( mobile) ) {
        return ({ msg: false, val: 'Wrong mobile number' });
    }

    // check mobile number is exists
    let uniqeCheck = new Promise(function(resolve) {
        conn.query(`SELECT id FROM pumper WHERE mobile = '${mobile}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve ({ msg: false, val: 'Wrong phone number' });
                } else {
                    resolve({ msg: true, val: result[0].id});
                }
            }
        })
    });

    let check = await uniqeCheck;
    if ( check.msg == true ) {
        return await otpSend.send( mobile, 3 );
    } else {
        return check;
    }

}

const pumperLoginVerification = async ( mobile, code, res ) => {

    // Checking address availability
    if ( !code ) {
        return ({ msg: false, val: 'Empty OTP code' });
    } 

    // Checking mobile availability
    if ( !mobile ) {
        return ({ msg: false, val: 'Empty mobile number' });
    }

    // length validation
    if ( !validator.isLength( mobile,{min:10,max:10} ) ) {
        return ({ msg: false, val: 'Wrong mobile number' });	
    }

    // check if the mobile is an integer
    if ( !validator.isInt( mobile) ) {
        return ({ msg: false, val: 'Wrong mobile number' });
    } if ( !validator.isInt( code) ) {
        return ({ msg: false, val: 'Wrong OTP code' });
    }

    // check mobile number is exists
    let uniqeCheck = new Promise(function(resolve) {
        conn.query(`SELECT id FROM pumper WHERE mobile = '${mobile}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve ({ msg: false, val: 'Somthing went wrong' });
                } else {
                    resolve({ msg: true, val: result[0].id});
                }
            }
        })
    });
 
    let check = await uniqeCheck;
    if ( check.msg != true ) {
        return check;
    }

    
    let sended = new Promise(function(resolve) {
        conn.query(`SELECT id FROM verification WHERE userid = '${check.val}' && type = 3 && otp = '${code}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                console.log(`SELECT id FROM verification WHERE userid = '${check.val}' && type = 3 && otp = '${code}' LIMIT 1;`)
                if ( result.length == 0 ) {
                    resolve({ msg: false, val: 'Wrong OTP code' });
                } else {
                    resolve ({ msg: true, val: result[0].id });
                }
            }
        })
    });

    let send = await sended;
    if ( send.msg != true ) {
        return send;
    }

    let activeStatus = new Promise(function(resolve) {
        conn.query(`DELETE FROM verification WHERE userid = '${check.val}' && type = 3;`);
        // SET AUTHENTICATION COOKIE
        const maxAge = 3 * 60 * 60;
        const token = jwt.sign(
            { id: 1, uid: check.val, mobile: mobile, role: '2' },
            process.env.JWTSECRET,
            {
                expiresIn: maxAge, // 3hrs in sec
            }
        );
        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000, // 3hrs in ms
        });
        resolve({ msg: true, val: 'Successfully verified' });
    });

    return await activeStatus;
    
}

const pumperDetails =  async ( req, res ) => {

    const verifyRes = await verify.check( req, 2 );
    if  ( verifyRes.msg == false ) {
        return verifyRes;
    }

    // check user is exists
    let getData = new Promise(function(resolve) {
        conn.query(`
        SELECT name, stationId
        FROM pumper 
        WHERE id = '${verifyRes.val}';`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: result })
            }
        })
    });

    return await getData;

}

const searchVehicle = async ( req ) => {
    const verifyRes = await verify.check( req, 2 );
    if  ( verifyRes.msg == false ) {
        return verifyRes;
    }

    if ( !req.body.vehicleNo ) { 
        return({ msg: false, val: 'Empty vehicle id' });
    }

    let getData = new Promise(function(resolve) {
        conn.query(`
        SELECT vehicle.id, vehicle.vehicleno, vehicle.color, vehicle.class, vehicletype.vehicletype, vehicle.fueltype, vehicletype.available
        FROM vehicle 
        INNER JOIN vehicletype ON vehicletype.id = vehicle.vehicletype
        WHERE vehicle.vehicleno = '${req.body.vehicleNo}'`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if (result.length == 0){
                    resolve({ msg: false, val: 'No vehicle found' });
                }else {
                    resolve({ msg: true, val: result })
                }
            }
        })
    });

    const data = await getData;
    if ( data.msg != true ) {
        return data;
    }

    // fuel availability
    const day   = await luxon.DateTime.now().setZone("Asia/Colombo").toFormat("cccc")
    const date  = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("dd");
    const month = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("M");
    const year  = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("y");
    const info  = await getSunday(day, date, month, year);
    const timestamp = `${year}-${info.month}-${info.date} 11:59:59`;
    let availability = new Promise(function(resolve) {
        conn.query(`SELECT count FROM fuelpump WHERE vehicleId='${data.val[0].id}' && timestamp > '${timestamp}'`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve({ msg: true, val: 0 });
                    return;
                }
                let count = 0;
                for ( var i = 0; i < result.length ; i++ ) {
                    count += result[i].count
                    if ( i == result.length - 1 ) {
                        resolve({ msg: true, val: count });
                    }
                }
                
            }
        })
    });
    const information = await availability;
    if ( information.msg != true ) {
        return information;
    }

    data.val[0].avalilable = data.val[0].available - information.val;

    if (data.val.length == 0){
        return {msg:false,val:'No Data Found'}
    }
    if ( data.val[0].fueltype == 1 ) {
        data.val[0].fueltype = "Petrol";
    } else {
        data.val[0].fueltype = "Diesel";
    }
    data.val[0].used = "5L";
    return data;

}

const pump = async ( req ) => {
    const verifyRes = await verify.check( req, 2 );
    if  ( verifyRes.msg == false ) {
        return verifyRes;
    }

    if ( !req.body.vehicleNo ) {
        return({ msg: false, val: 'Empty vehicle id' });
    }
    if ( !req.body.amount ) {
        return({ msg: false, val: 'Empty amount' });
    }
    
    let getData = new Promise(function(resolve) {
        conn.query(`
        SELECT vehicle.id , vehicletype.available
        FROM vehicle 
        INNER JOIN vehicletype ON vehicletype.id = vehicle.vehicletype
        WHERE vehicle.vehicleno = '${req.body.vehicleNo}'`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if (result.length == 0){
                    resolve({msg:false,val:'No vehicle Found'})
                } else {
                    resolve({ msg: true, val: result })
                }
            }
        })
    });

    const data = await getData;
    if ( data.msg != true ) {
        return data;
    }

    // fuel availability
    const day   = await luxon.DateTime.now().setZone("Asia/Colombo").toFormat("cccc")
    const dateH  = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("dd");
    const month = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("M");
    const year  = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("y");
    const info  = await getSunday(day, dateH, month, year);
    const timestamp = `${year}-${info.month}-${info.date} 11:59:59`;
    let availability = new Promise(function(resolve) {
        conn.query(`SELECT count FROM fuelpump WHERE vehicleId='${data.val[0].id}' && timestamp > '${timestamp}'`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve({ msg: true, val: 0 });
                    return;
                }
                let count = 0;
                for ( var i = 0; i < result.length ; i++ ) {
                    count += result[i].count
                    if ( i == result.length - 1 ) {
                        resolve({ msg: true, val: count });
                    }
                }
                
            }
        })
    });
    const information = await availability;
    if ( information.msg != true ) {
        return information;
    }

    if ( parseInt(req.body.amount) > (data.val[0].available - information.val) ) {
        return ({ msg: false, val: 'This amount is not available' })
    }

    const date = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("y-MM-dd HH:mm:ss");
    
    let insert = new Promise(function(resolve) {
        conn.query(`
        INSERT INTO fuelpump(id, vehicleId, pumperId, count, timestamp) VALUES ('','${data.val[0].id}','${verifyRes.val}','${req.body.amount}','${date}')`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong1' });
            } else {
                resolve({ msg: true, val: "success" })
            }
        })
    });

    
    return await insert;

}


module.exports = {
    pumperLogin,
    pumperLoginVerification,
    searchVehicle,
    pumperDetails,
    pump
}