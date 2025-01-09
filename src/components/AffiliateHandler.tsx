import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useUser } from '../hooks/api'
import { apiUrl } from '../main'

export function AffiliateHandler() {
  const { authenticated, user, getAccessToken } = usePrivy()
  const address = user?.wallet?.address
  const [searchParams, setSearchParams] = useSearchParams()
  const userApi = useUser(address)

  // Set referral in local storage
  useEffect(() => {
    const param = searchParams.get('ref')
    const referral = localStorage.getItem('referral')
    console.log("affiliate existing referral", referral)
    if(param && param !== referral){
      localStorage.setItem('referral', param)
      console.log("affiliate referral", param)
    }
  }, [searchParams])

  const affiliateIsAlreadySet = useMemo(() => {
    if(userApi && !userApi.isError && userApi.data){
      const userFromApi = userApi.data
      return userFromApi.affiliate != null
    }
    return false
  }, [userApi]) 
  
  useEffect(() => {
    const setAffiliate = async () => {
      if(affiliateIsAlreadySet){
        //already set an affiliate for this user
        localStorage.removeItem('referral')
        const params = new URLSearchParams(searchParams)
        params.delete('ref')
        setSearchParams(params)
        console.log("already set an affiliate for this user")
      } else if(address && !affiliateIsAlreadySet && authenticated) {
        console.log("setting affiliate")
        const affiliateAddress = localStorage.getItem('referral') ?? searchParams.get('ref')
        console.log("affiliateAddress", affiliateAddress)
        if(affiliateAddress && affiliateAddress.toLowerCase() !== address.toLowerCase()) {
          try {
            const accessToken = await getAccessToken()
            const response = await fetch(`${apiUrl}/users/${address}/set-affiliate`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ affiliate: affiliateAddress })
            })
            console.log("response affiliate", response)
            if (response.ok) {
              localStorage.removeItem('referral')
              const params = new URLSearchParams(searchParams)
              params.delete('ref')
              setSearchParams(params)
            }
          } catch (error) {
            console.error('Error setting affiliate:', error)
          }
        } else if(affiliateAddress && affiliateAddress.toLowerCase() === address.toLowerCase()) {
          localStorage.removeItem('referral')
          const params = new URLSearchParams(searchParams)
          params.delete('ref')
          setSearchParams(params)
        }
      }
    }
    setAffiliate()
  }, [affiliateIsAlreadySet, authenticated, address, getAccessToken, searchParams, setSearchParams])

  return null // This component doesn't render anything
} 