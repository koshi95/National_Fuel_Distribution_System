const validator    = require("validator"); // for input validation
const luxon        = require("luxon"); // for get date
const bcrypt       = require("bcrypt");
const jwt          = require('jsonwebtoken')
const conn         = require("../routes/db-config")
const verify       = require("./verification")
const cookieParser = require("cookie-parser");
const express      = require("express");
const { reset } = require("nodemon");
const app          = express();
app.use(cookieParser())

require("dotenv").config()

app.use(cookieParser());

// login
const login = async ( req, res ) => {

    if ( !req.body.mobile ) {
        return ({ msg: false, val: 'Empty mobile number' });
    }
    if ( !req.body.password ) {
        return ({ msg: false, val: 'Empty password' });
    }

    const password = await bcrypt.hash( req.body.password, process.env.SOLT );

    // check mobile number or uniqe number is already exists
    let Check = new Promise(function(resolve) {
        conn.query(`SELECT id FROM admin WHERE mobile = '${req.body.mobile}' && password = '${password}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve({ msg: false, val: 'Wrong information' }); 
                } else {
                    // SET AUTHENTICATION COOKIE
                    const maxAge = 3 * 60 * 60;
                    const token = jwt.sign(
                        { id: 1, uid: result[0].id, role: '3' },
                            process.env.JWTSECRET,
                        {
                            expiresIn: maxAge, // 3hrs in sec
                        }
                    );
                    res.cookie("jwt", token, {
                        httpOnly: true,
                        maxAge: maxAge * 1000, // 3hrs in ms
                    });
                    resolve ({ msg: true, val: 'successfully loged in' });
                }
            }
        })
    });
    return  await Check;
}

// Add new pumper
const addPumper = async ( req ) => {

    const verifyRes = await verify.check( req, 3 );
    if ( verifyRes.msg != true ) {
        return verifyRes;
    }

    if ( !req.body.mobile ) {
        return ({ msg: false, val: 'Empty Mobile Number' });
    }
    if ( !req.body.nic ) {
        return ({ msg: false, val: 'Empty NIC' });
    }
    if ( !req.body.name ) {
        return ({ msg: false, val: 'Empty Name' });
    }
    if ( !req.body.stationId ) {
        return ({ msg: false, val: 'Empty station ID' });
    }

    
    // check mobile number or uniqe number is already exists
    let uniqeCheck = new Promise(function(resolve) {
        conn.query(`SELECT id FROM pumper WHERE mobile = '${req.body.mobile}'  LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve(true); 
                } else {
                    resolve ({ msg: false, val: 'This mobile number already added' });
                }
            }
        })
    });

    let check = await uniqeCheck;
    if ( check != true ) {
        return check;
    }

    // Insert
    let insert = new Promise(function(resolve) {
        conn.query(`INSERT INTO pumper(id, nic, name, stationId, mobile) VALUES ('','${req.body.nic}','${req.body.name}','${req.body.stationId}','${req.body.mobile}')`,(error)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: 'Sucessfully added' });
            }
        })
    });

    return await insert;
    
}


// Edit pumper
const EditPumper = async ( req ) => {

    const verifyRes = await verify.check( req, 3 );
    if ( verifyRes.msg != true ) {
        return verifyRes;
    }

    if ( !req.body.mobile ) {
        return ({ msg: false, val: 'Empty Mobile Number' });
    }
    if ( !req.body.id ) {
        return ({ msg: false, val: 'Empty id' });
    }
    if ( !req.body.nic ) {
        return ({ msg: false, val: 'Empty NIC' });
    }
    if ( !req.body.name ) {
        return ({ msg: false, val: 'Empty Name' });
    }
    if ( !req.body.stationId ) {
        return ({ msg: false, val: 'Empty station ID' });
    }

    
    // check mobile number or uniqe number is already exists
    let uniqeCheck = new Promise(function(resolve) {
        conn.query(`SELECT id FROM pumper WHERE mobile = '${req.body.mobile}' AND id != '${req.body.id}' LIMIT 1;`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve(true); 
                } else {
                    resolve ({ msg: false, val: 'This mobile number already added' });
                }
            }
        })
    });

    let check = await uniqeCheck;
    if ( check != true ) {
        return check;
    }

    // Insert
    let insert = new Promise(function(resolve) {
        conn.query(`UPDATE pumper SET nic='${req.body.nic}', name='${req.body.name}', stationId='${req.body.stationId}', mobile = '${req.body.mobile}' WHERE id = '${req.body.id}'`,(error)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: 'Sucessfully Changed' });
            }
        })
    });

    return await insert;
    
}

