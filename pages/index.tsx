import {
  useAddress,
  useNetwork,
  ConnectWallet,
  useMetadata,
  Web3Button,
  useContract,
  useNFTBalance,
  MediaRenderer,
  ChainId,
} from "@thirdweb-dev/react";
import { useState, useEffect, useMemo } from "react";
import { AddressZero } from "@ethersproject/constants";
import {
  Button,
  Text,
  Card,
  Container,
  Flex,
  FormLabel,
  Heading,
  Input,
  Radio,
  Table,
  TableCaption,
  TableContainer,
  SimpleGrid,
  GridItem,
  Switch,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { BigNumber } from "ethers";
import CreateProposal from "../components/CreateProposal";

interface Vote {
  type: number;
  label: string;
}

interface Proposal {
  proposalId: any;
  description: string;
  votes: Vote[];
}

const App = () => {
  // Use the hooks thirdweb give us.
  const address = useAddress();
  //console.log("👋 Address:", address);

  // Initialize our Edition Drop contract
  const editionDropAddress = "0x7f2BfBf0E6904b5B6Facec197C64b8eB4b1aBeC1";
  const { contract: editionDrop } = useContract(
    editionDropAddress,
    "edition-drop"
  );
  const { contract: vote } = useContract(
    "0x299E2B4129eA5Ca4b3a572086A86C015D726C0EC",
    "vote"
  );
  if (vote === undefined) {
    console.log("vote is undefined");
  }

  const { contract: token } = useContract(
    "0x3Aa1FebD87D6Cf9bAB16475f943b39DbFbf18f33",
    "token"
  );

  // Hook to check if the user has our NFT
  const { data: nftBalance } = useNFTBalance(editionDrop, address, "0");
  const { data: metadata, isLoading: isLoadingMetadata } =
    useMetadata(editionDrop);

  const hasClaimedNFT = useMemo(() => {
    return nftBalance && nftBalance.gt(0);
  }, [nftBalance]);

  //array of addresses
  const [memberAddresses, setMemberAddresses] = useState<string[]>([]);

  //function to shorten someones wallet address
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const [selectedVotes, setSelectedVotes] = useState<{
    [proposalId: string]: number;
  }>({});
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedProposals, setVotedProposals] = useState<string[]>([]);

  // Retrieve all our existing proposals from the contract.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // A simple call to vote.getAll() to grab the proposals.
    const getAllProposals = async () => {
      try {
        if (vote?.getAll) {
          const proposals = await vote.getAll();
          setProposals(proposals);
          console.log("🌈 Proposals:", proposals);
        } else {
          console.log("getAll method is not available on vote contract");
        }
      } catch (error) {
        console.log("failed to get proposals", error);
      }
    };
    getAllProposals();
  }, [hasClaimedNFT, vote]);

  // We also need to check if the user already voted.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // If we haven't finished retrieving the proposals from the useEffect above
    // then we can't check if the user voted yet!
    if (!proposals.length) {
      return;
    }

    const checkIfUserHasVoted = async () => {
      try {
        if (vote?.hasVoted) {
          const hasVoted = await vote.hasVoted(
            proposals[0].proposalId,
            address
          );
          setHasVoted(hasVoted);
          if (hasVoted) {
            console.log("🥵 User has already voted");
          } else {
            console.log("🙂 User has not voted yet");
          }
        } else {
          console.log("hasVoted method is not available on vote contract");
        }
      } catch (error) {
        console.error("Failed to check if wallet has voted", error);
      }
    };

    checkIfUserHasVoted();
  }, [hasClaimedNFT, proposals, address, vote]);

  //function to get all the members of the DAO
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    const getMembers = async () => {
      try {
        if (editionDrop?.history?.getAllClaimerAddresses) {
          const memberAddress =
            await editionDrop.history.getAllClaimerAddresses(0);
          if (memberAddress) {
            setMemberAddresses(memberAddress);
            console.log("Members:", memberAddress);
          }
        } else {
          console.log(
            "getAllClaimerAddresses method is not available on editionDrop contract"
          );
        }
      } catch (error) {
        console.error("Failed to get members", error);
      }
    };
    getMembers();
  }, [hasClaimedNFT, editionDrop?.history]);

  const memberList = useMemo(() => {
    return memberAddresses.map((address) => {
      return {
        address,
        tokenAmount: 1,
      };
    });
  }, [memberAddresses]);
  {
    /*
  // This is the case where the user is connected to the wrong network
  const { data: network } = useNetwork();
  {
    if (address && network?.[0].data.chain.id !== ChainId.Mumbai) {
    return (
      <Container className="unsupported-network">
        <Heading fontSize={20}>Please connect to Mumbai</Heading>
        <Text>
          This dapp only works on the Mumbai network, please switch networks in
          your connected wallet.
        </Text>
      </Container>
    );
    }
  } */
  }

  // This is the case where the user hasn't connected their wallet
  // to your web app. Let them call connectWallet.
  if (!address) {
    return (
      <Container className="landing">
        <Heading>Welcome to NeulandDAO</Heading>
        <div className="btn-hero">
          <ConnectWallet />
        </div>
      </Container>
    );
  }
  // Render the screen where the user can claim their NFT.
  // If the user has already claimed their NFT we want to display the internal DAO page to them
  // only DAO members will see this. Render all the members + token amounts.
  if (hasClaimedNFT) {
    return (
      <Container padding={16} maxWidth={1240} className="member-page">
        <Center>
          <Heading>DAO Dashboard</Heading>
        </Center>
        <Center paddingBottom={8}>
          <Text>Congratulations on being a member!</Text>
        </Center>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <Card borderRadius={20} padding={6}>
            <Heading fontSize={20}>Member List</Heading>
            <Table className="card">
              <TableCaption>
                <tr>
                  <th>Address</th>
                  <th>Token Amount</th>
                </tr>
              </TableCaption>
              <TableCaption>
                {memberList.map((member) => {
                  return (
                    <tr key={member.address}>
                      <td>{shortenAddress(member.address)}</td>
                      <td>{member.tokenAmount}</td>
                    </tr>
                  );
                })}
              </TableCaption>
            </Table>
          </Card>
          <GridItem gap={4}>
            <Heading fontSize={20}>Active Proposals</Heading>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                //before we do async things, we want to disable the button to prevent double clicks
                setIsVoting(true);

                if (!(token?.getDelegationOf && token?.delegateTo)) {
                  console.log(
                    "getDelegationOf or delegateTo method is not available on token contract"
                  );
                  setIsVoting(false);
                  return;
                }

                if (
                  !(
                    typeof vote?.get === "function" &&
                    typeof vote?.vote === "function" &&
                    typeof vote?.execute === "function"
                  )
                ) {
                  console.log(
                    "get, vote or execute method is not available on vote contract"
                  );
                  setIsVoting(false);
                  return;
                }

                // lets get the votes from the form for the values
                const votes = proposals.map((proposal: any) => {
                  const voteResult = {
                    proposalId: proposal.proposalId,
                    //abstain by default
                    vote: 2,
                  };
                  proposal.votes.forEach((vote: any) => {
                    const elem = document.getElementById(
                      proposal.proposalId + "-" + vote.type
                    ) as HTMLInputElement;

                    if (elem && elem.checked) {
                      voteResult.vote = vote.type;
                      return;
                    }
                  });
                  return voteResult;
                });

                // first we need to make sure the user delegates their token to vote
                try {
                  //we'll check if the wallet still needs to delegate their tokens before they can vote
                  const delegation = await token.getDelegationOf(address);
                  // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                  if (delegation === AddressZero) {
                    //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                    await token.delegateTo(address);
                  }
                  // then we need to vote on the proposals
                  try {
                    await Promise.all(
                      votes.map(async ({ proposalId, vote: _vote }) => {
                        // before voting we first need to check whether the proposal is open for voting
                        // we first need to get the latest state of the proposal
                        const proposal = await vote.get(proposalId);
                        // then we check if the proposal is open for voting (state === 1 means it is open)
                        if (proposal.state === 1) {
                          // if it is open for voting, we'll vote on it
                          return vote.vote(proposalId, _vote);
                        }

                        // after successful vote execution
                        setVotedProposals((prevProposals) => [
                          ...prevProposals,
                          proposalId,
                        ]);

                        // if the proposal is not open for voting we just return nothing, letting us continue
                        return;
                      })
                    );
                    try {
                      // if any of the propsals are ready to be executed we'll need to execute them
                      // a proposal is ready to be executed if it is in state 4
                      await Promise.all(
                        votes.map(async ({ proposalId }) => {
                          // we'll first get the latest state of the proposal again, since we may have just voted before
                          const proposal = await vote.get(proposalId);

                          //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                          if (proposal.state === 4) {
                            return vote.execute(proposalId);
                          }
                        })
                      );
                      // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                      setHasVoted(true);
                      // and log out a success message
                      console.log("successfully voted");
                    } catch (err) {
                      console.error("failed to execute votes", err);
                    }
                  } catch (err) {
                    console.error("failed to vote", err);
                  }
                } catch (err) {
                  console.error("failed to delegate tokens", err);
                } finally {
                  // in *either* case we need to set the isVoting state to false to enable the button again
                  setIsVoting(false);
                }
              }}
            >
              {proposals.map((proposal: any) => (
                <Card
                  padding={6}
                  borderRadius={20}
                  key={proposal.proposalId}
                  className="card"
                  style={
                    votedProposals.includes(proposal.proposalId)
                      ? { opacity: 0.5 }
                      : {}
                  }
                >
                  <Heading fontSize={16}>{proposal.description}</Heading>
                  <div>
                    {proposal.votes.map(({ type, label }: any) => (
                      <Flex key={type}>
                        <Radio
                          type="radio"
                          id={proposal.proposalId + "-" + type}
                          name={proposal.proposalId}
                          value={type}
                          defaultChecked={type === 2}
                          disabled={votedProposals.includes(
                            proposal.proposalId
                          )}
                        />
                        <FormLabel htmlFor={proposal.proposalId + "-" + type}>
                          {label}
                        </FormLabel>
                      </Flex>
                    ))}
                  </div>
                </Card>
              ))}

              <Button disabled={isVoting || hasVoted} type="submit">
                {isVoting ? (
                  <Spinner />
                ) : hasVoted ? (
                  "You Already Voted"
                ) : (
                  "Submit Votes"
                )}
              </Button>

              {!hasVoted && (
                <small>
                  This will trigger multiple transactions that you will need to
                  sign.
                </small>
              )}
            </form>
            <CreateProposal />
          </GridItem>
        </SimpleGrid>
      </Container>
    );
  }
  // Render mint nft screen.
  return (
    <Container className="mint-nft">
      <Heading>Mint your free 🍪DAO Membership NFT</Heading>
      <MediaRenderer src={(metadata as { image: string })?.image} />
      <p>
        balance: {nftBalance?.toString()} <br />
      </p>
      <br />
      <div className="btn-hero">
        <Web3Button
          contractAddress={editionDropAddress}
          action={(contract) => {
            contract?.erc1155.claim(0, 1);
          }}
          onSuccess={() => {
            console.log(
              `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${editionDrop?.getAddress()}/0`
            );
          }}
          onError={(error) => {
            console.error("Failed to mint NFT", error);
          }}
        >
          Mint your NFT (FREE)
        </Web3Button>
      </div>
    </Container>
  );
};

export default App;
