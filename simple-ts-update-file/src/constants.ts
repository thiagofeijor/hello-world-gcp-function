import os from 'os';

const tmpdir = os.tmpdir();

// This object will accumulate all the fields, keyed by their name
const fields: any = {};

// This object will accumulate all the uploaded files, keyed by their name.
const uploads: any = {};

const fileWrites: Array<Promise<any>> = [];

export {
  tmpdir,
  fields,
  uploads,
  fileWrites,
}
