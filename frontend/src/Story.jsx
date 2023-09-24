import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAccount, useConnect, useContractRead, useDisconnect } from "wagmi";
import { readContract, writeContract } from "@wagmi/core";
import { InjectedConnector } from "wagmi/connectors/injected";
import "./Book.css";
import abi from "./abi.json";
import constants from "./constants";
import axios from "axios";
import BigNumber from "bignumber.js";
import BounceLoader from "react-spinners/ClipLoader";
import Book from "./components/Book";

const modelToIsLandscape = {
  1: true,
};

function Story() {
  const { nonce } = useParams();
  const [title, setTitle] = useState("");
  const [pageCost, setPageCost] = useState();
  const [storyPage, setStoryPage] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    loadStory();
    const interval = setInterval(() => {
      loadStory();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const loadStory = async () => {
    console.log("loading story...");
    const s = await readContract({
      address: constants.contractAddress,
      abi: abi,
      functionName: "stories",
      args: [nonce],
    });
    console.log(s);
    const data = {
      nonce: s[0],
      pages: s[1],
      pageLimit: s[2],
      category: s[3],
      creator: s[4],
      title: s[5],
      ipfs: s[6],
      creationRejected: s[7],
      updating: s[8],
      voteFirst: s[9],
      storyAIid: s[10],
      imageAIid: s[11],
      imageStyle: s[12],
    };

    setNumPages(parseInt(data.pages.toString()));
    setIsLandscape(modelToIsLandscape[data.imageAIid]);
    setUpdating(data.updating);

    const ipfsHash = data.ipfs;
    const storyData = await axios.get(`https://${ipfsHash}.ipfs.w3s.link/`);
    setTitle(storyData.data.title);
    const messages = storyData.data.messages;
    setStoryPage(messages[currentPage]);
    console.log(storyData);
    setPageCost(
      BigNumber(
        calculateCost({
          llmId: data.storyAIid.toString(),
        })
      ).multipliedBy(10 ** 18)
    );
  };

  const handleGoToPrevPage = () => {
    setCurrentPage((prev) => prev - 1);
  };

  const handleGoToNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handleGoToLastPage = () => {
    console.log(numPages, currentPage);
    if (updating) setCurrentPage(numPages);
    else setCurrentPage(numPages - 1);
  };

  const calculateCost = ({ llmId }) => {
    const costs = constants.costs;
    return costs.fixed + costs.imageAI + costs.storyAI[llmId];
  };

  return (
    <>
      <div id="wrapper">
        <div id="container">
          <section className="open-book">
            <header />
            <Book
              title={title}
              pageNo={currentPage + 1}
              totalPages={numPages}
              body={storyPage?.page}
              image={storyPage?.image}
              author={storyPage?.author || ""}
              landscape={isLandscape}
              updating={updating}
              nonce={nonce}
              cost={pageCost}
              metadata={storyPage?.nftMetadata}
              goToNextPage={handleGoToNextPage}
              goToPrevPage={handleGoToPrevPage}
              goToFirstPage={() => setCurrentPage(0)}
              goToLastPage={handleGoToLastPage}
            />
            <footer />
          </section>
        </div>
      </div>
    </>
  );
}

export default Story;
