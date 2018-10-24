## Running Locally

You must have nodjs installed: https://nodejs.org. Make sure Python 2 is installed.

```
git clone https://github.com/lupyanlab/ChangeDetection
cd ChangeDetection
npm install
npm start
```

When making changes, the html and javascript is in the `dev/` directory. To make sure the `prod/` (production) directory is
updated while editing the `dev/` directory, run the watch command.

```
npm run watch
```

If you just need to build `prod/` , then use this command:

```
npm run prod
```

Then, go to http://localhost:7080


## Switching from CSV to JSON and Vice Versa

Open `fileformat.js` and switch which file format you want the data and demographics in. You **must restart** the node api server (pm2) after making these changes.

## Running on Sapir (PM2)

To run this on Sapir, use [PM2](http://pm2.keymetrics.io/) which is a production process manager for Node.js. PM2 is already installed on Sapir. Currently, only sudo has access.

### Starting Up the Server

```
pm2 start index.js --name ChangeDetection
```

### Deleting a Running Server

```
pm2 delete ChangeDetection
```

### Checking on All Servers

```
pm2 status
```

When renaming the folder (especially index.js), make sure to delete the old running Node.js instance before starting it again in the new directory. See the on how to delete and start it.
