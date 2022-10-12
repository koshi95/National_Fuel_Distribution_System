const admin = require("../modules/admin");

const login = async (req, res) => {
    const result = await admin.login( req, res );
    res.send(result);
}

const addPumper = async (req, res) => {
    const result = await admin.addPumper( req );
    res.send(result);
}

const deletePumper = async (req, res) => {
    const result = await admin.deletePumper( req );
    res.send(result);
}

const pumperList = async (req, res) => {
    const result = await admin.pumperList( req );
    res.send(result);
}

const stockupdate = async (req, res) => {
    const result = await admin.stockupdate( req );
    res.send(result);
}

const stockupdateHistory = async (req, res) => {
    const result = await admin.stockupdateHistory( req );
    res.send(result);
}

const analytics = async (req, res) => {
    const result = await admin.analytics( req );
    res.send(result);
}

const EditPumper = async (req, res) => {
    const result = await admin.EditPumper( req );
    res.send(result);
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