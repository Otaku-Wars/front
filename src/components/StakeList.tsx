import React from 'react';
import { StakeListItem } from './StakeListItem';
import { useCharacterStakes } from '../hooks/api';
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { ArrowDownIcon, ArrowUpIcon, HeartIcon, ShieldIcon, SwordIcon, ZapIcon, WindIcon } from "lucide-react"
import { ActivityType } from './ActivityBar';
import { StakeActivity } from '@memeclashtv/types/activity';
interface StakeListProps {
  characterId: number;
  characterImage: string;
}

const formatAddress = (address: string) => {
  if(!address) return "0x"
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 10,
  }).format(num)
}

const timeSince = (date: number) => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const seconds = now - date;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ago`;
};

const attributeIcons = {
  0: <HeartIcon className="h-4 w-4 text-red-500" />,
  1: <ZapIcon className="h-4 w-4 text-yellow-500" />,
  2: <SwordIcon className="h-4 w-4 text-blue-500" />,
  3: <ShieldIcon className="h-4 w-4 text-green-500" />,
  4: <WindIcon className="h-4 w-4 text-purple-500" />,
}

export const StakeList: React.FC<StakeListProps> = ({ characterId, characterImage }) => {
  const { data: stakes, isLoading, isError } = useCharacterStakes(characterId);

  if (isLoading) return <div className="stake-list-loading">Loading stakes...</div>;
  if (isError) return <div className="stake-list-error">Error loading stakes. Please try again.</div>;
  if (!stakes || stakes.length === 0) return <div className="stake-list-empty">No stakes found.</div>;


  return (
    <div className="w-full bg-regularbackground text-foreground p-4 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Amount Staked</TableHead>
            <TableHead>Stats impact</TableHead>
            <TableHead>Final</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stakes.map((activity, index) => (
            <TableRow key={index}>
              <TableCell className="py-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt={activity.staker} />
                    <AvatarFallback>{activity?.staker}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{formatAddress(activity.staker)}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <span className={activity.amount > 0 ? "text-green-500" : "text-red-500"}>
                  {activity.amount > 0 ? "STAKE" : "UNSTAKE"}
                </span>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center space-x-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={characterImage} alt="Token" />
                    <AvatarFallback>T</AvatarFallback>
                  </Avatar>
                  <span>{formatNumber(Math.abs(activity.amount))} for</span>
                  {attributeIcons[activity.attribute]}
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center">
                  {activity.amount > 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={activity.amount > 0 ? "text-green-500" : "text-red-500"}>
                    {formatNumber(Math.abs(activity.newAttribute - activity.prevAttribute))}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center space-x-1">
                  <span>{formatNumber(activity.newAttribute)}</span>
                  {attributeIcons[activity.attribute]}
                </div>
              </TableCell>
              <TableCell className="py-4 text-muted-foreground">{timeSince(activity.timestamp)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}