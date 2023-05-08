import { useEffect } from "react";
import type { AppProps } from "next/app";
import { MantineProvider } from "@mantine/core";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import NextNProgress from "nextjs-progressbar";
import { Toaster } from "react-hot-toast";
import { WagmiConfig } from "wagmi";
import App from "~~/components/common/App";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import mantineConfig from "~~/configs/mantine";
import { useEthPrice } from "~~/hooks/scaffold-eth";
import { useAppStore } from "~~/services/store/store";
import { wagmiClient } from "~~/services/web3/wagmiClient";
import { appChains } from "~~/services/web3/wagmiConnectors";
import "~~/styles/globals.css";

const ScaffoldEthApp = ({ Component, pageProps }: AppProps) => {
  const price = useEthPrice();
  const setEthPrice = useAppStore(state => state.setEthPrice);
  // This variable is required for initial client side rendering of correct theme for RainbowKit

  useEffect(() => {
    if (price > 0) {
      setEthPrice(price);
    }
  }, [setEthPrice, price]);

  return (
    <WagmiConfig client={wagmiClient}>
      <NextNProgress />
      <RainbowKitProvider chains={appChains.chains} avatar={BlockieAvatar} theme={lightTheme()}>
        <MantineProvider {...mantineConfig}>
          <App>
            <Component {...pageProps} />
          </App>
        </MantineProvider>
        <Toaster />
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default ScaffoldEthApp;
