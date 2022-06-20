//jshint esversion:8
//jshint node:true
const fs = require("fs");
const path = require("path");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const TEMP_PATH = path.join(__dirname, `../tmp`);

const s3Client = new S3Client({
  endpoint: "https://sgp1.digitaloceanspaces.com", // Find your endpoint in the control panel, under Settings. Prepend "https://".
  region: "sgp1", // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (e.g. nyc3).
  credentials: {
    accessKeyId: "Z7FBHMAEQNR5UNCEUD4W", // Access key pair. You can create access key pairs using the control panel or API.
    secretAccessKey: process.env.SPACES_SECRET, // Secret access key defined through an environment variable.
  },
});

const filesLoop = async (dir) => {
  try {
    // Get the files as an array
    const files = await fs.promises.readdir(dir);

    // Loop them all with the new for...of
    for (const file of files) {
      // Get the full paths
      const fullPath = path.join(dir, file);

      // Stat the file to see if we have a file or dir
      const stat = await fs.promises.stat(fullPath);

      if (stat.isFile()) {
        // Upload to DO
        const params = {
          Bucket: "abcnewsdata",
          Key: "covid-data" + dir.substr(TEMP_PATH.length) + "/" + file,
          Body: fs.readFileSync(fullPath),
          ACL: "public-read",
          ContentType: "application/json",
        };
        // console.log("params :>> ", params);
        uploadObject(params);
      } else if (stat.isDirectory()) {
        // Kick this off again
        filesLoop(fullPath);
      }
    }
  } catch (e) {
    // Catch anything bad that happens
    console.error("Error uploading files", e);
    throw e; // let it die
  }
};

// Step 4: Define a function that uploads your object using SDK's PutObjectCommand object and catches any errors.
const uploadObject = async (params) => {
  const data = await s3Client.send(new PutObjectCommand(params));
  console.log(
    "Successfully uploaded object: " + params.Bucket + "/" + params.Key
  );
  return data;
};

filesLoop(TEMP_PATH);
