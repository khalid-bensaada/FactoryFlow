
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const userRepository = require("../repositories/user.repository");
const installationRepository = require("../repositories/installation.repository");

const isAlreadyInstalledError = (err) =>
    (err.code === 11000 && err.keyPattern && err.keyPattern.key) ||
    err.code === 112;

const getStatus = async () => installationRepository.exists();

const install = async ({ name, email, password }) => {
    if (await installationRepository.exists()) {
        throw new AppError("Application already installed", 409);
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const admin = await userRepository.create(
            { name, email, password: password, role: "Admin" },
            session
        );

        await installationRepository.create({ admin: admin._id }, session);

        await session.commitTransaction();

        return {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt,
        };
    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (isAlreadyInstalledError(err)) {
            throw new AppError("Application already installed", 409);
        }
        throw err;
    } finally {
        await session.endSession();
    }
};

module.exports = { getStatus, install };