// delete pumper
const deletePumper = async ( req ) => {

    const verifyRes = await verify.check( req, 3 );
    if ( verifyRes.msg != true ) {
        return verifyRes;
    }

    if ( !req.body.id ) {
        return ({ msg: false, val: 'Empty pumper id' });
    }

    if ( !validator.isInt(req.body.id) ) {
        return ({ msg: false, val: 'Wrong pumper id' });
    }
    
    // check mobile number or uniqe number is already exists
    let uniqeCheck = new Promise(function(resolve) {
        conn.query(`DELETE FROM pumper WHERE id = '${req.body.id}';`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve ({ msg: true, val: 'Successfully deleted' });
            }
        })
    });

    return await uniqeCheck;
    
}

// All pumpers List
const pumperList = async ( req ) => {

    const verifyRes = await verify.check( req, 3 );
    if  ( verifyRes.msg == false ) {
        return verifyRes;
    }

    const arr = []
    let getAll = new Promise(function(resolve) {
        conn.query(`SELECT * FROM pumper`,async (error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                for ( var i = 0; i < result.length; i++ ) {

                    let count = 0;
                    let a = new Promise(function(resolve2){
                        conn.query(`SELECT count FROM fuelpump WHERE pumperId = '${result[i].id}'`,(error,result1)=>{
                            if (error) {
                                console.log(error)
                            } else {
                                if ( result1.length == 0 ) {
                                    resolve2(true)
                                }
                                for ( j = 0; j<result1.length;j++ ) {
                                    count += result1[j].count
                                    if ( j == result1.length - 1 ) {
                                        resolve2(true)
                                    }
                                } 
                            }
                        })
                    })
                    await a;

                    const child = {
                        id : result[i].id,
                        nic : result[i].nic,
                        name : result[i].name,
                        stationId : result[i].stationId,
                        mobile : result[i].mobile,
                        fuel : count
                    }
                    arr.push(child)
                    if ( i == result.length - 1 ) {
                        resolve(true)
                    }
                }
            }
        })
    });

    const data = await getAll;
    if ( data != true ) {
        return data;
    }

    return({"msg":true, val:arr})


}

// Update the fuel stock
const stockupdate = async ( req ) => {

    const verifyRes = await verify.check( req, 3 );
    if ( verifyRes.msg != true ) {
        return verifyRes;
    }

    if ( !req.body.type ) {
        return ({ msg: false, val: 'Empty fuel type' });
    }
    if ( !req.body.count ) {
        return ({ msg: false, val: 'Empty count' });
    }
    if ( req.body.type != 1 && req.body.type != 2 ) {
        return ({ msg: false, val: 'Wrong fuel type' });
    }

    // Get current date
    const date = luxon.DateTime.now().setZone("Asia/COlombo").toFormat("y-MM-dd HH:mm:ss");

    // Insert
    let insert = new Promise(function(resolve) {
        conn.query(`INSERT INTO stock(id, type, count, AddedTime) VALUES ('','${req.body.type}','${req.body.count}','${date}')`,(error)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                resolve({ msg: true, val: 'Sucessfully added' });
            }
        })
    });

    return await insert;
    
}

