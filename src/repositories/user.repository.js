const User = require('../models/user.model');

const findByEmail = (email) => User.findOne({ email });

const findByEmailWithPassword = (email) =>
  User.findOne({ email }).select('+password');

const findById = (id) => User.findById(id);

const create = (data) => User.create(data);

module.exports = {
  findByEmail,
  findByEmailWithPassword,
  findById,
  create,
};