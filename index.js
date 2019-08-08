const { DATA_FILE_FORMAT, DEMOGRAPHICS_FILE_FORMAT, CSV_FORMAT, JSON_FORMAT } = require("./fileformat");

// Dependencies
const express = require("express");
const path = require("path");
const PythonShell = require("python-shell");
const fs = require("fs");
const fsPromises = require("fs").promises;
const csvWriter = require("csv-write-stream");
const _ = require("lodash");
const bodyParser = require("body-parser");
const csv = require("csvtojson");
const compression = require('compression');
const jsonfile = require('jsonfile');
const getPort = require("get-port");

let app = express();
let writer = csvWriter({ sendHeaders: false });

app.use(compression())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let batchesCount = { dev: {}, prod: {} };

// create a new file to store category counts
const batchesCountDevPath = "batchesCounts.dev.csv";
const batchesCountProdPath = "batchesCounts.prod.csv";


function createFolderIfDoesntExist(foldername) {
  if (!fs.existsSync(path.join(__dirname, foldername))) {
    fs.mkdirSync(path.join(__dirname, foldername));
  }
}

createFolderIfDoesntExist("demographics");
createFolderIfDoesntExist("trials");
createFolderIfDoesntExist("data");

(async () => {
  const PORT = await getPort({ port: getPort.makeRange(7100, 7199) });
  app.set("port", process.env.PORT || PORT);
  await fsPromises.writeFile(
    path.join("dev", "port.js"),
    `export default ${PORT};\n`
  );

  createFolderIfDoesntExist("prod");
  await fsPromises.writeFile(
    path.join("prod", "port.js"),
    `export default ${PORT};\n`
  );

  app.listen(app.get("port"), function() {
    console.log("Node app is running at http://localhost:" + app.get("port"));
  });
})();



if (fs.existsSync(batchesCountDevPath)) {
  // Read existing category counts if csv exists.
  csv({ trim: false })
    .fromFile(batchesCountDevPath)
    .on("json", jsonObj => {
      batchesCount.dev = jsonObj;
    })
    .on("done", error => {
      if (error) throw error;
      console.log(batchesCount.dev);
    });
} else {
  // Create new csv of category counts if doesn't exist.
  // Get all categories from image folders.
  fs.readdirSync(path.join("images_newformat")).forEach(folder => {
    // Check for image folders that are non-empty
    batchesCount.dev[path.join("images_newformat", folder)] = 0;
  });
  writer = csvWriter({ headers: Object.keys(batchesCount.dev) });
  writer.pipe(fs.createWriteStream(batchesCountDevPath, { flags: "a" }));
  writer.write(batchesCount.dev);
  writer.end();
}

if (fs.existsSync(batchesCountProdPath)) {
  // Read existing category counts if csv exists.
  csv({ trim: false })
    .fromFile(batchesCountProdPath)
    .on("json", jsonObj => {
      batchesCount.prod = jsonObj;
    })
    .on("done", error => {
      if (error) throw error;
      console.log(batchesCount.prod);
    });
} else {
  // Create new csv of category counts if doesn't exist.
  // Get all categories from image folders.
  fs.readdirSync(path.join("images_newformat")).forEach(folder => {
    batchesCount.prod[path.join("images_newformat", folder)] = 0;
  });
  writer = csvWriter({ headers: Object.keys(batchesCount.prod) });
  writer.pipe(fs.createWriteStream(batchesCountProdPath, { flags: "a" }));
  writer.write(batchesCount.prod);
  writer.end();
}

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
app.use(express.static(path.join(__dirname, "images_newformat")));

// POST endpoint for requesting trials
app.post("/trials", function(req, res) {
  console.log("trials post request received");
  let workerId = req.body.workerId;
  let image_file = req.body.image_file;
  // numTrials must be < number of images available
  let numTrials = req.body.numTrials;
  let reset = req.body.reset;
  const dev = req.body.dev == true;

  const env = dev ? "dev" : "prod";
  const batchesCountPath = dev ? batchesCountDevPath : batchesCountProdPath;
  const trialsPath = path.join(__dirname, "trials/", `${workerId}_trials.csv`);
  const dataPath = path.join(__dirname, "data", `${workerId}_data.csv`);

  console.log("workerId received is " + workerId);
  console.log("image_file received is " + image_file);

  if (fs.existsSync(trialsPath) && reset == "false") {
    console.log("Grabbing unfinished trials");
    const completedImagesPerBatch = {};
    const trials = [];
    if (fs.existsSync(dataPath)) {
      let maxBatchNum = 1;
      csv({ trim: false })
        .fromFile(dataPath)
        .on("json", jsonObj => {
          if (!(jsonObj.batchFile in completedImagesPerBatch)) {
            completedImagesPerBatch[jsonObj.batchFile] = new Set();
          }
          maxBatchNum = Math.max(jsonObj.batchNum, maxBatchNum);
          completedImagesPerBatch[jsonObj.batchFile].add(jsonObj.image);
        })
        .on("done", error => {
          csv({ trim: false })
            .fromFile(trialsPath)
            .on("json", jsonObj => {
              if (
                !(jsonObj.batchFile in completedImagesPerBatch) ||
                !completedImagesPerBatch[jsonObj.batchFile].has(jsonObj.image)
              ) {
                trials.push(jsonObj);
              }
            })
            .on("done", error => {
              res.send({ success: true, trials, maxBatchNum });
            });
        });
    } else {
      csv({ trim: false })
        .fromFile(trialsPath)
        .on("json", jsonObj => {
          trials.push(jsonObj);
        })
        .on("done", error => {
          res.send({ success: true, trials, maxBatchNum: 1 });
        });
    }
  } else {
    console.log("Creating new trials");
    // Runs genTrial python script with workerId and image_file arg
    PythonShell.defaultOptions = { args: [workerId,image_file] };
    PythonShell.run("generateTrials.py", function(err, results) {
  
      const batchFile = Object.entries(batchesCount[env]).reduce((a, c) =>
        Number(a[1]) < Number(c[1]) ? a : c
      ).slice(0, numTrials);
  
      let trials = [];
      csv({ delimiter: ",", trim: false })
        .fromFile(path.resolve(__dirname, `${batchFile}.csv`))
        .on("json", jsonObj => {
          trials.push({ ...jsonObj, batchFile });
        })
        .on("done", error => {
          batchesCount[env][batchFile] = String(
            Number(batchesCount[env][batchFile]) + 1
          );
  
          if (!fs.existsSync(batchesCountPath)) {
            writer = csvWriter({ headers: Object.keys(batchesCount[env]) });
          } else {
            writer = csvWriter({ sendHeaders: false });
          }
  
          writer.pipe(fs.createWriteStream(batchesCountPath, { flags: "a" }));
          writer.write(batchesCount[env]);
          writer.end();
          
          // generateTrials.py already did the shuffling
          // trials = _.shuffle(trials);
  
          if (!fs.existsSync(trialsPath)) {
            writer = csvWriter({ headers: Object.keys(trials[0]) });
          } else {
            writer = csvWriter({ sendHeaders: false });
          }
  
          writer.pipe(fs.createWriteStream(trialsPath, { flags: "a" }));
          trials.forEach(trial => writer.write(trial));
          writer.end();
  
          console.log(trials);
          res.send({ success: true, trials, maxBatchNum: 1 });
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