const stockupdateHistory = async ( req ) => {

    const verifyRes = await verify.check( req, 3 );
    if  ( verifyRes.msg == false ) {
        return verifyRes;
    }

    const arr = []
    let getAll = new Promise(function(resolve) {
        conn.query(`SELECT * FROM stock`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                for ( var i = 0; i < result.length; i++ ) {
                    // result[i].AddedTime = result[i].AddedTime.substr(0,10)
                    result[i].AddedTime = (JSON.stringify(result[i].AddedTime).substring(1,11))+ " " + JSON.stringify(result[i].AddedTime).substring(12,17)
                    if ( i == result.length -1 ) {
                        resolve({"msg":true, val:result})
                    }
                }
                
            }
        })
    });

    return await getAll;
    


}

const analytics = async ( req ) => {

    const verifyRes = await verify.check( req, 3 );
    if  ( verifyRes.msg == false ) {
        return verifyRes;
    }

    // Get stock amount start
    let getStock = new Promise(function(resolve) {
        conn.query(`SELECT count,type FROM stock`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve({"msg":true, val:0})
                }
                let Petrol = 0;
                let Deisel = 0;
                for ( i = 0; i<result.length;i++ ) {
                    if ( result[i].type == 1 ) {
                        Petrol += result[i].count;
                    } else {
                        Deisel += result[i].count;
                    }
                    if ( i == result.length - 1 ) {
                        resolve({"msg":true, val:{patrol:Petrol, deisel:Deisel}})
                    }
                }
            }
        })
    });

    const stock = await getStock;

    let getPump = new Promise(function(resolve) {
        conn.query(`SELECT fuelpump.count,vehicle.fueltype FROM fuelpump INNER JOIN vehicle ON vehicle.id = fuelpump.vehicleId`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve({"msg":true, val:{patrol:0, deisel:0}})
                }
                let Petrol = 0;
                let Deisel = 0;
                for ( i = 0; i<result.length;i++ ) {
                    if ( result[i].type == 1 ) {
                        Petrol += result[i].count;
                    } else {
                        Deisel += result[i].count;
                    }
                    if ( i == result.length - 1 ) {
                        resolve({"msg":true, val:{patrol:Petrol, deisel:Deisel}})
                    }
                }
            }
        })
    });

    const pump = await getPump;
    let patrol = stock.val.patrol - pump.val.patrol
    let deisel = stock.val.deisel - pump.val.deisel
    var stockAmout  = ({petrol:patrol, deisel:deisel});

    // Get day user count and sale
    const date = luxon.DateTime.now().setZone("Asia/COlombo").toFormat("y-MM-dd");
    var start  = date+' 00:00'
    var end    = date+' 23:59:59'
    let getUsers = new Promise(function(resolve) {
        conn.query(`SELECT fuelpump.count, vehicle.fueltype 
        FROM fuelpump INNER JOIN vehicle ON vehicle.id = fuelpump.vehicleId WHERE fuelpump.timestamp > '${start}' &&  fuelpump.timestamp < '${end}'`,(error,result)=>{
            if (error) {
                resolve({ msg: false, val: 'Somthing went wrong' });
            } else {
                if ( result.length == 0 ) {
                    resolve({"msg":true, count:{patrol:0, deisel:0}, users:{patrol:0, deisel:0}})
                }
                let Petrol = 0;
                let Deisel = 0;
                let UPetrol = 0;
                let UDeisel = 0;
                for ( i = 0; i<result.length;i++ ) {
                    if ( result[i].type == 1 ) {
                        Petrol += result[i].count;
                        UPetrol += 1;
                    } else {
                        Deisel += result[i].count;
                        UDeisel += 1;
                    }
                    if ( i == result.length - 1 ) {
                        resolve({"msg":true, count:{patrol:Petrol, deisel:Deisel}, users:{patrol:UPetrol, deisel:UDeisel}})
                    }
                }
            }
        })
    });

    const userCount = await getUsers;
    if ( userCount == false ) {
        return userCount;
    }

    
    return ({ 
        stock : stockAmout,
        totalSale : pump.val,
        userCount: userCount.users,
        count: userCount.count
    });

}

 
module.exports = {
    login,
    addPumper,
    deletePumper,
    pumperList,
    stockupdate,
    stockupdateHistory,
    analytics,
    EditPumper
}