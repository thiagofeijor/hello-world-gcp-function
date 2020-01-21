import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

import { tmpdir, fields, uploads, fileWrites } from './constants'

const receive_field = (fieldname: string, val: string) => {
  console.log(`Processed field ${fieldname}: ${val}.`);
  fields[fieldname] = val;
}

const stacks_files = (
  fieldname: string,
  file: NodeJS.ReadableStream,
  filename: string
) => {
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
}

const process_files = () => {
  const project_id: string = process.env.PROJECT_ID || '';
  const bucket_name: string = process.env.BUCKET_NAME || '';

  const storage = new Storage({projectId: project_id});

  return Promise.all(fileWrites)
    .then(() => { 
      return Object.keys(uploads).map(name => {
        return new Promise((resolve, reject) => {
          const file = uploads[name];

          if (fs.existsSync(file)) {
            storage
              .bucket(bucket_name)
              .upload(file, {
                destination: `${name}/${new Date().toISOString()}`,
                gzip: true
              })
              .then(() => resolve())
              .catch(err => reject(err));
          } else {
            reject()
          }
        })
      })
    });
}

export {
  stacks_files,
  receive_field,
  process_files
}