'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'react-toastify'
import { FiArrowUp, FiClock, FiInfo } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { STAKE_CONTRACT_ADDRESS, stakeAbi, PID } from '@/lib/contract'

export default function Withdraw() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [unstakeLoading, setUnstakeLoading] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)

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

  const { data: withdrawData } = useReadContract({
    address: STAKE_CONTRACT_ADDRESS,
    abi: stakeAbi,
    functionName: 'withdrawAmount',
    args: [BigInt(PID), address!],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000,
    }
  })

  const { writeContract: unstakeContract, data: unstakeHash, isPending: isUnstakePending } = useWriteContract()
  const { writeContract: withdrawContract, data: withdrawHash, isPending: isWithdrawPending } = useWriteContract()
  
  // 等待交易确认
  const { isLoading: isUnstakeConfirming, isSuccess: isUnstakeConfirmed } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  })
  
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  })

  // 监听交易确认
  useEffect(() => {
    if (isUnstakeConfirmed) {
      toast.success('Unstake successful!')
      setAmount('')
      setUnstakeLoading(false)
    }
  }, [isUnstakeConfirmed])

  useEffect(() => {
    if (isWithdrawConfirmed) {
      toast.success('Withdraw successful!')
      setWithdrawLoading(false)
    }
  }, [isWithdrawConfirmed])

  const stakedAmountFormatted = stakedAmount ? formatUnits(stakedAmount, 18) : '0'
  const requestAmount = withdrawData ? formatUnits(withdrawData[0], 18) : '0'
  const pendingWithdrawAmount = withdrawData ? formatUnits(withdrawData[1], 18) : '0'
  const withdrawPending = (parseFloat(requestAmount) - parseFloat(pendingWithdrawAmount)).toFixed(4)
  
  const isWithdrawable = parseFloat(pendingWithdrawAmount) > 0 && isConnected
  
  // 综合的loading状态
  const isUnstakeLoadingState = unstakeLoading || isUnstakePending || isUnstakeConfirming
  const isWithdrawLoadingState = withdrawLoading || isWithdrawPending || isWithdrawConfirming

  const handleUnstake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (parseFloat(amount) > parseFloat(stakedAmountFormatted)) {
      toast.error('Amount cannot be greater than staked amount')
      return
    }
    
    try {
      setUnstakeLoading(true)
      const hash = await unstakeContract({
        address: STAKE_CONTRACT_ADDRESS,
        abi: stakeAbi,
        functionName: 'unstake',
        args: [BigInt(PID), parseUnits(amount, 18)],
      })
      console.log('Unstake transaction sent:', hash)
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error('Unstake error:', error)
      setUnstakeLoading(false)
    }
  }

  const handleWithdraw = async () => {
    try {
      setWithdrawLoading(true)
      const hash = await withdrawContract({
        address: STAKE_CONTRACT_ADDRESS,
        abi: stakeAbi,
        functionName: 'withdraw',
        args: [BigInt(PID)],
      })
      console.log('Withdraw transaction sent:', hash)
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
      console.error('Withdraw error:', error)
      setWithdrawLoading(false)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (/^\d*(\.\d*)?$/.test(val)) {
      setAmount(val)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent mb-4">
          Withdraw
        </h1>
        <p className="text-gray-400 text-lg">
          Unstake and withdraw your ETH
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-8"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-primary-500/20 border-[1.5px] rounded-2xl">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Staked Amount</div>
              <div className="text-2xl font-bold text-primary-400">
                {parseFloat(stakedAmountFormatted).toFixed(4)} ETH
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-green-500/20 border-[1.5px] rounded-2xl">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Available to Withdraw</div>
              <div className="text-2xl font-bold text-green-400">
                {parseFloat(pendingWithdrawAmount).toFixed(4)} ETH
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-yellow-500/20 border-[1.5px] rounded-2xl">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Pending Withdraw</div>
              <div className="text-2xl font-bold text-yellow-400">
                {parseFloat(withdrawPending).toFixed(4)} ETH
              </div>
            </div>
          </Card>
        </div>

        {/* Unstake Section */}
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-primary-500/20 border-[1.5px] rounded-2xl">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary-400 mb-6">Unstake ETH</h2>
            
            <div className="space-y-4">
              <Input
                label="Amount to Unstake"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                rightElement={<span className="text-gray-500">ETH</span>}
                helperText={`Available: ${parseFloat(stakedAmountFormatted).toFixed(4)} ETH`}
                className="text-lg"
              />
            </div>

            <div className="pt-4">
              {!isConnected ? (
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              ) : (
                <Button
                  onClick={handleUnstake}
                  disabled={isUnstakeLoadingState || !amount}
                  loading={isUnstakeLoadingState}
                  fullWidth
                  className="py-4 text-lg"
                >
                  <FiArrowUp className="w-5 h-5" />
                  <span>
                    {isUnstakePending ? 'Confirming...' : 
                     isUnstakeConfirming ? 'Processing...' : 
                     'Unstake ETH'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Withdraw Section */}
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-green-500/20 border-[1.5px] rounded-2xl">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-400 mb-6">Withdraw ETH</h2>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Ready to Withdraw</div>
                  <div className="text-2xl font-semibold text-green-400">
                    {parseFloat(pendingWithdrawAmount).toFixed(4)} ETH
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <FiClock className="mr-1" />
                  <span>20 min cooldown</span>
                </div>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-400">
              <FiInfo className="mr-1" />
              <span>After unstaking, you need to wait 20 minutes to withdraw.</span>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={!isWithdrawable || isWithdrawLoadingState}
              loading={isWithdrawLoadingState}
              fullWidth
              className="py-4 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <FiArrowUp className="w-5 h-5" />
              <span>
                {isWithdrawPending ? 'Confirming...' : 
                 isWithdrawConfirming ? 'Processing...' : 
                 'Withdraw ETH'}
              </span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
