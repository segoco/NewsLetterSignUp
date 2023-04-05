/* eslint-disable quotes */
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const path = require("path");
const fs = require("fs");

const apiKey = "9285e63c89d2756e58eb786b937c6a96-us14";
const listId = "f41e130261";
const dataCenter = "us14";

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/signup.html"));
});

app.post("/signup", (req, res) => {
  const { firstName } = req.body;
  const { lastName } = req.body;
  const { email } = req.body;
  let data = JSON.stringify({
    email_address: email,
    status: "subscribed",
    merge_fields: {
      FNAME: firstName,
      LNAME: lastName,
    },
  });
  const options = {
    hostname: `${dataCenter}.api.mailchimp.com`,
    path: `/3.0/lists/${listId}/members`,
    method: "POST",
    headers: {
      Authorization: `apikey ${apiKey}`,
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };
  const request = https.request(options, (response) => {
    data = "";
    response.on("data", (chunk) => {
      data += chunk;
    });
    response.on("end", () => {
      if (response.statusCode === 200) {
        const htmlSuccess = path.join(__dirname, "/success.html");
        res.sendFile(htmlSuccess);
      } else {
        const htmlFailure = path.join(__dirname, "/failure.html");
        const errorDetail = JSON.parse(data).title;
        fs.readFile(htmlFailure, "utf-8", (err, html) => {
          if (!err) {
            const newHtmlFailure = html.replace("{{errorMessage}}", errorDetail);
            res.send(newHtmlFailure);
          }
        });
      }
    });
  });

  request.on("error", (error) => {
    console.error(error);
  });
  request.write(data);
  request.end();
});

app.post("/failure", (req, res) => {
  res.redirect("/");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
