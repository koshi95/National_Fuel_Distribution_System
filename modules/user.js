const express   = require("express")
const app       = express()
const validator = require("validator")
const luxon     = require("luxon")
const conn      = require("../routes/db-config")
const verify    = require("./verification")
const otpSend   = require("./otpSend")
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


// this is a driver registration
const register =  async ( firstName, lastName, uniqNo, uniqNoType, address, mobile ) => {

    // Checking first name availability
    if ( !firstName ) {
        return ({ msg: false, val: 'Empty first name' });
    }
    
    // Checking last name availability
    if ( !lastName ) {
        return ({ msg: false, val: 'Empty last name' });
    }
    
    // Checking uniq number availability
    if ( !uniqNoType ) {
        return ({ msg: false, val: 'Empty uniq number type' });
    } 

    // Checking uniq number is true and get card type
    let card;
    if ( uniqNoType == '1' ) {
        card = 'Identy Number';
    } else if ( uniqNoType == '2' ) {
        card = 'Passport Number';
    } else {
        return ({ msg: false, val: 'Wrong uniq number type' });
    }
    
    // Checking uniqNo availability
    if ( !uniqNo ) {
        return ({ msg: false, val: `Empty ${card}` });
    } 
    
    // Checking address availability
    if ( !address ) {
        return ({ msg: false, val: 'Empty address' });
    } 

    // Checking mobile availability
    if ( !mobile ) {
        return ({ msg: false, val: 'Empty mobile number' });
    }

    // Length validations
    if ( !validator.isLength( firstName,{min:1,max:50} ) ) {
        return ({ msg: false, val: 'first name must be 1 to 50 characters' });	
    } if ( !validator.isLength( lastName,{min:1,max:50} ) ) {
        return ({ msg: false, val: 'last name must be 1 to 50 characters' });	
    } if ( !validator.isLength( uniqNo,{min:5,max:50} ) ) {
        return ({ msg: false, val: `Wrong ${card}` });
    } if ( !validator.isLength( address,{min:1,max:500} ) ) {
        return ({ msg: false, val: 'Address must be 1 to 500 characters' });	
    } if ( !validator.isLength( mobile,{min:10,max:10} ) ) {
        return ({ msg: false, val: 'Wrong mobile number' });	
    }

    // check if the mobile is an integer
    if ( !validator.isInt( mobile) ) {
        return ({ msg: false, val: 'Wrong mobile number' });
    }

    // check mobile number or uniqe number is already exists
    let uniqeCheck = new Promise(function(resolve) {
        conn.query(`SELECT mobile FROM user WHERE mobile = '${mobile}' || uniqNo = '${uniqNo}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong 1' });
            } else {
                if ( result.length == 0 ) {
                    resolve(true); 
                } else {
                    if ( result[0].mobile == mobile ) {
                        resolve ({ msg: false, val: 'This mobile number already registered' });
                        
                    }  else {
                        resolve ({ msg: false, val: `This ${card} already used` });
                    }
                }
            }
        })
    });

    let check = await uniqeCheck;
    if ( check != true ) {
        return check;
    }
    
    // Get current date
    const date = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("y-MM-dd HH:mm:ss");

    // Insert
    let insert = new Promise(function(resolve) {
        conn.query(`INSERT INTO user(id, firstName, lastName, uniqNo, uniqNoType, address, mobile, status, timestamp) VALUES ('','${firstName}','${lastName}','${uniqNo}','${uniqNoType}','${address}','${mobile}',0,'${date}')`,(error)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: 'Sucessfully registered' });
            }
        })
    });

    const result = await insert;
    if ( result.msg == true ) {
        return await otpSend.send( mobile, 1 );
    } else {
        return result;
    }

}

const verification = async ( mobile, code, res ) => {

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
        conn.query(`SELECT id FROM user WHERE mobile = '${mobile}' LIMIT 1;`,(error,result)=>{
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

    // check already sended
    let sended = new Promise(function(resolve) {
        conn.query(`SELECT id FROM verification WHERE userid = '${check.val}' && type = 1 && otp = '${code}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve({ msg: false, val: 'Wrong OTP code' });
                } else {
                    resolve (true);
                }
            }
        })
    });

    let send = await sended;
    if ( send != true ) {
        return send;
    }

    // check already sended
    let activeStatus = new Promise(function(resolve) {
        conn.query(`UPDATE user SET status = 1 WHERE mobile = '${mobile}';`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                conn.query(`DELETE FROM verification WHERE userid = '${check.val}' && type = 1;`);
                // SET AUTHENTICATION COOKIE
                const maxAge = 3 * 60 * 60;
                const token = jwt.sign(
                    { id: 1, uid: check.val, mobile: mobile, role: '1' },
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
            }
        })
    });

    return await activeStatus;
    
}

