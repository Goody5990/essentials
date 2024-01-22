"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_1 = require("bdsx/event");
const packetids_1 = require("bdsx/bds/packetids");
const packets_1 = require("bdsx/bds/packets");
const blockpos_1 = require("bdsx/bds/blockpos");
const command_1 = require("bdsx/bds/command");
const command_2 = require("bdsx/command");
const nativetype_1 = require("bdsx/nativetype");
const message_1 = require("../utils/message");
const { Dimension } = require("bdsx/bds/dimension");
const fs = require('fs');
const path = require('path');

let invites = {};
let teams = {};

const teamsFilePath = path.join(__dirname, '../data/teams.json');
const homesSettings = require('../config/settings.json');
const mainConfig = require('../config/mainConfig.js');

loadTeamsData();

// Utility functions
function getTeamNameForPlayer(playerName) {
    for (const teamName in teams) {
        if (teams[teamName].members.includes(playerName)) {
            return teamName;
        }
    }
    return null;
}

function isPlayerTeamLeader(playerName) {
    for (const teamName in teams) {
        if (teams[teamName].leader === playerName) {
            return true;
        }
    }
    return false;
}

function loadTeamsData() {
    if (fs.existsSync(teamsFilePath)) {
        const data = fs.readFileSync(teamsFilePath, 'utf8');
        teams = JSON.parse(data);
    }
}

function saveTeamsData() {
    const data = JSON.stringify(teams, null, 4);
    fs.writeFileSync(teamsFilePath, data, 'utf8');
}

function sendInvite(playerToInvite, teamName) {
    if (!invites[playerToInvite.getNameTag()]) {
        invites[playerToInvite.getNameTag()] = [];
    }
    invites[playerToInvite.getNameTag()].push(teamName);
    playerToInvite.sendMessage(`You have been invited to join team '${teamName}'. Use '/team_accept' to accept.`);
}

// Fancy Team Chat
if (mainConfig['fancyTeamChat']) {
    event_1.events.packetSend(packetids_1.MinecraftPacketIds.Text).on((pkt, netId) => {
        if (pkt.type !== packets_1.TextPacket.Types.Chat) return;

        const playerName = pkt.name;
        const teamName = getTeamNameForPlayer(playerName);
        const teamPrefix = teamName ? `[${teamName}§f] ` : "";

        pkt.message = `${teamPrefix}${playerName}§7:§f ${pkt.message}`;
        pkt.name = "";
        pkt.type = packets_1.TextPacket.Types.Raw;
    });
}

