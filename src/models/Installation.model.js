const mongoose = require("mongoose");

const installationSchema = new mongoose.Schema({
    key: {
        type: String,
        enum: ["installation"],
        default: "installation",
        required: true,
        unique: true,
        immutable: true,
    },
    installedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

module.exports = mongoose.model("Installation", installationSchema);