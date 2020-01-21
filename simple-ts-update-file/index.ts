import Busboy from 'busboy';
import {
  stacks_files,
  receive_field,
  process_files
} from './src/file_process';

const upload = (req: any, res: any) => {
  const busboy = new Busboy({ headers: req.headers });

  // This code will process each non-file field in the form.
  busboy.on('field', receive_field);
  // This code will process each file uploaded.
  busboy.on('file', stacks_files);

  // Triggered once all uploaded files are processed by Busboy.
  // We still need to wait for the disk writes (saves) to complete.
  busboy.on('finish', () => {
    process_files()
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

export { 
  upload
}