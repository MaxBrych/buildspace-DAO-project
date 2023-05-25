import { Link } from "@chakra-ui/react";
import { ConnectWallet } from "@thirdweb-dev/react";
import React from "react";

export default function NavBar() {
  return (
    <div>
      <Link href="/create-proposal">Create Proposal</Link>
      <ConnectWallet />
    </div>
  );
}
