import BigNumber from 'bignumber.js'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Button, useModal, AddIcon } from '@pancakeswap-libs/uikit'
import { useWallet } from 'use-wallet'
import { BLOCKS_PER_YEAR } from 'config'
import UnlockButton from 'components/UnlockButton'
import Label from 'components/Label'
import { useERC20 } from 'hooks/rework/useContract'
import { useSousAllowance } from 'hooks/useAllowance'
import { useSousApprove } from 'hooks/useApprove'
import useI18n from 'hooks/useI18n'
import { useSousEarnings, useSousLeftBlocks } from 'hooks/useEarnings'
import { useSousStake } from 'hooks/useStake'
import { useSousStakedBalance, useSousTotalStaked } from 'hooks/useStakedBalance'
import useTokenBalance from 'hooks/useTokenBalance'
import { useSousUnstake } from 'hooks/useUnstake'
import { getBalanceNumber } from 'utils/formatBalance'
import { useSousReward } from 'hooks/useReward'
import Balance from 'components/Balance'
import { QuoteToken } from 'sushi/lib/constants/types'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import CardTitle from './CardTitle'
import CardTokenImg from './CardTokenImg'
import Card from './Card'
import OldSyrupTitle from './OldSyrupTitle'
import HarvestButton from './HarvestButton'
import CardFooter from './CardFooter'

interface HarvestProps {
  tokenName: string
  stakingTokenName: QuoteToken
  stakingTokenAddress: string
  sousId: number
  projectLink: string
  harvest: boolean
  tokenPerBlock: string
  cakePrice: BigNumber
  tokenPrice: BigNumber
  isCommunity?: boolean
  isFinished?: boolean
  tokenDecimals: number
}

