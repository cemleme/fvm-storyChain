const { ethers } = require("ethers");
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const abi = require("./abi.json");
const fs = require("fs");
const getProviderEvents = require("./lib/getProviderEvents");
require("dotenv").config();
const generateStory = require("./lib/generateStory");
const generateImage = require("./lib/generateImage");
const generateLilypadImage = require("./lib/generateLilypad");
const uploadIPFS = require("./lib/uploadIPFS");

const provider = new JsonRpcProvider(
  "https://api.calibration.node.glif.io/rpc/v1"
);
const signer = new Wallet(process.env.privateKey, provider);

const contractAddress = "0xC7041206070A789dA289D800F0Eb069ED1270d22";
const contract = new ethers.Contract(contractAddress, abi, signer);

let lastProviderBlock = 937400;

try {
  lastProviderBlock = parseInt(fs.readFileSync("./tmp/lastCheck"));
  console.log(lastProviderBlock);
} catch {}

const hashCache = {};

const llms = ["gpt-3.5-turbo", "gpt-4"];

const sleep = function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const getLogs = async () => {
  const { result: providerEvents, toBlock: newToBlock } =
    await getProviderEvents({
      provider,
      contractAddress,
      startingBlock: lastProviderBlock,
    });
  if (!providerEvents) {
    await sleep(2000);
    return getLogs();
  }
  console.log("provider events:", providerEvents.length);
  try {
    for (let i = 0; i < providerEvents.length; i++) {
      if (!hashCache[providerEvents[i].hash]) {
        hashCache[providerEvents[i].hash] = true;
        await handleStory(providerEvents[i]);
      }
    }
    lastProviderBlock = newToBlock + 1;
    fs.writeFileSync("./tmp/lastCheck", lastProviderBlock.toString());
    await sleep(5000);
    getLogs();
  } catch (err) {
    console.log(err);
    await sleep(5000);
    getLogs();
  }
};

getLogs();

const handleStory = async ({ nonce, author, prompt, page }) => {
  const storyData = await contract.stories(nonce.toString());
  const currentPage = storyData[1].toString();
  const pages = parseInt(storyData[1].toString()) + 1;
  const pageLimit = parseInt(storyData[2].toString());
  const category = storyData[3].toString();
  const title = storyData[5];
  const ipfsHash = storyData[6] || "create";
  const updating = storyData[8];
  const storyAIid = parseInt(storyData[10].toString());
  const imageAIid = parseInt(storyData[11].toString());
  const imageStyleid = parseInt(storyData[12].toString());

  console.log(title, "imageAIid", imageAIid)

  const llm = llms.length > storyAIid ? llms[storyAIid] : llms[0];

  if (currentPage != page) {
    console.log("this event belongs to an old page, skip...");
    return;
  }

  if (!updating) {
    console.log("the story is not updating, cant change anything");
    return;
  }

  console.log("handling story", { nonce, prompt, author });

  const {
    story,
    characterBackground,
    characterDescription,
    storyPage,
    pageSummary,
    storyMessages,
  } = await generateStory({
    category,
    prompt,
    ipfsHash,
    pages,
    llm,
  });

  if (!story.approved) {
    console.log("rejecting the prompt");
    const tx = await contract.rejectPrompt(nonce.toString(), {
      from: signer.address,
    });
    console.log("txhash:", tx.hash);
    return;
  }

  const id = parseInt(nonce) * 10000 + pages;
  let imageURI;

  //use lilypad if image AI is SDXL
  if (imageAIid == 1) {
    imageURI = await generateLilypadImage({
      category,
      imageStyleid,
      imagePrompt: story.imagePrompt,
    });
  } else {
    imageURI = await generateImage({
      category,
      imageAIid,
      imageStyleid,
      id,
      imagePrompt: story.imagePrompt,
    });
  }

  if (!imageURI) {
    console.log("----------error on image generation");
    return;
  }

  const { storyHash, nftUri } = await uploadIPFS({
    nonce,
    characterBackground,
    characterDescription,
    storyMessages,
    title,
    id,
    pages,
    pageSummary,
    storyPage,
    imageURI,
    prompt,
    author,
    imagePrompt: story.imagePrompt,
  });

  if (!storyHash) {
    console.log("----------error on storyhash");
    return;
  }

  try {
    const tx = await contract.updateStory(
      nonce.toString(),
      storyHash,
      author,
      nftUri,
      pages.toString(),
      {
        from: signer.address,
      }
    );
    console.log("txhash:", tx.hash);
  } catch (err) {
    console.log("error on updateStory contract function");
    console.log(err);
    console.log(err.message);
  }
};
