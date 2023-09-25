# StoryChain

Try at https://fvm.storychain.ai

**StoryChain**, a new take on the ages old classic chain of stories, where different users in turn create a story collaboratively. The system supports **multiple AI alternatives** for users to choose from, creating a dynamic ecosystem. For consistency reason, once a story is created with a specific AI, it continues using it.

Using this dapp, users create stories that have unique chapters and arts using web3, AI, NFTs, IPFS. Each page can belong to a different user.

Once a user creates a story, they define the category (such as if it is a childrens' story), select the story AI and also the image generation AI. Once the story is created, users simply read the previous chapters and enter a prompt however they wish to continue.

So a story is created collaboratively by the users and each page belongs to one user with unique story and art. More if it, this page itself is minted as an **NFT** for the user; which can be visited on Filecoin Calibration Testnet Explorer and NFT Marketplaces.

System currently uses LLMs of ChatGPT v3.5 and ChatGPT v4 and Image Generation of SDXL from Lilypad and other stable diffusion models from Leonardo.ai

## Instructions

Contracts:

- To deploy: npx hardhat run scripts/deploy.js --network calibrationnet

Backend:

- Update contractAddress @ backend/run.js
- Update backend/.env to add keys
  openAiKey=
  web3storageKey=
  privateKey=
  REPLICATE_API_TOKEN=
  leonardo_key=

- Set Lilypad CLI settings described as at https://docs.lilypadnetwork.org/lilypad-v1-examples/stable-diffusion
- Export private key for Lilypad

- Start using: node run.js (inside backend folder)

Frontend:

- Update contractAddress @ frontend/constants.js
- Start using npm run dev (inside frontend folder)

## What it does

**StoryChain**, a new take on the ages old classic chain of stories, where different users collaboratively create stories.

Using this dapp, users create stories that have unique chapters and arts using web3, AI, NFTs, IPFS. Each page can belong to a different user.

Once a user creates a story, they define the category (such as if it is a childrens' story), select the story AI and also the image generation AI. Once the story is created, users simply read the previous chapters and enter a prompt however they wish to continue.

So a story is created collaboratively by the users and each page belongs to one user with unique story and art. More if it, this page itself is minted as an **NFT** for the user; which can be visited on Filecoin Calibration Testnet Explorer and NFT Marketplaces.

## Technologies

- Calibration Testnet Blockchain
- ChatGPT for AI Story Generation
- Lilypad for SDXL AI Image Generation
- LeonardoAI Stable Diffusion Models for AI Image Generation
- AWS for hosting NodeJS backend
- React for frontend

## How I built it

Once the prompt is entered, NodeJS backend server running on AWS catches the emitted events from the contract and applies multiple steps on it;

- Checks if the prompt is suitable for the category (For an example if it's a children's story and the user asked the character to burn down a forest, the prompt is rejected)
- It gets the latest story data from **IPFS**,
- Providing entire story to chatgpt, asks to create a new chapter that would fit the continuity, and also create a prompt for ai image generator
- AI Image generator generates an image for our chapter
- Then we upload the image to IPFS
- Upload the entire story with new chapter and the image to IPFS
- Then submit these IPFS hashes to the contract
- And finally the contract mints an NFT for the author of the new chapter

The metadata for the NFT items is stored on-chain and IPFS. After an update on the story, user's chapter now have the story and the image, and this chapter also belongs to the author as an NFT. We can also view this NFT or other chapters or other books on Filecoin Calibration Testnet Explorer and NFT Marketplaces. The story metadata on IPFS is also available to view.

Another option for creating a story is using the **voting mechanism**. When creating a story, user can select if the future entries to the story requires voting. This way each story becomes a DAO itself.
When a user wants to continue to the story, they enter their prompt.
Then in a certain period, NFT owners submit their votes to their favorite prompt, creator having an extra half vote to break the equal votes. At the end of the voting period, prompt with the highest vote is used to continue the story, minting the NFT to the elected prompt owner.
This way as the story grows, a larger community forms within, increasing the chance of higher quality prompts to be entered. Other users can choose to buy NFTs from the authors to have a vote in the decision.