const vehicleTypes = async () => {
    // check mobile number is exists
    let getAll = new Promise(function(resolve) {
        conn.query(`SELECT id,vehicletype FROM vehicletype;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: result })
            }
        })
    });
    return await getAll;
}

const manufactureurers = async ( type ) => {
    // Checking address availability
    if ( !type ) {
        return ({ msg: false, val: 'Empty vehicle type' });
    } 

    if ( !validator.isInt( type ) ) {
        return ({ msg: false, val: 'Wrong vehicle type' });
    }

    if ( type == 0 ) {
        type = '';
    } else {
        type = `WHERE vehicleTypeId = ${type}`
    }

    // check mobile number is exists
    let getAll = new Promise(function(resolve) {
        conn.query(`SELECT id,manufactureurer FROM manufactureurer ${type};`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: result })
            }
        })
    });
    return await getAll;
}

const vehicleInfo = async ( req ) => {

    const verifyRes = await verify.check( req );

    if ( verifyRes.msg != true ) {
        return verifyRes;
    }


    if ( !req.body.data ) {
        return ({ msg: false, val: 'Empty data' });
    }

    const data = req.body.data.list;

    let validations = new Promise(function(resolve) {

        for ( var i = 0; i < data.length; i++ ) {

            if ( data[i].vehicleNO.length == 0 ) {

                resolve ({ msg: false, val: 'Empty vehicle number' });
                break;
            }
    
            if ( data[i].vehicalType == 0 ) {
                resolve ({ msg: false, val: 'vehicle type is not selected' });
                break;
            }
    
            if ( data[i].vehicalClass == 0 ) {
                resolve ({ msg: false, val: 'vehicle class is not selected' });
                break;
            }
    
            if ( data[i].manufacturer == 0 ) {
                resolve ({ msg: false, val: 'vehicle manufacturer is not selected' });
                break;
            }
    
            if ( data[i].vehicalColor == 0 ) {
                resolve ({ msg: false, val: 'Empty vehicle color' });
                break;
            }

            if ( data[i].fuleType != 1 && data[i].fuleType != 2 ) {
                resolve ({ msg: false, val: 'Empty fuel type' });
                break;
            }

            if ( i == data.length -1 ) {
                resolve({ msg: true })
            }
        }
        
    });

    const valid = await validations;
    if ( valid.msg == false ) {
        return valid;
    }

    let insert = new Promise(function(resolve) {

        for ( var i = 0; i < data.length; i++ ) {
            
            conn.query(`INSERT INTO vehicle(id, userid, vehicleno, chasieno, vehicletype, fueltype, color, class, manufacture) VALUES ('','${verifyRes.val}','${data[i].vehicleNO}','${data[i].chasisNumber}','${data[i].vehicalType}','${data[i].fuleType}','${data[i].vehicalColor}','${data[i].vehicalClass}','${data[i].manufacturer}')`)
            if ( i == data.length - 1 ) {
                resolve("")
            }
        }
        
    });

    await insert;

    return ({ msg: true, val: 'success' });

}

const userVehicleList = async ( req ) => {

    const verifyRes = await verify.check( req );
    if  ( verifyRes.msg == false ) {
        return verifyRes;
    }

    let getAll = new Promise(function(resolve) {
        conn.query(`SELECT id,vehicleno FROM vehicle WHERE userid = '${verifyRes.val}'`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: result })
            }
        })
    });
    return await getAll;

}

const userVehicleInfoGet = async ( req ) => {
    
    const verifyRes = await verify.check( req );
    if  ( verifyRes.msg == false ) {
        return verifyRes;
    }

    if ( !req.body.id ) {
        return({ msg: false, val: 'Empty vehicle id' });
    }

    let getData = new Promise(function(resolve) {
        conn.query(`
        SELECT vehicle.id, vehicle.vehicleno, vehicletype.vehicletype, vehicletype.vehicletype, vehicletype.available
        FROM vehicle 
        INNER JOIN vehicletype ON vehicletype.id = vehicle.vehicletype
        WHERE vehicle.id = '${req.body.id}' && vehicle.userid = '${verifyRes.val}';`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: result })
            }
        })
    });
    const data = await getData;
    if ( data.msg != true ) {
        return data;
    }


    const day   = await luxon.DateTime.now().setZone("Asia/Colombo").toFormat("cccc")
    const date  = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("dd");
    const month = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("M");
    const year  = luxon.DateTime.now().setZone("Asia/Colombo").toFormat("y");
    const info  = await getSunday(day, date, month, year);
    const timestamp = `${year}-${info.month}-${info.date} 11:59:59`;
    
    let availability = new Promise(function(resolve) {
        conn.query(`SELECT count FROM fuelpump WHERE vehicleId='${data.val[0].id}'&& timestamp > '${timestamp}'`,(error,result)=>{
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

    data.val[0].available = data.val[0].available - information.val;
    data.val[0].used = information.val;

    data.val[0].till = await getMonday(day, date, month, year)

    if ( data.val[0].fueltype == 1 ) {
        data.val[0].fueltype = "Petrol";
    } else {
        data.val[0].fueltype = "Diesel";
    }
    return data;

}

const driverLogin = async ( mobile ) => {

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
        conn.query(`SELECT id FROM user WHERE mobile = '${mobile}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve ({ msg: false, val: 'This mobile number is not registered' });
                } else {
                    resolve({ msg: true, val: result[0].id});
                }
            }
        })
    });

    let check = await uniqeCheck;
    if ( check.msg == true ) {
        return await otpSend.send( mobile, 2 );
    } else {
        return check;
    }

}

const Loginverification = async ( mobile, code, res ) => {

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
        conn.query(`SELECT id FROM user WHERE mobile = '${mobile}' && status = 1 LIMIT 1;`,(error,result)=>{
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
        conn.query(`SELECT id FROM verification WHERE userid = '${check.val}' && type = 2 && otp = '${code}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
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

    // set cookie

    let activeStatus = new Promise(function(resolve) {
        conn.query(`DELETE FROM verification WHERE userid = '${check.val}';`);
        // SET AUTHENTICATION COOKIE
        const maxAge = 3 * 60 * 60;
        const token = jwt.sign(
            { id: 1, uid: check.val, mobile: mobile, role: '1' },
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


const logOut = async ( res ) => {

    res.cookie("jwt", '', {
        httpOnly: true,
        maxAge: 0,
    });

    return({msg:true, val:'success'})

}

module.exports = {
    register,
    verification,
    vehicleInfo,
    userVehicleList,
    vehicleTypes,
    manufactureurers,
    userVehicleInfoGet,
    driverLogin,
    Loginverification,
    logOut
}