'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAccount, useBalance, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'react-toastify'
import { FiArrowDown, FiInfo, FiZap, FiTrendingUp, FiGift } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { STAKE_CONTRACT_ADDRESS, stakeAbi, PID, isValidContractAddress } from '@/lib/contract'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)

  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: isConnected,
      refetchInterval: 10000,
    }
  })

  // Read contract data
  const { data: stakedAmount } = useReadContract({
    address: STAKE_CONTRACT_ADDRESS,
    abi: stakeAbi,
    functionName: 'stakingBalance',
    args: [BigInt(PID), address!],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000,
    }
  })

  const { data: pendingReward } = useReadContract({
    address: STAKE_CONTRACT_ADDRESS,
    abi: stakeAbi,
    functionName: 'pendingMetaNode',
    args: [BigInt(PID), address!],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000,
    }
  })

  // 获取池子信息 - 包含总质押金额
  const { data: poolInfo, error: poolError } = useReadContract({
    address: STAKE_CONTRACT_ADDRESS,
    abi: stakeAbi,
    functionName: 'pool',
    args: [BigInt(PID)],
    query: {
      enabled: isValidContractAddress(),
      refetchInterval: 10000,
    }
  })

  const { writeContract: stakeContract, data: stakeHash, isPending: isStakePending } = useWriteContract()
  const { writeContract: claimContract, data: claimHash, isPending: isClaimPending } = useWriteContract()
  
  // 等待质押交易确认
  const { isLoading: isStakeConfirming, isSuccess: isStakeConfirmed } = useWaitForTransactionReceipt({
    hash: stakeHash,
  })
  
  // 等待领取交易确认
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  // 监听质押交易确认
  useEffect(() => {
    if (isStakeConfirmed) {
      toast.success('Stake successful!')
      setAmount('')
      setLoading(false)
    }
  }, [isStakeConfirmed])

  // 监听领取交易确认
  useEffect(() => {
    if (isClaimConfirmed) {
      toast.success('Claim successful!')
      setClaimLoading(false)
    }
  }, [isClaimConfirmed])

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(amount) > parseFloat(balance?.formatted || '0')) {
      toast.error('Amount cannot be greater than current balance')
      return
    }

    try {
      setLoading(true)
      const hash = await stakeContract({
        address: STAKE_CONTRACT_ADDRESS,
        abi: stakeAbi,
        functionName: 'depositETH',
        value: parseUnits(amount, 18),
      })
      
      // 不在这里显示成功消息，等待交易确认
      console.log('Transaction sent:', hash)
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error('Stake error:', error)
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    try {
      setClaimLoading(true)
      const hash = await claimContract({
        address: STAKE_CONTRACT_ADDRESS,
        abi: stakeAbi,
        functionName: 'claim',
        args: [BigInt(PID)],
      })
      
      // 不在这里显示成功消息，等待交易确认
      console.log('Claim transaction sent:', hash)
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error('Claim error:', error)
      setClaimLoading(false)
    }
  }

  const stakedAmountFormatted = stakedAmount ? formatUnits(stakedAmount, 18) : '0'
  const pendingRewardFormatted = pendingReward ? formatUnits(pendingReward, 18) : '0'
  const canClaim = parseFloat(pendingRewardFormatted) > 0
  
  // 综合的loading状态
  const isStakeLoading = loading || isStakePending || isStakeConfirming
  const isClaimLoadingState = claimLoading || isClaimPending || isClaimConfirming
  
  // 获取池子总质押金额 - poolInfo[4] 是 stTokenAmount
  const totalStakedAmount = poolInfo ? formatUnits(poolInfo[4], 18) : '0'
  
  // 调试信息 (可以在生产环境中移除)
  if (process.env.NODE_ENV === 'development') {
    console.log('Pool Info:', poolInfo)
    console.log('Total Staked Amount:', totalStakedAmount)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-block mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-2 border-primary-500/20 flex items-center justify-center shadow-xl"
            style={{ boxShadow: '0 0 60px 0 rgba(14,165,233,0.15)' }}
          >
            <FiZap className="w-12 h-12 text-primary-500" />
          </motion.div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
          MetaNode Stake
        </h1>
        <p className="text-gray-400 text-xl">
          Stake ETH to earn tokens
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Stake Card */}
        <Card className="min-h-[420px] p-4 sm:p-8 md:p-12 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-primary-500/20 border-[1.5px] rounded-2xl sm:rounded-3xl">
          <div className="space-y-8 sm:space-y-12">
            {/* Staked Amount Display */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-4 sm:p-8 bg-gray-800/70 rounded-xl sm:rounded-2xl border border-gray-700/50 group-hover:border-primary-500/50 transition-colors duration-300 shadow-lg">
              <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-primary-500/10 rounded-full">
                <FiTrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-primary-400" />
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0 items-center sm:items-start">
                <span className="text-gray-400 text-base sm:text-lg mb-1">Total Staked Amount</span>
                <span className="text-3xl sm:text-5xl font-bold text-blue-200 leading-tight break-all">
                  {parseFloat(totalStakedAmount).toFixed(4)} ETH
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  Your Stake: {parseFloat(stakedAmountFormatted).toFixed(4)} ETH
                </span>
              </div>
            </div>

            {/* Input Field */}
            <div className="space-y-4 sm:space-y-6">
              <Input
                label="Amount to Stake"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                rightElement={<span className="text-gray-500">ETH</span>}
                helperText={balance ? `Available: ${parseFloat(balance.formatted).toFixed(4)} ETH` : undefined}
                className="text-lg sm:text-xl py-3 sm:py-5"
              />
            </div>

            {/* Stake Button */}
            <div className="pt-4 sm:pt-8">
              {!isConnected ? (
                <div className="flex justify-center">
                  <div className="glow">
                    <ConnectButton />
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleStake}
                  disabled={isStakeLoading || !amount}
                  loading={isStakeLoading}
                  fullWidth
                  className="py-3 sm:py-5 text-lg sm:text-xl"
                >
                  <FiArrowDown className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span>
                    {isStakePending ? 'Confirming...' : 
                     isStakeConfirming ? 'Processing...' : 
                     'Stake ETH'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Claim Card */}
        <Card className="min-h-[420px] p-4 sm:p-8 md:p-12 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-primary-500/20 border-[1.5px] rounded-2xl sm:rounded-3xl">
          <div className="space-y-8 sm:space-y-12">
            {/* Pending Reward Display */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-4 sm:p-8 bg-gray-800/70 rounded-xl sm:rounded-2xl border border-gray-700/50 group-hover:border-primary-500/50 transition-colors duration-300 shadow-lg">
              <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-green-500/10 rounded-full">
                <FiGift className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0 items-center sm:items-start">
                <span className="text-gray-400 text-base sm:text-lg mb-1">Pending Rewards</span>
                <span className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent leading-tight break-all">
                  {parseFloat(pendingRewardFormatted).toFixed(4)} MetaNode
                </span>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <FiInfo className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">How rewards work:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Rewards accumulate based on your staked amount and time</li>
                      <li>• You can claim rewards anytime</li>
                      <li>• Rewards are paid in MetaNode tokens</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Button */}
            <div className="pt-4 sm:pt-8">
              {!isConnected ? (
                <div className="flex justify-center">
                  <div className="glow">
                    <ConnectButton />
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleClaim}
                  disabled={isClaimLoadingState || !canClaim}
                  loading={isClaimLoadingState}
                  fullWidth
                  className="py-3 sm:py-5 text-lg sm:text-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <FiGift className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span>
                    {isClaimPending ? 'Confirming...' : 
                     isClaimConfirming ? 'Processing...' : 
                     'Claim Rewards'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}