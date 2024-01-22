"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeMain = void 0;
const event_1 = require("bdsx/event");
const blockpos_1 = require("bdsx/bds/blockpos");
const message_1 = require("./src/utils/message.js");
const path = require("path");
const fs = require("fs");
const { CommandExecuteFlag } = require("bdsx/bds/command");
const { DimensionId } = require("bdsx/bds/actor");
const { int8_t, int16_t } = require("bdsx/nativetype");
const { MinecraftPacketIds } = require("bdsx/bds/packetids");
const teleporting = new Map();
let config = {
    timeout: 5,
    home_limit: 3,
};
let homes = {};
const configPath = path.join(__dirname, "/src/config/settings.json");
const homePath = path.join(__dirname, "/src/data/homes.json");
try {
    config = require(configPath);
    homes = require(homePath);
}
catch (err) { }
/**HomeMain */
var HomeMain;
(function (HomeMain) {
    /**Set Teleport Timeout */
    async function setTeleportTimeout(value) {
        return new Promise((resolve, reject) => {
            if (!(value >= 0)) {
                reject("Invalid value!");
                return;
            }
            config.timeout = value;
            resolve();
        });
    }
    HomeMain.setTeleportTimeout = setTeleportTimeout;
    /**Get Teleport Timeout */
    function getTeleportTimeout() {
        if (!config.timeout)
            return undefined;
        if (config.timeout < 0 || config.timeout === 0)
            return undefined;
        return config.timeout;
    }
    HomeMain.getTeleportTimeout = getTeleportTimeout;
    /**Set Default Limit */
    async function setDefaultLimit(value) {
        return new Promise((resolve, reject) => {
            if (!(value >= 0)) {
                reject("Invalid value!");
                return;
            }
            config.home_limit = value;
            resolve();
        });
    }
    HomeMain.setDefaultLimit = setDefaultLimit;
    /**Get Default Home Limit */
    function getDefaultLimit() {
        if (config.home_limit < 0)
            return 0;
        else
            return config.home_limit;
    }
    HomeMain.getDefaultLimit = getDefaultLimit;
    /**Set Max Limit */
    // export async function setMaxLimit(value: number): Promise<void> {
    //     return new Promise((resolve, reject) => {
    //         if (!(value >= 0)) {
    //             reject("Invalid value!");
    //             return;
    //         }
    //         config.max_home_limit=value;
    //         resolve();
    //     });
    // }
    // /**Get Max Home Limit */
    // export function getMaxLimit(): number {
    //     if (config.max_home_limit < 0) return 0;
    //     else return config.max_home_limit;
    // }
    /**Set Player Homes Limit */
    async function setHomesLimit(player, value) {
        return new Promise((resolve, reject) => {
            if (!hasPlayer(player)) {
                reject("Xuid not found!");
                return;
            }
            if (value < 0) {
                reject("Invalid value!");
                return;
            }
            homes[player.getXuid()].limit = value;
            resolve();
        });
    }
    HomeMain.setHomesLimit = setHomesLimit;
    /**Remove Player Homes Limit */
    async function removeHomesLimit(player, value) {
        return new Promise((resolve, reject) => {
            if (!hasPlayer(player)) {
                reject("Xuid not found!");
                return;
            }
            if (value < 0 || (getHomesLimit(player) - value) < 0) {
                reject("Invalid value!");
                return;
            }
            homes[player.getXuid()].limit -= value;
            resolve();
        });
    }
    HomeMain.removeHomesLimit = removeHomesLimit;
    /**Set Player Homes Limit */
    async function addHomesLimit(player, value) {
        return new Promise((resolve, reject) => {
            if (!hasPlayer(player)) {
                reject("Xuid not found!");
                return;
            }
            if (value < 0) {
                reject("Invalid value!");
                return;
            }
            homes[player.getXuid()].limit += value;
            resolve();
        });
    }
    HomeMain.addHomesLimit = addHomesLimit;
    /**Get Player Homes Limit */
    function getHomesLimit(player) {
        if (!hasPlayer(player))
            return 0;
        else
            return homes[player.getXuid()].limit;
    }
    HomeMain.getHomesLimit = getHomesLimit;
    /**Check Has Player */
    function hasPlayer(player) {
        return homes.hasOwnProperty(player.getXuid());
    }
    HomeMain.hasPlayer = hasPlayer;
    /**Add Player Data */
    function addPlayer(player) {
        const xuid = player.getXuid();
        if (xuid === "")
            return false;
        if (hasPlayer(player))
            return false;
        homes[xuid] = {
            limit: getDefaultLimit(),
            homes: [],
        };
        return true;
    }
    HomeMain.addPlayer = addPlayer;
    /**Has Player Home */
    function hasHome(player, name) {
        if (!hasPlayer(player))
            return false;
        else
            return Boolean(homes[player.getXuid()].homes.find((home) => home.name === name));
    }
    HomeMain.hasHome = hasHome;
    /**Get Player Home */
    function getHome(player, name) {
        var _a;
        if (!hasPlayer(player))
            return null;
        else
            return (_a = homes[player.getXuid()].homes.find((home) => home.name === name)) !== null && _a !== void 0 ? _a : null;
    }
    HomeMain.getHome = getHome;
    /**Get All Player Homes */
    function getHomes(player) {
        if (!hasPlayer(player))
            return null;
        else
            return homes[player.getXuid()].homes;
    }
    HomeMain.getHomes = getHomes;
    /**Get All Player Homes Name */
    function getHomesName(player) {
        if (!hasPlayer(player))
            return null;
        else
            return homes[player.getXuid()].homes.map((home) => home.name);
    }
    HomeMain.getHomesName = getHomesName;
    /**Create New Home */
    async function createHome(player, name, dimensionId = player.getDimensionId()) {
        return new Promise((resolve, reject) => {
            var _a, _b, _c;
            addPlayer(player);
            const xuid = player.getXuid();
            if (xuid === "") {
                reject("Xuid not found!");
                return;
            }
            const amount = (_b = (_a = getHomes(player)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
            const limit = (_c = getHomesLimit(player)) !== null && _c !== void 0 ? _c : 0;
            const textPattern = /^[A-Za-z0-9]+$/;
            if (!limit && (amount + 1) > limit) {
                reject("Maximum homes limit");
                return;
            }
            if (!textPattern.test(name)) {
                reject("Invalid name!");
                return;
            }
            if (hasHome(player, name)) {
                player.sendMessage(`§cHome already`);
                return;
            }
            const home = {
                name: name,
                pos: blockpos_1.BlockPos.create(player.getFeetPos()),
                dimension: dimensionId,
            };
            homes[xuid].homes.push(home);
            resolve(home);
        });
    }
    HomeMain.createHome = createHome;
    /**Delete Player Home */
    async function deleteHome(player, name) {
        return new Promise((resolve, reject) => {
            addPlayer(player);
            const xuid = player.getXuid();
            if (xuid === "") {
                reject("Xuid not found!");
                return;
            }
            const home = getHome(player, name);
            if (!home) {
                reject("Home not found!");
                return;
            }
            homes[xuid].homes = homes[xuid].homes.filter((data) => data.name !== name);
            resolve(home);
        });
    }
    HomeMain.deleteHome = deleteHome;
    /**Set Player Home */
    async function setHome(player, name, dimensionId = player.getDimensionId()) {
        return new Promise((resolve, reject) => {
            var _a, _b, _c;
            addPlayer(player);
            const xuid = player.getXuid();
            if (xuid === "") {
                reject("Xuid not found!");
                return;
            }
            if (hasHome(player, name)) {
                const home = {
                    name: name,
                    pos: pos,
                    dimension: dimensionId,
                };
                homes[xuid].homes.push(home);
                resolve(home);
                return;
            }
            const amount = (_b = (_a = getHomes(player)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
            const limit = (_c = getHomesLimit(player)) !== null && _c !== void 0 ? _c : 0;
            const textPattern = /^[A-Za-z0-9]+$/;
            if (!limit && (amount + 1) > limit) {
                reject("Maximum homes limit");
                return;
            }
            if (!textPattern.test(name)) {
                reject("Invalid name!");
                return;
            }
            const home = {
                name: name,
                pos: blockpos_1.BlockPos.create(player.getFeetPos()),
                dimension: dimensionId,
            };
            homes[xuid].homes.push(home);
            resolve(home);
        });
    }
    HomeMain.setHome = setHome;
    /**Teleport Player */
    function teleport(player, home) {
        if (player.getXuid() === "") {
            player.sendMessage(`§cXuid not found!`);
            return false;
        }
        const data = getHome(player, home);
        if (!data) {
            player.sendMessage(`§cHome not found!`);
            return false;
        }
        const pos = data.pos;
        const posFix = blockpos_1.Vec3.create(Math.floor(pos.x) + 0.5, Math.floor(pos.y) + 0.5, Math.floor(pos.z) + 0.5);
        let dimension = data.dimension;
        const timeout = getTeleportTimeout();
        if (timeout) {
            player.sendMessage(`§fTeleporting to §2${data.name} §fhome in §7${timeout}§f seconds.`);
            teleporting.set(player.getNetworkIdentifier(), player);
            const wait = setTimeout(() => {
                if (teleporting.has(player.getNetworkIdentifier())) {
                    teleporting.delete(player.getNetworkIdentifier());
                    if(posFix, dimension !=-1 && dimension !=2 && dimension != 1 && dimension != 0 || dimension == null){
                        player.teleport(posFix, dimension = 0);
                        player.sendMessage('§r§fDimension is undefined...');
                        player.sendMessage(`§r§fTeleported to your saved coordinates in the overworld.\nPlease reset your home!`);
                    } else {
                        player.teleport(posFix, dimension);
                        player.sendMessage(`§fTeleported!`);
                    } 
                }
            }, timeout * 1000);
            event_1.events.playerLeft.on((ev) => {
                if (ev.player === player)
                    clearTimeout(wait);
            });
            return true;
        }
        player.sendMessage(`§fTeleporting to §2${data.name}§f home.`);
        if(posFix, dimension !=-1 && dimension !=2 && dimension != 1 && dimension != 0 || dimension == null){
            player.teleport(posFix, dimension = 0);
            player.sendMessage('§r§fDimension is undefined...');
            player.sendMessage(`§r§fTeleported to your saved coordinates in the overworld.\nPlease reset your home!`);
        } else if(posFix, dimension){
            player.teleport(posFix, dimension);
            player.sendMessage(`§fTeleported!`);
        } 
        return true;
    }
    HomeMain.teleport = teleport;
    function save(message = false) {
        fs.writeFile(configPath, JSON.stringify(config, null, 4), "utf8", (err) => {
            if (message) {
                if (err)
                    message_1.send.error(`config.json ${err}`);
                else
                    message_1.send.success(`config.json Saved!`);
            }
        });
        fs.writeFile(homePath, JSON.stringify(homes, null, 4), "utf8", (err) => {
            if (message) {
                if (err)
                    message_1.send.error(`homes.json ${err}`);
                else
                    message_1.send.success(`homes.json Saved!`);
            }
        });
    }
    HomeMain.save = save;
})(HomeMain = exports.HomeMain || (exports.HomeMain = {}));
const movingCanceling = setInterval(() => {
    const players = Array.from(teleporting.entries());
    for (let i = 0; i < players.length; i++) {
        const [netId, player] = players[i];
        if (!player.isMoving())
            return;
        teleporting.delete(netId);
        player.sendMessage(`§cTeleport §4Cancelled!`);
    }
}, 1);
event_1.events.playerLeft.on((data) => {
    if (teleporting.has(data.player.getNetworkIdentifier()))
        teleporting.delete(data.player.getNetworkIdentifier());
});
event_1.events.serverStop.on(() => {
    clearInterval(movingCanceling);
});
event_1.events.playerJoin.on((ev) => {
    HomeMain.addPlayer(ev.player);
});
event_1.events.serverOpen.on(() => {
    require("./src/commands/homes");
    require("./src/commands/teams");
    require("./src/commands/teamAlly");
    require("./src/commandUI/homesUI");
    message_1.send.success(`Started!`);
});
event_1.events.serverClose.on(() => {
    HomeMain.save(true);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxzQ0FBb0M7QUFDcEMsZ0RBQW1EO0FBSW5ELGlEQUEyQztBQUMzQyw2QkFBNkI7QUFDN0IseUJBQXlCO0FBYXpCLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO0FBRXpELElBQUksTUFBTSxHQUdOO0lBQ0EsT0FBTyxFQUFFLENBQUM7SUFDVixVQUFVLEVBQUUsQ0FBQztDQUNoQixDQUFDO0FBQ0YsSUFBSSxLQUFLLEdBQStCLEVBQUUsQ0FBQztBQUUzQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUN2RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUVwRCxJQUFJO0lBQ0EsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUM3QixLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0NBQzdCO0FBQUMsT0FBTSxHQUFHLEVBQUUsR0FBRTtBQUVmLGNBQWM7QUFDZCxJQUFpQixRQUFRLENBZ1V4QjtBQWhVRCxXQUFpQixRQUFRO0lBRXJCLDBCQUEwQjtJQUNuQixLQUFLLFVBQVUsa0JBQWtCLENBQUMsS0FBYTtRQUNsRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRTtnQkFDZixNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDekIsT0FBTzthQUNWO1lBRUQsTUFBTSxDQUFDLE9BQU8sR0FBQyxLQUFLLENBQUM7WUFDckIsT0FBTyxFQUFFLENBQUE7UUFDYixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFWcUIs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