const Installation = require("../models/Installation.model");

const exists = async () => {
    const doc = await Installation.exists({});
    return doc !== null;
};

const create = async (data, session) => {
    const [installation] = await Installation.create([data], { session });
    return installation;
};

module.exports = { exists, create };