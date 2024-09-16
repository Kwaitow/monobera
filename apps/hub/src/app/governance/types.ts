import { Address } from "viem";

export enum StatusEnum {
  PENDING = "pending",
  QUEUED = "queued",
  ACTIVE = "active",
  CANCELED = "canceled",
  SUCCEEDED = "succeeded",
  DEFEATED = "defeated",
  EXPIRED = "expired",
  EXECUTED = "executed",
}

export enum OrderByEnum {
  MOST_RECENT = "most-recent",
  OLDEST = "oldest",
  NEWEST = "newest",
  HIGHEST_PARTICIPATION = "highest-participation",
  LOWEST_PARTICIPATION = "lowest-participation",
}

export type ProposalVotes = {
  yes: number;
  no: number;
  abstain: number;
};

export const VoteColorMap = {
  yes: "#059669",
  1: "#059669",
  no: "#DC2629",
  2: "#DC2629",
  veto: "#0284C7",
  4: "#0284C7",
  abstain: "#78716c",
  3: "#78716c",
  yes_secondary: "#ECFDF5",
  no_secondary: "#FEF2F2",
  veto_secondary: "#F0F9FF",
  abstain_secondary: "#E7E5E4",
  default: "#57534e",
};

export enum VoteEnum {
  for = "yes",
  against = "no",
  abstain = "abstain",
}

export const voteTypes: VOTE_TYPE[] = ["yes", "no", "abstain"];

export type VOTE_TYPE = "yes" | "no" | "abstain";

export type ALL = "all";

export type CustomProposalErrors = {
  title?: false | string;
  description?: false | string;
  forumLink?: false | string;
};

export enum ProposalTypeEnum {
  CUSTOM_PROPOSAL = "custom-proposal",
  UPDATE_REWARDS_GAUGE = "update-rewards-gauge",
}

export type CustomProposal = {
  title: string;
  description: any;
  actions: PropoalAction[];
  forumLink: string;
};

export type PropoalAction = {
  type: ProposalTypeEnum;
  target: Address;
  ABI: JSON;
  functionName: string;
  calldata: { params: string; type: string; value: any }[];
};
