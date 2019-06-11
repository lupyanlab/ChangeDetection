const { DATA_FILE_FORMAT, DEMOGRAPHICS_FILE_FORMAT, CSV_FORMAT, JSON_FORMAT } = require("./fileformat");

// Dependencies
const express = require("express");
const path = require("path");
const PythonShell = require("python-shell");
const fs = require("fs");
const csvWriter = require("csv-write-stream");
const _ = require("lodash");
const bodyParser = require("body-parser");
const csv = require("csvtojson");
const compression = require('compression');
const jsonfile = require('jsonfile');

let app = express();
let writer = csvWriter({ sendHeaders: false });

app.use(compression())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("port", process.env.PORT || 7150);

// Add headers
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// For Rendering HTML
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/dev/index.html"));
});
app.use(express.static(__dirname + "/dev"));

app.listen(app.get("port"), function() {
  console.log("Node app is running at http://localhost:" + app.get("port"));
});

// POST endpoint for requesting trials
app.post("/trials", function(req, res) {
  console.log("trials post request received");
  let workerId = req.body.workerId;
  let setnum = req.body.setnum;
  console.log("workerId received is " + workerId);
  console.log("setnum received is " + setnum);

  if (fs.existsSync("trials/" + workerId + "_trials.csv")) {
    let trials = [];
    // Reads generated trial csv file
    csv()
      .fromFile("trials/" + workerId + "_trials.csv")
      // Push all trials to array
      .on("json", jsonObj => {
        trials.push(jsonObj);
      })
      // Send trials array when finished
      .on("done", error => {
        if (error) {
          res.status(500).send({ success: false });
          throw error;
        }
        res.send({ success: true, trials: trials });
        console.log("finished parsing csv");
      });
  } else {
    // Runs genTrial python script with workerId and setnum arg
    PythonShell.defaultOptions = { args: [workerId,setnum] };
    PythonShell.run("generateTrials.py", function(err, results) {
      if (err) throw err;
      let trials = [];
  
      // Reads generated trial csv file
      csv()
        .fromFile("trials/" + workerId + "_trials.csv")
        // Push all trials to array
        .on("json", jsonObj => {
          trials.push(jsonObj);
        })
        // Send trials array when finished
        .on("done", error => {
          if (error) {
            res.status(500).send({ success: false });
            throw error;
          }
          res.send({ success: true, trials: trials });
          console.log("finished parsing csv");
        });
    });
  }

});


function writeToJSON(req, res, next, folderName) {
  // Write response to json
  let response = req.body;
  let path = `${folderName}/${response.workerId}_${folderName}.json`;
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({ [folderName]: [] }));
  }
  console.log('Request body written to ' + path);
  jsonfile.readFile(path, (err, obj) => {
    if (err) {
      res.status(500).send({ success: false });
      return next(err);
    }
    obj[folderName].push(response);
    jsonfile.writeFile(path, obj, (err) => {
      if (err) {
        res.status(500).send({ success: false });
        return next(err);
      }
      res.send({ success: true });
    })
  })
};

function writeToCSV(req, res, next, folderName) {
  // Parses the trial response data to csv
  let response = req.body;
  let path = `${folderName}/${response.workerId}_${folderName}.csv`;
  console.log('Request body written to ' + path);
  let headers = Object.keys(response);
  if (!fs.existsSync(path)) writer = csvWriter({ headers: headers });
  else writer = csvWriter({ sendHeaders: false });

  writer.pipe(fs.createWriteStream(path, { flags: "a" }));
  writer.write(response);
  writer.end();

  res.send({ success: true });
}

// POST endpoint for receiving trial responses
app.post('/data', function (req, res, next) {
  console.log('data post request received');

  // Create new data file if does not exist
  let response = req.body;
  fs.access('./data', (err) => {
    if (err && err.code === 'ENOENT') {
      fs.mkdir('./data', () => {
        next();
      });
    }
    else next();
  });

},
  (req, res, next) => {
    if (DATA_FILE_FORMAT == JSON_FORMAT) {
      writeToJSON(req, res, next, 'data');
    } else if (DATA_FILE_FORMAT == CSV_FORMAT) {
      writeToCSV(req, res, next, 'data');
    } else {
      res.status(500).send({ success: false, message: "Invalid file format specified. Check fileformat.js."});
    }
  });


// POST endpoint for receiving demographics responses
app.post('/demographics', function (req, res, next) {
  let demographics = req.body;
  console.log('demographics post request received');
  console.log(demographics);

  fs.access('./demographics', (err) => {
    if (err && err.code === 'ENOENT') {
      fs.mkdir('./demographics', () => {
        next();
      });
    }
    else next();
  });

  }, (req, res, next) => {
    if (DEMOGRAPHICS_FILE_FORMAT == JSON_FORMAT) {
      writeToJSON(req, res, next, 'demographics');
    } else if (DEMOGRAPHICS_FILE_FORMAT == CSV_FORMAT) {
      writeToCSV(req, res, next, 'demographics');
    } else {
      res.status(500).send({ success: false, message: "Invalid file format specified. Check fileformat.js."});
    }
  });
