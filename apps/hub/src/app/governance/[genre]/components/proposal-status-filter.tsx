import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bera/ui/dropdown-menu";
import { Icons } from "@bera/ui/icons";

import { ProposalStatus } from "@bera/graphql/governance";

export const ProposalStatusFilter = ({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: ProposalStatus[];
  setStatusFilter: (
    value: ProposalStatus[] | ((prev: ProposalStatus[]) => ProposalStatus[]),
  ) => void;
}) => {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex w-fit cursor-pointer items-center rounded-full border border-border text-sm hover:bg-muted">
            <div className="flex h-10 w-32 items-center border-r px-3 text-ellipsis max-w-full overflow-hidden font-medium whitespace-nowrap capitalize">
              {statusFilter.length
                ? statusFilter
                    .map((status) => status.toLowerCase().replaceAll("_", " "))
                    .join(", ")
                : "Filter by Status"}
            </div>
            <Icons.chevronDown className="ml-1 mr-2 h-4 w-4 text-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 border border-border">
          <DropdownMenuLabel>Proposal Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.values(ProposalStatus).map((status) => (
            <DropdownMenuCheckboxItem
              className="capitalize"
              key={status}
              checked={statusFilter.includes(status)}
              onCheckedChange={(checked) =>
                setStatusFilter((prev) =>
                  checked
                    ? (Array.from(
                        new Set([...prev, status]),
                      ) as ProposalStatus[])
                    : (prev.filter((s) => s !== status) as ProposalStatus[]),
                )
              }
            >
              {status.replaceAll("_", " ").toLowerCase()}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
