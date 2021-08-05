import React from 'react'
import {
  Box,
  BunnyPlaceholderIcon,
  Card,
  CardBody,
  CardRibbon,
  Flex,
  BackgroundImage,
  LaurelLeftIcon,
  LaurelRightIcon,
  Link,
  Text,
} from '@pancakeswap/uikit'
import { PredictionUser } from 'state/types'
import { useGetProfileAvatar } from 'state/profile/hooks'
import styled from 'styled-components'
import { getBscScanLink } from 'utils'
import truncateWalletAddress from 'utils/truncateWalletAddress'
import { useTranslation } from 'contexts/Localization'
import { NetWinningsRow, Row } from './styles'

interface RankingCardProps {
  rank: 1 | 2 | 3
  user: PredictionUser
}

const PlaceholderIcon = styled(BunnyPlaceholderIcon)`
  width: 40px;

  ${({ theme }) => theme.mediaQueries.lg} {
    width: 64px;
  }
`

const RotatedLaurelLeftIcon = styled(LaurelLeftIcon)`
  transform: rotate(30deg);
`

const RotatedLaurelRightIcon = styled(LaurelRightIcon)`
  transform: rotate(-30deg);
`

const getRankingColor = (rank: number) => {
  if (rank === 3) {
    return 'bronze'
  }

  if (rank === 2) {
    return 'silver'
  }

  return 'gold'
}

const RankingCard: React.FC<RankingCardProps> = ({ rank, user }) => {
  const { t } = useTranslation()
  const rankColor = getRankingColor(rank)
  const profileAvatar = useGetProfileAvatar(user.id)

  return (
    <Card ribbon={<CardRibbon variantColor={rankColor} text={`#${rank}`} ribbonPosition="left" />}>
      <CardBody p="24px">
        <Flex alignItems="center" justifyContent="center" flexDirection="column" mb="24px">
          <Flex mb="4px">
            <RotatedLaurelLeftIcon color={rankColor} width="40px" />
            <Box width={['40px', null, null, '64px']}>
              {profileAvatar.nft ? (
                <BackgroundImage
                  src={`/images/nfts/${profileAvatar.nft?.images?.md}`}
                  height={64}
                  width={64}
                  style={{ borderRadius: '50%' }}
                />
              ) : (
                <PlaceholderIcon />
              )}
            </Box>
            <RotatedLaurelRightIcon color={rankColor} width="40px" />
          </Flex>
          <Link href={getBscScanLink(user.id, 'address')} external>
            {truncateWalletAddress(user.id)}
          </Link>
        </Flex>
        <Row mb="4px">
          <Text fontSize="12px" color="textSubtle">
            {t('Win Rate')}
          </Text>
          <Text fontWeight="bold">
            {`${user.winRate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`}
          </Text>
        </Row>
        <NetWinningsRow amount={user.netBNB} />
        <Row>
          <Text fontSize="12px" color="textSubtle">
            {t('Rounds Won')}
          </Text>
          <Text fontWeight="bold">{`${user.totalBetsClaimed.toLocaleString()}/${user.totalBets.toLocaleString()}`}</Text>
        </Row>
      </CardBody>
    </Card>
  )
}

export default RankingCard