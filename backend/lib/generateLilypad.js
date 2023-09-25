require("dotenv").config();
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const negative_prompt =
  "2 heads, 2 faces, 3 feet, 4 feet, cropped image, out of frame, deformed hands, twisted fingers, cross eyes, weird eyes, dead eyes, double image, malformed hands, multiple heads, extra limb, ugly, poorly drawn hands, missing limb, disfigured, cut off, ugly, grain, low res, deformed, blurry, bad anatomy, disfigured, poorly drawn face, mutation, mutated, floating limbs, disconnected limbs, disgusting, poorly drawn, mutilated, mangled, extra fingers, duplicate artifacts, missing arms, mutated hands, mutilated hands, cloned face, malformed, text, fonts, letters, symbols, logo, wordmark, writing, heading, signature, watermark, stamp";

const sleep = function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const styles = [
  "regular",
  "colored sketch",
  "black and white sketch",
  "anime",
  "3d render",
  "children's book illustration",
  "illustration",
  "photography",
  "retro",
  "ultra realistic",
  "sci fi",
];

const generate = async ({ category, imageStyleid, imagePrompt }) => {
  const style = styles.length > imageStyleid ? styles[imageStyleid] : styles[0];

  let positivePrompt = style + " " + imagePrompt;
  positivePrompt = positivePrompt.replaceAll("'", "");
  if (category === 0) positivePrompt = "kids story. " + positivePrompt;

  const seed = Math.floor(Math.random() * 1000000 + 1);

  const command = `./lib/lilypad run sdxl:v0.9-lilypad1 '{"prompt": ${positivePrompt}, "seed": ${seed}}'`;

  const { stdout, stderr } = await exec(command);
  let imageAIUri;
  if (stdout) {
    const result = stdout.toString();
    imageAIUri = ipfsLink(result, seed);
  }
  if (stderr) {
    console.log(stderr);
  }

  console.log(imageAIUri);

  return imageAIUri;

  const imageRequest = await axios({
    url: imageAIUri,
    method: "GET",
    responseType: "arraybuffer",
  });
  const imageBuffer = imageRequest.data;

  const imageUploadResponse = await fetch("https://api.web3.storage/upload", {
    method: "POST",
    headers: {
      "Content-type": "Content-type: image/png",
      Authorization: "Bearer " + process.env.web3storageKey,
    },
    body: imageBuffer,
  });
  const imageUploadResult = await imageUploadResponse.json();
  const imageURI = `https://${imageUploadResult.cid}.ipfs.w3s.link/`;

  console.log("imageURI", imageURI);
  return imageURI;
};

const ipfsLink = (text, seed) => {
  const index = text.indexOf("🍃 Fetching results... ");
  if (index > 0) {
    return (
      text.substring(index + 23, index + 23 + 67) + `/outputs/image-${seed}.png`
    );
  } else {
    console.log("lilypad error");
    return null;
  }
};

// generate({
//   category: 0,
//   imageStyleid: 0,
//   imagePrompt:
//     "Henry is a white hacker trying to stop malicious attacks on world wide web.",
// });

module.exports = generate;
