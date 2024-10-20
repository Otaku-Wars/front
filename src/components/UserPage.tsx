import React, { useMemo, useState } from 'react';
import { User, Balance, Stake, Attribute, Character } from '@memeclashtv/types'
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Copy, LogOut, Wallet, TrendingUp, WalletIcon, Lock, ArrowUpRight, ArrowDownLeft, Users, Swords, ArrowUpIcon, ArrowDownIcon, ChartPie } from "lucide-react";
import { useCharacters, useUser, useAllCharacterPerformance, useValueSpent, calculatePnL, usePortfolio } from '../hooks/api'
import { useAddress, useBalance, useWithdraw } from '../hooks/user';
import { useParams, Link } from 'react-router-dom';
import { truncateWallet } from './NavBar';
import { useFundWallet, useLogout, useWallets } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';
import { currentChain } from '../main';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { useTimeTill } from './WorldStateView';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { formatEther, formatNumber, formatPercentage } from '../lib/utils';
import { useGetSellPrices, useGetSellPricesWithoutFee } from '../hooks/contract';
import { formatEther as viemFormatEther } from 'viem';
import { buildDataUrl } from './ActivityBar';
import { FaMoneyBill } from 'react-icons/fa';

const attributeNames = {
  [Attribute.health]: "Health",
  [Attribute.power]: "Power",
  [Attribute.attack]: "Attack",
  [Attribute.defense]: "Defense",
};

