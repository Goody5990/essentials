"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blockpos_1 = require("bdsx/bds/blockpos");
const command_1 = require("bdsx/bds/command");
const command_2 = require("bdsx/command");
const nativetype_1 = require("bdsx/nativetype");
const __1 = require("../..");
const form_1 = require("../commandUI/homesUI.js");
const message_1 = require("../utils/message.js");
const { Dimension } = require("bdsx/bds/dimension");
const fs = require('fs');
const mainConfig = require('../config/mainConfig.js');
// Home UI
if (mainConfig['homeUI']) {
    command_2.command.register("homeui", "Open home-ui menu.")
    .overload((p, o) => {
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        form_1.HomeForm.menu(pl);
    }, {});
}
// Add Home
if (mainConfig['addHome']) {
    command_2.command.register("addhome", "Create a new home position.")
    .overload((p, o) => {
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        form_1.HomeForm.add(pl);
    }, {})
    .overload((p, o) => {
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        let pos = blockpos_1.BlockPos.create(pl.getPosition());
        __1.HomeMain.createHome(pl, p.name, pl.getDimensionId())
            .then((home) => {
                message_1.send.success(`§fSet §2${home.name}§7,§f as home.`, pl);
            })
            .catch((err) => {
                if (err) message_1.send.error(err, pl);
            });
    }, {
        name: nativetype_1.CxxString
    });
}
// Set Home
if (mainConfig['setHome']) {
    command_2.command.register("sethome", "Create a new home position.")
    .overload((p, o) => {
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        let pos = blockpos_1.BlockPos.create(pl.getPosition());
        __1.HomeMain.setHome(pl, p.name, pl.getDimensionId())
            .then((home) => {
                message_1.send.success(`§fSet §2${home.name}§7,§f as home.`, pl);
            })
            .catch((err) => {
                if (err) message_1.send.error(err, pl);
            });
    }, {
        name: nativetype_1.CxxString
    });
}
// Remove Home
if (mainConfig['removeHome']) {
    command_2.command.register("removehome", "Delete your home position.")
    .overload((p, o) => {
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        form_1.HomeForm.remove(pl);
    }, {})
    .overload((p, o) => {
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        __1.HomeMain.deleteHome(pl, p.name)
            .then((home) => {
                message_1.send.success(`§fDeleted §2${home.name}§7.`, pl);
            })
            .catch((err) => {
                if (err) message_1.send.error(err, pl);
            });
    }, {
        name: nativetype_1.CxxString
    });
}
// Home
if (mainConfig['home']) {
    command_2.command.register("home", "Teleport to your home position.")
    .overload((p, o) => {
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        form_1.HomeForm.teleport(pl);
    }, {})
    .overload((p, o) => {
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        __1.HomeMain.teleport(pl, p.name);
    }, {
        name: nativetype_1.CxxString
    });
}
// List Home
if (mainConfig['listHome']) {
    command_2.command.register("listhome", "Check your homes.")
    .overload((p, o) => {
        var _a;
        const pl = o.getEntity();
        if (!pl) {
            message_1.send.error(`This command not for console`);
            return;
        }
        if (!pl.isPlayer()) return;
        pl.sendMessage(`§aHomes: §r${((_a = __1.HomeMain.getHomesName(pl)) !== null && _a !== void 0 ? _a : []).toString().replace(/,/g, "§r§a, §r")}`);
    }, {});
}

// Set Homes Limit
if (mainConfig['setHomesLimit']) {
    command_2.command.register("sethomeslimit", "Change limit player homes.", command_1.CommandPermissionLevel.Operator)
    .overload((p, o) => {
        var _a, _b;
        const pl = (_b = (_a = o.getEntity()) === null || _a === void 0 ? void 0 : _a.getNetworkIdentifier().getActor()) !== null && _b !== void 0 ? _b : undefined;
        __1.HomeMain.setDefaultLimit(p.maximum)
            .then(() => {
                message_1.send.success(`Set §r${p.maximum}§a as default homes limit`, pl);
            })
            .catch((err) => {
                if (err) message_1.send.error(err, pl);
            });
    }, {
        normal: command_2.command.enum("set_normal", "normal"),
        maximum: nativetype_1.int32_t
    })
    .overload((p, o) => {
        var _a, _b;
        const pl = (_b = (_a = o.getEntity()) === null || _a === void 0 ? void 0 : _a.getNetworkIdentifier().getActor()) !== null && _b !== void 0 ? _b : undefined;
        for (const target of p.target.newResults(o)) {
            __1.HomeMain.setHomesLimit(target, p.maximum)
                .then(() => {
                    message_1.send.success(`Set §r${p.maximum}§a as §r${target.getName()}§a homes limit`, pl);
                })
                .catch((err) => {
                    if (err) message_1.send.error(err, pl);
                });
        }
    }, {
        player: command_2.command.enum("set_player", "player"),
        target: command_1.PlayerCommandSelector,
        maximum: nativetype_1.int32_t
    });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBDQUE2QztBQUM3QyxnREFBNkM7QUFDN0MsOENBQWtHO0FBQ2xHLDBDQUF1QztBQUN2QyxnREFBcUQ7QUFDckQsMEJBQThCO0FBQzlCLGlDQUFrQztBQUNsQyw2Q0FBdUM7QUFFdkMsWUFBWTtBQUNaLGlCQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxvQkFBb0IsQ0FBQztLQUMvQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDZixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDekIsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNMLGNBQUksQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUMzQyxPQUFPO0tBQ1Y7SUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRTtRQUFFLE9BQU87SUFFM0IsZUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN0QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFUCxhQUFhO0FBQ2IsaUJBQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLDZCQUE2QixDQUFDO0tBQ3pELFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUNmLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN6QixJQUFJLENBQUMsRUFBRSxFQUFFO1FBQ0wsY0FBSSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQzNDLE9BQU87S0FDVjtJQUNELElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFO1FBQUUsT0FBTztJQUUzQixlQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDTCxR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