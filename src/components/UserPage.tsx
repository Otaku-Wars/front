import React, { useState } from 'react';
import { User, Balance, Stake, Attribute, Character } from '@memeclashtv/types'
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Copy, LogOut, Wallet, TrendingUp, Lock, ArrowUpRight, ArrowDownLeft, Users, Swords } from "lucide-react";
import { useCharacters, useUser } from '../hooks/api'
import { useAddress, useBalance, useWithdraw } from '../hooks/user';
import { useParams } from 'react-router-dom';
import { truncateWallet } from './NavBar';
import { convertEthToUsd } from './CharacterList';
import { useFundWallet, useLogout } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';
import { currentChain } from '../main';

const attributeNames = {
  [Attribute.health]: "Health",
  [Attribute.power]: "Power",
  [Attribute.attack]: "Attack",
  [Attribute.defense]: "Defense",
  [Attribute.speed]: "Speed",
};

export const UserPage = () => {
    const { fundWallet } = useFundWallet()
    const { logout } = useLogout();
    const chainId = useChainId();
    const { address } = useParams();
    const yourAddress = useAddress()
    const isYourAccount = yourAddress?.toLowerCase() == address?.toLowerCase();
    const { balance: userBalance} = useBalance(address as `0x${string}`);
    const {data:user} = useUser(address); // Fetch user data using the useUser hook
    const { data: characters } = useCharacters();
    const { withdraw, isError: withdrawError, isPending: withdrawPending, isSuccess: withdrawSuccess, error: withDrawErrorMessage} = useWithdraw();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAddress, setWithdrawAddress] = useState(''); // State for withdraw address
    const [withdrawAmount, setWithdrawAmount] = useState(''); // State for withdraw amount
    const netWorth = user?.balances?.reduce((acc, curr) => {
        const character = characters?.find(c => c.id === curr?.character);
        return acc + (character ? character?.price * curr?.balance : 0);
    }, 0);

  const charactersOwnedCount = user?.balances?.length;
  const totalStakesCount = user?.stakes?.reduce((acc, curr) => acc + curr.balance, 0);

  // Function to calculate time until unlock
  const getTimeUntilUnlock = () => {
    const currentTime = Date.now() / 1000; // Current time in seconds
    const timeRemaining = user?.stakeUnlockTime - currentTime; // Time remaining in seconds

    if (timeRemaining <= 0) return "Stake is unlocked";

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = Math.floor(timeRemaining % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(user?.address);
  };

  const handleLogout = () => {
    console.log("Logout clicked");
    logout();
  };

  const handleWithdraw = async () => {
    try {
      await withdraw(withdrawAddress as any, withdrawAmount as any); // Call the withdraw function
      console.log("Withdrawal successful");
      setWithdrawAddress('');
      setWithdrawAmount('');
      setShowWithdrawModal(false); // Close the withdraw modal after success
    } catch (error) {
      console.error("Withdrawal failed", error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">@Profile name</CardTitle>
            <CardDescription>{truncateWallet(user?.address)}</CardDescription>
          </div>
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder.svg" alt="Profile" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleCopyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </Button>
              {isYourAccount && <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>}
            </div>
            <div className="grid grid-cols-2 gap-4">
            
                  <Button 
                    onClick={()=> {fundWallet(address, {chain: currentChain})}}
                    className="w-full"
                    >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                
              <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="withdrawAddress" className="text-right">
                        Address
                      </label>
                      <Input
                        id="withdrawAddress"
                        type="text"
                        placeholder="Enter address to withdraw"
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="withdrawAmount" className="text-right">
                        Amount
                      </label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        placeholder="Enter amount to withdraw"
                        value={withdrawAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string or valid number
                          if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                            setWithdrawAmount(value);
                          }
                        }}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  {withdrawPending && <div className="text-yellow-500">Processing withdrawal...</div>}
                  {withdrawError && <div className="text-red-500">Error: {withDrawErrorMessage?.message}</div>}
                  {withdrawSuccess && <div className="text-green-500">Withdrawal successful!</div>}
                  <Button onClick={handleWithdraw} disabled={withdrawPending}>Confirm Withdrawal</Button> {/* Call handleWithdraw on click */}
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Wallet className="inline mr-2 h-4 w-4" />
                    Cash Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${convertEthToUsd(parseFloat(userBalance))}</div>
                  <div className="text-xs text-muted-foreground">{userBalance} ETH</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <TrendingUp className="inline mr-2 h-4 w-4" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${convertEthToUsd(netWorth)}</div>
                  <div className="text-xs text-muted-foreground">{netWorth?.toFixed(2)} ETH</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Users className="inline mr-2 h-4 w-4" />
                    Characters Owned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{charactersOwnedCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Swords className="inline mr-2 h-4 w-4" />
                    Total Stakes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStakesCount}</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  <Lock className="inline mr-2 h-4 w-4" />
                  Stake Unlock Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {new Date(user?.stakeUnlockTime * 1000).toLocaleString()}
                </div>
                <div className="text-md font-medium">
                  Time until unlock: {getTimeUntilUnlock()}
                </div>
                {/* <Progress value={50} className="mt-2" /> */}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="holdings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="stakes">Stakes</TabsTrigger>
        </TabsList>
        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.balances?.map((balance: Balance, index: number) => {
                const character = characters?.find(c => c.id === balance.character);
                const value = character ? character.price * balance.balance : 0;
                return (
                  <div key={balance.character} className="flex items-center justify-between mb-4 p-2 rounded hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarImage src={character?.pfp} alt={character?.name} />
                        <AvatarFallback>{character?.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{character?.name}</div>
                        <div className="text-sm text-muted-foreground">{balance.balance.toLocaleString()} Shares</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${convertEthToUsd(value)}</div>
                      <div className="text-sm text-muted-foreground">{value.toFixed(2)} ETH</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stakes">
          <Card>
            <CardHeader>
              <CardTitle>Your Stakes</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.stakes?.map((stake: Stake, index: number) => {
                const character = characters?.find(c => c.id === stake.character);
                return (
                  <div key={index} className="flex items-center justify-between mb-4 p-2 rounded hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarImage src={character?.pfp} alt={character?.name} />
                        <AvatarFallback>{character?.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{character?.name}</div>
                        <div className="text-sm text-muted-foreground">{attributeNames[stake.attribute]}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{stake.balance} shares</div>
                      <div className="text-sm text-muted-foreground">Staked</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
