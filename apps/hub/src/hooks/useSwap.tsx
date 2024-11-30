"use client";

import { useEffect, useState } from "react";
import {
  TXN_GAS_USED_ESTIMATES,
  useGasData,
  usePollAllowance,
  usePollWalletBalances,
  useSubgraphTokenInformation,
  useTokenInformation,
  useTokens,
  // @ts-ignore - ignore Token typing import error
  type Token,
} from "@bera/berajs";
import {
  balancerVaultAddress,
  beraTokenAddress,
  nativeTokenAddress,
} from "@bera/config";
import { POLLING } from "@bera/shared-ui";
import { beraToken } from "@bera/wagmi";
import { SwapKind } from "@berachain-foundation/berancer-sdk";
import { type Address } from "viem";

import { isBeratoken } from "~/utils/isBeraToken";
import { usePollBalancerSwap } from "~/b-sdk/usePollBalancerSwap";

interface UseSwapArguments {
  inputCurrency?: string | undefined;
  outputCurrency?: string | undefined;
  isRedeem: boolean;
}

function normalizeToRatio(num1: number, num2: number): string {
  const ratio = num2 / num1;
  return ratio.toFixed(6);
}

export enum WRAP_TYPE {
  WRAP = "Wrap",
  UNWRAP = "Unwrap",
}

