// Import modules
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const port = 3000;
dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(port, () =>
      console.log("Server Listening at http://localhost:3000")
    );
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};
initializeDbAndServer();

//GET API 1: Returns a list of all players in the player table.
app.get("/players/", async (req, res) => {
  const getPlayersQuery = `
    SELECT
      * 
    FROM 
      player_details;`;

  const playerArray = await db.all(getPlayersQuery);
  const newPlayerArray = [];
  playerArray.forEach((eachObj) => {
    newPlayerArray.push({
      playerId: eachObj["player_id"],
      playerName: eachObj["player_name"],
    });
  });

  res.send(newPlayerArray);
});

//GET API 2: Returns a player based on a player ID.
app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;

  const getPlayerQuery = `
  SELECT
  *
  FROM
  player_details
  WHERE
  player_id = ${playerId};`;

  const playerObj = await db.get(getPlayerQuery);
  res.send({
    playerId: playerObj["player_id"],
    playerName: playerObj["player_name"],
  });
});

//PUT API 3: Updates the details of a player based on the player ID.
app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const playerDetails = req.body;
  const { playerName } = playerDetails;

  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name = '${playerName}'
    WHERE
      player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  res.send("Player Details Updated");
});

//GET API 4: Returns the match details of a specific match.
app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;

  const getMatchQuery = `
  SELECT
    *
  FROM
    match_details
  WHERE
    match_id = ${matchId};`;

  const matchObj = await db.get(getMatchQuery);
  res.send({
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  });
});

//GET API 5: Returns a list of all the matches of a player.
app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;

  const getMatchQuery = `
  SELECT
    match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year
  FROM
    match_details
    NATURAL JOIN player_match_score
  WHERE
    player_id = ${playerId}
  ORDER BY
    player_id ASC;`;

  const matchArray = await db.all(getMatchQuery);
  res.send(matchArray);
});

//GET API 6: Returns a list of players of a specific match.
app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;

  const getPlayersQuery = `
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
  FROM
    player_details
    NATURAL JOIN player_match_score
  WHERE
    match_id = ${matchId};`;

  const playerArray = await db.all(getPlayersQuery);
  res.send(playerArray);
});

//GET API 7: Returns a list of players of a specific match.
app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;

  const getPlayerQuery = `
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM
    player_details
    NATURAL JOIN player_match_score
  WHERE
    player_id = ${playerId};`;

  const playerStats = await db.get(getPlayerQuery);
  res.send(playerStats);
});

module.exports = app;
