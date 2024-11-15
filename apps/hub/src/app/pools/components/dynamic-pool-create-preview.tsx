import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  balancerVaultAbi,
  formatUsd,
  getSafeNumber,
  useBeraJs,
  useSubgraphTokenInformations,
} from "@bera/berajs";
import {
  balancerPoolCreationHelper,
  balancerVaultAddress,
  cloudinaryUrl,
} from "@bera/config";
import {
  ActionButton,
  ApproveButton,
  TokenIcon,
  useTxn,
} from "@bera/shared-ui";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { Button } from "@bera/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@bera/ui/dialog";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { formatUnits, parseUnits } from "viem";

import { TokenInput } from "~/hooks/useMultipleTokenInput";
import { usePollPoolCreationRelayerApproval } from "~/hooks/usePollPoolCreationRelayerApproval";
import { OwnershipType } from "./ownership-input";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tokens: TokenInput[];
  weights: bigint[];
  poolName: string;
  poolSymbol: string;
  poolType: string;
  swapFee: number;
  ownerAddress: string;
  ownershipType: OwnershipType;
  amplification: number;
  isLoadingCreatePoolTx: boolean;
  isSubmittingCreatePoolTx: boolean;
  isSuccessCreatePoolTx: boolean;
  createPoolErrorMessage: string | null;
  writeCreatePool: () => void;
  tokensNeedApproval: any[];
  refreshAllowances: () => void;
};

