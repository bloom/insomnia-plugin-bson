const BSON = require("bson");
const fs = require("fs");
const os = require("os");
const path = require("path");
const lodash = require("lodash");

let writeAsFile = (buffer) => {
  let tmp = os.tmpDir();
  let base = path.join(tmp, "insomnia-bson");

  if (!fs.existsSync(base)) {
    fs.mkdirSync(base);
  }

  let filePath = path.join(
    base,
    String(Math.floor(Math.random() * 3000000000))
  );

  fs.writeFileSync(filePath, buffer);
  return filePath;
};

module.exports.templateTags = [
  {
    name: "buffer_from_string",
    displayName: "Buffer (from a string)",
    description:
      "Given a string, renders that string as a buffer in the BSON body.",
    args: [
      {
        displayName: "Value",
        description: "The value to write to a buffer (as a UTF-8 string)",
        type: "string",
        defaultValue: "pizza",
      },
    ],
    async run(context, value) {
      return "INSOMNIA-BSON::::buffer_from_string::::" + value;
    },
  },
  {
    name: "buffer_from_file",
    displayName: "Buffer (from a file)",
    description:
      "Given a path to a file, includes the contents as a buffer in the BSON body.",
    args: [
      {
        displayName: "File",
        description: "The file to include",
        type: "file",
      },
    ],
    async run(context, path) {
      return "INSOMNIA-BSON::::buffer_from_file::::" + path;
    },
  },
];

let tagOperationDict = {
  buffer_from_string: (value) => {
    return Buffer.from(value);
  },

  buffer_from_file: (path) => {
    return fs.readFileSync(path);
  },
};

let replaceTags = (data) => {
  if (typeof data == "string" && data.split("::::").length == 3) {
    let [_, name, value] = data.split("::::");
    return tagOperationDict[name](value);
  } else if (data instanceof Array) {
    return data.map(replaceTags);
  } else if (data instanceof Object) {
    return lodash.mapValues(data, replaceTags);
  } else {
    return data;
  }
};

module.exports.requestHooks = [
  (ctx) => {
    let req = ctx.request;
    let shouldProcess = req.getHeader("x-use-bson") || false;
    if (!shouldProcess) {
      return;
    }

    // Set the correct content-type header:
    req.setHeader("content-type", "application/bson");
    req.removeHeader("x-use-bson");

    // Take the JSON body as it is and serialize it to bson.
    let { text } = req.getBody();
    let parsed = JSON.parse(text);
    let replaced = replaceTags(parsed);
    let serialized = BSON.serialize(replaced, { ignoreUndefined: true });
    let filePath = writeAsFile(serialized);
    req.setBody({ mimeType: "application/bson", fileName: filePath });
  },
];

let replaceBuffers = (data) => {
  if (data instanceof Buffer) {
    return data.toString("base64");
  } else if (data instanceof Array) {
    return data.map(replaceBuffers);
  } else if (data instanceof Object) {
    return lodash.mapValues(data, replaceBuffers);
  } else {
    return data;
  }
};

module.exports.responseHooks = [
  (ctx) => {
    let res = ctx.response;
    if (res.getHeader("content-type") == "application/bson") {
      let body = res.getBody();
      let deserialized = BSON.deserialize(body, {
        promoteBuffers: true,
        promoteValues: true,
        promoteLongs: true,
      });
      res.setBody(JSON.stringify(replaceBuffers(deserialized)));
    }
  },
];
