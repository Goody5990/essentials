const fs = require('fs');
const path = require('path');
const message_1 = require("../utils/message.js");
const command_1 = require("bdsx/bds/command");
const command_2 = require("bdsx/command");
const mainConfig = require('../config/mainConfig.js');
const settings = require('../config/settings.json');
const nativetype_1 = require("bdsx/nativetype");
const { Vec3 } = require("bdsx/bds/blockpos");
const { getTeamNameForPlayer, isPlayerTeamLeader } = require('../commands/teams.js');
const teamsFilePath = path.join(__dirname, '../data/teams.json');
let teams = {};

function loadTeamsData() {
    if (fs.existsSync(teamsFilePath)) {
        const data = fs.readFileSync(teamsFilePath, 'utf8');
        teams = JSON.parse(data);
    } else {
        teams = {};
    }
}

function saveTeamsData() {
    const data = JSON.stringify(teams, null, 4);
    fs.writeFileSync(teamsFilePath, data, 'utf8');
}

loadTeamsData();

// Ally Request Command
if (mainConfig.allyRequest) {
    command_2.command.register("ally_request", "Send an ally request to another team.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        const playerTeamName = getTeamNameForPlayer(player.getNameTag());

        if (!playerTeamName || !isPlayerTeamLeader(player.getNameTag())) {
            message_1.send.error(`You must be the team leader to send ally requests.`, player);
            return;
        }

        const targetTeam = params.targetTeamName;
        
        // Check if the team already has the maximum number of allies
        const currentAlliesCount = teams[origin.getEntity().getNameTag()].allyTeams ? teams[origin.getEntity().getNameTag()].allyTeams.length : 0;
        if (currentAlliesCount >= homesSettings.maxAlliesPerTeam) {
            message_1.send.error(`Your team has reached the maximum number of allies.`, origin.getEntity());
            return;
        }

        if (!teams[targetTeam]) {
            message_1.send.error(`Team '${targetTeam}' does not exist.`, player);
            return;
        }

        if (teams[playerTeamName].allyTeams && teams[playerTeamName].allyTeams.includes(targetTeam)) {
            message_1.send.error(`You are already allies with '${targetTeam}'.`, player);
            return;
        }

        if (!teams[targetTeam].allyRequests) {
            teams[targetTeam].allyRequests = [];
        }
        teams[targetTeam].allyRequests.push(playerTeamName);
        saveTeamsData();
        message_1.send.success(`Ally request sent to '${targetTeam}'.`, player);
    }, {
        targetTeamName: nativetype_1.CxxString
    });
}
// Ally Accept Command
if (mainConfig.allyAccept) {
    command_2.command.register("ally_accept", "Accept an ally request.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        const playerTeamName = getTeamNameForPlayer(player.getNameTag());

        if (!playerTeamName || !isPlayerTeamLeader(player.getNameTag())) {
            message_1.send.error("You must be the team leader to accept ally requests.", player);
            return;
        }

        if (!teams[playerTeamName].allyRequests || teams[playerTeamName].allyRequests.length === 0) {
            message_1.send.error("Your team has no pending ally requests.", player);
            return;
        }

        // Get the name of the requesting team, not the player
        const requestingTeamName = teams[playerTeamName].allyRequests.shift();

        // Add the requesting team to the allyTeams array if it's not already there
        if (!teams[playerTeamName].allyTeams.includes(requestingTeamName)) {
            teams[playerTeamName].allyTeams.push(requestingTeamName);
        }

        // Also add this team to the requesting team's allyTeams array
        if (!teams[requestingTeamName].allyTeams) {
            teams[requestingTeamName].allyTeams = [];
        }
        if (!teams[requestingTeamName].allyTeams.includes(playerTeamName)) {
            teams[requestingTeamName].allyTeams.push(playerTeamName);
        }

        saveTeamsData();
        message_1.send.success(`You are now allies with '${requestingTeamName}'.`, player);
    }, {});
}
// Ally Deny Command
if (mainConfig.allyDeny) {
    command_2.command.register("ally_deny", "Deny an ally request.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        const playerTeamName = getTeamNameForPlayer(player.getNameTag());

        if (!playerTeamName || !isPlayerTeamLeader(player.getNameTag())) {
            message_1.send.error(`You must be the team leader to deny ally requests.`, player);
            return;
        }

        if (!teams[playerTeamName].allyRequests || teams[playerTeamName].allyRequests.length === 0) {
            message_1.send.error(`Your team has no pending ally requests.`, player);
            return;
        }

        const deniedTeam = teams[playerTeamName].allyRequests.shift();
        saveTeamsData();
        message_1.send.success(`Ally request from '${deniedTeam}' has been denied.`, player);
    }, {});
}
// Remove Ally Command
if (mainConfig.removeAlly) {
    command_2.command.register("remove_ally", "Remove an existing ally.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        const playerTeamName = getTeamNameForPlayer(player.getNameTag());

        if (!playerTeamName || !isPlayerTeamLeader(player.getNameTag())) {
            message_1.send.error(`You must be the team leader to remove allies.`, player);
            return;
        }

        const allyTeam = params.allyTeamName;
        if (!teams[playerTeamName].allyTeams || !teams[playerTeamName].allyTeams.includes(allyTeam)) {
            message_1.send.error(`'${allyTeam}' is not an ally of your team.`, player);
            return;
        }

        teams[playerTeamName].allyTeams = teams[playerTeamName].allyTeams.filter(ally => ally !== allyTeam);
        if (teams[allyTeam].allyTeams) {
            teams[allyTeam].allyTeams = teams[allyTeam].allyTeams.filter(ally => ally !== playerTeamName);
        }

        saveTeamsData();
        message_1.send.success(`'${allyTeam}' has been removed from your allies.`, player);
    }, { allyTeamName: nativetype_1.CxxString
 });
}
// List Ally Command
if (mainConfig.listAlly) {
    command_2.command.register("list_ally", "List all your allies.")
    .overload((params, origin) => {
        const player = origin.getEntity();
        const playerTeamName = getTeamNameForPlayer(player.getNameTag());

        if (!playerTeamName) {
            message_1.send.error(`You are not in a team.`, player);
            return;
        }

        const allyTeamNames = teams[playerTeamName].allyTeams || [];
        message_1.send.success(`Your allies: ${allyTeamNames.join(', ')}`, player);
    }, {});
}

