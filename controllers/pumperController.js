const account = require("../modules/pumper");

const pumperLogin = async (req, res) => {
    const result = await account.pumperLogin( req.body.mobile );
    res.send(result);
}

const pumperLoginVerification = async (req, res) => {
    const result = await account.pumperLoginVerification( req.body.mobile, req.body.code, res );
    res.send(result);
}

const pumperDetails = async (req, res) => {
    const result = await account.pumperDetails( req, res );
    res.send(result);
}

const searchVehicle = async (req, res) => {
    const result = await account.searchVehicle( req );
    res.send(result);
}

const pump = async (req, res) => {
    const result = await account.pump( req );
    res.send(result);
}


module.exports = {
    pumperLogin,
    pumperLoginVerification,
    pumperDetails,
    searchVehicle,
    pump
}