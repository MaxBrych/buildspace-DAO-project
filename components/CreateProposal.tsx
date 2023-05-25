import React, { useEffect, useState } from "react";
import {
  Button,
  Textarea,
  Box,
  Input,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useAddress, useContract } from "@thirdweb-dev/react";
import { ethers } from "ethers";

interface MySmartContract extends ethers.Contract {
  getAll: () => Promise<any>;
  propose: (description: string) => Promise<void>;
}

const CreateProposal = () => {
  const address = useAddress();
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalDescription, setProposalDescription] = useState("");

  const { contract: tokenContract, isLoading: isTokenLoading } =
    useContract<any>(process.env.NEXT_PUBLIC_TOKEN_ADDRESS);

  const { contract: voteContract, isLoading: isVoteLoading } = useContract<any>(
    process.env.NEXT_PUBLIC_VOTE_ADDRESS
  );

  const vote = voteContract as any;
  const token = tokenContract as any;

  const getProposals = async () => {
    if (!address || isVoteLoading || !vote) return;
    const data = await vote.getAll();
    setProposals(data);
  };

  const createProposal = async () => {
    if (!vote) return;
    await vote.propose(proposalDescription);
    window.location.reload();
  };

  useEffect(() => {
    getProposals();
  }, [address, isVoteLoading]);

  return (
    <Box borderWidth="1px" borderRadius="lg" padding="6" marginTop="4">
      {address && (
        <>
          <FormControl marginTop="4">
            <FormLabel>Description</FormLabel>
            <Textarea
              placeholder="Proposal Description"
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
            />
          </FormControl>
          <Button
            colorScheme="blue"
            marginTop="4"
            disabled={isVoteLoading}
            isLoading={isVoteLoading}
            onClick={createProposal}
          >
            Create Proposal
          </Button>
        </>
      )}
    </Box>
  );
};

export default CreateProposal;
