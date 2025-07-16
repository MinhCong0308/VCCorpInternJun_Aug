const db = require('models/index');
const config = require('configs/index');
const { Op } = require('sequelize');

const accountService = {    
    async updateUsername(username, userid) {
        const user = await db.User.findOne({
            where: {[Op.and]: [
                {userid: userid}, {status: config.config.statusenum.AUTHENTICATED}
            ]},
        });
        console.log("user: ", user);
        if (!user) throw new Error("User not found"); // ← maybe add this
        const userWithUsername = await db.User.findOne({
            where: { username: username }
        });
        if(userWithUsername) {
            console.log("Username has been used");
            throw new Error("Username has been used");
        }
        user.username = username;
        await user.save();
        return {message: "Update username successfully"};
    },
    async updateFullname(newFullName, userid) {
        const {firstname, lastname} = await this.extractFullname(newFullName);
        const user = await db.User.findOne({
            where: {[Op.and]: [
                {userid: userid}, {status: config.config.statusenum.AUTHENTICATED}
            ]},
        });
        if(!user) {
            throw new Error("User does not exist or not authenticated");
        }
        user.firstname = firstname;
        user.lastname = lastname;
        await user.save();
        return {message: "Updated fullname successfully"};
    },
    async extractFullname(fullname) {
        const part = fullname.trim().split(/\s+/);
        const lastname = part[0];
        const firstname = part.slice(1).join(" ");
        return {firstname, lastname};
    },
    async deactivateAccount(userid) {
        const user = await db.User.findOne({
            where: {[Op.and]: [{userid}, {status: config.config.statusenum.AUTHENTICATED}]}
        })
        console.log("User found: ", user);
        if(!user) {
            throw new Error("User does not exist or not authenticated");
        }
        user.status = config.config.statusenum.NON_AUTHENTICATED;
        await user.save();
        return {message: "Deactivate successfully"};
    }
};
module.exports = accountService;