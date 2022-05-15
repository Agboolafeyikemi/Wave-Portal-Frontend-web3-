import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import MyPhoto from "./img/myPhoto2.JPG";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);

  const [loading, setLoading] = useState(false);

  const contractAddress = "0x434Fe7fCAcB23828337bf928c224590ECF572682";

  const contractABI = abi.abi;
  const handleMessage = () => {};
  const getAllWaves = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get Metamask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };
  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
    // checkIfWalletIsConnected();
  }, []);

  const wave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();

        let waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined ---", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
      } else {
        console.log("Ethereum object does not exist!");
      }
    } catch (error) {
      console.log(error);
      setLoading(true);
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          {" "}
          <div className="imgContainer">
            <img className="round" src={MyPhoto} alt="user" />
          </div>
          👋 Hey there!
        </div>

        <div className="bio">
          I am Feyikemi and I'm a frontend engineer so that's pretty cool right?
          Connect your Ethereum wallet and wave at me!
        </div>
        <div className="messageContainer">
          <form onSubmit={(e) => wave(e)} className="formContainer">
            <textarea
              value={message}
              id="message"
              placeholder="Send  Me a Message!"
              name="message"
              rows="4"
              cols="50"
              onChange={(e) => setMessage(e.target.value)}
            />

            <button type="submit" className="waveBtn">
              {loading ? "loading..." : "Wave at Me"}
            </button>
            {!currentAccount && (
              <button className="waveBtn" onClick={connectWallet}>
                {" "}
                Connect Wallet{" "}
              </button>
            )}
          </form>
        </div>

        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: "#28223F",
                marginTop: "16px",
                padding: "8px",
                color: "#fff",
              }}
            >
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