const PoolCard: React.FC<HarvestProps> = ({
  sousId,
  tokenName,
  stakingTokenName,
  stakingTokenAddress,
  projectLink,
  harvest,
  cakePrice,
  tokenPrice,
  tokenPerBlock,
  isCommunity,
  isFinished: isFinishedConfig,
  tokenDecimals,
}) => {
  const TranslateString = useI18n()
  const stakingTokenContract = useERC20(stakingTokenAddress)
  const [requestedApproval, setRequestedApproval] = useState(false)
  const { account } = useWallet()
  const allowance = useSousAllowance(stakingTokenContract, sousId)
  const { onApprove } = useSousApprove(stakingTokenContract, sousId)
  const { isFinished: isCalculatedFinished, farmStart, blocksRemaining } = useSousLeftBlocks(sousId)
  const tokenBalance = useTokenBalance(stakingTokenContract.options.address)
  const stakedBalance = useSousStakedBalance(sousId)
  const totalStaked = useSousTotalStaked(sousId)
  const earnings = useSousEarnings(sousId)

  const { onStake } = useSousStake(sousId)
  const { onUnstake } = useSousUnstake(sousId)
  const { onReward } = useSousReward(sousId)

  const [pendingTx, setPendingTx] = useState(false)

  const apy: BigNumber = useMemo(() => {
    if (!harvest || cakePrice.isLessThanOrEqualTo(0)) return null

    const a = tokenPrice.times(BLOCKS_PER_YEAR).times(tokenPerBlock)
    const b = cakePrice.times(getBalanceNumber(totalStaked))
    return a.div(b).times(100)
  }, [cakePrice, harvest, tokenPerBlock, tokenPrice, totalStaked])

  const isOldSyrup = stakingTokenName === QuoteToken.SYRUP
  const accountHasStakedBalance = account && stakedBalance.toNumber() > 0
  const needsApproval = !accountHasStakedBalance && !allowance.toNumber()
  const isFinished = isFinishedConfig || isCalculatedFinished
  const isCardActive = isFinished && accountHasStakedBalance

  const [onPresentDeposit] = useModal(
    <DepositModal max={tokenBalance} onConfirm={onStake} tokenName={stakingTokenName} />,
  )

  const [onPresentWithdraw] = useModal(
    <WithdrawModal max={stakedBalance} onConfirm={onUnstake} tokenName={stakingTokenName} />,
  )

  const handleApprove = useCallback(async () => {
    try {
      setRequestedApproval(true)
      const txHash = await onApprove()
      // user rejected tx or didn't go thru
      if (!txHash) {
        setRequestedApproval(false)
      }
    } catch (e) {
      console.error(e)
    }
  }, [onApprove, setRequestedApproval])

  return (
    <Card isActive={isCardActive} isFinished={isFinished && sousId !== 0}>
      {isFinished && sousId !== 0 && <PoolFinishedSash />}
      <div style={{ padding: '24px' }}>
        <CardTitle isFinished={isFinished && sousId !== 0}>
          {isOldSyrup && '[OLD]'} {tokenName} {TranslateString(348, 'Pool')}
        </CardTitle>
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <CardTokenImg src={`/images/tokens/${tokenName}.png`} alt={tokenName} />
          </div>
          {account && harvest && !isOldSyrup && (
            <HarvestButton
              disabled={!earnings.toNumber() || pendingTx}
              text={pendingTx ? 'Collecting' : 'Harvest'}
              onClick={async () => {
                setPendingTx(true)
                await onReward()
                setPendingTx(false)
              }}
            />
          )}
        </div>
        {!isOldSyrup ? (
          <Balance value={getBalanceNumber(earnings, tokenDecimals)} isDisabled={isFinished} />
        ) : (
          <OldSyrupTitle hasBalance={accountHasStakedBalance} />
        )}
        <Label isFinished={isFinished && sousId !== 0} text={TranslateString(330, `${tokenName} earned`)} />
        <StyledCardActions>
          {!account && <UnlockButton />}
          {account &&
            (needsApproval && !isOldSyrup ? (
              <div style={{ flex: 1 }}>
                <Button disabled={isFinished || requestedApproval} onClick={handleApprove}>
                  {`Approve ${stakingTokenName}`}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  disabled={stakedBalance.eq(new BigNumber(0)) || pendingTx}
                  onClick={
                    isOldSyrup
                      ? async () => {
                          setPendingTx(true)
                          await onUnstake('0')
                          setPendingTx(false)
                        }
                      : onPresentWithdraw
                  }
                >
                  {`Unstake ${stakingTokenName}`}
                </Button>
                <StyledActionSpacer />
                {!isOldSyrup && (
                  <Button disabled={isFinished && sousId !== 0} onClick={onPresentDeposit}>
                    <AddIcon color="background" />
                  </Button>
                )}
              </>
            ))}
        </StyledCardActions>
        <StyledDetails>
          <div style={{ flex: 1 }}>{TranslateString(352, 'APY')}:</div>
          {isFinished || isOldSyrup ? (
            '-'
          ) : (
            <Balance fontSize="14px" isDisabled={isFinished} value={apy?.toNumber()} unit="%" />
          )}
        </StyledDetails>
        <StyledDetails>
          <div style={{ flex: 1 }}>
            <span role="img" aria-label={stakingTokenName}>
              🥞{' '}
            </span>
            {TranslateString(384, 'Your Stake')}:
          </div>
          <Balance fontSize="14px" isDisabled={isFinished} value={getBalanceNumber(stakedBalance)} />
        </StyledDetails>
      </div>
      <CardFooter
        projectLink={projectLink}
        totalStaked={totalStaked}
        blocksRemaining={blocksRemaining}
        isFinished={isFinished}
        farmStart={farmStart}
        isCommunity={isCommunity}
      />
    </Card>
  )
}

const PoolFinishedSash = styled.div`
  background-image: url('/images/pool-finished-sash.svg');
  background-position: top right;
  background-repeat: not-repeat;
  height: 135px;
  position: absolute;
  right: -24px;
  top: -24px;
  width: 135px;
`

const StyledCardActions = styled.div`
  display: flex;
  justify-content: center;
  margin: 16px 0;
  width: 100%;
  box-sizing: border-box;
`

const StyledActionSpacer = styled.div`
  height: ${(props) => props.theme.spacing[4]}px;
  width: ${(props) => props.theme.spacing[4]}px;
`

const StyledDetails = styled.div`
  display: flex;
  font-size: 14px;
`

export default PoolCard