export const useSwap = ({
  inputCurrency = undefined,
  outputCurrency = undefined,
  isRedeem,
}: UseSwapArguments) => {
  const { data: pendingInputToken } = useTokenInformation({
    address: inputCurrency,
  });
  const { data: pendingOutputToken } = useTokenInformation({
    address: outputCurrency,
  });

  const [selectedTo, setSelectedTo] = useState<Token | undefined>(undefined);

  const [selectedFrom, setSelectedFrom] = useState<Token | undefined>(
    undefined,
  );

  const [inputAddTokenDialogOpen, setInputAddTokenDialogOpen] = useState(false);
  const [outputAddTokenDialogOpen, setOutputAddTokenDialogOpen] =
    useState(false);

  const { data: tokenListData } = useTokens();

  useEffect(() => {
    if (!inputCurrency || !outputCurrency) return;
    if (inputCurrency === outputCurrency) return;
    if (!tokenListData) return;

    const doesInputTokenExist = tokenListData?.tokenList?.some(
      // @ts-ignore - ignore any
      (t) => t.address.toLowerCase() === inputCurrency.toLowerCase(),
    );
    if (!doesInputTokenExist) {
      setInputAddTokenDialogOpen(true);
      return;
    }
    const doesOutputTokenExist = tokenListData?.tokenList?.some(
      // @ts-ignore - ignore any
      (t) => t.address.toLowerCase() === outputCurrency.toLowerCase(),
    );
    if (!doesOutputTokenExist) {
      setOutputAddTokenDialogOpen(true);
      return;
    }
    if (inputCurrency === nativeTokenAddress) {
      setSelectedFrom(beraToken);
    }
    if (outputCurrency === nativeTokenAddress) {
      setSelectedTo(beraToken);
    }
    if (pendingInputToken && inputCurrency) {
      setSelectedFrom(pendingInputToken);
    }
    if (pendingOutputToken && outputCurrency) {
      setSelectedTo(pendingOutputToken);
    }
    return;
  }, [pendingInputToken, pendingOutputToken]);
  const { data: inputTokenInfo } = useSubgraphTokenInformation({
    tokenAddress: selectedFrom?.address,
  });
  const { data: outputTokenInfo } = useSubgraphTokenInformation({
    tokenAddress: selectedTo?.address,
  });

  const tokenInPrice = inputTokenInfo?.usdValue;
  const tokenOutPrice = outputTokenInfo?.usdValue;

  const [isWrap, setIsWrap] = useState(false);
  const [wrapType, setWrapType] = useState<WRAP_TYPE | undefined>(undefined);
  const [fromAmount, setFromAmount] = useState<string | undefined>();
  const [toAmount, setToAmount] = useState<string | undefined>();
  const [swapAmount, setSwapAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState<undefined | string>(
    undefined,
  );
  const [swapKind, setSwapKind] = useState<SwapKind>(SwapKind.GivenIn);
  const [isTyping, setIsTyping] = useState(false);
  const { isLoading: isBalanceLoading } = usePollWalletBalances();

  useEffect(() => {
    if (isWrap) {
      if (swapKind === SwapKind.GivenIn) {
        setToAmount(fromAmount);
      }
      if (swapKind === SwapKind.GivenOut) {
        setFromAmount(toAmount);
      }
    }
  }, [swapAmount]);

  const {
    data: swapInfo,
    error: getSwapError,
    isLoading: isSwapLoading,
  } = usePollBalancerSwap(
    {
      tokenIn: selectedFrom?.address as Address,
      tokenOut: selectedTo?.address as Address,
      tokenInDecimals: selectedFrom?.decimals ?? 18,
      tokenOutDecimals: selectedTo?.decimals ?? 18,
      amount: swapAmount,
      isWrap,
      wberaIsBera:
        selectedTo?.address === nativeTokenAddress ||
        selectedFrom?.address === nativeTokenAddress, // aka if we have BERA in i/o we want vault to handle the wrapping
    },
    {
      opts: {
        refreshInterval: POLLING.FAST, // every 10s
      },
      isTyping: isTyping,
    },
  );

  const [differenceUSD, setDifferenceUSD] = useState<number | null>(null);

  // update price impact in terms of USD value of in/out tokens
  useEffect(() => {
    if (!swapInfo?.swapPaths?.length || !swapInfo?.swapPaths?.length) {
      setDifferenceUSD(0);
      return;
    }
    const usdIn = Number(tokenInPrice ?? 0) * Number(swapInfo?.amountIn);
    const usdOut =
      Number(tokenOutPrice ?? 0) * Number(swapInfo?.expectedAmountOutFormatted);
    const differenceUSD = (usdOut / usdIn) * 100 - 100;
    setDifferenceUSD(parseFloat(differenceUSD.toFixed(2)));
  }, [swapInfo, tokenInPrice, tokenOutPrice]);

  useEffect(() => {
    if (
      selectedTo !== undefined &&
      selectedFrom !== undefined &&
      isBeratoken(selectedTo) &&
      isBeratoken(selectedFrom)
    ) {
      setIsWrap(true);
      if (selectedFrom.address === nativeTokenAddress) {
        setWrapType(WRAP_TYPE.WRAP);
      }
      if (selectedFrom.address === beraTokenAddress) {
        setWrapType(WRAP_TYPE.UNWRAP);
      }
    } else {
      setIsWrap(false);
      setWrapType(undefined);
    }
  }, [selectedTo, selectedFrom]);

  // populate field of calculated swap amount
  useEffect(() => {
    if (isWrap || isRedeem) return;
    if (!swapInfo?.swapPaths?.length) {
      setToAmount(swapInfo?.amountInFormatted);
    }
    if (swapKind === SwapKind.GivenIn) {
      setToAmount(swapInfo?.expectedAmountOutFormatted);
    } else {
      setFromAmount(swapInfo?.amountInFormatted);
    }
  }, [swapInfo, isWrap]);

  // calculate exchange rate
  useEffect(() => {
    if (!swapInfo?.swapPaths?.length) return;
    if (
      swapInfo?.amountInFormatted &&
      swapInfo?.expectedAmountOutFormatted &&
      selectedFrom &&
      selectedTo
    ) {
      try {
        const ratio = normalizeToRatio(
          Number(swapInfo?.amountInFormatted),
          Number(swapInfo?.expectedAmountOutFormatted),
        );
        if (Number.isNaN(Number(ratio))) {
          setExchangeRate(undefined);
          return;
        }

        const exchangeRate = `1 ${selectedFrom?.symbol} = ${ratio} ${selectedTo?.symbol}`;
        setExchangeRate(exchangeRate);
      } catch (e) {
        console.log(e);
        setExchangeRate(undefined);
      }
    } else {
      setExchangeRate(undefined);
    }
  }, [swapInfo, selectedFrom, selectedTo, fromAmount, toAmount]);

  useEffect(() => {
    setExchangeRate(undefined);
  }, [selectedFrom, selectedTo]);

  const { data: allowance, refresh: refreshAllowance } = usePollAllowance({
    spender: balancerVaultAddress,
    token: selectedFrom,
  });

  const onSwitch = () => {
    const tempFrom = selectedFrom;
    const tempTo = selectedTo;

    setSelectedFrom(tempTo);
    setSelectedTo(tempFrom);

    setFromAmount(toAmount);
    setSwapAmount(toAmount ?? "");

    if (isWrap) {
      if (wrapType === WRAP_TYPE.WRAP) {
        setWrapType(WRAP_TYPE.UNWRAP);
      } else {
        setWrapType(WRAP_TYPE.WRAP);
      }
      setToAmount(toAmount);
    } else {
      setToAmount("");
    }
  };

  useEffect(() => {
    if (isWrap) {
      if (fromAmount !== toAmount) {
        setToAmount(fromAmount);
      }
    }
  }, [isWrap]);

  // @ts-ignore
  const { estimatedBeraFee } = useGasData({
    gasUsedOverride: TXN_GAS_USED_ESTIMATES.SWAP * 8 * 2, // multiplied by 8 for the multiswap steps assumption in a swap, then by 2 to allow for a follow up swap
  });

  const { data: beraInfo } = useSubgraphTokenInformation({
    tokenAddress: nativeTokenAddress,
  });

  // Format and output final gas price
  const beraGasPriceToUSD = (priceInBera?: number) => {
    return beraInfo && priceInBera
      ? parseFloat(beraInfo?.usdValue ?? "0") * priceInBera
      : null;
  };

  const formattedGasPrice = estimatedBeraFee
    ? beraGasPriceToUSD(estimatedBeraFee)
    : 0;

  return {
    setSwapKind,
    setSelectedFrom,
    setFromAmount,
    setToAmount,
    setSelectedTo,
    setSwapAmount,
    onSwitch,
    setIsTyping,
    refreshAllowance,
    setInputAddTokenDialogOpen,
    setOutputAddTokenDialogOpen,
    pendingInputToken,
    pendingOutputToken,
    inputAddTokenDialogOpen,
    outputAddTokenDialogOpen,
    swapAmount,
    selectedFrom,
    allowance,
    selectedTo,
    fromAmount,
    toAmount,
    swapKind,
    error: getSwapError,
    swapInfo,
    exchangeRate,
    gasEstimateInBera: estimatedBeraFee,
    gasPrice: formattedGasPrice,
    isRouteLoading: isSwapLoading || isTyping,
    isWrap,
    wrapType,
    isBalanceLoading,
    tokenInPrice,
    tokenOutPrice,
    differenceUSD,
  };
};
