import React, { useMemo } from 'react';
import { User } from '@memeclashtv/types';
import { HolderListItem } from './HolderListItem';
import { useCharacterHolders, useUsers } from '../hooks/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { truncateWallet } from './NavBar';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface HolderListProps {
  characterId: number
  characterSupply: number
  characterMarketCap: number
}

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 10,
  }).format(num)
}

export const HolderList: React.FC<HolderListProps> = ({ characterId, characterSupply, characterMarketCap }) => {
  const { data: holders, isLoading, isError } = useCharacterHolders(characterId);
  const { data: users } = useUsers(); // Fetch users
  const navigate = useNavigate(); // Initialize useNavigate

  const sortedHolders = useMemo(() => {
    return holders
      ?.map(user => {
        const balance = user.balances.find(b => b.character === characterId)?.balance || 0
        const value = (balance / characterSupply) * characterMarketCap
        return { ...user, balance, value }
      })
      .sort((a, b) => b.balance - a.balance)
  }, [holders, characterId, characterSupply, characterMarketCap])

  if (isLoading) {
    return <div className="holder-list-loading">Loading holders...</div>;
  }

  if (isError) {
    return <div className="holder-list-error">Error loading holders. Please try again later.</div>;
  }

  if (!holders || holders.length === 0) {
    return <div className="holder-list-empty">No holders found for this character.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>User</TableHead>
          <TableHead className="text-right">Holdings</TableHead>
          <TableHead className="text-right">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedHolders.map((holder, index) => {
          const user = users?.find(user => user?.address?.toLowerCase() == holder?.address?.toLowerCase())
          const displayName = (user as any)?.username ?? truncateWallet(user?.address);
          const pfp = (user as any)?.pfp;
          return (
          <TableRow key={holder.address} onClick={() => navigate(`/user/${user?.id}`)}> {/* Added onClick for navigation */}
            <TableCell className="font-medium">#{index + 1}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={pfp ?? `/placeholder.svg?height=40&width=40`} alt={`User ${index + 1}`} />
                  <AvatarFallback>{displayName}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{truncateWallet(holder.address)}</p>
                  <p className="text-sm text-muted-foreground">{formatNumber(holder.value / holder.balance)}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right font-semibold">{holder.balance.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <p className="font-semibold">{formatNumber(holder.value)}</p>
            </TableCell>
          </TableRow>)
        })}
      </TableBody>
    </Table>
  )
}