// Create team
if (mainConfig['createTeam']) {
    command_2.command.register("createteam", "Create a new team.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        if (!player) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        // Check if player is already in a team
        for (const teamName in teams) {
            if (teams[teamName].members.includes(player.getNameTag())) {
                message_1.send.error(`§fYou are already in a team. Leave your current team to create a new one.`, player);
                return;
            }
        }

        const teamName = params.name;
        if (teams[teamName]) {
            message_1.send.error(`§fA team with the name §2'${teamName}'§f already exists.`, player);
            return;
        }

        teams[teamName] = {
            members: [player.getNameTag()],
            home: null,
            allys: [],
            leader: player.getNameTag()
        };

        saveTeamsData();
        message_1.send.success(`§fTeam §2'${teamName}'§f created successfully.`, player);
    }, {
        name: nativetype_1.CxxString
    });
}
// Accept Team Invite
if (mainConfig['teamAccept']) {
    command_2.command.register("team_accept", "Accept a team invitation.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        if (!player) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        const playerName = player.getNameTag();
        const pendingInvites = invites[playerName];

        if (!pendingInvites || pendingInvites.length === 0) {
            message_1.send.error(`§fYou have no pending invites.`, player);
            return;
        }

        const teamNameToJoin = pendingInvites[0];
        if (teams[teamNameToJoin].members.length >= homesSettings.maxTeamMembers) {
            message_1.send.error(`The team you are trying to join has reached the maximum number of members.`, player);
            return;
        }
        if (teams[teamNameToJoin]) {
            teams[teamNameToJoin].members.push(playerName);
            saveTeamsData();
            message_1.send.success(`§fYou have joined team §2'${teamNameToJoin}'§7.`, player);
        } else {
            message_1.send.error(`§fThe team you were invited to no longer exists.`, player);
        }
        invites[playerName] = pendingInvites.filter(name => name !== teamNameToJoin);
    }, {});
}
// Decline Team Invite
if (mainConfig['teamDecline']) {
    command_2.command.register("team_decline", "Decline a team invitation.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        if (!player) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        const teamName = invites[player.getNameTag()];
        if (!teamName) {
            message_1.send.error(`§fYou have no pending invites.`, player);
            return;
        }
        delete invites[player.getNameTag()];
        message_1.send.success(`§fYou have declined the invitation to join team §2'${teamName}'.`, player);
    }, {});
}
// Team invite
if (mainConfig['teamInvite']) {
    command_2.command.register("team_invite", "Invite a player to your team.")
    .overload((params, origin) => {
        const inviter = origin.getEntity();
        if (!inviter) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        const inviterName = inviter.getNameTag();
        let inviterTeamName = null;
        for (const teamName in teams) {
            if (teams[teamName].leader === inviterName) {
                inviterTeamName = teamName;
                break;
            }
        }
        if (teams[inviterTeamName].members.length >= homesSettings.maxTeamMembers) {
            message_1.send.error(`Your team has reached the maximum number of members.`, inviter);
            return;
        }
        if (!inviterTeamName) {
            message_1.send.error(`§fYou are not the leader of any team.`, inviter);
            return;
        }

        const targetPlayer = params.target.newResults(origin)[0];
        if (!targetPlayer) {
            message_1.send.error(`§fPlayer not found.`, inviter);
            return;
        }

        const targetPlayerName = targetPlayer.getNameTag();
        if (targetPlayerName === inviterName) {
            message_1.send.error(`§fYou cannot invite yourself to a team.`, inviter);
            return;
        }
        if (teams[inviterTeamName].members.includes(targetPlayerName)) {
            message_1.send.error(`§fPlayer §2'${targetPlayerName}'§f is already in your team.`, inviter);
            return;
        }

        sendInvite(targetPlayer, inviterTeamName);
        message_1.send.success(`§fInvitation sent to §2'${targetPlayerName}'§f to join team §f'${inviterTeamName}'§7.`, inviter);
    }, {
        target: command_1.PlayerCommandSelector
    });
}
// Leave Team Command
if (mainConfig['leaveTeam']) {
    command_2.command.register("leaveteam", "Leave your current team.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        if (!player) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        const playerName = player.getNameTag();
        const teamName = getTeamNameForPlayer(playerName);

        if (!teamName) {
            message_1.send.error(`§fYou are not currently in any team.`, player);
            return;
        }

        // Remove player from the team
        teams[teamName].members = teams[teamName].members.filter(member => member !== playerName);
        saveTeamsData();
        message_1.send.success(`§fYou have left the team §2'${teamName}'§7.`, player);
    }, {});
}
// Team Set Home
if (mainConfig['teamSetHome']) {
    command_2.command.register("team_sethome", "Set the team's home location.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        if (!player) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        let playerTeamName = null;
        for (const teamName in teams) {
            if (teams[teamName].leader === player.getNameTag()) {
                playerTeamName = teamName;
                break;
            }
        }

        if (!playerTeamName) {
            message_1.send.error(`§fYou are not the leader of any team.`, player);
            return;
        }
        const homeLocation = {
            x: player.getPosition().x,
            y: player.getPosition().y,
            z: player.getPosition().z,
            dimensionId: player.getDimensionId()
        };
        
        teams[playerTeamName].home = homeLocation;
        saveTeamsData();
        message_1.send.success(`§fTeam §fhome §fset to your current location.`, player);
    }, {});
}
// Team Del Home
if (mainConfig['teamDelHome']) {
    command_2.command.register("team_delhome", "Delete the team's home location.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        if (!player) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        let playerTeamName = null;
        for (const teamName in teams) {
            if (teams[teamName].leader === player.getNameTag()) {
                playerTeamName = teamName;
                break;
            }
        }

        if (!playerTeamName) {
            message_1.send.error(`§fYou are not the leader of any team.`, player);
            return;
        }

        // Delete the home location
        if (teams[playerTeamName].home) {
            teams[playerTeamName].home = null;
            saveTeamsData();
            message_1.send.success(`§fTeam §2home§f has been deleted.`, player);
        } else {
            message_1.send.error(`§fYour team does not have a home set.`, player);
        }
    }, {});
}
// Team Kick Player
if (mainConfig['teamKick']) {
    command_2.command.register("team_kick", "Kick a player from your team.")
    .overload((params, origin) => {
        const leader = origin.getEntity();
        if (!leader) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        const playerNameToKick = params.target.getName();
        let leaderTeamName = null;

        // Check if the leader is actually the leader of a team
        for (const teamName in teams) {
            if (teams[teamName].leader === leader.getNameTag()) {
                leaderTeamName = teamName;
                break;
            }
        }

        if (!leaderTeamName) {
            message_1.send.error(`§fYou are not the leader of any team.`, leader);
            return;
        }

        // Prevent the leader from kicking themselves
        if (playerNameToKick === leader.getNameTag()) {
            message_1.send.error(`§fYou cannot kick yourself from your team.`, leader);
            return;
        }

        // Check if the player to kick is in the leader's team
        if (!teams[leaderTeamName].members.includes(playerNameToKick)) {
            message_1.send.error(`§fPlayer §2'${playerNameToKick}'§f is not in your team.`, leader);
            return;
        }

        // Remove the player from the team
        teams[leaderTeamName].members = teams[leaderTeamName].members.filter(member => member !== playerNameToKick);
        saveTeamsData();
        message_1.send.success(`§fPlayer §2'${playerNameToKick}'§f has been kicked from your team.`, leader);
    }, {
        target: command_1.PlayerCommandSelector
    });
}
// Team Home
if (mainConfig['teamHome']) {
    command_2.command.register("team_home", "Teleport to your team's home.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        if (!player) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        let playerTeamName = null;
        for (const teamName in teams) {
            if (teams[teamName].members.includes(player.getNameTag())) {
                playerTeamName = teamName;
                break;
            }
        }

        if (!playerTeamName || !teams[playerTeamName].home) {
            message_1.send.error(`§fYour team does not have a home set.`, player);
            return;
        }

        const homeLocation = teams[playerTeamName].home;
        const initialPosition = player.getPosition();
        const teleportTimeout = homesSettings.timeout || 5; // Default to 5 seconds if not set
        message_1.send.success(`§fTeleporting to your team's home in §2${teleportTimeout} §fseconds. Do not move.`, player);

        setTimeout(() => {
            if (player.getPosition().equals(initialPosition)) {
                try {
                    const posFix = blockpos_1.Vec3.create(Math.floor(homeLocation.x) + 0.5, Math.floor(homeLocation.y) + 0.5, Math.floor(homeLocation.z) + 0.5);
                    player.teleport(posFix, homeLocation.dimensionId);
                    message_1.send.success(`§fTeleported to your team's home.`, player);
                } catch (error) {
                    console.error(`Error teleporting player: ${error}`);
                    message_1.send.error(`§fFailed to teleport to team's home.`, player);
                }
            } else {
                message_1.send.error(`§fTeleportation cancelled because you moved.`, player);
            }
        }, teleportTimeout * 1000);
    }, {});
}
// Delete Team
if (mainConfig['delTeam']) {
    command_2.command.register("delteam", "Delete your team.")
    .overload((params, origin) => {
        const leader = origin.getEntity();
        if (!leader) {
            message_1.send.error(`This command is for players only.`);
            return;
        }

        let leaderTeamName = null;
        for (const teamName in teams) {
            if (teams[teamName].leader === leader.getNameTag()) {
                leaderTeamName = teamName;
                break;
            }
        }

        if (!leaderTeamName) {
            message_1.send.error(`You are not the leader of any team.`, leader);
            return;
        }

        delete teams[leaderTeamName];
        saveTeamsData();
        message_1.send.success(`Your team has been deleted.`, leader);
    }, {});
}
// Adding the /max_team command in teams.js
if (mainConfig.setMaxTeamMembers) {
    command_2.command.register("max_team", "Set the maximum number of members in a team.", command_1.CommandPermissionLevel.Operator)
    .overload((p, origin) => {
        // Ensure only operators can execute this command
        if (!origin.isServerCommandOrigin() && !origin.hasPermission(command_1.CommandPermissionLevel.Operator)) {
            message_1.send.error("This command is for operators only.", origin.getEntity());
            return;
        }

        // Read settings.json, modify the maxTeamMembers setting, and save
        const settingsPath = path.join(__dirname, '../config/settings.json');
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        settings.maxTeamMembers = p.maxMembers;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');

        message_1.send.success(`Max team members set to ${p.maxMembers}.`, origin.getEntity());
    }, {
        maxMembers: nativetype_1.int32_t
    });
}

module.exports = {
    // ... other exports ...
    getTeamNameForPlayer,
    isPlayerTeamLeader
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBDQUE2QztBQUM3QyxnREFBNkM7QUFDN0MsOENBQWtHO0FBQ2xHLDBDQUF1QztBQUN2QyxnREFBcUQ7QUFDckQsMEJBQThCO0FBQzlCLGlDQUFrQztBQUNsQyw2Q0FBdUM7QUFFdkMsWUFBWTtBQUNaLGlCQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxvQkFBb0IsQ0FBQztLQUMvQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDZixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDekIsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNMLGNBQUksQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUMzQyxPQUFPO0tBQ1Y7SUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRTtRQUFFLE9BQU87SUFFM0IsZUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN0QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFUCxhQUFhO0FBQ2IsaUJBQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLDZCQUE2QixDQUFDO0tBQ3pELFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUNmLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN6QixJQUFJLENBQUMsRUFBRSxFQUFFO1FBQ0wsY0FBSSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQzNDLE9BQU87S0FDVjtJQUNELElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFO1FBQUUsT0FBTztJQUUzQixlQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDTCxR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