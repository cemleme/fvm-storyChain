require("dotenv").config();
const upload = async ({
  nonce,
  characterBackground,
  characterDescription,
  storyMessages,
  title,
  pages,
  storyPage,
  imagePrompt,
  imageURI,
  prompt,
  author,
  id,
  pageSummary,
}) => {
  console.log("uploadingIPFS data");

  const nftIPFSResponse = await fetch("https://api.web3.storage/upload", {
    method: "POST",
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      Authorization: "Bearer " + process.env.web3storageKey,
    },
    body: JSON.stringify({
      title,
      name: title + " Page " + pages,
      description: storyPage,
      image: imageURI,
      author,
      id,
    }),
  });
  const nftIPFSResult = await nftIPFSResponse.json();

  console.log("nftIPFSResult", nftIPFSResult);

  const nftUri = `https://${nftIPFSResult.cid}.ipfs.w3s.link/`;

  storyMessages.push({
    author,
    userPrompt: prompt,
    page: storyPage,
    summary: pageSummary,
    imagePrompt,
    image: imageURI,
    nftMetadata: nftUri,
  });

  const saveToIPFSResult = await fetch("https://api.web3.storage/upload", {
    method: "POST",
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      Authorization: "Bearer " + process.env.web3storageKey,
    },
    body: JSON.stringify({
      id: nonce.toString(),
      date: new Date(),
      characterDescription,
      characterBackground,
      messages: storyMessages,
      title,
      pages: pages.toString(),
    }),
  });
  const r = await saveToIPFSResult.json();
  const storyHash = r.cid;

  return { storyHash, nftUri };
};

module.exports = upload;
