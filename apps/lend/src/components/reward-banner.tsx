import Image from "next/image";
import { useBeraJs } from "@bera/berajs";
import { bgtTokenAddress, bgtUrl, cloudinaryUrl } from "@bera/config";
import { TokenIcon } from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import { Icons } from "@bera/ui/icons";

export const Banner = () => {
  const { isReady } = useBeraJs();
  return (
    <div className="relative flex flex-col-reverse items-start gap-4 rounded-18 border border-accent bg-gradient-to-b from-[#FFFCF2] to-[#FFF2D0] px-8 py-6 dark:from-[#27251F] dark:to-[#322400] lg:flex-row lg:gap-16">
      <Image
        src={`${cloudinaryUrl}/bears/lendbear_npxhb3`}
        width={213}
        height={197}
        className="absolute -right-0 hidden w-[213px] lg:bottom-0 lg:block"
        alt="happy bear"
      />
      <div className="flex h-full w-full flex-shrink-0 flex-col gap-4 rounded-xl border border-amber-400 bg-gradient-to-br from-[#FFF6D7] via-[#FFEAA3] to-[#FFD977] p-4 dark:from-[#413E33] dark:to-[#453509] lg:w-fit">
        <div className="flex items-center justify-center gap-2 text-3xl font-semibold leading-9 lg:justify-start">
          <TokenIcon address={bgtTokenAddress} fetch />
          {isReady ? "207.10" : "~~"}
        </div>
        <Button disabled={!isReady}>Claim Rewards</Button>
      </div>

      <div className="flex w-full flex-col gap-4">
        <div className="w-full text-center font-bold md:text-lg md:leading-10 lg:w-fit lg:text-left">
          What can I do with my BGT rewards? (not working)
          <div className="text-xs font-normal leading-normal text-muted-foreground md:text-sm">
            Now that you&apos;ve got some BGT rewards, you can start using them!
          </div>
        </div>
        <div className="flex w-full justify-center gap-4 lg:justify-start">
          <div className="flex items-center gap-1 text-sm font-semibold leading-7 hover:cursor-pointer md:text-lg">
            🐝{" "}
            <span
              className="hover:underline"
              onClick={() => window.open(`${bgtUrl}/delegate`, "_blank")}
            >
              {" "}
              Stake
            </span>
            <Icons.externalLink className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold leading-7 hover:cursor-pointer md:text-lg">
            🔥{" "}
            <span
              className="hover:underline"
              onClick={() => window.open(`${bgtUrl}/redeem`, "_blank")}
            >
              {" "}
              Burn
            </span>{" "}
            <Icons.externalLink className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold leading-7 hover:cursor-pointer md:text-lg">
            🗳️{" "}
            <span
              className="hover:underline"
              onClick={() => window.open(`${bgtUrl}/governance`, "_blank")}
            >
              {" "}
              Vote
            </span>{" "}
            <Icons.externalLink className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};