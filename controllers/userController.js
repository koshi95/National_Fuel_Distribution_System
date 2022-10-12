const account = require("../modules/user");

const register = async (req, res) => {
    const result = await account.register( req.body.firstName, req.body.lastName, req.body.uniqNo, req.body.uniqNoType, req.body.address, req.body.mobile );
    res.send(result);
}


const verification = async (req, res) => {
    const result = await account.verification( req.body.mobile, req.body.code, res );
    res.send(result);
}

const vehicleInfo = async (req, res) => {
    const result = await account.vehicleInfo( req );
    res.send(result);
}

const userVehicleList = async (req, res) => {
    const result = await account.userVehicleList( req );
    res.send(result);
}

const vehicleTypes = async (req, res) => {
    const result = await account.vehicleTypes(  );
    res.send(result);
}

const manufactureurers = async (req, res) => {
    const result = await account.manufactureurers( req.body.type );
    res.send(result);
}

const userVehicleInfoGet = async (req, res) => {
    const result = await account.userVehicleInfoGet( req );
    res.send(result);
}

const driverLogin = async (req, res) => {
    const result = await account.driverLogin( req.body.mobile );
    res.send(result);
}

const Loginverification = async (req, res) => {
    const result = await account.Loginverification( req.body.mobile, req.body.code, res );
    res.send(result);
}


const logOut = async (req, res) => {
    const result = await account.logOut( res );
    res.send(result);
}

module.exports = {
    register,
    verification,
    vehicleInfo,
    userVehicleInfoGet,
    userVehicleList,
    driverLogin,
    vehicleTypes,
    manufactureurers,
    Loginverification,
    logOut
}