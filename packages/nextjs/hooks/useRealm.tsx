import { useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import { BigNumber as EBigNumber } from "ethers";
import { useContractRead, useContractReads } from "wagmi";
import { RealmConfig, RealmType, Token, realms } from "~~/configs/pool";
import contracts from "~~/generated/deployedContracts";
import { useAccount } from "~~/hooks/useAccount";
import { p18 } from "~~/utils/amount";
import { ContractName, RealmContract } from "~~/utils/scaffold-eth/contract";

export type Market = {
  address: string;
  cToken: string;
  token: string;
};

export type MarketData = {
  cash?: BigNumber;
  price?: BigNumber;
  value?: BigNumber;
  totalSupply?: BigNumber;
  exchangeRate?: BigNumber;
  supply?: BigNumber;
  totalBorrows?: BigNumber;
  borrow?: BigNumber;
  balance?: BigNumber;
  supplyRatePerBlock?: BigNumber;
  supplyAPY?: BigNumber;
  borrowAPY?: BigNumber;
  netAPY?: BigNumber;
  borrowBalanceStored?: BigNumber;
  borrowRatePerBlock?: BigNumber;
  deposit?: BigNumber;
  userBorrowed?: BigNumber;
  markets?: [boolean, BigNumber, boolean];
  userLimit?: BigNumber;
  token: Token;
  address: string;
  borrowCaps?: BigNumber;
};

export type Realm = {
  [key in string]?: MarketData;
} & {
  totalValueLocked?: BigNumber;
  totalSupply?: BigNumber;
  totalBorrow?: BigNumber;
  netAPY?: BigNumber;
  deposit?: BigNumber;
  totalUserBorrowed?: BigNumber;
  totalUserLimit?: BigNumber;
  userBorrowLimit?: BigNumber;
  markets?: Market[];
  config?: RealmConfig;
  contract: RealmContract;
};

function processContractValue(data: string | boolean | EBigNumber) {
  if (typeof data === "boolean" || typeof data === "string") {
    return data;
  } else {
    return new BigNumber(data.toString());
  }
}

export function useRealm(realmType: RealmType) {
  const realmInfo = realms.find(realm => {
    return realm.id === realmType;
  });

  const { address } = useAccount();

  // @ts-ignore
  const realmContracts = contracts[realmInfo.key]?.[0];

  const [realm, setRealm] = useState<Realm>({
    contract: realmContracts,
  } as Realm);

  const { data: marketAddresses = [] } = useContractRead({
    ...realmContracts.contracts.Comptroller,
    functionName: "getAllMarkets",
  });

  const calls = [] as any;

  const contractAddressName = {} as any;

  Object.keys(realmContracts.contracts).forEach(name => {
    const contract = realmContracts.contracts[name as ContractName];
    contractAddressName[contract.address] = name;
  });

  const marketContracts = (marketAddresses as string[])
    .map(market => {
      return Object.values(realmContracts.contracts).find(contract => {
        return contract.address === market;
      });
    })
    .filter(contract => {
      return !!contract;
    });

  const avaliableMarkets = realmInfo!.markets.map(market => {
    const address = realmContracts.contracts[market.cToken].address;
    return {
      ...market,
      address,
    };
  });

  marketContracts.forEach(marketContract => {
    if (!marketContract) {
      return;
    }
    const SimplePriceOracleContract = realmContracts.contracts.SimplePriceOracle;
    const ComptrollerContract = realmContracts.contracts.Comptroller;
    calls.push({
      ...marketContract,
      functionName: "getCash",
      chainId: parseInt(realmContracts.chainId),
    });
    calls.push({
      ...SimplePriceOracleContract,
      functionName: "getUnderlyingPrice",
      args: [marketContract.address],
      chainId: parseInt(realmContracts.chainId),
    });
    calls.push({
      ...marketContract,
      functionName: "totalSupply",
      chainId: parseInt(realmContracts.chainId),
    });
    calls.push({
      ...marketContract,
      functionName: "exchangeRateStored",
      chainId: parseInt(realmContracts.chainId),
    });
    calls.push({
      ...marketContract,
      functionName: "totalBorrows",
      chainId: parseInt(realmContracts.chainId),
    });
    calls.push({
      ...marketContract,
      functionName: "balanceOf",
      chainId: parseInt(realmContracts.chainId),
      args: [address],
    });
    calls.push({
      ...marketContract,
      functionName: "supplyRatePerBlock",
      chainId: parseInt(realmContracts.chainId),
    });
    calls.push({
      ...marketContract,
      functionName: "borrowBalanceStored",
      chainId: parseInt(realmContracts.chainId),
      args: [address],
    });
    calls.push({
      ...marketContract,
      functionName: "borrowRatePerBlock",
      chainId: parseInt(realmContracts.chainId),
    });
    calls.push({
      ...ComptrollerContract,
      functionName: "markets",
      chainId: parseInt(realmContracts.chainId),
      args: [marketContract.address],
    });
    calls.push({
      ...ComptrollerContract,
      functionName: "borrowCaps",
      chainId: parseInt(realmContracts.chainId),
      args: [marketContract.address],
    });
  });

  const { data } = useContractReads({
    scopeKey: "market",
    contracts: calls,
    cacheTime: 2000,
  });

  const props = [
    "cash",
    "price",
    "totalSupply",
    "exchangeRate",
    "totalBorrows",
    "balance",
    "supplyRatePerBlock",
    "borrowBalanceStored",
    "borrowRatePerBlock",
    "markets",
    "borrowCaps",
  ] as (
    | "cash"
    | "price"
    | "totalSupply"
    | "exchangeRate"
    | "totalBorrows"
    | "balance"
    | "supplyRatePerBlock"
    | "borrowBalanceStored"
    | "borrowRatePerBlock"
    | "markets"
    | "borrowCaps"
  )[];

  useEffect(() => {
    const result = {} as Realm;
    data?.forEach((item, index) => {
      const marketIndex = Math.floor(index / props.length);
      const propIndex = index % props.length;
      const marketContract = marketContracts[marketIndex]!;
      const prop = props[propIndex];
      if (!result[marketContract.address]) {
        const market = realmInfo!.markets.find(market => {
          return market.cToken === contractAddressName[marketContract.address];
        })!;
        result[marketContract.address] = {
          token: realmInfo!.tokens.find(token => {
            return token.name === market.token;
          })!,
          address: marketContract.address,
        };
      }
      if (!item) {
        result[marketContract.address]![prop] = undefined;
      } else if (prop === "price") {
        // @ts-ignore
        result[marketContract.address].price = processContractValue(item)?.div(p18);
      } else if (prop === "exchangeRate") {
        // @ts-ignore
        result[marketContract.address].exchangeRate = processContractValue(item)?.div(p18);
      } else if (Array.isArray(item)) {
        // @ts-ignore
        result[marketContract.address][prop] = item.map(value => {
          return processContractValue(value);
        });
      } else {
        // @ts-ignore
        result[marketContract.address][prop] = processContractValue(item);
      }
    });

    let marketTotalValueLocked = new BigNumber(0);
    let marketTotalSupply = new BigNumber(0);
    let marketTotalBorrow = new BigNumber(0);
    let marketNetAPY = new BigNumber(0);
    let marketDeposit = new BigNumber(0);
    let totalUserBorrowed = new BigNumber(0);
    let totalUserLimit = new BigNumber(0);

    marketContracts.forEach(marketContract => {
      const marketAddress = marketContract!.address;
      if (!result || !result[marketAddress]) {
        return;
      }
      const {
        cash,
        price,
        exchangeRate,
        totalSupply,
        totalBorrows,
        balance,
        supplyRatePerBlock,
        borrowRatePerBlock,
        borrowBalanceStored,
        markets,
      } = result[marketAddress]!;
      if (price && cash) {
        result[marketAddress]!.value = cash.div(p18).multipliedBy(price);
        marketTotalValueLocked = marketTotalValueLocked.plus(result[marketAddress]!.value!);
      }
      if (totalSupply && exchangeRate && price) {
        result[marketAddress]!.supply = totalSupply.div(p18).multipliedBy(exchangeRate).multipliedBy(price);
        marketTotalSupply = marketTotalSupply.plus(result[marketAddress]!.supply!);
      }
      if (totalBorrows && exchangeRate && price) {
        result[marketAddress]!.borrow = totalBorrows.div(p18).multipliedBy(exchangeRate).multipliedBy(price);
        marketTotalBorrow = marketTotalBorrow.plus(result[marketAddress]!.borrow!);
      }
      if (balance && supplyRatePerBlock) {
        const _v = balance.div(p18).multipliedBy(supplyRatePerBlock);
        result[marketAddress]!.supplyAPY = new BigNumber(_v.toNumber() ^ 365);
      }
      if (borrowBalanceStored && borrowRatePerBlock) {
        const _v = borrowBalanceStored.div(p18).multipliedBy(borrowRatePerBlock);
        result[marketAddress]!.borrowAPY = new BigNumber(_v.toNumber() ^ 365);
      }
      if (result[marketAddress]!.borrowAPY && result[marketAddress]!.supplyAPY) {
        result[marketAddress]!.netAPY = result[marketAddress]!.supplyAPY?.minus(
          result[marketAddress]!.borrowAPY as any,
        );
        marketNetAPY = marketNetAPY.plus(result[marketAddress]!.netAPY!);
      }
      if (balance && exchangeRate && price) {
        result[marketAddress]!.deposit = balance.div(p18).multipliedBy(exchangeRate).multipliedBy(price);
        marketDeposit = marketDeposit.plus(result[marketAddress]!.deposit!);
      }
      if (exchangeRate && borrowBalanceStored) {
        result[marketAddress]!.userBorrowed = borrowBalanceStored.div(p18).multipliedBy(exchangeRate);
        totalUserBorrowed = totalUserBorrowed.plus(result[marketAddress]!.userBorrowed!);
      }
      if (markets && balance && price) {
        result[marketAddress]!.userLimit = markets[1].div(p18).multipliedBy(balance).div(p18).multipliedBy(price);
        totalUserLimit = totalUserLimit.plus(result[marketAddress]!.userLimit!);
      }
    });

    result.totalValueLocked = marketTotalValueLocked;
    result.deposit = marketDeposit;
    result.netAPY = marketNetAPY;
    result.totalBorrow = marketTotalBorrow;
    result.totalSupply = marketTotalSupply;
    result.totalUserBorrowed = totalUserBorrowed;
    result.totalUserLimit = totalUserLimit;
    result.userBorrowLimit = totalUserBorrowed.div(totalUserLimit);
    if (result.userBorrowLimit.isNaN()) {
      result.userBorrowLimit = new BigNumber(0);
    }
    result.markets = avaliableMarkets;
    result.config = realmInfo;
    result.contract = realmContracts;
    setRealm(result);
  }, [data]);

  return realm;
}