export const generateAffiliateLink = (address: string) => {
  return `${window.location.host}/#/?ref=${address}`
}

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
    const pfp = (user as any)?.pfp ?? buildDataUrl(user?.address);  
    const username = (user as any)?.username;
    const convertEthToUsd = useConvertEthToUsd();
    console.log("user", user)
    
    const { setActiveWallet } = useSetActiveWallet();
    //set active account
  const { wallets } = useWallets();
  

  const charactersOwnedCount = user?.balances?.length ?? 0
  const totalStakesCount = user?.stakes?.reduce((acc, curr) => acc + curr.balance, 0) ?? 0

  const timeTill = useTimeTill(user?.stakeUnlockTime ?? 0)
  // Function to calculate time until unlock
  const getTimeUntilUnlock = (timeRemaining: number) => {
    if (timeRemaining <= 0) return "Stake is unlocked";

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = Math.floor(timeRemaining % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(user?.address ?? address);
    alert(`Copied ${user?.address ?? address} to clipboard`);
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
  const displayName = username ?? truncateWallet(user?.address ?? address) ?? address;

  const yesterday = useMemo(() => new Date().getTime() / 1000 - 24 * 60 * 60, []);
  const characterIds = user?.balances?.map(balance => balance.character) || [];
  const balanceAmounts = user?.balances?.map(balance => balance.balance) || [];
  console.log("balanceAmounts", balanceAmounts)
  const {data: sellPrices} = useGetSellPricesWithoutFee(characterIds.map((characterId, index) => ({characterId, amount: balanceAmounts[index]})));
  //const performanceData = useAllCharacterPerformance(characterIds, yesterday);
  //console.log("AAvalueSpents", valueSpents)
  const netWorth = useMemo(() => {
    return sellPrices?.reduce((acc, price) => {
      const value = viemFormatEther(price?.result ?? 0 as any);
      console.log("AAvalueSpent:adding", value)
      return acc + Number(value);
    }, 0) ?? 0;
  }, [sellPrices]);
  console.log("AAvalueSpents netWorth", netWorth)

  const totalSpent = user?.pnl?.costBasis ?? 0;
  const totalFees = user?.pnl?.fees ?? 0;
  const referrals = user?.referralCount ?? 0;
  const rewards = user?.rewards ?? 0;

  console.log("AAvalueSpents totalSpent", totalSpent)

  //calculate total pnl
  const {totalPnl, totalPercentageChange} = useMemo(() => {
    let totalPnl = 0;
    let totalPercentageChange = 0;
    if (netWorth && totalSpent) {
      const {absoluteChange, percentageChange} = calculatePnL(totalSpent, netWorth);
      totalPnl = absoluteChange;
      totalPercentageChange = percentageChange;
    }
    return {totalPnl, totalPercentageChange};
  }, [netWorth, totalSpent]);

  console.log("Net Worth", netWorth)

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8 bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">@{displayName}</CardTitle>
            <CardDescription>{truncateWallet(user?.address ?? address)}</CardDescription>
          </div>
          <Avatar className="h-20 w-20">
            <AvatarImage src={pfp ??"/placeholder.svg"} alt="Profile" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Button className='bg-gray-800 border-gray-700' variant="outline" size="sm" onClick={handleCopyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </Button>
              {isYourAccount && <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>}
            </div>
            {isYourAccount && <div className="grid grid-cols-2 gap-4">
            
                  <Button 
                    style={{
                      textShadow: `
                        2px 2px 0 #000000, 
                        2px 2px 0 #000000, 
                        2px 2px 0 #000000, 
                        2px 2px 0 #000000, 
                        2px 2px 0 #000000
                      `,
                      //bright blue
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      opacity: '0.8',
                    }}  
                    className="breathing w-full bg-yellow-600 text-black text-lg font-bold hover:bg-yellow-700 transition-all duration-300 text-xs sm:text-sm md:text-base relative overflow-hidden group py-10 text-white"
                    onClick={async () => {
                      await fundWallet(address, {chain: currentChain})
                    }}
                  >
                    <WalletIcon color='black' className="mr-2 h-4 w-4" />
                    DEPOSIT
                  </Button>
                
              <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                <DialogTrigger asChild>
                  <Button 
                    style={{
                      textShadow: `
                        2px 2px 0 #000000, 
                        2px 2px 0 #000000, 
                        2px 2px 0 #000000, 
                        2px 2px 0 #000000, 
                        2px 2px 0 #000000
                      `,
                      //gray
                      backgroundColor: '#374151',
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      opacity: '0.8',
                    }}  
                    className="text-4xl flex-1  bg-blue-600 text-white text-2xl font-bold transition-all duration-300 relative overflow-hidden group py-10"
                    >
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-6 items-center gap-4">
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
            </div>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <Wallet className="w-8 h-8 text-yellow-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Wallet Balance</span>
                <span className="block text-2xl font-bold text-white">{formatNumber(convertEthToUsd(parseFloat(userBalance ?? "0")) ?? 0)}</span>
                <span className="text-xs text-muted-foreground">{formatEther(parseFloat(userBalance ?? "0"))} ETH</span>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <TrendingUp className="w-8 h-8 text-blue-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Portfolio Value</span>
                <span className="block text-2xl font-bold text-white">{formatNumber(convertEthToUsd(netWorth ?? 0))}</span>
                <span className="text-xs text-muted-foreground">{formatEther(netWorth ?? 0)} ETH</span>
                <div className={`inline-flex items-center px-3 py-1 rounded-full ${totalPnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {totalPnl >= 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
                  <span className="text-sm font-medium">
                    {formatNumber(convertEthToUsd(totalPnl ?? 0))} ({formatPercentage(totalPercentageChange ?? 0)})
                  </span>
                </div>
                {/* <span className={`inline-block px-2 py-1 mt-2 text-xs font-semibold rounded-full ${totalPnl >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {totalPnl >= 0 ? 'Profit' : 'Loss'}
                </span> */}
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <Users className="w-8 h-8 text-green-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Characters Owned</span>
                <span className="block text-2xl font-bold text-white">{charactersOwnedCount}</span>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <Swords className="w-8 h-8 text-red-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Total Stakes</span>
                <span className="block text-2xl font-bold text-white">{totalStakesCount}</span>
              </div>
              
            </div>
            {/* Affiliate section */}
            <h1 className="text-2xl mt-10 font-bold">Rewards sharing <span className="text-sm text-gray-400">(Earn 50% of trading fees)</span></h1>
            <div className="grid grid-cols-4 gap-4 w-full">
              <Button 
                style={{
                  textShadow: `
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000
                  `,
                  //bright blue
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  opacity: '0.8',
                }}  
                className="bg-yellow-600 col-span-3 text-black text-lg font-bold hover:bg-yellow-700 transition-all duration-300 text-xs sm:text-sm md:text-base relative overflow-hidden group py-10 text-white h-full"
                variant="outline" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(generateAffiliateLink(address as string));
                  alert(`Copied ${generateAffiliateLink(address as string)} to clipboard`);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Affiliate Link
              </Button>
              <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <span className="text-xl text-gray-400">Copy your link and share it with friends to earn 50% of their Trading fees!</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="col-span-1 bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <Users className="w-8 h-8 text-green-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Total Referrals</span>
                <span className="block text-2xl font-bold text-white">{referrals}</span>
            </div>
              <div className="col-span-3 bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <FaMoneyBill className="w-8 h-8 text-green-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Fees earned</span>
                <span className="block text-2xl font-bold text-white">{formatNumber(convertEthToUsd(rewards ?? 0))}</span>
              </div>
              {/* <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <Users className="w-8 h-8 text-green-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Fees Paid</span>
                <span className="block text-2xl font-bold text-white">{formatNumber(convertEthToUsd(totalFees ?? 0))}</span>
              </div> */}
            </div>

            {/* Stake unlock time */}
            <h1 className="text-2xl mt-10 font-bold">Staking <span className="text-sm text-gray-400">(coming soon)</span></h1>
            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
              <Lock className="w-8 h-8 text-purple-400 mb-2 mx-auto" />
              <span className="text-xl text-gray-400">Stake Unlock Time</span>
              <span className="block text-lg font-semibold text-white">{ user?.stakeUnlockTime ? new Date(user?.stakeUnlockTime * 1000).toLocaleString() : "No Stake"}</span>
              {user?.stakeUnlockTime && <span className="text-md font-medium text-gray-400">Time until unlock: {getTimeUntilUnlock(timeTill)}</span>}
              {!user?.stakeUnlockTime && <span className="text-md font-medium text-gray-400">Stake is not active</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="holdings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="stakes">Stakes</TabsTrigger>
        </TabsList>
        <TabsContent value="holdings">
          <Card className="bg-gray-900">
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.balances?.map((balance: Balance, index: number) => {
                const character = characters?.find(c => c.id === balance.character);
                const trueValue = sellPrices ? sellPrices[index]?.result : 0;
                const value = viemFormatEther(trueValue as any ?? 0);
                const valueSpent = balance?.pnl?.costBasis ?? 0;

                //const performance = performanceData?.find(p => p.characterId === character?.id);
                const {percentageChange, absoluteChange} = calculatePnL(Number(valueSpent), Number(value));
                const isPositive = percentageChange >= 0;

                return (
                  <Link to={`/character/${character?.id}`} key={balance.character} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 mb-4 border border-gray-700 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-4 ring-offset-gray-800">
                        <AvatarImage src={character?.pfp} alt={character?.name} />
                        <AvatarFallback>{character?.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-xl mb-1">{character?.name}</h3>
                        <p className="text-sm text-gray-400">{balance.balance.toLocaleString()} Shares</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right mt-4 sm:mt-0 w-full sm:w-auto">
                      <p className="font-bold text-2xl mb-1">{formatNumber(convertEthToUsd(Number(value)))}</p>
                      <p className="text-sm text-gray-400 mb-2">{formatEther(Number(value))} ETH</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isPositive ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
                        <span className="text-sm font-medium">
                          {formatNumber(convertEthToUsd(absoluteChange))} ({formatPercentage(percentageChange)})
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stakes">
          <Card className="bg-gray-900">
            <CardHeader>
              <CardTitle>Your Stakes</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.stakes?.map((stake: Stake, index: number) => {
                const character = characters?.find(c => c.id === stake.character);
                return (
                  <Link to={`/character/${character?.id}`} key={index} className="flex items-center justify-between mb-4 p-2 rounded hover:bg-accent cursor-pointer transition-colors">
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
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}