export default function DynamicPoolCreationPreview({
  open,
  setOpen,
  tokens,
  weights,
  poolName,
  poolSymbol,
  poolType,
  swapFee,
  ownerAddress,
  ownershipType,
  amplification,
  isLoadingCreatePoolTx,
  isSubmittingCreatePoolTx,
  isSuccessCreatePoolTx,
  createPoolErrorMessage,
  writeCreatePool,
  tokensNeedApproval,
  refreshAllowances,
}: Props) {
  // Get relayer approval status and refresh function
  const router = useRouter(); // FIXME this seems to not be able to go here.
  const { account } = useBeraJs();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // NOTE: if useTxn isnt here we dont receive updates properly for out submit button
  const {
    data: isRelayerApproved,
    isLoading: isLoadingRelayerStatus,
    error: isRelayerApprovalError,
    refreshPoolCreationApproval,
  } = usePollPoolCreationRelayerApproval();

  // Use useTxn for the approval
  const {
    write,
    ModalPortal: ModalPortalRelayerApproval,
    isLoading: isRelayerApprovalLoading,
    isSubmitting: isRelayerApprovalSubmitting,
  } = useTxn({
    message: "Approving the Pool Creation Helper...",
    onSuccess: () => {
      refreshPoolCreationApproval();
    },
    onError: (e) => {
      setErrorMessage("Error approving relayer.");
    },
  });

  const handleRelayerApproval = async () => {
    if (!account || !balancerVaultAddress) {
      console.error("Missing account or balancerVaultAddress");
      return;
    }
    try {
      await write({
        address: balancerVaultAddress,
        abi: balancerVaultAbi,
        functionName: "setRelayerApproval",
        params: [account, balancerPoolCreationHelper, true],
      });
    } catch (error) {
      setErrorMessage(
        "Error approving PoolCreationHelper as a Relayer on Vault contract",
      );
    }
  };

  useEffect(() => {
    if (isRelayerApprovalError) {
      setErrorMessage("Error loading relayer approval status");
    }
  }, [isRelayerApprovalError]);

  const formattedOwnerAddress = `${ownerAddress.slice(
    0,
    6,
  )}...${ownerAddress.slice(-4)} (${ownershipType})`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-lg bg-black p-8 text-white sm:w-[500px]">
        <DialogHeader>
          <DialogTitle className="mb-1 text-sm font-semibold text-gray-400">
            {poolType}
          </DialogTitle>
          {isSuccessCreatePoolTx ? (
            <div className="flex flex-row items-center">
              <Image
                src={`${cloudinaryUrl}/DEX/ycllsahokol33hfs8yx6.png`}
                alt="Success Polar Bear"
                width={240}
                height={150}
              />
              {/* FIXME TOKEN ICONS */}
              <h3 className="text-3xl font-bold">{`${poolName} has been successfully created`}</h3>
            </div>
          ) : (
            <h2 className="text-3xl font-bold">{poolName}</h2>
          )}
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Initial Liquidity Section */}
          <section>
            <h3 className="mb-2 text-lg font-medium">Initial Liquidity</h3>
            {tokens.map((token, index) => (
              <div
                key={index}
                className="mb-2 flex items-center justify-between text-gray-300"
              >
                <div className="flex items-center gap-2">
                  <TokenIcon address={token.address} symbol={token.symbol} />
                  <span className="font-semibold">{token.symbol}</span>
                  {poolType === PoolType.Weighted && (
                    <span className="text-sm text-gray-500">
                      {Number(formatUnits(weights[index], 16)).toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-400">{token.amount}</span>
              </div>
            ))}
          </section>

          <hr className="my-4 border-t border-gray-700" />

          {/* Pool Details Section */}
          <section className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-400">Pool Name</span>
              <span className="text-xs font-medium text-white">{poolName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-400">Pool Symbol</span>
              <span className="text-xs font-medium text-white">
                {poolSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-400">Pool Type</span>
              <span className="text-xs font-medium text-white">{poolType}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-400">Swap Fee</span>
              <span className="text-xs font-medium text-white">{swapFee}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-400">Owner Address</span>
              <span className="text-xs font-medium text-white">
                {formattedOwnerAddress}
              </span>
            </div>
            {(poolType === PoolType.ComposableStable ||
              poolType === PoolType.MetaStable) && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">
                  Amplification
                </span>
                <span className="text-xs font-medium text-white">
                  {amplification}
                </span>
              </div>
            )}
            {/* TODO (#): we will want to display rate providers here */}
          </section>

          {/* NOTE: we display pool creation tx errors in this dialog, and not in the background page. */}
          {(createPoolErrorMessage || errorMessage) && (
            <Alert
              variant="destructive"
              className="my-4 text-destructive-foreground"
            >
              <AlertTitle>Error</AlertTitle>
              {createPoolErrorMessage && (
                <AlertDescription>{createPoolErrorMessage}</AlertDescription>
              )}
              {errorMessage && (
                <AlertDescription>{errorMessage}</AlertDescription>
              )}
            </Alert>
          )}

          {/* Conditional Approve and Create Pool Buttons */}
          {!isSuccessCreatePoolTx ? (
            <>
              {!isRelayerApproved ? (
                <ActionButton>
                  <Button
                    disabled={
                      isRelayerApprovalLoading ||
                      isLoadingRelayerStatus ||
                      isRelayerApprovalSubmitting
                    }
                    onClick={handleRelayerApproval}
                    className="mt-4 w-full"
                  >
                    Approve Pool Creation Helper
                    {(isRelayerApprovalLoading ||
                      isRelayerApprovalSubmitting) &&
                      "..."}
                  </Button>
                </ActionButton>
              ) : tokensNeedApproval.length > 0 ? (
                (() => {
                  const approvalTokenIndex = tokens.findIndex(
                    (t) => t.address === tokensNeedApproval[0]?.address,
                  );
                  const approvalToken = tokens[approvalTokenIndex];
                  const approvalAmount = parseUnits(
                    approvalToken.amount,
                    approvalToken?.decimals ?? 18,
                  );

                  return (
                    <ActionButton>
                      <ApproveButton
                        amount={approvalAmount}
                        disabled={approvalAmount === BigInt(0)}
                        token={approvalToken}
                        spender={balancerVaultAddress}
                        onApproval={() => refreshAllowances()}
                      />
                    </ActionButton>
                  );
                })()
              ) : (
                <ActionButton>
                  <Button
                    onClick={writeCreatePool}
                    disabled={isLoadingCreatePoolTx || isSubmittingCreatePoolTx}
                    className="mt-6 w-full bg-white py-3 font-semibold text-black"
                  >
                    {isLoadingCreatePoolTx || isSubmittingCreatePoolTx
                      ? "Creating Pool..."
                      : "Create Pool"}
                  </Button>
                </ActionButton>
              )}
            </>
          ) : (
            <div className="flex flex-row gap-4">
              {/* <Button
                variant="info"
                onClick={() => {
                  router.push("/pools");
                  // FIXME this is actually somewhat hard - we have to ingest and process the on-chain event from the tx.
                }}
              >
                View Pool
              </Button> */}
              <Button
                variant="ghost"
                onClick={() => {
                  router.push("/pools");
                }}
              >
                Back to all Pools
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
