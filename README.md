## Installation

You must have nodjs installed: https://nodejs.org. Make sure Python 2 is installed.

The following are instructions to download and install the repo.

```sh
git clone https://github.com/lupyanlab/ChangeDetection  
cd ChangeDetection 
npm install
pm2 start index.js --name ChangeDetection  
```

## Development

If you are working on your local machinese, go to http://localhost:7080.

If you are working on Sapir, go to http://sapir.psych.wisc.edu/mturk/ChangeDetection/dev.

The static HTML, CSS, and JavaScript files are in the `dev/` directory, and the Node.js API server is located in the root `./index.js` file.

## Production

When you are done, run the following command on Sapir and go to http://sapir.psych.wisc.edu/mturk/ChangeDetection/prod.

```sh
npm run prod
```


## Switching from CSV to JSON and Vice Versa for Data Collection

Open `fileformat.js` and switch which file format you want the data and demographics in. You **must restart** the node api server (pm2) after making these changes.
