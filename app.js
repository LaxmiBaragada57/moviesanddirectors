const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertSnakeCaseToCamelCase = (each) => {
  return {
    movieName: each.movie_name,
    movieId: each.movie_id,
    directorId: each.director_id,
    leadActor: each.lead_actor,
  };
};

const directorObjToResponseObj = (eachDir) => {
  return {
    directorId: eachDir.directorId,
    directorName: eachDir.director_Name,
  };
};

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT DISTINCT movie_name 
    FROM movie;`;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => convertSnakeCaseToCamelCase(eachMovie))
  );
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `
    INSERT INTO movie (director_id,movie_name,lead_actor)
    VALUES (${directorId},'${movieName}','${leadActor}');
    `;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetailsQuery = `
    SELECT *
    FROM movie
    WHERE movie_id=${movieId};`;
  const movieDetails = await db.get(getMovieDetailsQuery);
  response.send(convertSnakeCaseToCamelCase(movieDetails));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `
    UPDATE movie SET 
    director_id=${directorId},movie_name='${movieName}',lead_actor='${leadActor}'
    WHERE movie_id=${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie
    WHERE movie_id=${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT *
    FROM director
    ORDER BY director_id;`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) => directorObjToResponseObj(eachDirector))
  );
});

app.get("/directors/:directorId/movies", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMovies = `
    SELECT movie_name
    FROM movie
    WHERE director_id=${directorId}
    ORDER BY director_id;`;
  const directorMoviesArray = await db.all(getDirectorMovies);
  response.send(
    directorMoviesArray.map((movie) => convertSnakeCaseToCamelCase(movie))
  );
});

module.exports = app;
