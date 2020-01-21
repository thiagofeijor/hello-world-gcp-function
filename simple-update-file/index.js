const { Storage } = require('@google-cloud/storage');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

exports.upload = (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  const storage = new Storage({projectId: process.env.PROJECT_ID});
  const tmpdir = os.tmpdir();
  
  // This object will accumulate all the fields, keyed by their name
  const fields = {};

  // This object will accumulate all the uploaded files, keyed by their name.
  const uploads = {};

  // This code will process each non-file field in the form.
  busboy.on('field', (fieldname, val) => {
    console.log(`Processed field ${fieldname}: ${val}.`);
    fields[fieldname] = val;
  });

  let fileWrites = [];
  // This code will process each file uploaded.
  busboy.on('file', (fieldname, file, filename) => {
    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    console.log(`Processed file ${filename}`);
    const filepath = path.join(tmpdir, filename);
    uploads[fieldname] = filepath;

    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);

    // File was processed by Busboy; wait for it to be written to disk.
    const promise = new Promise((resolve, reject) => {
      file.on('end', () => {
        writeStream.end();
      });
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    fileWrites.push(promise);
  });

  // Triggered once all uploaded files are processed by Busboy.
  // We still need to wait for the disk writes (saves) to complete.
  busboy.on('finish', () => {
    Promise.all(fileWrites)
      .then(() => {  
        return Object.keys(uploads).map(name => {
          return new Promise((resolve, reject) => {
            const file = uploads[name];

            if (fs.existsSync(file)) {
              storage
                .bucket(process.env.BUCKET_NAME)
                .upload(file, {
                  gzip: true
                })
                .then(() => resolve())
                .catch(err => reject(err));
            } else {
              reject()
            }

          })
        })
      })
      .then(() => {
        res.status(200).end();
      })
      .catch((err) => {
        console.log(err);
        res.status(500).end();
      });
  });

  busboy.end(req.rawBody);
};
  