function teleportPlayerToAllyHome(player, allyTeamName) {
    if (!allyTeamName || !teams[allyTeamName] || !teams[allyTeamName].home) {
        message_1.send.error(`Ally team '${allyTeamName}' does not have a home set or does not exist.`, player);
        return;
    }

    const homeLocation = teams[allyTeamName].home;
    const initialPosition = player.getPosition();
    const teleportTimeout = settings.timeout || 5;
    message_1.send.success(`Teleporting to '${allyTeamName}' home in ${teleportTimeout} seconds. Do not move.`, player);

    setTimeout(() => {
        if (player.getPosition().equals(initialPosition)) {
            const posFix = Vec3.create(Math.floor(homeLocation.x) + 0.5, Math.floor(homeLocation.y) + 0.5, Math.floor(homeLocation.z) + 0.5);
            player.teleport(posFix, homeLocation.dimensionId);
            message_1.send.success(`Teleported to '${allyTeamName}' home.`, player);
        } else {
            message_1.send.error(`Teleportation cancelled because you moved.`, player);
        }
    }, teleportTimeout * 1000);
}

// ally_home command
command_2.command.register("ally_home", "Teleport to your ally's home.")
  .overload((params, origin) => {
    // Logic when no team name is provided
    const player = origin.getEntity();
    if (!player) {
        message_1.send.error("This command is for players only.");
        return;
    }

    const playerTeamName = getTeamNameForPlayer(player.getNameTag());
    if (!playerTeamName || !teams[playerTeamName].allyTeams || teams[playerTeamName].allyTeams.length === 0) {
        message_1.send.error("Your team does not have any allies.", player);
        return;
    }

    const allyTeamName = teams[playerTeamName].allyTeams[0];
    teleportPlayerToAllyHome(player, allyTeamName);
  }, {})
  .overload((params, origin) => {
    // Logic when a team name is provided
    const player = origin.getEntity();
    if (!player) {
      message_1.send.error("This command is for players only.");
      return;
    }

    const playerTeamName = getTeamNameForPlayer(player.getNameTag());
    if (!playerTeamName) {
      message_1.send.error("You are not in a team.", player);
      return;
    }

    if (!teams[playerTeamName].allyTeams.includes(params.allyTeamName)) {
      message_1.send.error(`The team '${params.allyTeamName}' is not an ally of your team.`, player);
      return;
    }

    if (!teams[params.allyTeamName] || !teams[params.allyTeamName].home) {
      message_1.send.error(`Ally team '${params.allyTeamName}' does not have a home set.`, player);
      return;
    }

    teleportPlayerToAllyHome(player, params.allyTeamName);
  }, {
    allyTeamName: nativetype_1.CxxString
  });
// Adding the /set_max_allies command in teamAlly.js
if (mainConfig.setMaxAllies) {
    command_2.command.register("max_allies", "Set the maximum number of allies per team.", command_1.CommandPermissionLevel.Operator)
    .overload((p, origin) => {
        // Ensure only operators can execute this command
        if (!origin.isServerCommandOrigin() && !origin.hasPermission(command_1.CommandPermissionLevel.Operator)) {
            message_1.send.error("This command is for operators only.", origin.getEntity());
            return;
        }

        // Read settings.json, modify the maxAlliesPerTeam setting, and save
        const settingsPath = path.join(__dirname, '../config/settings.json');
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        settings.maxAlliesPerTeam = p.maxAllies;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');

        message_1.send.success(`Max allies per team set to ${p.maxAllies}.`, origin.getEntity());
    }, {
        maxAllies: nativetype_1.int32_t
    });
}

module.exports = {
    loadTeamsData,
    saveTeamsData,
    // ... other exports if needed ...
}