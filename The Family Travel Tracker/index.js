import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "AngelaYU_1",
  password: "paras",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "Green" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted_user() {
  const result = await db.query("select vs.country_code from users u join visited_countries vs on u.id = vs.user_id where u.id=$1;",[currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function currentUserId_index() {   
  var index;                             
  for(let i=0; i<users.length; i++){
    if(currentUserId == users[i].id){
      index = i;
      break;
    }
  }
  return index;
}

async function Users() {
  const result = await db.query("select * from users;");
  return result.rows;
}

app.get("/", async (req, res) => {
  users = await Users();
  const countries = await checkVisisted_user();
  var Curr_index = await currentUserId_index();
  console.log("Countries visited by User entry: "+currentUserId+" "+users[Curr_index].name+" "+users[Curr_index].color+" "+countries);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: users[Curr_index].color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    console.log(countryCode);
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  if(req.body.user){
    currentUserId = req.body.user;
    console.log(currentUserId);
    res.redirect("/");
  } else if(req.body.add){
    res.render("new.ejs");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  var new_user = await db.query("insert into users (name,color) values ($1,$2) returning *;",[req.body.name, req.body.color]);
  currentUserId = new_user.rows[0].id;
  console.log(currentUserId, req.body.name, req.body.color);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
